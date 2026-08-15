import { Client } from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/governr";

const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 1000;

const SEVERITIES = ["LOW", "MODERATE", "HIGH"] as const;

// Per-model severity mix, weighted toward a target risk profile so aggregate
// scores spread out (a "LOW"-profile model vs a "HIGH"-profile model) rather
// than every model landing on the same blended average.
const SEVERITY_WEIGHTS: Record<(typeof SEVERITIES)[number], number[]> = {
  LOW: [6, 3, 1], // mostly LOW, a little MODERATE, rare HIGH
  MODERATE: [2, 5, 3], // mostly MODERATE, spread either side
  HIGH: [1, 3, 6], // mostly HIGH, a little MODERATE, rare LOW
};

interface DemoModel {
  name: string;
  riskProfile: (typeof SEVERITIES)[number];
  riskCount: number; // how many risk_category x context pairings to fill in
}

interface DemoOrg {
  name: string;
  owners: { name: string; email: string; team: string }[];
  riskCategories: string[];
  contexts: string[];
  models: DemoModel[];
}

const DEMO_ORGS: DemoOrg[] = [
  {
    name: "Acme Financial",
    owners: [
      { name: "Priya Shah", email: "priya.shah@acmefinancial.example", team: "Risk Engineering" },
      { name: "Tom Kessler", email: "tom.kessler@acmefinancial.example", team: "Data Science" },
    ],
    riskCategories: ["Model Drift", "Vendor Risk", "Bias & Fairness", "Explainability"],
    contexts: ["Internal Tools", "Customer-Facing App", "Regulatory Reporting"],
    models: [
      { name: "Loan Approval Scorer", riskProfile: "HIGH", riskCount: 8 },
      { name: "Fraud Alert Ranker", riskProfile: "MODERATE", riskCount: 5 },
      { name: "Chatbot Assistant", riskProfile: "LOW", riskCount: 3 },
      { name: "Document Classifier", riskProfile: "MODERATE", riskCount: 6 },
    ],
  },
  {
    name: "Globex Health",
    owners: [
      { name: "Amara Nwosu", email: "amara.nwosu@globexhealth.example", team: "Clinical AI" },
      { name: "Liam O'Brien", email: "liam.obrien@globexhealth.example", team: "Platform Engineering" },
    ],
    riskCategories: ["Clinical Validity", "Data Retention", "Patient Safety", "Consent Handling"],
    contexts: ["Patient Portal", "Clinician Dashboard", "Third-Party Integration"],
    models: [
      { name: "Diagnosis Support Tool", riskProfile: "HIGH", riskCount: 9 },
      { name: "Appointment No-Show Predictor", riskProfile: "LOW", riskCount: 2 },
      { name: "Triage Chatbot", riskProfile: "HIGH", riskCount: 6 },
      { name: "Claims Anomaly Detector", riskProfile: "MODERATE", riskCount: 4 },
    ],
  },
];

// Small deterministic PRNG (mulberry32) so re-running the seed against a
// fresh db always produces the same spread of risk data.
function makeRng(seed: number) {
  let state = seed;
  return function rng() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickSeverity(profile: (typeof SEVERITIES)[number], rng: () => number) {
  const weights = SEVERITY_WEIGHTS[profile];
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = rng() * total;
  for (const [index, weight] of weights.entries()) {
    roll -= weight;
    if (roll <= 0) return SEVERITIES[index];
  }
  return SEVERITIES[SEVERITIES.length - 1];
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

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
      "INSERT INTO owners (name, email, team, org_id) VALUES ($1, $2, $3, $4) RETURNING id",
      [owner.name, owner.email, owner.team, organizationId]
    );
    ownerIds.push(id);
  }

  const riskCategoryIds: number[] = [];
  for (const name of org.riskCategories) {
    const { rows: [{ id }] } = await client.query(
      "INSERT INTO risk_categories (name, org_id) VALUES ($1, $2) RETURNING id",
      [name, organizationId]
    );
    riskCategoryIds.push(id);
  }

  const contextIds: number[] = [];
  for (const name of org.contexts) {
    const { rows: [{ id }] } = await client.query(
      "INSERT INTO contexts (name, org_id) VALUES ($1, $2) RETURNING id",
      [name, organizationId]
    );
    contextIds.push(id);
  }

  for (const [index, model] of org.models.entries()) {
    const ownerId = ownerIds[index % ownerIds.length];
    const { rows: [{ id: modelId }] } = await client.query(
      "INSERT INTO models (name, owner_id, org_id) VALUES ($1, $2, $3) RETURNING id",
      [model.name, ownerId, organizationId]
    );

    const rng = makeRng(organizationId * 1000 + index + 1);
    const allPairings = riskCategoryIds.flatMap((riskCategoryId) =>
      contextIds.map((contextId) => ({ riskCategoryId, contextId }))
    );
    const pairings = shuffle(allPairings, rng).slice(
      0,
      Math.min(model.riskCount, allPairings.length)
    );

    for (const { riskCategoryId, contextId } of pairings) {
      const severity = pickSeverity(model.riskProfile, rng);
      await client.query(
        "INSERT INTO model_risks (model_id, risk_category_id, context_id, severity) VALUES ($1, $2, $3, $4)",
        [modelId, riskCategoryId, contextId, severity]
      );
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
