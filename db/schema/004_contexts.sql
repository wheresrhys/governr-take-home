-- Reference table of deployment contexts.
CREATE TABLE IF NOT EXISTS contexts (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  org_id INTEGER REFERENCES organizations (id)
);

CREATE INDEX IF NOT EXISTS idx_contexts_org_id ON contexts (org_id);
