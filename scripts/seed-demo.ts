import { Client } from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/governr";

const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 1000;

const SEVERITIES = ["LOW", "MODERATE", "HIGH"] as const;

interface DemoOrg {
  name: string;
  owners: { name: string; email: string; team: string }[];
  riskCategories: string[];
  contexts: string[];
  models: string[];
}

const DEMO_ORGS: DemoOrg[] = [
  {
    name: "Acme Financial",
    owners: [
      { name: "Priya Shah", email: "priya.shah@acmefinancial.example", team: "Risk Engineering" },
      { name: "Tom Kessler", email: "tom.kessler@acmefinancial.example", team: "Data Science" },
    ],
    riskCategories: ["Model Drift", "Vendor Risk"],
    contexts: ["Internal Tools", "Customer-Facing App"],
    models: ["Loan Approval Scorer", "Fraud Alert Ranker", "Chatbot Assistant", "Document Classifier"],
  },
  {
    name: "Globex Health",
    owners: [
      { name: "Amara Nwosu", email: "amara.nwosu@globexhealth.example", team: "Clinical AI" },
      { name: "Liam O'Brien", email: "liam.obrien@globexhealth.example", team: "Platform Engineering" },
    ],
    riskCategories: ["Clinical Validity", "Data Retention"],
    contexts: ["Patient Portal", "Clinician Dashboard"],
    models: ["Diagnosis Support Tool", "Appointment No-Show Predictor", "Triage Chatbot", "Claims Anomaly Detector"],
  },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(): Promise<Client> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const client = new Client({ connectionString: DATABASE_URL });
    try {
      await client.connect();
      return client;
    } catch (err) {
      await client.end().catch(() => {});
      if (attempt === MAX_ATTEMPTS) throw err;
      console.log(
        `db not ready yet (attempt ${attempt}/${MAX_ATTEMPTS}): ${(err as Error).message}`
      );
      await sleep(RETRY_DELAY_MS);
    }
  }
  throw new Error("unreachable");
}

async function seedOrg(client: Client, org: DemoOrg) {
  const existing = await client.query(
    "SELECT id FROM organizations WHERE name = $1",
    [org.name]
  );
  if (existing.rows.length > 0) {
    console.log(`org "${org.name}" already seeded, skipping`);
    return;
  }

  const { rows: [{ id: organizationId }] } = await client.query(
    "INSERT INTO organizations (name) VALUES ($1) RETURNING id",
    [org.name]
  );

  const ownerIds: number[] = [];
  for (const owner of org.owners) {
    const { rows: [{ id }] } = await client.query(
      "INSERT INTO owners (name, email, team, organization_id) VALUES ($1, $2, $3, $4) RETURNING id",
      [owner.name, owner.email, owner.team, organizationId]
    );
    ownerIds.push(id);
  }

  const riskCategoryIds: number[] = [];
  for (const name of org.riskCategories) {
    const { rows: [{ id }] } = await client.query(
      "INSERT INTO risk_categories (name, organization_id) VALUES ($1, $2) RETURNING id",
      [name, organizationId]
    );
    riskCategoryIds.push(id);
  }

  const contextIds: number[] = [];
  for (const name of org.contexts) {
    const { rows: [{ id }] } = await client.query(
      "INSERT INTO contexts (name, organization_id) VALUES ($1, $2) RETURNING id",
      [name, organizationId]
    );
    contextIds.push(id);
  }

  for (const [index, name] of org.models.entries()) {
    const ownerId = ownerIds[index % ownerIds.length];
    const { rows: [{ id: modelId }] } = await client.query(
      "INSERT INTO models (name, owner_id, organization_id) VALUES ($1, $2, $3) RETURNING id",
      [name, ownerId, organizationId]
    );

    let severityIndex = 0;
    for (const riskCategoryId of riskCategoryIds) {
      for (const contextId of contextIds) {
        const severity = SEVERITIES[severityIndex % SEVERITIES.length];
        await client.query(
          "INSERT INTO model_risks (model_id, risk_category_id, context_id, severity) VALUES ($1, $2, $3, $4)",
          [modelId, riskCategoryId, contextId, severity]
        );
        severityIndex++;
      }
    }
  }

  console.log(`seeded org "${org.name}" with ${org.owners.length} owners, ${org.models.length} models`);
}

async function seedDemo() {
  const client = await connectWithRetry();
  try {
    for (const org of DEMO_ORGS) {
      await seedOrg(client, org);
    }
  } finally {
    await client.end();
  }
}

seedDemo()
  .then(() => {
    console.log("demo data seeded");
  })
  .catch((err) => {
    console.error("failed to seed demo data:", err);
    process.exit(1);
  });
