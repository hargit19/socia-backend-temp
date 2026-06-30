const router = require('express').Router();
const db = require('../db');
const mock = require('../data/mockData');

const isDbError = e => ['ETIMEDOUT','ECONNREFUSED','ENOTFOUND','ER_ACCESS_DENIED_ERROR'].includes(e.code) || e.fatal;

// GET /api/submissions?user_id=1
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 1;
    const [rows] = await db.query(
      `SELECT d.*, p.title AS project_title, p.organization
       FROM deliverables d
       JOIN user_projects up ON up.id = d.user_project_id
       JOIN projects p ON p.id = up.project_id
       WHERE up.user_id = ? ORDER BY d.submitted_at DESC, d.id DESC`,
      [userId]
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

// POST /api/submissions
router.post('/', async (req, res) => {
  try {
    const { user_project_id, content_type, platform, post_url, caption } = req.body;
    const [result] = await db.query(
      `UPDATE deliverables SET post_url=?, caption=?, status='submitted', submitted_at=NOW()
       WHERE user_project_id=? AND content_type=? AND platform=?`,
      [post_url, caption, user_project_id, content_type, platform]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Deliverable not found' });
    res.json({ success: true });
  } catch (e) {
    if (isDbError(e)) return res.json({ success: true, note: 'mock' });
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
