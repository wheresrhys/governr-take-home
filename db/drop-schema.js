const { Client } = require("pg");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/governr";

const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const client = new Client({ connectionString: DATABASE_URL });
    try {
      await client.connect();
      return client;
    } catch (err) {
      await client.end().catch(() => {});
      if (attempt === MAX_ATTEMPTS) throw err;
      console.log(
        `db not ready yet (attempt ${attempt}/${MAX_ATTEMPTS}): ${err.message}`
      );
      await sleep(RETRY_DELAY_MS);
    }
  }
}

async function dropSchema() {
  const client = await connectWithRetry();
  try {
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    console.log("dropped public schema");
  } finally {
    await client.end();
  }
}

dropSchema()
  .then(() => {
    console.log("schema wiped");
  })
  .catch((err) => {
    console.error("failed to drop schema:", err);
    process.exit(1);
  });
