const router = require('express').Router();
const crypto = require('crypto');
const { promisify } = require('util');
const db = require('../db');
const notify = require('../lib/notify');

const scrypt = promisify(crypto.scrypt);
const isDbError = e => ['ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'ER_ACCESS_DENIED_ERROR'].includes(e.code) || e.fatal;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}

async function passwordMatches(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, expected] = stored.split(':');
  const derived = await scrypt(password, salt, 64);
  const actual = Buffer.from(expected, 'hex');
  return actual.length === derived.length && crypto.timingSafeEqual(actual, derived);
}

function publicUser(user) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  const handle = String(b.handle || '').trim() || `@${name.toLowerCase().replace(/\s+/g, '.')}`;
  const causes = Array.isArray(b.causes) ? b.causes : [];
  const snsAccounts = Array.isArray(b.sns_accounts) ? b.sns_accounts : [];

  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  try {
    const passwordHash = await hashPassword(password);
    const [result] = await db.query(
      `INSERT INTO influencers (full_name, email, phone, country, bio, causes, sns_accounts,
        id_type, id_number, bank_name, bank_account, bank_branch, bank_account_name,
        tax_country, tax_id, tax_form, password_hash, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [name, email, b.phone || null, b.country || null, b.bio || null, JSON.stringify(causes), JSON.stringify(snsAccounts),
        b.id_type || null, b.id_number || null, b.bank_name || null, b.bank_account || null,
        b.bank_branch || null, b.bank_account_name || null, b.tax_country || null,
        b.tax_id || null, b.tax_form || null, passwordHash]
    );
    const userId = result.insertId;
    const [[user]] = await db.query('SELECT * FROM influencers WHERE id = ?', [userId]);
    res.status(201).json({ user: publicUser(user) });
    try {
      await notify.sendInfluencerWelcome(email, name);
      await notify.notifyAdmins('influencer', name, `Email: ${email}`);
    } catch (notifyErr) {
      console.error('[auth] Failed to send signup notifications:', notifyErr.message);
    }
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account with that email already exists.' });
    if (isDbError(e)) return res.status(503).json({ error: 'User storage is unavailable. Please try again shortly.' });
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/signin — sign in uses display name and password as requested.
router.post('/signin', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const password = String(req.body?.password || '');
  if (!name || !password) return res.status(400).json({ error: 'Name and password are required.' });
  try {
    const [rows] = await db.query('SELECT * FROM influencers WHERE full_name = ? ORDER BY id DESC LIMIT 1', [name]);
    if (!rows.length || !(await passwordMatches(password, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Incorrect name or password.' });
    }
    res.json({ user: publicUser(rows[0]) });
  } catch (e) {
    if (isDbError(e)) return res.status(503).json({ error: 'User storage is unavailable. Please try again shortly.' });
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/npo/signup
router.post('/npo/signup', async (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');

  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  try {
    const passwordHash = await hashPassword(password);
    const [result] = await db.query(
      `INSERT INTO npos (admin_name, email, password_hash, status) VALUES (?, ?, ?, 'pending')`,
      [name, email, passwordHash]
    );
    const orgId = result.insertId;
    const [[org]] = await db.query('SELECT * FROM npos WHERE id = ?', [orgId]);
    res.status(201).json({ user: publicUser(org) });
    try {
      await notify.sendNPOWelcome(email, name);
      await notify.notifyAdmins('npo', name, `Email: ${email}`);
    } catch (notifyErr) {
      console.error('[auth] Failed to send NPO signup notifications:', notifyErr.message);
    }
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account with that email already exists.' });
    if (isDbError(e)) return res.status(503).json({ error: 'User storage is unavailable. Please try again shortly.' });
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/npo/signin
router.post('/npo/signin', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const password = String(req.body?.password || '');
  if (!name || !password) return res.status(400).json({ error: 'Name and password are required.' });
  try {
    const [rows] = await db.query('SELECT * FROM npos WHERE admin_name = ? ORDER BY id DESC LIMIT 1', [name]);
    if (!rows.length || !(await passwordMatches(password, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Incorrect name or password.' });
    }
    res.json({ user: publicUser(rows[0]) });
  } catch (e) {
    if (isDbError(e)) return res.status(503).json({ error: 'User storage is unavailable. Please try again shortly.' });
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/admin/signup — not exposed in the UI; used to provision admin accounts directly.
router.post('/admin/signup', async (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim();
  const email = b.email ? String(b.email).trim().toLowerCase() : null;
  const password = String(b.password || '');

  if (!name || !password) return res.status(400).json({ error: 'Name and password are required.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  try {
    const passwordHash = await hashPassword(password);
    const [result] = await db.query(
      `INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)`,
      [name, email, passwordHash]
    );
    const adminId = result.insertId;
    const [[admin]] = await db.query('SELECT * FROM admins WHERE id = ?', [adminId]);
    res.status(201).json({ user: publicUser(admin) });
  } catch (e) {
    if (isDbError(e)) return res.status(503).json({ error: 'User storage is unavailable. Please try again shortly.' });
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/admin/signin
router.post('/admin/signin', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const password = String(req.body?.password || '');
  if (!name || !password) return res.status(400).json({ error: 'Name and password are required.' });
  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE name = ? ORDER BY id DESC LIMIT 1', [name]);
    if (!rows.length || !(await passwordMatches(password, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Incorrect name or password.' });
    }
    res.json({ user: publicUser(rows[0]) });
  } catch (e) {
    if (isDbError(e)) return res.status(503).json({ error: 'User storage is unavailable. Please try again shortly.' });
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
