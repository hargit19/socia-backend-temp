const router = require('express').Router();
const crypto = require('crypto');
const db = require('../db');
const mock = require('../data/mockData');
const notify = require('../lib/notify');

const isDbError = e => ['ETIMEDOUT','ECONNREFUSED','ENOTFOUND','ER_ACCESS_DENIED_ERROR'].includes(e.code) || e.fatal;

const slugify = (s) => String(s || '').toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

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
    sql += ' ORDER BY deadline ASC';
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
    // Normalize platform — table uses ENUM, map anything unrecognized to 'Other'
    const PLATFORMS = ['GoFundMe','Kickstarter','Indiegogo','Other'];
    const platform     = PLATFORMS.includes(b.platform) ? b.platform : 'Other';
    const npo_id       = b.npo_id || null;
    const external_url = b.external_url || b.url || '';

    if (!title) return res.status(400).json({ error: 'Project name is required' });

    const [result] = await db.query(
      `INSERT INTO projects
        (npo_id, title, organization, category, platform, external_url, goal, goal_amount, stipend_amount, deadline, description, status)
       VALUES (?,?,?,?,?,?,?,?,0,?,?,'pending')`,
      [npo_id, title, organization, category, platform, external_url || null, goal_text, goal_amount, deadline, description]
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

// POST /api/projects/:id/enroll — influencer enrolls in an approved project.
// Generates a shareable referral link slugged from the project name, influencer name, and platform.
router.post('/:id/enroll', async (req, res) => {
  try {
    const influencer_id = req.body.influencer_id || req.body.user_id;
    const project_id = req.params.id;
    if (!influencer_id) return res.status(400).json({ error: 'influencer_id required' });

    const [[existing]] = await db.query(
      'SELECT referral_slug FROM influencer_projects WHERE influencer_id = ? AND project_id = ?',
      [influencer_id, project_id]
    );
    if (existing) return res.json({ success: true, referral_slug: existing.referral_slug });

    const [[project]] = await db.query('SELECT title, platform, organization FROM projects WHERE id = ?', [project_id]);
    const [[influencer]] = await db.query('SELECT full_name, email FROM influencers WHERE id = ?', [influencer_id]);
    if (!project || !influencer) return res.status(404).json({ error: 'Project or influencer not found' });

    const base = [project.title, influencer.full_name, project.platform].map(slugify).filter(Boolean).join('-');
    const referral_slug = `${base}-${crypto.randomBytes(3).toString('hex')}`;

    await db.query(
      "INSERT INTO influencer_projects (influencer_id, project_id, status, referral_slug) VALUES (?, ?, 'enrolled', ?)",
      [influencer_id, project_id, referral_slug]
    );
    res.json({ success: true, referral_slug });

    try {
      if (influencer.email) {
        await notify.sendInfluencerEnrolled(influencer.email, influencer.full_name, project.title, project.organization);
      }
    } catch (notifyErr) {
      console.error('[projects] Failed to send enrollment notification:', notifyErr.message);
    }
  } catch (e) {
    if (isDbError(e)) return res.json({ success: true, _mock: true });
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
