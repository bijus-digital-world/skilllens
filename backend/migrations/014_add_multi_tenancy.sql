-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add org_id to all data tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE candidate_cvs ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE question_sets ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE evaluation_profiles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE password_resets ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- Indexes for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_org ON job_descriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_candidate_cvs_org ON candidate_cvs(org_id);
CREATE INDEX IF NOT EXISTS idx_interviews_org ON interviews(org_id);
CREATE INDEX IF NOT EXISTS idx_interviews_org_status ON interviews(org_id, status);
CREATE INDEX IF NOT EXISTS idx_question_sets_org ON question_sets(org_id);
