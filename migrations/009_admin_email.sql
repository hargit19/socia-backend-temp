-- Admin notification recipient address, used for approval-needed emails.
ALTER TABLE admins ADD COLUMN email VARCHAR(150) NULL AFTER name;
