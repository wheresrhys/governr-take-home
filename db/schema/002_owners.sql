-- Who's accountable for a model within an organization.
CREATE TABLE IF NOT EXISTS owners (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  team TEXT NOT NULL,
  org_id INTEGER NOT NULL REFERENCES organizations (id)
);

CREATE INDEX IF NOT EXISTS idx_owners_org_id ON owners (org_id);
