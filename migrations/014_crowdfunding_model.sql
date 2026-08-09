-- Crowdfunding model chosen by the NPO when creating a project: All-In or a custom Other value.
ALTER TABLE projects ADD COLUMN crowdfunding_model VARCHAR(20) NOT NULL DEFAULT 'All-In' AFTER platform;
ALTER TABLE projects ADD COLUMN crowdfunding_model_other VARCHAR(150) NULL AFTER crowdfunding_model;
