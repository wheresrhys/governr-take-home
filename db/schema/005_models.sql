-- AI models.
CREATE TABLE IF NOT EXISTS models (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES owners (id),
  organization_id INTEGER NOT NULL REFERENCES organizations (id)
);

CREATE INDEX IF NOT EXISTS idx_models_owner_id ON models (owner_id);
CREATE INDEX IF NOT EXISTS idx_models_organization_id ON models (organization_id);
