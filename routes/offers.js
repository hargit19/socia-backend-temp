const router = require('express').Router();
const crypto = require('crypto');
const db = require('../db');
const mock = require('../data/mockData');

const isDbError = e => ['ETIMEDOUT','ECONNREFUSED','ENOTFOUND','ER_ACCESS_DENIED_ERROR'].includes(e.code) || e.fatal;

const slugify = (s) => String(s || '').toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// GET /api/offers?influencer_id=1&project_id=2&status=pending
router.get('/', async (req, res) => {
  try {
    const { influencer_id, project_id, status } = req.query;
    let sql = `
      SELECT o.*, p.title, p.emoji, p.organization, p.platform, p.category,
             p.stipend_amount, p.bonus_stipend, p.deadline, p.description, p.goal_amount, p.goal
      FROM offers o JOIN projects p ON p.id = o.project_id WHERE 1=1
    `;
    const params = [];
    if (influencer_id) { sql += ' AND o.influencer_id = ?'; params.push(influencer_id); }
    if (project_id) { sql += ' AND o.project_id = ?'; params.push(project_id); }
    if (status) { sql += ' AND o.status = ?'; params.push(status); }
    sql += ' ORDER BY o.invited_at DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    if (isDbError(e)) {
      const { status } = req.query;
      return res.json(status ? mock.offers.filter(o => o.status === status) : mock.offers);
    }
    res.status(500).json({ error: e.message });
  }
});

// POST /api/offers — NPO invites an influencer to a project
router.post('/', async (req, res) => {
  try {
    const project_id = req.body.project_id;
    const influencer_id = req.body.influencer_id;
    if (!project_id || !influencer_id) return res.status(400).json({ error: 'project_id and influencer_id are required' });

    const [[existing]] = await db.query('SELECT id, status FROM offers WHERE project_id = ? AND influencer_id = ?', [project_id, influencer_id]);
    if (existing) return res.json({ success: true, id: existing.id, status: existing.status, already_invited: true });

    const [result] = await db.query(
      "INSERT INTO offers (influencer_id, project_id, status, invited_at) VALUES (?, ?, 'pending', CURDATE())",
      [influencer_id, project_id]
    );
    res.status(201).json({ success: true, id: result.insertId, status: 'pending' });
  } catch (e) {
    if (isDbError(e)) return res.status(201).json({ success: true, id: Date.now(), status: 'pending', _mock: true });
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/offers/:id — influencer accepts or declines an invitation.
// Accepting an offer enrolls the influencer in the project, same as applying directly.
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted','declined'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const [[offer]] = await db.query('SELECT * FROM offers WHERE id = ?', [req.params.id]);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    await db.query('UPDATE offers SET status = ? WHERE id = ?', [status, req.params.id]);

    if (status === 'accepted') {
      const [[existingEnrollment]] = await db.query(
        'SELECT referral_slug FROM influencer_projects WHERE influencer_id = ? AND project_id = ?',
        [offer.influencer_id, offer.project_id]
      );
      if (existingEnrollment) return res.json({ success: true, referral_slug: existingEnrollment.referral_slug });

      const [[project]] = await db.query('SELECT title, platform FROM projects WHERE id = ?', [offer.project_id]);
      const [[influencer]] = await db.query('SELECT full_name FROM influencers WHERE id = ?', [offer.influencer_id]);
      const base = [project?.title, influencer?.full_name, project?.platform].map(slugify).filter(Boolean).join('-');
      const referral_slug = `${base}-${crypto.randomBytes(3).toString('hex')}`;

      await db.query(
        "INSERT INTO influencer_projects (influencer_id, project_id, status, referral_slug) VALUES (?, ?, 'enrolled', ?)",
        [offer.influencer_id, offer.project_id, referral_slug]
      );
      return res.json({ success: true, referral_slug });
    }

    res.json({ success: true });
  } catch (e) {
    if (isDbError(e)) return res.json({ success: true, note: 'mock' });
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
