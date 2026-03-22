CREATE TABLE question_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jd_id UUID NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
    cv_id UUID REFERENCES candidate_cvs(id) ON DELETE SET NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('simple', 'moderate', 'tough')),
    question_count INTEGER NOT NULL,
    questions JSONB NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_qs_created_by ON question_sets(created_by);
CREATE INDEX idx_qs_jd ON question_sets(jd_id);
