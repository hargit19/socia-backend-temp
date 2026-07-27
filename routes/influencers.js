const router = require('express').Router();
const db = require('../db');

const isDbError = e => ['ETIMEDOUT','ECONNREFUSED','ENOTFOUND','ER_ACCESS_DENIED_ERROR'].includes(e.code) || e.fatal;

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
         tax_country, tax_id, tax_form, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending')`,
      [full_name, email, phone, country, bio,
       JSON.stringify(causes), JSON.stringify(sns_accounts),
       id_type, id_number, bank_name, bank_account, bank_branch, bank_account_name,
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
       id_type=?, id_number=?, bank_name=?, bank_account=?, bank_branch=?, bank_account_name=? WHERE id=?`,
      [full_name, email, b.phone || '', b.country || '', b.bio || '', JSON.stringify(b.causes || []), JSON.stringify(b.sns_accounts || b.snsAccounts || []),
       b.id_type || b.idType || '', b.id_number || b.idNumber || '', b.bank_name || b.bankName || '',
       b.bank_account || b.accountNumber || '', b.bank_branch || b.bankBranch || '',
       b.bank_account_name || b.accountHolder || '', req.params.id]
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
              p.goal_amount, p.deadline, p.emoji, p.description,
              ip.status AS enrollment_status, ip.enrolled_at, ip.referral_slug, ip.click_count
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
