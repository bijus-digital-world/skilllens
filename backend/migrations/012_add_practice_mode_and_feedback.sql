ALTER TABLE interviews ADD COLUMN is_practice BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE interviews ADD COLUMN candidate_feedback JSONB;
