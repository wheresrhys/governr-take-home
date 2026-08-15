-- For a given model, which risk category applies in which deployment
-- context, and at what severity.
DO $$ BEGIN
  CREATE TYPE risk_severity AS ENUM ('LOW', 'MODERATE', 'HIGH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS model_risks (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  model_id INTEGER NOT NULL REFERENCES models (id),
  risk_category_id INTEGER NOT NULL REFERENCES risk_categories (id),
  context_id INTEGER NOT NULL REFERENCES contexts (id),
  severity risk_severity NOT NULL,
  UNIQUE (model_id, risk_category_id, context_id)
);

CREATE INDEX IF NOT EXISTS idx_model_risks_model_id ON model_risks (model_id);
CREATE INDEX IF NOT EXISTS idx_model_risks_risk_category_id ON model_risks (risk_category_id);
CREATE INDEX IF NOT EXISTS idx_model_risks_context_id ON model_risks (context_id);
