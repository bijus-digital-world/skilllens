ALTER TABLE interviews ADD COLUMN snapshots JSONB DEFAULT '[]'::jsonb;
ALTER TABLE interviews ADD COLUMN proctoring_events JSONB DEFAULT '[]'::jsonb;
ALTER TABLE interviews ADD COLUMN proctoring_summary JSONB;
