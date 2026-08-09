const db = require('../db');
const crypto = require('crypto');
const notify = require('./notify');

const slugify = (s) => String(s || '').toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// Call after updating npo_status or admin_status on an influencer_projects row.
// Once both sides have approved, promotes the row to a live 'enrolled' state,
// mints a referral link (if it doesn't have one yet), and emails the creator.
// No-op if either side is still pending/rejected, or if already enrolled.
async function finalizeIfApproved(id) {
  const [[row]] = await db.query('SELECT * FROM influencer_projects WHERE id = ?', [id]);
  if (!row) return null;
  if (row.npo_status !== 'approved' || row.admin_status !== 'approved') return row;
  if (row.status === 'enrolled') return row;

  const [[project]] = await db.query('SELECT title, platform, organization FROM projects WHERE id = ?', [row.project_id]);
  const [[influencer]] = await db.query('SELECT full_name, email FROM influencers WHERE id = ?', [row.influencer_id]);

  let referral_slug = row.referral_slug;
  if (!referral_slug) {
    const base = [project?.title, influencer?.full_name, project?.platform].map(slugify).filter(Boolean).join('-');
    referral_slug = `${base}-${crypto.randomBytes(3).toString('hex')}`;
  }
  await db.query("UPDATE influencer_projects SET status='enrolled', referral_slug=? WHERE id=?", [referral_slug, id]);

  try {
    if (influencer?.email) {
      await notify.sendInfluencerEnrolled(influencer.email, influencer.full_name, project?.title, project?.organization);
    }
  } catch (e) {
    console.error('[enrollmentApproval] Failed to send acceptance email:', e.message);
  }

  const [[updated]] = await db.query('SELECT * FROM influencer_projects WHERE id = ?', [id]);
  return updated;
}

module.exports = { finalizeIfApproved };
