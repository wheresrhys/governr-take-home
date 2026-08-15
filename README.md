This project has three parts: a [Next.js](https://nextjs.org) app (bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)), a `risk-scoring` Express service (`services/risk-scoring/`), and a Postgres database.

## Getting Started

The easiest way to run everything is via Docker Compose — it starts all three services in parallel with hot reload:

```bash
docker compose up --build
```

- Next.js app: [http://localhost:3000](http://localhost:3000)
- risk-scoring service: [http://localhost:4000](http://localhost:4000)
- Postgres: `localhost:5433` (user/pass `postgres`, db `governr`)

Edit `app/page.tsx` or `services/risk-scoring/index.ts` and the running containers pick up the change automatically.

### Database schema

`db/schema/` holds the Postgres schema as numbered, recreate-safe SQL files (`CREATE TABLE IF NOT EXISTS`, etc.), applied in order by `db/apply-schema.js`. It runs automatically before `npm run dev`/`npm run start` (via `predev`/`prestart`), so the `web` container's `docker compose up` picks it up with no manual step — it retries the connection for a few seconds in case Postgres isn't accepting connections yet. To apply/re-apply it manually:

```bash
npm run db:migrate
```

#### Demo data

After `docker compose up`, if you want some sample organisations to explore the app with, run:

```bash
npm run db:seed-demo
```

This creates 2 demo organisations, each with 2 owners, 2 org-scoped risk categories, 2 org-scoped contexts, 4 models, and 4 model risks per model. Safe to run repeatedly — it skips any org whose name is already seeded.

#### Schema design calls

1. Global vs per user categories & contexts
Organisations have both similarities and differences, so there is value in having a shared standard core of categories by default, but with scope to extend to suit a customer's precise needs. I have implemented a table design - with nullable org_id foreign key - that allows for combining both. My implementation heere is a bit simplistic - nothing to enforce uniqueness of category names for instance, and in fact that would be harder to implement than a simple uniqueness constraint (which would be simple if all categories were global). It could be enforced using a trigger when writing to the table.

2. Denormalised additional org_id foreign key on model_risks and audit log
Writing these adds a bit more load for every write, which can add up. There is also a risk of values becoming inconsistent (and I would prefer to use a trigger in the database to enforce consistency). This needs to be balanced against the expense and complexity of the extra join when querying for an org's data.

In this case, the single extra join when querying is not much more complexity and unlikely to be a major performance bottleneck. My instinct here is to not add the foreign keys at first, but to keep an eye on query performance and add them later if necessary. My answer might be different if the query to link these tables to orgs was several joins deep, where performance and complexity concerns start to become more likely. However, it also depends on the product needs - if there is no need to get an overview of risks and audit per org without going via the model anyway, then the user will always be querying from org -> model -> audit/risks, anyway.

Finally, if introducing RLS I have a stronger preference for allowing access decisions to be as local to a table as possible (ideally 0 joins, but max 1), so that would add weight to adding the org_id columns.

3. I've assumed that owners = users, and that when a user logs in they get access to their org's data. While this wouldn't necessarily be the case in the real world, it saves me the effort of creating an additional users table for use as the "who" in the audit table if I just assume users and owners are the same thing for this exercise.

### Running without Docker

Each part can also run standalone with Node 22+:

```bash
# Next.js app
npm install
npm run dev

# risk-scoring service (separate terminal)
cd services/risk-scoring
npm install
npm run dev
```

You'll need your own Postgres instance running if you go this route — Docker Compose is the simpler path.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

