CREATE TABLE evaluation_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    experience_level VARCHAR(20) NOT NULL CHECK (experience_level IN ('junior', 'mid', 'senior', 'lead')),
    role_type VARCHAR(20) NOT NULL DEFAULT 'ic' CHECK (role_type IN ('ic', 'tech_lead', 'manager')),
    domain VARCHAR(20) NOT NULL DEFAULT 'fullstack' CHECK (domain IN ('frontend', 'backend', 'fullstack', 'devops', 'data')),
    categories JSONB NOT NULL,
    strictness VARCHAR(20) NOT NULL DEFAULT 'moderate' CHECK (strictness IN ('lenient', 'moderate', 'strict')),
    pass_threshold DECIMAL(3,1) NOT NULL DEFAULT 5.0,
    is_preset BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ep_created_by ON evaluation_profiles(created_by);

-- Add profile reference to interviews
ALTER TABLE interviews ADD COLUMN profile_id UUID REFERENCES evaluation_profiles(id) ON DELETE SET NULL;

-- Seed preset profiles
INSERT INTO evaluation_profiles (name, description, experience_level, role_type, domain, categories, strictness, pass_threshold, is_preset) VALUES
(
    'Junior Developer',
    'For candidates with 0-2 years of experience. Evaluates fundamentals and learning potential. Lenient scoring.',
    'junior', 'ic', 'fullstack',
    '[
        {"name": "Core Fundamentals", "weight": 30, "description": "Understanding of basic concepts, syntax, and standard patterns"},
        {"name": "Problem Solving", "weight": 25, "description": "Ability to break down problems and think logically"},
        {"name": "Communication", "weight": 20, "description": "Clarity in explaining thought process and asking questions"},
        {"name": "Learning Ability", "weight": 15, "description": "Curiosity, willingness to learn, awareness of what they don''t know"},
        {"name": "Code Quality Awareness", "weight": 10, "description": "Basic understanding of clean code, naming, and readability"}
    ]'::jsonb,
    'lenient', 5.0, TRUE
),
(
    'Mid-Level Developer',
    'For candidates with 3-5 years of experience. Evaluates applied knowledge and practical skills. Moderate scoring.',
    'mid', 'ic', 'fullstack',
    '[
        {"name": "Technical Depth", "weight": 25, "description": "Working knowledge of tools, frameworks, and their trade-offs"},
        {"name": "Problem Solving", "weight": 25, "description": "Ability to solve real-world problems with practical approaches"},
        {"name": "System Thinking", "weight": 20, "description": "Understanding of how components fit together, data flow, and dependencies"},
        {"name": "Communication", "weight": 15, "description": "Ability to explain technical decisions clearly"},
        {"name": "Best Practices", "weight": 15, "description": "Knowledge of testing, code review, CI/CD, and development workflows"}
    ]'::jsonb,
    'moderate', 6.0, TRUE
),
(
    'Senior Developer',
    'For candidates with 5+ years of experience. Evaluates architectural thinking and leadership. Strict scoring.',
    'senior', 'ic', 'fullstack',
    '[
        {"name": "Architecture & Design", "weight": 25, "description": "Ability to design systems, make trade-offs, and justify decisions"},
        {"name": "Technical Leadership", "weight": 20, "description": "Mentoring ability, code review skills, setting standards"},
        {"name": "Problem Solving", "weight": 20, "description": "Tackling complex, ambiguous problems with structured approaches"},
        {"name": "System Design", "weight": 20, "description": "Scalability, reliability, performance considerations"},
        {"name": "Communication", "weight": 15, "description": "Explaining complex concepts simply, stakeholder communication"}
    ]'::jsonb,
    'strict', 7.0, TRUE
),
(
    'Tech Lead',
    'For lead/principal level candidates. Evaluates strategic thinking and team impact. Strict scoring.',
    'lead', 'tech_lead', 'fullstack',
    '[
        {"name": "Technical Vision", "weight": 25, "description": "Setting technical direction, technology choices, long-term thinking"},
        {"name": "System Architecture", "weight": 20, "description": "Designing large-scale systems across multiple services"},
        {"name": "Team Leadership", "weight": 20, "description": "Growing engineers, resolving conflicts, driving culture"},
        {"name": "Execution & Delivery", "weight": 20, "description": "Planning, prioritization, shipping under constraints"},
        {"name": "Communication", "weight": 15, "description": "Cross-functional communication, influencing without authority"}
    ]'::jsonb,
    'strict', 7.5, TRUE
);
