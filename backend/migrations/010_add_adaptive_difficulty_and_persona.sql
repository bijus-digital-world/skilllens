ALTER TABLE interviews ADD COLUMN adaptive_difficulty BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE interviews ADD COLUMN initial_difficulty VARCHAR(20) NOT NULL DEFAULT 'moderate'
  CHECK (initial_difficulty IN ('simple', 'moderate', 'tough'));
ALTER TABLE interviews ADD COLUMN persona VARCHAR(20) NOT NULL DEFAULT 'friendly'
  CHECK (persona IN ('friendly', 'tough', 'rapid_fire'));
