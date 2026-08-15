import { Client } from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/governr";

const RISK_CATEGORIES = [
  "Bias & Fairness",
  "Privacy",
  "Safety",
  "Security",
  "Explainability",
];

const CONTEXTS = ["Credit/Lending", "Hiring", "Healthcare", "Fraud Detection"];

const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 1000;

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

async function seedIfEmpty(client: Client, table: string, names: string[]) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS count FROM ${table}`
  );
  if (rows[0].count > 0) {
    console.log(`${table} already populated, skipping`);
    return;
  }
  for (const name of names) {
    await client.query(
      `INSERT INTO ${table} (name, organization_id) VALUES ($1, NULL)`,
      [name]
    );
  }
  console.log(`seeded ${names.length} rows into ${table}`);
}

async function populateCategories() {
  const client = await connectWithRetry();
  try {
    await seedIfEmpty(client, "risk_categories", RISK_CATEGORIES);
    await seedIfEmpty(client, "contexts", CONTEXTS);
  } finally {
    await client.end();
  }
}

populateCategories()
  .then(() => {
    console.log("categories populated");
  })
  .catch((err) => {
    console.error("failed to populate categories:", err);
    process.exit(1);
  });
