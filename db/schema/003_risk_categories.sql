-- Reference table of risk types. org_id is nullable: a NULL means
-- the risk category is a global/shared category, not scoped to one org.
CREATE TABLE IF NOT EXISTS risk_categories (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  org_id INTEGER REFERENCES organizations (id)
);

CREATE INDEX IF NOT EXISTS idx_risk_categories_org_id ON risk_categories (org_id);
