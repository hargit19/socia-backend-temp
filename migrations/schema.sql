-- Socia Dashboard — MySQL Schema
-- Character set: utf8mb4

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                  INT          PRIMARY KEY AUTO_INCREMENT,
  name                VARCHAR(100) NOT NULL,
  handle              VARCHAR(50)  NOT NULL,
  email               VARCHAR(100) UNIQUE NOT NULL,
  phone               VARCHAR(20),
  country             VARCHAR(50),
  bio                 TEXT,
  avatar_initials     VARCHAR(5),
  total_followers     INT          DEFAULT 0,
  avg_engagement      DECIMAL(5,2) DEFAULT 0,
  authenticity_score  INT          DEFAULT 0,
  registration_step   ENUM('profile','sns','kyc','payment','complete') DEFAULT 'complete',
  created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── USER CAUSES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_causes (
  id       INT         PRIMARY KEY AUTO_INCREMENT,
  user_id  INT         NOT NULL,
  cause    VARCHAR(50) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── AUDIENCE GEOGRAPHY ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audience_geography (
  id          INT          PRIMARY KEY AUTO_INCREMENT,
  user_id     INT          NOT NULL,
  region      VARCHAR(50)  NOT NULL,
  percentage  DECIMAL(5,2) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── SNS ACCOUNTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sns_accounts (
  id              INT          PRIMARY KEY AUTO_INCREMENT,
  user_id         INT          NOT NULL,
  platform        ENUM('instagram','youtube','twitter','tiktok','facebook','linkedin','threads','blog') NOT NULL,
  handle          VARCHAR(100),
  display_name    VARCHAR(100),
  followers       INT          DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  account_number  INT          DEFAULT 1,
  is_connected    TINYINT(1)   DEFAULT 1,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── PROJECTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id               INT           PRIMARY KEY AUTO_INCREMENT,
  title            VARCHAR(200)  NOT NULL,
  emoji            VARCHAR(10)   DEFAULT '🌍',
  organization     VARCHAR(100)  NOT NULL,
  platform         ENUM('GoFundMe','Kickstarter','Indiegogo','Other') NOT NULL,
  category         VARCHAR(50)   NOT NULL,
  goal_amount      DECIMAL(12,2) NOT NULL,
  raised_amount    DECIMAL(12,2) DEFAULT 0,
  stipend_amount   DECIMAL(10,2) NOT NULL,
  bonus_stipend    DECIMAL(10,2) DEFAULT 0,
  deadline         DATE          NOT NULL,
  status           ENUM('open','invited','closed','completed') DEFAULT 'open',
  description      TEXT,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── PROJECT DELIVERABLE TEMPLATES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_deliverable_templates (
  id           INT         PRIMARY KEY AUTO_INCREMENT,
  project_id   INT         NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  platform     VARCHAR(30) NOT NULL,
  icon         VARCHAR(10) DEFAULT '📱',
  description  TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── USER PROJECT ENROLLMENTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_projects (
  id            INT       PRIMARY KEY AUTO_INCREMENT,
  user_id       INT       NOT NULL,
  project_id    INT       NOT NULL,
  enrolled_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at  TIMESTAMP NULL,
  status        ENUM('active','completed','declined') DEFAULT 'active',
  UNIQUE KEY uq_user_project (user_id, project_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── DELIVERABLES (per user-project) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deliverables (
  id              INT          PRIMARY KEY AUTO_INCREMENT,
  user_project_id INT          NOT NULL,
  content_type    VARCHAR(50)  NOT NULL,
  platform        VARCHAR(30)  NOT NULL,
  icon            VARCHAR(10)  DEFAULT '📱',
  status          ENUM('pending','submitted','reviewing','approved','revision') DEFAULT 'pending',
  post_url        VARCHAR(500),
  caption         TEXT,
  feedback        TEXT,
  submitted_at    TIMESTAMP    NULL,
  reviewed_at     TIMESTAMP    NULL,
  FOREIGN KEY (user_project_id) REFERENCES user_projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── OFFERS (invitation to apply) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offers (
  id          INT       PRIMARY KEY AUTO_INCREMENT,
  user_id     INT       NOT NULL,
  project_id  INT       NOT NULL,
  status      ENUM('pending','accepted','declined') DEFAULT 'pending',
  invited_at  DATE      NOT NULL,
  expires_at  DATE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── MATERIALS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS materials (
  id            INT          PRIMARY KEY AUTO_INCREMENT,
  project_id    INT          NOT NULL,
  name          VARCHAR(100) NOT NULL,
  material_type ENUM('pdf','script','brand_kit','photography','template','canva') NOT NULL,
  file_size_mb  DECIMAL(6,2),
  file_url      VARCHAR(500),
  is_canva_link TINYINT(1)   DEFAULT 0,
  icon          VARCHAR(10)  DEFAULT '📄',
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── ANALYTICS (per user + project) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics (
  id              INT           PRIMARY KEY AUTO_INCREMENT,
  user_id         INT           NOT NULL,
  project_id      INT           NOT NULL,
  impressions     BIGINT        DEFAULT 0,
  engagements     BIGINT        DEFAULT 0,
  engagement_rate DECIMAL(5,2)  DEFAULT 0,
  link_clicks     INT           DEFAULT 0,
  funds_raised    DECIMAL(12,2) DEFAULT 0,
  period_start    DATE,
  period_end      DATE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── MONTHLY ANALYTICS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_monthly (
  id           INT           PRIMARY KEY AUTO_INCREMENT,
  user_id      INT           NOT NULL,
  month        TINYINT       NOT NULL,
  year         YEAR          NOT NULL,
  funds_raised DECIMAL(12,2) DEFAULT 0,
  impressions  BIGINT        DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id               INT           PRIMARY KEY AUTO_INCREMENT,
  user_id          INT           NOT NULL,
  project_id       INT           NOT NULL,
  amount           DECIMAL(10,2) NOT NULL,
  status           ENUM('pending','paid','cancelled') DEFAULT 'pending',
  transaction_date DATE          NOT NULL,
  expected_date    DATE,
  reference        VARCHAR(50),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET foreign_key_checks = 1;
