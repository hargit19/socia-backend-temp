const router = require('express').Router();
const db = require('../db');

const isDbError = e => ['ETIMEDOUT','ECONNREFUSED','ENOTFOUND','ER_ACCESS_DENIED_ERROR'].includes(e.code) || e.fatal;

// POST /api/npos — register a new NPO
// Accepts both camelCase (from frontend forms) and snake_case field names
router.post('/', async (req, res) => {
  try {
    const b = req.body;

    // Resolve field names from whichever format the client sends
    const org_name       = b.org_name       || b.legalName    || b.orgName    || b.displayName || '';
    const org_type       = b.org_type       || b.orgType      || b.title      || '';
    const ein            = b.ein            || '';
    const website        = b.website        || '';
    const phone          = b.phone          || '';
    const email          = b.email          || b.officialEmail || '';
    const country        = b.country        || '';
    const address        = b.address        || '';
    const mission        = b.mission        || b.description   || '';
    const causes         = b.causes         || [];
    const kyc_name       = b.kyc_name       || b.fullName      || b.adminName  || '';
    const kyc_id_type    = b.kyc_id_type    || b.idType        || '';
    const kyc_id_number  = b.kyc_id_number  || b.idNumber      || '';
    const bank_name      = b.bank_name      || b.bank          || b.bankName   || '';
    const bank_account   = b.bank_account   || b.account       || b.accountNumber || '';
    const bank_branch    = b.bank_branch    || b.branch        || b.bankBranch || '';
    const bank_account_name = b.bank_account_name || b.holder  || b.accountHolder || '';

    if (!org_name || !email) {
      return res.status(400).json({ error: 'Organization name and email are required' });
    }

    const [result] = await db.query(
      `INSERT INTO npos
        (org_name, org_type, ein, website, phone, email, country, address, mission, causes,
         kyc_name, kyc_id_type, kyc_id_number, bank_name, bank_account, bank_branch, bank_account_name, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending')`,
      [org_name, org_type, ein, website, phone, email, country, address, mission,
       JSON.stringify(causes), kyc_name, kyc_id_type, kyc_id_number,
       bank_name, bank_account, bank_branch, bank_account_name]
    );
    res.status(201).json({ id: result.insertId, status: 'pending' });
  } catch (e) {
    if (isDbError(e)) {
      return res.status(201).json({ id: Date.now(), status: 'pending', _mock: true });
    }
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/npos/:id — save the remaining registration fields after account creation.
router.put('/:id', async (req, res) => {
  try {
    const b = req.body;

    const org_name       = b.org_name       || b.legalName    || b.orgName    || b.displayName || '';
    const org_type       = b.org_type       || b.orgType      || b.title      || '';
    const admin_name     = b.admin_name     || b.fullName     || b.adminName  || '';
    const ein            = b.ein            || '';
    const website        = b.website        || '';
    const phone          = b.phone          || '';
    const email          = b.email          || b.officialEmail || '';
    const country        = b.country        || '';
    const address        = b.address        || '';
    const mission        = b.mission        || b.description   || '';
    const causes         = b.causes         || [];
    const kyc_name       = b.kyc_name       || b.fullName      || b.adminName  || '';
    const kyc_id_type    = b.kyc_id_type    || b.idType        || '';
    const kyc_id_number  = b.kyc_id_number  || b.idNumber      || '';
    const bank_name      = b.bank_name      || b.bank          || b.bankName   || '';
    const bank_account   = b.bank_account   || b.account       || b.accountNumber || '';
    const bank_branch    = b.bank_branch    || b.branch        || b.bankBranch || '';
    const bank_account_name = b.bank_account_name || b.holder  || b.accountHolder || '';

    if (!email) return res.status(400).json({ error: 'Email is required' });

    await db.query(
      `UPDATE npos SET org_name=?, org_type=?, admin_name=?, ein=?, website=?, phone=?, email=?, country=?,
       address=?, mission=?, causes=?, kyc_name=?, kyc_id_type=?, kyc_id_number=?,
       bank_name=?, bank_account=?, bank_branch=?, bank_account_name=? WHERE id=?`,
      [org_name || null, org_type || null, admin_name || null, ein || null, website || null, phone || null,
       email, country || null, address || null, mission || null, JSON.stringify(causes),
       kyc_name || null, kyc_id_type || null, kyc_id_number || null,
       bank_name || null, bank_account || null, bank_branch || null, bank_account_name || null,
       req.params.id]
    );
    res.json({ id: Number(req.params.id), status: 'pending' });
  } catch (e) {
    if (isDbError(e)) return res.json({ id: Number(req.params.id), status: 'pending', _mock: true });
    res.status(500).json({ error: e.message });
  }
});

// GET /api/npos/:id/projects — projects created by this NPO, with admin review status
router.get('/:id/projects', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM influencer_projects ip WHERE ip.project_id = p.id) AS creator_count,
              (SELECT COALESCE(SUM(ip.click_count), 0) FROM influencer_projects ip WHERE ip.project_id = p.id) AS total_clicks
       FROM projects p WHERE p.npo_id = ? ORDER BY p.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    if (isDbError(e)) return res.json([]);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/npos/:id
router.get('/:id', async (req, res) => {
  try {
    const [[npo]] = await db.query('SELECT * FROM npos WHERE id = ?', [req.params.id]);
    if (!npo) return res.status(404).json({ error: 'Not found' });
    res.json(npo);
  } catch (e) {
    if (isDbError(e)) return res.status(404).json({ error: 'DB unavailable' });
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
