-- Authentication field for the existing influencer records.
ALTER TABLE influencers ADD COLUMN password_hash VARCHAR(255) NULL AFTER email;
