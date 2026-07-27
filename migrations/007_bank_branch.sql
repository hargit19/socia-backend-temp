-- Replace routing number with bank branch name for both influencers and NPOs.
ALTER TABLE influencers CHANGE bank_routing bank_branch VARCHAR(100) NULL;
ALTER TABLE npos CHANGE bank_routing bank_branch VARCHAR(100) NULL;
