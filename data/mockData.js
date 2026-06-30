// Fallback data used when MySQL is unreachable.
// Mirrors exactly what is in seeds/seed.sql.
// Routes try the DB first; on connection failure they fall back here.

const user = {
  id: 1, name: 'Jamie Rivera', handle: '@jamie.forchange',
  email: 'jamie@example.com', phone: '+1 415 555 0182',
  country: 'United States', avatar_initials: 'JR',
  bio: 'Cause-driven creator focused on education, food relief, and global aid.',
  total_followers: 217000, avg_engagement: 5.2, authenticity_score: 91,
  registration_step: 'complete',
};

const sns_accounts = [
  { id:1, user_id:1, platform:'instagram', handle:'@jamie.forchange', display_name:'Jamie for Change', followers:98000, engagement_rate:5.8, account_number:1, is_connected:1 },
  { id:2, user_id:1, platform:'instagram', handle:'@jamie_advocacy',  display_name:'Jamie Advocacy',    followers:24000, engagement_rate:6.1, account_number:2, is_connected:1 },
  { id:3, user_id:1, platform:'youtube',   handle:null,               display_name:'Jamie for Change', followers:61000, engagement_rate:4.4, account_number:1, is_connected:1 },
  { id:4, user_id:1, platform:'twitter',   handle:'@jamie_change',    display_name:'Jamie Change',      followers:34000, engagement_rate:3.9, account_number:1, is_connected:1 },
];

const geography = [
  { region:'United States', percentage:62 },
  { region:'Europe',        percentage:22 },
  { region:'Others',        percentage:16 },
];

const projects = [
  { id:1,  title:'Daily Meals for Homeless Families',     emoji:'🍽️', organization:'Feed the Future',             platform:'GoFundMe',   category:'Food Relief', goal_amount:100000, raised_amount:88000,  stipend_amount:500, bonus_stipend:100, deadline:'2026-04-25', status:'open' },
  { id:2,  title:'Build a School in Rural Ghana',          emoji:'🏫', organization:'Pencils of Promise',          platform:'Kickstarter',category:'Education',   goal_amount:75000,  raised_amount:54200,  stipend_amount:350, bonus_stipend:100, deadline:'2026-05-10', status:'open' },
  { id:3,  title:'Legal Aid for Syrian Refugees',          emoji:'🤝', organization:'International Rescue Committee', platform:'Kickstarter',category:'Refugees',    goal_amount:50000,  raised_amount:21000,  stipend_amount:600, bonus_stipend:0,   deadline:'2026-05-20', status:'open' },
  { id:4,  title:'Mobile Clinics for Rural Kenya',         emoji:'💉', organization:'Doctors Without Borders',     platform:'Indiegogo',  category:'Healthcare',  goal_amount:150000, raised_amount:79500,  stipend_amount:450, bonus_stipend:0,   deadline:'2026-06-01', status:'open' },
  { id:5,  title:'Emergency Housing for Flood Survivors',  emoji:'🏘️', organization:'Habitat for Humanity',        platform:'GoFundMe',   category:'Housing',     goal_amount:50000,  raised_amount:9500,   stipend_amount:400, bonus_stipend:0,   deadline:'2026-05-30', status:'open' },
  { id:6,  title:'Clean Water Wells in Bangladesh',        emoji:'🌊', organization:'charity: water',              platform:'Kickstarter',category:'Clean Water', goal_amount:60000,  raised_amount:0,      stipend_amount:350, bonus_stipend:0,   deadline:'2026-06-15', status:'open' },
  { id:7,  title:'Schools for All – Ethiopia',             emoji:'🏫', organization:'Pencils of Promise',          platform:'Kickstarter',category:'Education',   goal_amount:65000,  raised_amount:65000,  stipend_amount:450, bonus_stipend:0,   deadline:'2026-02-28', status:'completed' },
  { id:8,  title:'Refugee Welcome Fund',                   emoji:'🤝', organization:'International Rescue Committee', platform:'Kickstarter',category:'Refugees',    goal_amount:40000,  raised_amount:40000,  stipend_amount:600, bonus_stipend:0,   deadline:'2026-03-15', status:'completed' },
  { id:9,  title:'Clean Futures Fund',                     emoji:'🌊', organization:'charity: water',              platform:'Kickstarter',category:'Clean Water', goal_amount:38000,  raised_amount:38000,  stipend_amount:380, bonus_stipend:0,   deadline:'2026-03-31', status:'completed' },
  { id:10, title:'Vaccination Drive – West Africa',        emoji:'🏥', organization:'UNICEF',                      platform:'Indiegogo',  category:'Healthcare',  goal_amount:30000,  raised_amount:30000,  stipend_amount:350, bonus_stipend:0,   deadline:'2026-01-31', status:'completed' },
  { id:11, title:"Children's Nutrition Drive",             emoji:'🥗', organization:'UNICEF',                      platform:'Indiegogo',  category:'Food Relief', goal_amount:25000,  raised_amount:25000,  stipend_amount:350, bonus_stipend:0,   deadline:'2026-02-20', status:'completed' },
  { id:12, title:'Literacy First',                         emoji:'📚', organization:'Room to Read',                platform:'Kickstarter',category:'Education',   goal_amount:30000,  raised_amount:30000,  stipend_amount:420, bonus_stipend:0,   deadline:'2026-01-30', status:'completed' },
];

