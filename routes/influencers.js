const router = require('express').Router();
const db = require('../db');

const isDbError = e => ['ETIMEDOUT','ECONNREFUSED','ENOTFOUND','ER_ACCESS_DENIED_ERROR'].includes(e.code) || e.fatal;

// GET /api/influencers — list creators (used by NPOs browsing who to invite). Defaults to approved only.
router.get('/', async (req, res) => {
  try {
    const { status = 'approved', search } = req.query;
    let sql = 'SELECT id, full_name, email, country, bio, causes, sns_accounts, status FROM influencers WHERE status = ?';
    const params = [status];
    if (search) { sql += ' AND full_name LIKE ?'; params.push(`%${search}%`); }
    sql += ' ORDER BY full_name ASC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    if (isDbError(e)) return res.json([]);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/influencers — register a new influencer
// Accepts both camelCase (from frontend forms) and snake_case field names
router.post('/', async (req, res) => {
  try {
    const b = req.body;

    const full_name      = b.full_name      || b.fullName      || '';
    const email          = b.email          || '';
    const phone          = b.phone          || '';
    const country        = b.country        || '';
    const bio            = b.bio            || '';
    const causes         = b.causes         || [];
    const sns_accounts   = b.sns_accounts   || b.snsAccounts   || [];
    const id_type        = b.id_type        || b.idType        || '';
    const id_number      = b.id_number      || b.idNumber      || '';
    const bank_name      = b.bank_name      || b.bankName      || '';
    const bank_account   = b.bank_account   || b.accountNumber || '';
    const bank_branch    = b.bank_branch    || b.bankBranch    || '';
    const bank_account_name = b.bank_account_name || b.accountHolder || '';
    const bank_number    = b.bank_number    || b.bankNumber    || '';
    const branch_code    = b.branch_code    || b.branchCode    || '';
    const account_type   = b.account_type   || b.accountType   || '';
    const tax_country    = b.tax_country    || b.taxCountry    || '';
    const tax_id         = b.tax_id         || b.taxId         || '';
    const tax_form       = b.tax_form       || b.taxForm       || '';

    if (!full_name || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }

    const [result] = await db.query(
      `INSERT INTO influencers
        (full_name, email, phone, country, bio, causes, sns_accounts,
         id_type, id_number, bank_name, bank_account, bank_branch, bank_account_name,
         bank_number, branch_code, account_type,
         tax_country, tax_id, tax_form, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending')`,
      [full_name, email, phone, country, bio,
       JSON.stringify(causes), JSON.stringify(sns_accounts),
       id_type, id_number, bank_name, bank_account, bank_branch, bank_account_name,
       bank_number, branch_code, account_type,
       tax_country, tax_id, tax_form]
    );
    res.status(201).json({ id: result.insertId, status: 'pending' });
  } catch (e) {
    if (isDbError(e)) {
      return res.status(201).json({ id: Date.now(), status: 'pending', _mock: true });
    }
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/influencers/:id — save the remaining onboarding fields after account creation.
router.put('/:id', async (req, res) => {
  try {
    const b = req.body;
    const full_name = b.full_name || b.fullName || '';
    const email = b.email || '';
    if (!full_name || !email) return res.status(400).json({ error: 'Full name and email are required' });
    await db.query(
      `UPDATE influencers SET full_name=?, email=?, phone=?, country=?, bio=?, causes=?, sns_accounts=?,
       id_type=?, id_number=?, bank_name=?, bank_account=?, bank_branch=?, bank_account_name=?,
       bank_number=?, branch_code=?, account_type=? WHERE id=?`,
      [full_name, email, b.phone || '', b.country || '', b.bio || '', JSON.stringify(b.causes || []), JSON.stringify(b.sns_accounts || b.snsAccounts || []),
       b.id_type || b.idType || '', b.id_number || b.idNumber || '', b.bank_name || b.bankName || '',
       b.bank_account || b.accountNumber || '', b.bank_branch || b.bankBranch || '',
       b.bank_account_name || b.accountHolder || '',
       b.bank_number || b.bankNumber || '', b.branch_code || b.branchCode || '', b.account_type || b.accountType || '',
       req.params.id]
    );
    res.json({ id: Number(req.params.id), status: 'pending' });
  } catch (e) {
    if (isDbError(e)) return res.json({ id: Number(req.params.id), status: 'pending', _mock: true });
    res.status(500).json({ error: e.message });
  }
});

// GET /api/influencers/:id/projects — enrolled projects for an influencer
router.get('/:id/projects', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.title, p.organization, p.platform, p.category, p.goal,
              p.goal_amount, p.stipend_amount, p.deadline, p.emoji, p.description,
              p.crowdfunding_model, p.crowdfunding_model_other,
              ip.id AS enrollment_id, ip.status, ip.npo_status, ip.admin_status,
              ip.enrolled_at, ip.referral_slug, ip.click_count
       FROM influencer_projects ip
       JOIN projects p ON p.id = ip.project_id
       WHERE ip.influencer_id = ?
       ORDER BY ip.enrolled_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    if (isDbError(e)) return res.json([]);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/influencers/:id/earnings — payout summary: pending vs. earned, monthly breakdown, payout schedule
router.get('/:id/earnings', async (req, res) => {
  try {
    const [[settings]] = await db.query('SELECT * FROM platform_settings WHERE id = 1');
    const payoutDay = settings?.payout_day || 5;

    const [rows] = await db.query(
      `SELECT p.id, p.title, p.organization, p.stipend_amount, p.deadline, ip.status
       FROM influencer_projects ip JOIN projects p ON p.id = ip.project_id
       WHERE ip.influencer_id = ? AND ip.status NOT IN ('dropped', 'pending', 'rejected')
       ORDER BY p.deadline DESC`,
      [req.params.id]
    );

    const pending_payout = rows
      .filter(r => r.status === 'enrolled' || r.status === 'active')
      .reduce((s, r) => s + Number(r.stipend_amount || 0), 0);
    const total_earned = rows
      .filter(r => r.status === 'completed')
      .reduce((s, r) => s + Number(r.stipend_amount || 0), 0);

    const monthlyMap = new Map();
    for (const r of rows) {
      if (!r.deadline) continue;
      const d = new Date(r.deadline);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthlyMap.has(key)) monthlyMap.set(key, { year: d.getFullYear(), month: d.getMonth() + 1, amount: 0, count: 0 });
      const bucket = monthlyMap.get(key);
      bucket.amount += Number(r.stipend_amount || 0);
      bucket.count += 1;
    }
    const monthly = [...monthlyMap.values()].sort((a, b) => b.year - a.year || b.month - a.month);

    // Format as YYYY-MM-DD from local date parts — using toISOString() here would shift the date
    // back a day on servers running ahead of UTC (e.g. UTC+5:30).
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const now = new Date();
    const cutoff_date = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const next_payout_date = new Date(now.getFullYear(), now.getMonth() + 1, payoutDay);

    res.json({
      pending_payout,
      total_earned,
      payout_day: payoutDay,
      cutoff_date: fmt(cutoff_date),
      next_payout_date: fmt(next_payout_date),
      monthly,
      campaigns: rows,
    });
  } catch (e) {
    if (isDbError(e)) return res.json({ pending_payout: 0, total_earned: 0, payout_day: 5, cutoff_date: null, next_payout_date: null, monthly: [], campaigns: [] });
    res.status(500).json({ error: e.message });
  }
});

// GET /api/influencers/:id
router.get('/:id', async (req, res) => {
  try {
    const [[inf]] = await db.query('SELECT * FROM influencers WHERE id = ?', [req.params.id]);
    if (!inf) return res.status(404).json({ error: 'Not found' });
    res.json(inf);
  } catch (e) {
    if (isDbError(e)) return res.status(404).json({ error: 'DB unavailable' });
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
