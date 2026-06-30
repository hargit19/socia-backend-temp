const router = require('express').Router();
const db = require('../db');
const mock = require('../data/mockData');

const isDbError = e => ['ETIMEDOUT','ECONNREFUSED','ENOTFOUND','ER_ACCESS_DENIED_ERROR'].includes(e.code) || e.fatal;

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (e) {
    if (isDbError(e)) return res.json(mock.user);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/users/:id/sns
router.get('/:id/sns', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM sns_accounts WHERE user_id = ? AND is_connected = 1 ORDER BY platform, account_number',
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    if (isDbError(e)) return res.json(mock.sns_accounts);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/users/:id/stats
router.get('/:id/stats', async (req, res) => {
  try {
    const [[user]] = await db.query(
      'SELECT total_followers, avg_engagement, authenticity_score FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!user) return res.status(404).json({ error: 'Not found' });
    const [[{ accounts_linked }]] = await db.query(
      'SELECT COUNT(*) as accounts_linked FROM sns_accounts WHERE user_id = ? AND is_connected = 1',
      [req.params.id]
    );
    const [geography] = await db.query(
      'SELECT region, percentage FROM audience_geography WHERE user_id = ? ORDER BY percentage DESC',
      [req.params.id]
    );
    const [sns_breakdown] = await db.query(
      'SELECT platform, handle, display_name, followers, engagement_rate, account_number FROM sns_accounts WHERE user_id = ? AND is_connected = 1 ORDER BY platform, account_number',
      [req.params.id]
    );
    res.json({ ...user, accounts_linked, geography, sns_breakdown });
  } catch (e) {
    if (isDbError(e)) return res.json({
      total_followers: mock.user.total_followers,
      avg_engagement: mock.user.avg_engagement,
      authenticity_score: mock.user.authenticity_score,
      accounts_linked: mock.sns_accounts.length,
      geography: mock.geography,
      sns_breakdown: mock.sns_accounts,
    });
    res.status(500).json({ error: e.message });
  }
});

// GET /api/users/:id/projects/active
router.get('/:id/projects/active', async (req, res) => {
  try {
    const [projects] = await db.query(
      `SELECT p.*, up.id AS user_project_id, up.enrolled_at
       FROM user_projects up JOIN projects p ON p.id = up.project_id
       WHERE up.user_id = ? AND up.status = 'active' ORDER BY p.deadline ASC`,
      [req.params.id]
    );
    for (const proj of projects) {
      const [deliverables] = await db.query(
        'SELECT * FROM deliverables WHERE user_project_id = ? ORDER BY id',
        [proj.user_project_id]
      );
      proj.deliverables = deliverables;
    }
    res.json(projects);
  } catch (e) {
    if (isDbError(e)) return res.json(mock.active_projects);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/users/:id/projects/completed
router.get('/:id/projects/completed', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.title, p.emoji, p.organization, p.platform,
              up.completed_at, t.amount, t.status AS payment_status
       FROM user_projects up
       JOIN projects p ON p.id = up.project_id
       LEFT JOIN transactions t ON t.user_id = up.user_id AND t.project_id = up.project_id
       WHERE up.user_id = ? AND up.status = 'completed'
       ORDER BY up.completed_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    if (isDbError(e)) return res.json(mock.completed_projects);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/users/:id/materials
router.get('/:id/materials', async (req, res) => {
  try {
    const [projects] = await db.query(
      `SELECT p.id, p.title, p.emoji, p.organization, p.platform, p.deadline
       FROM user_projects up JOIN projects p ON p.id = up.project_id
       WHERE up.user_id = ? AND up.status = 'active'`,
      [req.params.id]
    );
    for (const proj of projects) {
      const [materials] = await db.query('SELECT * FROM materials WHERE project_id = ?', [proj.id]);
      proj.materials = materials;
    }
    res.json(projects);
  } catch (e) {
    if (isDbError(e)) return res.json([]);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/users/:id/submissions
router.get('/:id/submissions', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.*, p.title AS project_title, p.organization
       FROM deliverables d
       JOIN user_projects up ON up.id = d.user_project_id
       JOIN projects p ON p.id = up.project_id
       WHERE up.user_id = ? ORDER BY d.submitted_at DESC, d.id DESC`,
      [req.params.id]
    );
    const stats = {
      total: rows.length,
      approved: rows.filter(r => r.status === 'approved').length,
      reviewing: rows.filter(r => r.status === 'reviewing').length,
      revision: rows.filter(r => r.status === 'revision').length,
    };
    res.json({ stats, submissions: rows });
  } catch (e) {
    if (isDbError(e)) return res.json(mock.submissions);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
