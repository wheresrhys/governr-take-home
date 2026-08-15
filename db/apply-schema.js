const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/governr";

const SCHEMA_DIR = path.join(__dirname, "schema");
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

async function applySchema() {
  const client = await connectWithRetry();
  try {
    const files = fs
      .readdirSync(SCHEMA_DIR)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(SCHEMA_DIR, file), "utf8");
      await client.query(sql);
      console.log(`applied ${file}`);
    }
  } finally {
    await client.end();
  }
}

applySchema()
  .then(() => {
    console.log("schema up to date");
  })
  .catch((err) => {
    console.error("failed to apply schema:", err);
    process.exit(1);
  });
