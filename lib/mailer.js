require('dotenv').config();
const nodemailer = require('nodemailer');

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, EMAIL_FROM } = process.env;
const configured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = configured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

// Sends an email if SMTP is configured; otherwise logs it so the rest of the
// app keeps working in local/dev environments that have no mail credentials.
async function sendMail({ to, subject, html }) {
  if (!to) return;
  if (!configured) {
    console.log(`[mailer] SMTP not configured — would have sent to ${to}: "${subject}"`);
    return;
  }
  try {
    await transporter.sendMail({ from: EMAIL_FROM || SMTP_USER, to, subject, html });
  } catch (e) {
    console.error(`[mailer] Failed to send email to ${to}:`, e.message);
  }
}

module.exports = { sendMail, isConfigured: () => configured };
