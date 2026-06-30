-- Socia Dashboard — Seed Data
-- Import via phpMyAdmin: Database > Import > Choose this file

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ── Users ─────────────────────────────────────────────────────────────────────
INSERT INTO users (id, name, handle, email, phone, country, bio, avatar_initials,
                   total_followers, avg_engagement, authenticity_score, registration_step)
VALUES (1, 'Jamie Rivera', '@jamie.forchange', 'jamie@example.com',
        '+1 415 555 0182', 'United States',
        'Cause-driven creator focused on education, food relief, and global aid.',
        'JR', 217000, 5.2, 91, 'complete')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ── User causes ───────────────────────────────────────────────────────────────
DELETE FROM user_causes WHERE user_id = 1;
INSERT INTO user_causes (user_id, cause) VALUES
(1,'Education'),(1,'Food Relief'),(1,'Global Aid'),(1,'Refugees');

-- ── Audience geography ────────────────────────────────────────────────────────
DELETE FROM audience_geography WHERE user_id = 1;
INSERT INTO audience_geography (user_id, region, percentage) VALUES
(1,'United States',62),(1,'Europe',22),(1,'Others',16);

-- ── SNS accounts ──────────────────────────────────────────────────────────────
DELETE FROM sns_accounts WHERE user_id = 1;
INSERT INTO sns_accounts (user_id, platform, handle, display_name, followers, engagement_rate, account_number) VALUES
(1,'instagram','@jamie.forchange','Jamie for Change',98000,5.8,1),
(1,'instagram','@jamie_advocacy','Jamie Advocacy',24000,6.1,2),
(1,'youtube',NULL,'Jamie for Change',61000,4.4,1),
(1,'twitter','@jamie_change','Jamie Change',34000,3.9,1);

-- ── Projects catalog ──────────────────────────────────────────────────────────
INSERT INTO projects (id, title, emoji, organization, platform, category,
                      goal_amount, raised_amount, stipend_amount, bonus_stipend,
                      deadline, status, description)
VALUES
(1,'Daily Meals for Homeless Families','🍽️','Feed the Future','GoFundMe','Food Relief',
 100000,88000,500,100,'2026-04-25','open',
 'Providing 500+ daily hot meals to homeless families across three US cities.'),
(2,'Build a School in Rural Ghana','🏫','Pencils of Promise','Kickstarter','Education',
 75000,54200,350,100,'2026-05-10','open',
 'Crowdfunding a new primary school in the Volta Region of Ghana for 320 children.'),
(3,'Legal Aid for Syrian Refugees','🤝','International Rescue Committee','Kickstarter','Refugees',
 50000,21000,600,0,'2026-05-20','open',
 'Funding legal support services for Syrian refugees.'),
(4,'Mobile Clinics for Rural Kenya','💉','Doctors Without Borders','Indiegogo','Healthcare',
 150000,79500,450,0,'2026-06-01','open',
 'Funding mobile medical clinic trucks for rural Kenya.'),
(5,'Emergency Housing for Flood Survivors','🏘️','Habitat for Humanity','GoFundMe','Housing',
 50000,9500,400,0,'2026-05-30','open',
 'Emergency shelter and permanent housing for flood-displaced families.'),
(6,'Clean Water Wells in Bangladesh','🌊','charity: water','Kickstarter','Clean Water',
 60000,0,350,0,'2026-06-15','open',
 'Drilling and maintaining clean water wells in rural Bangladesh.'),
(7,'Schools for All – Ethiopia','🏫','Pencils of Promise','Kickstarter','Education',
 65000,65000,450,0,'2026-02-28','completed',
 'Completed campaign building three classrooms in rural Ethiopia.'),
(8,'Refugee Welcome Fund','🤝','International Rescue Committee','Kickstarter','Refugees',
 40000,40000,600,0,'2026-03-15','completed',
 'Completed fundraiser for refugee resettlement support.'),
(9,'Clean Futures Fund','🌊','charity: water','Kickstarter','Clean Water',
 38000,38000,380,0,'2026-03-31','completed',
 'Completed clean water project in Bangladesh.'),
(10,'Vaccination Drive – West Africa','🏥','UNICEF','Indiegogo','Healthcare',
 30000,30000,350,0,'2026-01-31','completed',
 'Completed vaccination outreach across three West African nations.'),
(11,'Children''s Nutrition Drive','🥗','UNICEF','Indiegogo','Food Relief',
 25000,25000,350,0,'2026-02-20','completed',
 'Completed nutrition supplement program for 2,000 children.'),
(12,'Literacy First','📚','Room to Read','Kickstarter','Education',
 30000,30000,420,0,'2026-01-30','completed',
 'Completed literacy program reaching 1,500 children.')
ON DUPLICATE KEY UPDATE raised_amount=VALUES(raised_amount), status=VALUES(status);

-- ── Deliverable templates ──────────────────────────────────────────────────────
DELETE FROM project_deliverable_templates WHERE project_id IN (1,2);
INSERT INTO project_deliverable_templates (project_id, content_type, platform, icon, description) VALUES
(1,'Instagram Reel','instagram','📸','60–90s Reel showing impact of daily meals'),
(1,'YouTube Documentary','youtube','▶️','5–8 min documentary on the campaign'),
(1,'Instagram Story Set','instagram','📱','3-slide story set with GoFundMe swipe-up link'),
(2,'Instagram Reel','instagram','📸','60–90s Reel about Ghana school build'),
(2,'YouTube Short','youtube','▶️','60s YouTube Short or Story set'),
(2,'Caption + Campaign Link','instagram','📝','Caption with Kickstarter donation link');

