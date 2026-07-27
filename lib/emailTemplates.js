const wrap = (title, bodyHtml) => `
<div style="font-family:'DM Sans',Arial,sans-serif;background:#F4F7FB;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E2E8F0;">
    <div style="background:linear-gradient(135deg,#1A2B4A,#1565C0);padding:24px 28px;">
      <span style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-weight:800;font-size:20px;color:#fff;letter-spacing:.5px;">SOCIA</span>
    </div>
    <div style="padding:28px;">
      <h1 style="font-size:19px;font-weight:800;color:#1A2B4A;margin:0 0 14px;">${title}</h1>
      ${bodyHtml}
    </div>
    <div style="padding:16px 28px;background:#F4F7FB;font-size:11.5px;color:#94A3B8;">
      You're receiving this because of activity on your Socia account.
    </div>
  </div>
</div>`;

const p = (text) => `<p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 14px;">${text}</p>`;

// ── Influencer ──────────────────────────────────────────────
function influencerWelcome(name) {
  return {
    subject: 'Welcome to Socia — let\'s get you set up',
    html: wrap('Welcome to Socia, ' + name + '! 🎉', [
      p('Thanks for joining Socia as a creator. Complete your profile, link your social accounts, and finish identity and payout verification to start enrolling in campaigns.'),
      p('Once your registration is approved, you\'ll be able to browse causes and start amplifying campaigns you care about.'),
    ].join('')),
  };
}

function influencerEnrolled(name, projectTitle, orgName) {
  return {
    subject: `You're enrolled in "${projectTitle}"`,
    html: wrap('You\'re in! ✅', [
      p(`Hi ${name}, you've successfully enrolled in <strong>${projectTitle}</strong>, supporting <strong>${orgName}</strong>.`),
      p('A shareable campaign link has been generated for you in your dashboard under "My Active Projects" — use it to drive traffic straight to the campaign.'),
      p('Once your content is live, submit your post URL from the dashboard so the NPO can review it.'),
    ].join('')),
  };
}

// ── NPO ─────────────────────────────────────────────────────
function npoWelcome(name) {
  return {
    subject: 'Welcome to Socia — register your organization',
    html: wrap('Welcome to Socia, ' + name + '! 🎉', [
      p('Thanks for registering your organization on Socia. Complete your organization\'s basic info, certification, and recipient bank details to activate your account.'),
      p('Once approved, you\'ll be able to list crowdfunding campaigns for creators to promote.'),
    ].join('')),
  };
}

function npoProjectSubmitted(name, projectTitle) {
  return {
    subject: `"${projectTitle}" submitted for review`,
    html: wrap('Project submitted ✅', [
      p(`Hi ${name}, your project <strong>${projectTitle}</strong> has been submitted and is now pending admin review.`),
      p('You\'ll be notified as soon as it\'s approved and visible to creators.'),
    ].join('')),
  };
}

// ── Admin ────────────────────────────────────────────────────
function adminApprovalNeeded(kind, label, meta) {
  const KIND_LABEL = { npo: 'NPO registration', project: 'project submission', influencer: 'creator registration' };
  return {
    subject: `New ${KIND_LABEL[kind] || kind} awaiting approval: ${label}`,
    html: wrap('Approval needed', [
      p(`A new ${KIND_LABEL[kind] || kind} — <strong>${label}</strong> — is pending review.`),
      meta ? p(meta) : '',
      p('Sign in to the admin dashboard to review and approve or reject it.'),
    ].join('')),
  };
}

module.exports = {
  influencerWelcome,
  influencerEnrolled,
  npoWelcome,
  npoProjectSubmitted,
  adminApprovalNeeded,
};
