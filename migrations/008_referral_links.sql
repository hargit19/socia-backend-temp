-- Support generating a shareable referral link (project + influencer + platform) per enrollment.
ALTER TABLE projects ADD COLUMN external_url VARCHAR(500) NULL AFTER platform;
ALTER TABLE influencer_projects ADD COLUMN referral_slug VARCHAR(180) NULL UNIQUE AFTER status;
