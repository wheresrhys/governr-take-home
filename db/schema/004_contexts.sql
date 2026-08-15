-- Reference table of deployment contexts.
CREATE TABLE IF NOT EXISTS contexts (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  organization_id INTEGER REFERENCES organizations (id)
);

CREATE INDEX IF NOT EXISTS idx_contexts_organization_id ON contexts (organization_id);
