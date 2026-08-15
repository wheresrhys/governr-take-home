-- Captures every create and update to the DB. Append-only: no row may be
-- edited or removed after creation (enforced by trigger below).
DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  model_id INTEGER NOT NULL REFERENCES models (id),
  action audit_action NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id INTEGER NOT NULL REFERENCES owners (id)
);

CREATE INDEX IF NOT EXISTS idx_audit_log_model_id ON audit_log (model_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log (user_id);

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only: % not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_append_only ON audit_log;
CREATE TRIGGER audit_log_append_only
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
