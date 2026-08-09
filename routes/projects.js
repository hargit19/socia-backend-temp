const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('../db');
const mock = require('../data/mockData');
const notify = require('../lib/notify');

const isDbError = e => ['ETIMEDOUT','ECONNREFUSED','ENOTFOUND','ER_ACCESS_DENIED_ERROR'].includes(e.code) || e.fatal;

// ── Project material uploads (project & NPO overview PDF, creator script PDF) ──
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads', 'materials');
const MATERIAL_SPECS = {
  overview: { name: 'Project & NPO Overview', material_type: 'pdf', icon: '📄' },
  script: { name: 'Creator Script (~3 min)', material_type: 'script', icon: '🎬' },
};

const materialsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_ROOT, String(req.params.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}.pdf`),
});
const uploadMaterials = multer({
  storage: materialsStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF files are allowed'));
    cb(null, true);
  },
});

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const { category, platform, search, user_id = 1 } = req.query;
    let sql = `
      SELECT p.*,
        (SELECT COUNT(*) FROM offers o WHERE o.project_id = p.id AND o.user_id = ? AND o.status = 'pending') AS is_invited,
        (SELECT COUNT(*) FROM user_projects up WHERE up.project_id = p.id AND up.user_id = ?) AS is_enrolled
      FROM projects p WHERE p.status IN ('open','invited')
    `;
    const params = [user_id, user_id];
    if (category) { sql += ' AND p.category = ?'; params.push(category); }
    if (platform) { sql += ' AND p.platform = ?'; params.push(platform); }
    if (search) { sql += ' AND (p.title LIKE ? OR p.organization LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY p.deadline ASC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    if (isDbError(e)) return res.json(mock.projects.filter(p => p.status === 'open'));
    res.status(500).json({ error: e.message });
  }
});

// GET /api/projects/approved — influencer-facing: only approved projects
router.get('/approved', async (req, res) => {
  try {
    const { category, platform, search } = req.query;
    let sql = "SELECT * FROM projects WHERE status = 'approved'";
    const params = [];
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (platform) { sql += ' AND platform = ?'; params.push(platform); }
    if (search) { sql += ' AND (title LIKE ? OR organization LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY created_at DESC, id DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    if (isDbError(e)) return res.json(mock.projects.filter(p => p.status === 'open'));
    res.status(500).json({ error: e.message });
  }
});

// POST /api/projects — create a new project (submitted by NPO)
// Accepts both camelCase (frontend form) and snake_case field names
router.post('/', async (req, res) => {
  try {
    const b = req.body;

    const title        = b.title       || b.name          || '';
    const category     = b.category    || '';
    const description  = b.description || b.impactStatement || b.impact || '';
    const organization = b.organization|| b.npoName        || b.legalName || b.displayName || 'NPO';
    const deadline     = b.deadline    || b.endDate        || b.end_date   || null;
    const goal_text    = b.goal        || '';
    // Parse numeric goal from text like "$60,000" or "60000"
    const goal_amount  = parseFloat(String(goal_text).replace(/[^0-9.]/g, '')) || 0;
    const stipend_text   = b.stipendAmount || b.stipend_amount || '';
    const stipend_amount = parseFloat(String(stipend_text).replace(/[^0-9.]/g, '')) || 0;
    // Normalize platform — table uses ENUM, map anything unrecognized to 'Other'
    const PLATFORMS = ['GoFundMe','Kickstarter','Indiegogo','Other'];
    const platform     = PLATFORMS.includes(b.platform) ? b.platform : 'Other';
    const npo_id       = b.npo_id || null;
    const external_url = b.external_url || b.url || '';
    const CROWDFUNDING_MODELS = ['All-In', 'Other'];
    const modelInput = b.crowdfunding_model || b.crowdfundingModel || 'All-In';
    const crowdfunding_model = CROWDFUNDING_MODELS.includes(modelInput) ? modelInput : 'All-In';
    const crowdfunding_model_other = crowdfunding_model === 'Other'
      ? (b.crowdfunding_model_other || b.crowdfundingModelOther || '')
      : null;

    if (!title) return res.status(400).json({ error: 'Project name is required' });

    const [result] = await db.query(
      `INSERT INTO projects
        (npo_id, title, organization, category, platform, crowdfunding_model, crowdfunding_model_other,
         external_url, goal, goal_amount, stipend_amount, deadline, description, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'pending')`,
      [npo_id, title, organization, category, platform, crowdfunding_model, crowdfunding_model_other,
       external_url || null, goal_text, goal_amount, stipend_amount, deadline, description]
    );
    res.status(201).json({ id: result.insertId, status: 'pending' });

    try {
      if (npo_id) {
        const [[npo]] = await db.query('SELECT email, admin_name FROM npos WHERE id = ?', [npo_id]);
        if (npo?.email) await notify.sendNPOProjectSubmitted(npo.email, npo.admin_name || organization, title);
      }
      await notify.notifyAdmins('project', title, `Organization: ${organization}`);
    } catch (notifyErr) {
      console.error('[projects] Failed to send project-submission notifications:', notifyErr.message);
    }
  } catch (e) {
    if (isDbError(e)) return res.status(201).json({ id: Date.now(), status: 'pending', _mock: true });
    res.status(500).json({ error: e.message });
  }
});

// POST /api/projects/:id/submit — NPO submits a draft project for admin review
router.post('/:id/submit', async (req, res) => {
  try {
    await db.query("UPDATE projects SET status = 'pending' WHERE id = ? AND status = 'draft'", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    if (isDbError(e)) return res.json({ success: true, _mock: true });
    res.status(500).json({ error: e.message });
  }
});

// POST /api/projects/:id/materials — NPO uploads the two required creator materials
// (project & NPO overview PDF, ~3 min creator script PDF). Re-uploading either one
// replaces the existing file for that slot rather than creating a duplicate row.
router.post('/:id/materials', (req, res) => {
  uploadMaterials.fields([{ name: 'overview', maxCount: 1 }, { name: 'script', maxCount: 1 }])(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const project_id = req.params.id;
      const files = req.files || {};
      const saved = [];

      for (const [field, spec] of Object.entries(MATERIAL_SPECS)) {
        const file = files[field]?.[0];
        if (!file) continue;
        const file_url = `/uploads/materials/${project_id}/${file.filename}`;
        const file_size_mb = Math.round((file.size / (1024 * 1024)) * 100) / 100;

        const [[existing]] = await db.query(
          'SELECT id, file_url FROM materials WHERE project_id = ? AND material_type = ?',
          [project_id, spec.material_type]
        );
        if (existing) {
          if (existing.file_url) {
            const oldPath = path.join(__dirname, '..', existing.file_url);
            fs.unlink(oldPath, () => {});
          }
          await db.query('UPDATE materials SET name=?, file_size_mb=?, file_url=?, icon=? WHERE id=?',
            [spec.name, file_size_mb, file_url, spec.icon, existing.id]);
          saved.push({ id: existing.id, name: spec.name, material_type: spec.material_type, file_url, file_size_mb });
        } else {
          const [result] = await db.query(
            'INSERT INTO materials (project_id, name, material_type, file_size_mb, file_url, is_canva_link, icon) VALUES (?,?,?,?,?,0,?)',
            [project_id, spec.name, spec.material_type, file_size_mb, file_url, spec.icon]
          );
          saved.push({ id: result.insertId, name: spec.name, material_type: spec.material_type, file_url, file_size_mb });
        }
      }

      if (saved.length === 0) return res.status(400).json({ error: 'No files uploaded. Expected fields: overview, script' });
      res.status(201).json({ success: true, materials: saved });
    } catch (e) {
      if (isDbError(e)) return res.status(201).json({ success: true, _mock: true });
      res.status(500).json({ error: e.message });
    }
  });
});

// POST /api/projects/:id/enroll — influencer applies to promote an approved project.
// Creates a pending application: it only becomes a live enrollment (with a referral
// link) once BOTH the owning NPO and a platform admin approve it.
router.post('/:id/enroll', async (req, res) => {
  try {
    const influencer_id = req.body.influencer_id || req.body.user_id;
    const project_id = req.params.id;
    if (!influencer_id) return res.status(400).json({ error: 'influencer_id required' });

    const [[existing]] = await db.query(
      'SELECT id, status, npo_status, admin_status, referral_slug FROM influencer_projects WHERE influencer_id = ? AND project_id = ?',
      [influencer_id, project_id]
    );
    if (existing) return res.json({ success: true, ...existing });

    const [[project]] = await db.query('SELECT title, platform, organization, npo_id FROM projects WHERE id = ?', [project_id]);
    const [[influencer]] = await db.query('SELECT full_name, email FROM influencers WHERE id = ?', [influencer_id]);
    if (!project || !influencer) return res.status(404).json({ error: 'Project or influencer not found' });

    const [result] = await db.query(
      "INSERT INTO influencer_projects (influencer_id, project_id, status, npo_status, admin_status) VALUES (?, ?, 'pending', 'pending', 'pending')",
      [influencer_id, project_id]
    );
    res.json({ success: true, id: result.insertId, status: 'pending', npo_status: 'pending', admin_status: 'pending' });

    try {
      if (project.npo_id) {
        const [[npo]] = await db.query('SELECT email, admin_name, org_name FROM npos WHERE id = ?', [project.npo_id]);
        if (npo?.email) {
          await notify.sendNPOCreatorApplied(npo.email, npo.admin_name || npo.org_name || 'there', influencer.full_name, project.title);
        }
      }
      await notify.notifyAdmins('creator_application', `${influencer.full_name} → ${project.title}`, 'Awaiting NPO and admin approval before this creator can go live.');
    } catch (notifyErr) {
      console.error('[projects] Failed to send application notifications:', notifyErr.message);
    }
  } catch (e) {
    if (isDbError(e)) return res.json({ success: true, _mock: true, status: 'pending', npo_status: 'pending', admin_status: 'pending' });
    res.status(500).json({ error: e.message });
  }
});

// GET /api/projects/:id/influencers — list influencers enrolled in a project
router.get('/:id/influencers', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.id, i.full_name, i.email, i.country, i.sns_accounts,
              ip.status AS enrollment_status, ip.enrolled_at
       FROM influencer_projects ip
       JOIN influencers i ON i.id = ip.influencer_id
       WHERE ip.project_id = ?
       ORDER BY ip.enrolled_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    if (isDbError(e)) return res.json([]);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const [[project]] = await db.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) return res.status(404).json({ error: 'Not found' });
    const [templates] = await db.query('SELECT * FROM project_deliverable_templates WHERE project_id = ? ORDER BY id', [req.params.id]);
    const [materials] = await db.query('SELECT * FROM materials WHERE project_id = ?', [req.params.id]);
    res.json({ ...project, templates, materials });
  } catch (e) {
    if (isDbError(e)) {
      const p = mock.projects.find(p => p.id === Number(req.params.id));
      return p ? res.json(p) : res.status(404).json({ error: 'Not found' });
    }
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
