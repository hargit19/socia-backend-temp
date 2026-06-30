-- Migration 003: influencer_projects join table
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS influencer_projects (
  id             INT       PRIMARY KEY AUTO_INCREMENT,
  influencer_id  INT       NOT NULL,
  project_id     INT       NOT NULL,
  status         ENUM('enrolled','active','completed','dropped') DEFAULT 'enrolled',
  enrolled_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_inf_proj (influencer_id, project_id),
  FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id)    REFERENCES projects(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
