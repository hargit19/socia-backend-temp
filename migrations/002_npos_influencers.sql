-- Migration 002: NPOs, Influencers, and project workflow columns
-- Run via phpMyAdmin or Railway MySQL shell

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ─── NPOS ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS npos (
  id                  INT           PRIMARY KEY AUTO_INCREMENT,
  org_name            VARCHAR(200)  NOT NULL,
  org_type            VARCHAR(50),
  ein                 VARCHAR(20),
  website             VARCHAR(200),
  phone               VARCHAR(30),
  email               VARCHAR(100)  NOT NULL,
  country             VARCHAR(50),
  address             TEXT,
  mission             TEXT,
  causes              JSON,
  kyc_name            VARCHAR(100),
  kyc_id_type         VARCHAR(50),
  kyc_id_number       VARCHAR(100),
  bank_name           VARCHAR(100),
  bank_account        VARCHAR(50),
  bank_routing        VARCHAR(50),
  bank_account_name   VARCHAR(100),
  status              ENUM('pending','approved','rejected') DEFAULT 'pending',
  reject_reason       TEXT,
  reviewed_at         TIMESTAMP     NULL,
  created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── INFLUENCERS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS influencers (
  id                  INT           PRIMARY KEY AUTO_INCREMENT,
  full_name           VARCHAR(100)  NOT NULL,
  email               VARCHAR(100)  UNIQUE NOT NULL,
  phone               VARCHAR(30),
  country             VARCHAR(50),
  bio                 TEXT,
  causes              JSON,
  sns_accounts        JSON,
  id_type             VARCHAR(50),
  id_number           VARCHAR(100),
  bank_name           VARCHAR(100),
  bank_account        VARCHAR(50),
  bank_routing        VARCHAR(50),
  bank_account_name   VARCHAR(100),
  tax_country         VARCHAR(50),
  tax_id              VARCHAR(100),
  tax_form            VARCHAR(20),
  status              ENUM('pending','approved','rejected') DEFAULT 'pending',
  reject_reason       TEXT,
  reviewed_at         TIMESTAMP     NULL,
  created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── ALTER PROJECTS — add workflow columns ─────────────────────────────────────
-- Add npo_id column (nullable for legacy rows)
ALTER TABLE projects ADD COLUMN npo_id        INT          NULL AFTER id;
ALTER TABLE projects ADD COLUMN goal          VARCHAR(50)  NULL AFTER status;
ALTER TABLE projects ADD COLUMN reject_reason TEXT         NULL AFTER goal;
ALTER TABLE projects ADD COLUMN reviewed_at   TIMESTAMP    NULL AFTER reject_reason;

-- Widen the status enum to include workflow values
-- (MySQL requires redefining the whole column)
ALTER TABLE projects
  MODIFY COLUMN status ENUM('draft','pending','approved','rejected','open','invited','closed','completed') DEFAULT 'pending';

-- Add FK if npos table exists (safe to run after npos is created)
ALTER TABLE projects
  ADD CONSTRAINT fk_projects_npo FOREIGN KEY (npo_id) REFERENCES npos(id) ON DELETE SET NULL;

SET foreign_key_checks = 1;