-- ── User project enrollments ───────────────────────────────────────────────────
INSERT INTO user_projects (id, user_id, project_id, enrolled_at, completed_at, status) VALUES
(1,1,1,'2026-04-01',NULL,'active'),
(2,1,2,'2026-04-15',NULL,'active'),
(3,1,7,'2026-02-01','2026-02-28','completed'),
(4,1,8,'2026-03-01','2026-03-15','completed'),
(5,1,9,'2026-03-15','2026-03-31','completed'),
(6,1,10,'2026-01-01','2026-01-31','completed'),
(7,1,11,'2026-02-01','2026-02-20','completed'),
(8,1,12,'2026-01-01','2026-01-30','completed')
ON DUPLICATE KEY UPDATE status=VALUES(status), completed_at=VALUES(completed_at);

-- ── Deliverables ───────────────────────────────────────────────────────────────
DELETE FROM deliverables WHERE user_project_id IN (1,2);
INSERT INTO deliverables (user_project_id, content_type, platform, icon, status, feedback, submitted_at, reviewed_at) VALUES
(1,'Instagram Reel','instagram','📸','approved','Powerful story ✓','2026-04-15 10:00:00','2026-04-16 14:00:00'),
(1,'YouTube Documentary','youtube','▶️','approved',NULL,'2026-04-15 10:00:00','2026-04-16 14:00:00'),
(1,'Instagram Story Set','instagram','📱','revision','Missing GoFundMe link in swipe-up','2026-04-16 09:00:00',NULL),
(2,'Instagram Reel','instagram','📸','pending',NULL,NULL,NULL),
(2,'YouTube Short','youtube','▶️','pending',NULL,NULL,NULL),
(2,'Caption + Campaign Link','instagram','📝','pending',NULL,NULL,NULL);

-- ── Offers ─────────────────────────────────────────────────────────────────────
DELETE FROM offers WHERE user_id = 1;
INSERT INTO offers (user_id, project_id, status, invited_at, expires_at) VALUES
(1,2,'pending','2026-04-19','2026-04-21'),
(1,3,'pending','2026-04-20',NULL),
(1,4,'pending','2026-04-20',NULL);

-- ── Materials ──────────────────────────────────────────────────────────────────
DELETE FROM materials WHERE project_id IN (1,2);
INSERT INTO materials (project_id, name, material_type, file_size_mb, file_url, is_canva_link, icon) VALUES
(1,'Project Overview PDF','pdf',1.8,'/assets/feed-the-future-overview.pdf',0,'📄'),
(1,'Sample Content Script','script',0.5,'/assets/feed-the-future-script.pdf',0,'🎬'),
(1,'Brand & Media Kit','brand_kit',4.2,'/assets/feed-the-future-brand.zip',0,'🎨'),
(1,'Field Photography','photography',38.0,'/assets/feed-the-future-photos.zip',0,'📷'),
(1,'Social Media Templates','template',0,NULL,1,'🖼️'),
(2,'Project Overview PDF','pdf',2.4,'/assets/ghana-school-overview.pdf',0,'📄'),
(2,'Sample Content Script','script',0.6,'/assets/ghana-school-script.pdf',0,'🎬'),
(2,'Brand & Media Kit','brand_kit',3.8,'/assets/ghana-school-brand.zip',0,'🎨'),
(2,'Field Photography','photography',22.0,'/assets/ghana-school-photos.zip',0,'📷'),
(2,'Social Media Templates','template',0,NULL,1,'🖼️');

-- ── Analytics ──────────────────────────────────────────────────────────────────
DELETE FROM analytics WHERE user_id = 1;
INSERT INTO analytics (user_id, project_id, impressions, engagements, engagement_rate, link_clicks, funds_raised) VALUES
(1,2,680000,40800,6.0,2840,54200),
(1,1,490000,26500,5.4,2180,88000),
(1,9,312000,18400,5.9,1440,38000),
(1,8,284000,15200,5.4,980,22500),
(1,7,420000,24800,5.9,800,41200),
(1,10,214000,12000,5.6,0,0);

-- ── Monthly analytics ──────────────────────────────────────────────────────────
DELETE FROM analytics_monthly WHERE user_id = 1;
INSERT INTO analytics_monthly (user_id, month, year, funds_raised, impressions) VALUES
(1,10,2025,18000,320000),
(1,11,2025,24000,410000),
(1,12,2025,20000,360000),
(1,1,2026,32000,480000),
(1,2,2026,41000,560000),
(1,3,2026,36000,510000),
(1,4,2026,51000,760000);

-- ── Transactions ───────────────────────────────────────────────────────────────
DELETE FROM transactions WHERE user_id = 1;
INSERT INTO transactions (user_id, project_id, amount, status, transaction_date, expected_date, reference) VALUES
(1,1,500,'pending','2026-04-19','2026-05-05','TXN-2026-0419'),
(1,7,450,'paid','2026-04-12',NULL,'TXN-2026-0412'),
(1,8,600,'paid','2026-03-28',NULL,'TXN-2026-0328'),
(1,9,380,'paid','2026-03-15',NULL,'TXN-2026-0315'),
(1,11,350,'paid','2026-02-20',NULL,'TXN-2026-0220'),
(1,12,420,'paid','2026-01-30',NULL,'TXN-2026-0130'),
(1,10,350,'paid','2026-01-31',NULL,'TXN-2026-0131'),
(1,2,350,'pending','2026-04-19','2026-05-18','TXN-2026-0419B');

SET foreign_key_checks = 1;