const active_projects = [
  {
    ...projects[0], user_project_id: 1, enrolled_at: '2026-04-01',
    deliverables: [
      { id:1, content_type:'Instagram Reel',    platform:'instagram', icon:'📸', status:'approved',  feedback:'Powerful story ✓',                        submitted_at:'2026-04-15' },
      { id:2, content_type:'YouTube Documentary',platform:'youtube',   icon:'▶️', status:'approved',  feedback:null,                                       submitted_at:'2026-04-15' },
      { id:3, content_type:'Instagram Story Set',platform:'instagram', icon:'📱', status:'revision',  feedback:'Missing GoFundMe link in swipe-up',         submitted_at:'2026-04-16' },
    ],
  },
  {
    ...projects[1], user_project_id: 2, enrolled_at: '2026-04-15',
    deliverables: [
      { id:4, content_type:'Instagram Reel',         platform:'instagram', icon:'📸', status:'pending', feedback:null, submitted_at:null },
      { id:5, content_type:'YouTube Short',           platform:'youtube',   icon:'▶️', status:'pending', feedback:null, submitted_at:null },
      { id:6, content_type:'Caption + Campaign Link', platform:'instagram', icon:'📝', status:'pending', feedback:null, submitted_at:null },
    ],
  },
];

const completed_projects = [
  { title:'Schools for All – Ethiopia',     emoji:'🏫', organization:'Pencils of Promise',          platform:'Kickstarter', completed_at:'2026-02-28', amount:450, payment_status:'paid' },
  { title:'Refugee Welcome Fund',           emoji:'🤝', organization:'International Rescue Committee', platform:'Kickstarter', completed_at:'2026-03-15', amount:600, payment_status:'paid' },
  { title:'Clean Futures Fund',             emoji:'🌊', organization:'charity: water',              platform:'Kickstarter', completed_at:'2026-03-31', amount:380, payment_status:'paid' },
  { title:'Vaccination Drive – West Africa',emoji:'🏥', organization:'UNICEF',                      platform:'Indiegogo',   completed_at:'2026-01-31', amount:350, payment_status:'paid' },
  { title:"Children's Nutrition Drive",     emoji:'🥗', organization:'UNICEF',                      platform:'Indiegogo',   completed_at:'2026-02-20', amount:350, payment_status:'paid' },
  { title:'Literacy First',                 emoji:'📚', organization:'Room to Read',                platform:'Kickstarter', completed_at:'2026-01-30', amount:420, payment_status:'paid' },
];

const analytics = {
  summary: { total_impressions:2400000, total_engagements:125700, total_funds_raised:244100, total_link_clicks:8240 },
  campaigns: [
    { project_title:'Ghana School Build',         emoji:'🏫', organization:'Pencils of Promise',   platform:'Kickstarter', impressions:680000, engagements:40800, engagement_rate:6.0, link_clicks:2840, funds_raised:54200,  project_status:'open' },
    { project_title:'Daily Meals – Nairobi',       emoji:'🍽️', organization:'Feed the Future',      platform:'GoFundMe',    impressions:490000, engagements:26500, engagement_rate:5.4, link_clicks:2180, funds_raised:88000,  project_status:'open' },
    { project_title:'Clean Water Wells – Bangladesh',emoji:'🌊',organization:'charity: water',       platform:'Kickstarter', impressions:312000, engagements:18400, engagement_rate:5.9, link_clicks:1440, funds_raised:38000,  project_status:'completed' },
    { project_title:'Refugee Welcome Fund',         emoji:'🤝', organization:'IRC',                  platform:'Kickstarter', impressions:284000, engagements:15200, engagement_rate:5.4, link_clicks:980,  funds_raised:22500,  project_status:'completed' },
    { project_title:'Schools for All – Ethiopia',   emoji:'🏫', organization:'Pencils of Promise',   platform:'Kickstarter', impressions:420000, engagements:24800, engagement_rate:5.9, link_clicks:800,  funds_raised:41200,  project_status:'completed' },
    { project_title:'Vaccination Drive',            emoji:'🏥', organization:'UNICEF',               platform:'Indiegogo',   impressions:214000, engagements:12000, engagement_rate:5.6, link_clicks:0,    funds_raised:0,      project_status:'completed' },
  ],
  monthly: [
    { month:10, year:2025, funds_raised:18000 },
    { month:11, year:2025, funds_raised:24000 },
    { month:12, year:2025, funds_raised:20000 },
    { month:1,  year:2026, funds_raised:32000 },
    { month:2,  year:2026, funds_raised:41000 },
    { month:3,  year:2026, funds_raised:36000 },
    { month:4,  year:2026, funds_raised:51000 },
  ],
};

