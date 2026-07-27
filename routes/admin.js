const router = require('express').Router();
const db = require('../db');

const isDbError = e => ['ETIMEDOUT','ECONNREFUSED','ENOTFOUND','ER_ACCESS_DENIED_ERROR'].includes(e.code) || e.fatal;

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [[npoCount]] = await db.query("SELECT COUNT(*) AS total FROM npos WHERE status = 'approved'");
    const [[pendingNpos]] = await db.query("SELECT COUNT(*) AS total FROM npos WHERE status = 'pending'");
    const [[infCount]] = await db.query("SELECT COUNT(*) AS total FROM influencers WHERE status = 'approved'");
    const [[pendingInf]] = await db.query("SELECT COUNT(*) AS total FROM influencers WHERE status = 'pending'");
    const [[totalInf]] = await db.query('SELECT COUNT(*) AS total FROM influencers');
    const [[activeCreators]] = await db.query('SELECT COUNT(DISTINCT influencer_id) AS total FROM influencer_projects');
    const [[stipendsPaid]] = await db.query("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE status = 'paid'");
    const [[stipendsPending]] = await db.query("SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS amount FROM transactions WHERE status = 'pending'");
    const [[projLive]] = await db.query("SELECT COUNT(*) AS total FROM projects WHERE status = 'approved'");
    const [[projPending]] = await db.query("SELECT COUNT(*) AS total FROM projects WHERE status = 'pending'");
    const [categories] = await db.query(
      "SELECT category, COUNT(*) AS count FROM projects WHERE status = 'approved' AND category IS NOT NULL AND category != '' GROUP BY category ORDER BY count DESC"
    );
    res.json({
      npos: npoCount.total,
      pending_npos: pendingNpos.total,
      influencers: infCount.total,
      pending_influencers: pendingInf.total,
      total_influencers: totalInf.total,
      active_creators: activeCreators.total,
      stipends_paid: Number(stipendsPaid.total),
      stipends_pending_count: stipendsPending.total,
      stipends_pending_amount: Number(stipendsPending.amount),
      live_projects: projLive.total,
      pending_projects: projPending.total,
      categories,
    });
  } catch (e) {
    if (isDbError(e)) return res.json({ npos: 0, pending_npos: 0, influencers: 0, pending_influencers: 0, total_influencers: 0, active_creators: 0, stipends_paid: 0, stipends_pending_count: 0, stipends_pending_amount: 0, live_projects: 0, pending_projects: 0, categories: [] });
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/admins — list admin accounts (no password hashes)
router.get('/admins', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, created_at FROM admins ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) {
    if (isDbError(e)) return res.json([]);
    res.status(500).json({ error: e.message });
  }
});

// ── NPO ADMIN ROUTES ──────────────────────────────────────────

// GET /api/admin/npos
router.get('/npos', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM npos';
    const params = [];
    if (status) { sql += ' WHERE status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    if (isDbError(e)) return res.json([]);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/npos/:id/approve
router.post('/npos/:id/approve', async (req, res) => {
  try {
    await db.query("UPDATE npos SET status = 'approved', reviewed_at = NOW() WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    if (isDbError(e)) return res.json({ success: true, _mock: true });
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/npos/:id/reject
router.post('/npos/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    await db.query("UPDATE npos SET status = 'rejected', reject_reason = ?, reviewed_at = NOW() WHERE id = ?", [reason, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    if (isDbError(e)) return res.json({ success: true, _mock: true });
    res.status(500).json({ error: e.message });
  }
});

// ── PROJECT ADMIN ROUTES ──────────────────────────────────────

// GET /api/admin/projects
router.get('/projects', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT p.*, n.org_name AS npo_name FROM projects p LEFT JOIN npos n ON p.npo_id = n.id';
    const params = [];
    if (status) { sql += ' WHERE p.status = ?'; params.push(status); }
    sql += ' ORDER BY p.created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    if (isDbError(e)) return res.json([]);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/projects/:id/approve
router.post('/projects/:id/approve', async (req, res) => {
  try {
    await db.query("UPDATE projects SET status = 'approved', reviewed_at = NOW() WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    if (isDbError(e)) return res.json({ success: true, _mock: true });
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/projects/:id/reject
router.post('/projects/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    await db.query("UPDATE projects SET status = 'rejected', reject_reason = ?, reviewed_at = NOW() WHERE id = ?", [reason, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    if (isDbError(e)) return res.json({ success: true, _mock: true });
    res.status(500).json({ error: e.message });
  }
});

// ── INFLUENCER ADMIN ROUTES ───────────────────────────────────

// GET /api/admin/influencers
router.get('/influencers', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM influencers';
    const params = [];
    if (status) { sql += ' WHERE status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    if (isDbError(e)) return res.json([]);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/influencers/:id/approve
router.post('/influencers/:id/approve', async (req, res) => {
  try {
    await db.query("UPDATE influencers SET status = 'approved', reviewed_at = NOW() WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    if (isDbError(e)) return res.json({ success: true, _mock: true });
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/influencers/:id/reject
router.post('/influencers/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    await db.query("UPDATE influencers SET status = 'rejected', reject_reason = ?, reviewed_at = NOW() WHERE id = ?", [reason, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    if (isDbError(e)) return res.json({ success: true, _mock: true });
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/pending — all pending items in one call
router.get('/pending', async (req, res) => {
  try {
    const [[npos], [projects], [influencers]] = await Promise.all([
      db.query("SELECT id, org_name AS name, email, created_at FROM npos WHERE status = 'pending' ORDER BY created_at DESC"),
      db.query("SELECT id, title AS name, created_at FROM projects WHERE status = 'pending' ORDER BY created_at DESC"),
      db.query("SELECT id, full_name AS name, email, created_at FROM influencers WHERE status = 'pending' ORDER BY created_at DESC"),
    ]);
    res.json({ npos, projects, influencers });
  } catch (e) {
    if (isDbError(e)) return res.json({ npos: [], projects: [], influencers: [] });
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/activity — recent activity feed
router.get('/activity', async (req, res) => {
  try {
    const [rows] = await db.query(
      `(SELECT 'npo_registered' AS type, org_name AS label, created_at AS ts FROM npos ORDER BY created_at DESC LIMIT 5)
       UNION ALL
       (SELECT 'project_submitted' AS type, title AS label, created_at AS ts FROM projects WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5)
       UNION ALL
       (SELECT 'influencer_registered' AS type, full_name AS label, created_at AS ts FROM influencers ORDER BY created_at DESC LIMIT 5)
       ORDER BY ts DESC LIMIT 20`
    );
    res.json(rows);
  } catch (e) {
    if (isDbError(e)) return res.json([]);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
