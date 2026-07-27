-- Admin accounts, mirroring the influencer/NPO auth pattern but sign-in only (no public signup UI).
CREATE TABLE IF NOT EXISTS admins (
  id            INT           PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(150)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
