const router = require('express').Router();
const db = require('../db');

const isDbError = e => ['ETIMEDOUT','ECONNREFUSED','ENOTFOUND','ER_ACCESS_DENIED_ERROR'].includes(e.code) || e.fatal;

// GET /api/go/:slug — resolve a referral link (project + influencer + platform) to its destination.
// Public — this is hit by anyone who clicks the shared link, not just the influencer.
router.get('/:slug', async (req, res) => {
  try {
    const [[row]] = await db.query(
      `SELECT p.title, p.organization, p.emoji, p.platform, p.external_url,
              i.full_name AS influencer_name
       FROM influencer_projects ip
       JOIN projects p ON p.id = ip.project_id
       JOIN influencers i ON i.id = ip.influencer_id
       WHERE ip.referral_slug = ?`,
      [req.params.slug]
    );
    if (!row) return res.status(404).json({ error: 'Link not found' });
    res.json(row);
    db.query('UPDATE influencer_projects SET click_count = click_count + 1 WHERE referral_slug = ?', [req.params.slug])
      .catch(e => console.error('[go] Failed to record click:', e.message));
  } catch (e) {
    if (isDbError(e)) return res.status(503).json({ error: 'Service unavailable' });
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
