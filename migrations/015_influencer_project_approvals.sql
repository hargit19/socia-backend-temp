-- Dual approval workflow for influencer campaign applications: an application needs
-- both the owning NPO and a platform admin to sign off before it becomes a live enrollment.
ALTER TABLE influencer_projects
  ADD COLUMN npo_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' AFTER status,
  ADD COLUMN admin_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' AFTER npo_status;

-- Grandfather in existing enrollments as already fully approved so current
-- creators keep their referral links and materials access.
UPDATE influencer_projects SET npo_status='approved', admin_status='approved' WHERE status IN ('enrolled','active','completed','dropped');

ALTER TABLE influencer_projects
  MODIFY COLUMN status ENUM('pending','enrolled','active','completed','dropped','rejected') NOT NULL DEFAULT 'pending';