const earnings = {
  summary: { total_earned:4820, pending_payout:950, settled_to_bank:3870, campaign_count:8 },
  transactions: [
    { project_title:'Feed the Future',          organization:'GoFundMe Campaign',   emoji:'🍽️', amount:500, status:'pending', transaction_date:'2026-04-19', reference:'TXN-2026-0419' },
    { project_title:'Schools for All',           organization:'Pencils of Promise',  emoji:'🏫', amount:450, status:'paid',    transaction_date:'2026-04-12', reference:'TXN-2026-0412' },
    { project_title:'Refugee Welcome Fund',      organization:'IRC · Kickstarter',   emoji:'🤝', amount:600, status:'paid',    transaction_date:'2026-03-28', reference:'TXN-2026-0328' },
    { project_title:'Clean Futures Fund',        organization:'charity: water',      emoji:'🌊', amount:380, status:'paid',    transaction_date:'2026-03-15', reference:'TXN-2026-0315' },
    { project_title:"Children's Nutrition Drive",organization:'UNICEF Indiegogo',    emoji:'🥗', amount:350, status:'paid',    transaction_date:'2026-02-20', reference:'TXN-2026-0220' },
    { project_title:'Literacy First',            organization:'Room to Read',        emoji:'📚', amount:420, status:'paid',    transaction_date:'2026-01-30', reference:'TXN-2026-0130' },
  ],
  pending_payouts: [
    { project_title:'Feed the Future',     amount:500, expected_date:'2026-05-05' },
    { project_title:'Ghana School Build',  amount:350, expected_date:'2026-05-18' },
  ],
};

const submissions = {
  stats: { total:14, approved:10, reviewing:3, revision:1 },
  submissions: [
    { project_title:'Feed the Future', organization:'Feed the Future', content_type:'Instagram Reel',     platform:'instagram', status:'approved',  feedback:'Powerful story ✓',                  submitted_at:'2026-04-15' },
    { project_title:'Feed the Future', organization:'Feed the Future', content_type:'YouTube Documentary',platform:'youtube',   status:'approved',  feedback:null,                                submitted_at:'2026-04-15' },
    { project_title:'Feed the Future', organization:'Feed the Future', content_type:'Instagram Story Set',platform:'instagram', status:'revision',  feedback:'Missing GoFundMe link in swipe-up', submitted_at:'2026-04-16' },
    { project_title:'Clean Futures Fund',organization:'charity: water',content_type:'YouTube Explainer', platform:'youtube',   status:'approved',  feedback:'Excellent coverage ✓',              submitted_at:'2026-04-12' },
    { project_title:'Clean Futures Fund',organization:'charity: water',content_type:'Blog Post',         platform:'blog',      status:'reviewing', feedback:'In review...',                      submitted_at:'2026-04-11' },
    { project_title:'Refugee Welcome Fund',organization:'IRC',         content_type:'Twitter Thread',    platform:'twitter',   status:'approved',  feedback:null,                                submitted_at:'2026-04-10' },
    { project_title:'Refugee Welcome Fund',organization:'IRC',         content_type:'Instagram Carousel',platform:'instagram', status:'reviewing', feedback:'Pending org review',                submitted_at:'2026-04-09' },
  ],
};

const offers = [
  { id:1, project_id:2, status:'pending', invited_at:'2026-04-19', expires_at:'2026-04-21', title:'Build a School in Rural Ghana',    emoji:'🏫', organization:'Pencils of Promise',          platform:'Kickstarter', category:'Education',  stipend_amount:350, bonus_stipend:100, deadline:'2026-05-10', goal_amount:75000,  description:'1× Instagram Reel + 1× YouTube Short promoting the school build fundraiser.' },
  { id:2, project_id:3, status:'pending', invited_at:'2026-04-20', expires_at:null,         title:'Legal Aid for Syrian Refugees',     emoji:'🤝', organization:'International Rescue Committee', platform:'Kickstarter', category:'Refugees',  stipend_amount:600, bonus_stipend:0,   deadline:'2026-05-20', goal_amount:50000,  description:'Blog post + Instagram story series raising awareness and donations.' },
  { id:3, project_id:4, status:'pending', invited_at:'2026-04-20', expires_at:null,         title:'Mobile Clinics for Rural Kenya',    emoji:'💉', organization:'Doctors Without Borders',     platform:'Indiegogo',  category:'Healthcare',stipend_amount:450, bonus_stipend:0,   deadline:'2026-06-01', goal_amount:150000, description:'YouTube vlog + 2 Reels documenting healthcare gaps in rural Kenya.' },
];

module.exports = { user, sns_accounts, geography, projects, active_projects, completed_projects, analytics, earnings, submissions, offers };
