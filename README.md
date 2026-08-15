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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
