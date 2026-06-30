const router = require('express').Router();
const db = require('../db');
const mock = require('../data/mockData');

const isDbError = e => ['ETIMEDOUT','ECONNREFUSED','ENOTFOUND','ER_ACCESS_DENIED_ERROR'].includes(e.code) || e.fatal;

// GET /api/earnings?user_id=1
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 1;
    const [[summary]] = await db.query(
      `SELECT SUM(amount) AS total_earned,
              SUM(CASE WHEN status='pending' THEN amount ELSE 0 END) AS pending_payout,
              SUM(CASE WHEN status='paid'    THEN amount ELSE 0 END) AS settled_to_bank,
              COUNT(*) AS campaign_count
       FROM transactions WHERE user_id = ? AND YEAR(transaction_date) = YEAR(CURDATE())`, [userId]
    );
    const [transactions] = await db.query(
      `SELECT t.*, p.title AS project_title, p.organization, p.emoji
       FROM transactions t JOIN projects p ON p.id = t.project_id
       WHERE t.user_id = ? ORDER BY t.transaction_date DESC`, [userId]
    );
    const [pending_payouts] = await db.query(
      `SELECT t.*, p.title AS project_title, p.organization, t.expected_date
       FROM transactions t JOIN projects p ON p.id = t.project_id
       WHERE t.user_id = ? AND t.status = 'pending' ORDER BY t.expected_date ASC`, [userId]
    );
    const [monthly] = await db.query(
      `SELECT MONTH(transaction_date) AS month, YEAR(transaction_date) AS year, SUM(amount) AS total
       FROM transactions WHERE user_id = ?
       GROUP BY YEAR(transaction_date), MONTH(transaction_date)
       ORDER BY year ASC, month ASC`, [userId]
    );
    res.json({ summary, transactions, pending_payouts, monthly });
  } catch (e) {
    if (isDbError(e)) return res.json(mock.earnings);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
