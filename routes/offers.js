const router = require('express').Router();
const db = require('../db');
const mock = require('../data/mockData');

const isDbError = e => ['ETIMEDOUT','ECONNREFUSED','ENOTFOUND','ER_ACCESS_DENIED_ERROR'].includes(e.code) || e.fatal;

// GET /api/offers?user_id=1&status=pending
router.get('/', async (req, res) => {
  try {
    const { user_id = 1, status } = req.query;
    let sql = `
      SELECT o.*, p.title, p.emoji, p.organization, p.platform, p.category,
             p.stipend_amount, p.bonus_stipend, p.deadline, p.description, p.goal_amount
      FROM offers o JOIN projects p ON p.id = o.project_id WHERE o.user_id = ?
    `;
    const params = [user_id];
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

// PUT /api/offers/:id
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted','declined'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await db.query('UPDATE offers SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    if (isDbError(e)) return res.json({ success: true, note: 'mock' });
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
