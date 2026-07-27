-- Track how many times a referral link has been opened.
ALTER TABLE influencer_projects ADD COLUMN click_count INT NOT NULL DEFAULT 0 AFTER referral_slug;
