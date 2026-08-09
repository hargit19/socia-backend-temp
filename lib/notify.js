require('dotenv').config();
const db = require('../db');
const { sendMail } = require('./mailer');
const templates = require('./emailTemplates');

async function getAdminRecipients() {
  const recipients = new Set();
  try {
    const [rows] = await db.query('SELECT email FROM admins WHERE email IS NOT NULL AND email != ""');
    rows.forEach(r => recipients.add(r.email));
  } catch (e) {
    // DB unavailable — fall through to env fallback only.
  }
  if (process.env.ADMIN_NOTIFICATION_EMAIL) {
    process.env.ADMIN_NOTIFICATION_EMAIL.split(',').map(s => s.trim()).filter(Boolean).forEach(e => recipients.add(e));
  }
  return [...recipients];
}

async function notifyAdmins(kind, label, meta) {
  const recipients = await getAdminRecipients();
  if (!recipients.length) return;
  const { subject, html } = templates.adminApprovalNeeded(kind, label, meta);
  await Promise.all(recipients.map(to => sendMail({ to, subject, html })));
}

async function sendInfluencerWelcome(email, name) {
  const { subject, html } = templates.influencerWelcome(name);
  await sendMail({ to: email, subject, html });
}

async function sendInfluencerEnrolled(email, name, projectTitle, orgName) {
  const { subject, html } = templates.influencerEnrolled(name, projectTitle, orgName);
  await sendMail({ to: email, subject, html });
}

async function sendNPOWelcome(email, name) {
  const { subject, html } = templates.npoWelcome(name);
  await sendMail({ to: email, subject, html });
}

async function sendNPOProjectSubmitted(email, name, projectTitle) {
  const { subject, html } = templates.npoProjectSubmitted(name, projectTitle);
  await sendMail({ to: email, subject, html });
}

async function sendNPOCreatorApplied(email, npoName, influencerName, projectTitle) {
  const { subject, html } = templates.npoCreatorApplied(npoName, influencerName, projectTitle);
  await sendMail({ to: email, subject, html });
}

module.exports = {
  notifyAdmins,
  sendInfluencerWelcome,
  sendInfluencerEnrolled,
  sendNPOWelcome,
  sendNPOProjectSubmitted,
  sendNPOCreatorApplied,
};
