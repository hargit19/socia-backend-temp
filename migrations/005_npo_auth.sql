-- Authentication fields for NPO accounts, mirroring 004_user_auth.sql for influencers.
ALTER TABLE npos ADD COLUMN admin_name VARCHAR(150) NULL AFTER org_name;
ALTER TABLE npos ADD COLUMN password_hash VARCHAR(255) NULL AFTER email;
ALTER TABLE npos MODIFY org_name VARCHAR(200) NULL;
