-- Migration 011: wire the offers (invitation) table to the influencers table.
-- offers.user_id originally referenced the legacy `users` table, which the
-- influencer/NPO auth system never used — invitations need to target influencers.
SET NAMES utf8mb4;

ALTER TABLE offers ADD COLUMN influencer_id INT NULL AFTER project_id;
ALTER TABLE offers ADD CONSTRAINT fk_offers_influencer FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE;
ALTER TABLE offers MODIFY COLUMN user_id INT NULL;
