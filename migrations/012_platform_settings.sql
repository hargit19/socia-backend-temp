-- Migration 012: platform-wide payout & fee settings, editable from the admin dashboard.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS platform_settings (
  id                     INT           PRIMARY KEY DEFAULT 1,
  payout_day             TINYINT       NOT NULL DEFAULT 5,
  platform_fee_percent   DECIMAL(4,2)  NOT NULL DEFAULT 3.50,
  minimum_payout_amount  DECIMAL(10,2) NOT NULL DEFAULT 1000,
  disbursement_frequency VARCHAR(20)   NOT NULL DEFAULT 'Monthly',
  updated_at             TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO platform_settings (id) VALUES (1)
  ON DUPLICATE KEY UPDATE id = id;
