const router = require('express').Router();
const db = require('../db');
const mock = require('../data/mockData');

const isDbError = e => ['ETIMEDOUT','ECONNREFUSED','ENOTFOUND','ER_ACCESS_DENIED_ERROR'].includes(e.code) || e.fatal;

// GET /api/analytics?user_id=1
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id || 1;
    const [[summary]] = await db.query(
      `SELECT SUM(impressions) AS total_impressions, SUM(engagements) AS total_engagements,
              SUM(funds_raised) AS total_funds_raised, SUM(link_clicks) AS total_link_clicks,
              AVG(engagement_rate) AS avg_engagement_rate
       FROM analytics WHERE user_id = ?`, [userId]
    );
    const [campaigns] = await db.query(
      `SELECT a.*, p.title AS project_title, p.emoji, p.organization, p.platform, p.status AS project_status
       FROM analytics a JOIN projects p ON p.id = a.project_id
       WHERE a.user_id = ? ORDER BY a.impressions DESC`, [userId]
    );
    const [monthly] = await db.query(
      `SELECT month, year, funds_raised, impressions FROM analytics_monthly
       WHERE user_id = ? ORDER BY year ASC, month ASC`, [userId]
    );
    res.json({ summary, campaigns, monthly });
  } catch (e) {
    if (isDbError(e)) return res.json(mock.analytics);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
