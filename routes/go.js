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

// POST /api/go/:slug/donate — dummy checkout: records a simulated donation against
// this referral link, attributes commission to the influencer, and bumps the
// project's raised amount. Always succeeds — this is a stand-in for a real gateway.
router.post('/:slug/donate', async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'amount must be a positive number' });

    const [[link]] = await db.query(
      `SELECT ip.id AS influencer_project_id, p.id AS project_id, p.commission_percent
       FROM influencer_projects ip
       JOIN projects p ON p.id = ip.project_id
       WHERE ip.referral_slug = ?`,
      [req.params.slug]
    );
    if (!link) return res.status(404).json({ error: 'Link not found' });

    const commission_amount = Math.round(amount * Number(link.commission_percent) / 100 * 100) / 100;
    const donor_name = req.body.donor_name || null;

    const [result] = await db.query(
      'INSERT INTO donations (influencer_project_id, amount, commission_amount, donor_name) VALUES (?, ?, ?, ?)',
      [link.influencer_project_id, amount, commission_amount, donor_name]
    );
    await db.query('UPDATE projects SET raised_amount = raised_amount + ? WHERE id = ?', [amount, link.project_id]);

    res.status(201).json({ success: true, donation_id: result.insertId, amount, commission_amount });
  } catch (e) {
    if (isDbError(e)) return res.status(201).json({ success: true, donation_id: Date.now(), amount: Number(req.body.amount) || 0, commission_amount: 0, _mock: true });
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
