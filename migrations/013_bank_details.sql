-- Add bank number, branch code, and account type to influencer and NPO bank details.
ALTER TABLE influencers ADD COLUMN bank_number VARCHAR(50) NULL AFTER bank_account_name;
ALTER TABLE influencers ADD COLUMN branch_code VARCHAR(50) NULL AFTER bank_number;
ALTER TABLE influencers ADD COLUMN account_type VARCHAR(30) NULL AFTER branch_code;

ALTER TABLE npos ADD COLUMN bank_number VARCHAR(50) NULL AFTER bank_account_name;
ALTER TABLE npos ADD COLUMN branch_code VARCHAR(50) NULL AFTER bank_number;
ALTER TABLE npos ADD COLUMN account_type VARCHAR(30) NULL AFTER branch_code;
