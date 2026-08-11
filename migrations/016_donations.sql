-- Migration 016: dummy-checkout donations, attributed to a referral link, plus
-- a per-project commission rate an influencer earns on each donation.
SET NAMES utf8mb4;

ALTER TABLE projects ADD COLUMN commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00 AFTER stipend_amount;

CREATE TABLE IF NOT EXISTS donations (
  id                     INT           PRIMARY KEY AUTO_INCREMENT,
  influencer_project_id  INT           NOT NULL,
  amount                 DECIMAL(10,2) NOT NULL,
  commission_amount      DECIMAL(10,2) NOT NULL,
  donor_name             VARCHAR(100)  NULL,
  status                 ENUM('completed') NOT NULL DEFAULT 'completed',
  created_at             TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (influencer_project_id) REFERENCES influencer_projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
