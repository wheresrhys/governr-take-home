@AGENTS.md

## Architecture

Small multi-service app, orchestrated locally via `docker-compose.yml`:

- **`app/`** — Next.js app (root `package.json`). Main product UI.
- **`services/<name>/`** — standalone Node/Express microservices, each with its own `package.json`, `tsconfig.json`, and `Dockerfile`. Currently just `risk-scoring` (`POST /assess-risk` — ajv-validated, 400 on shape mismatch; see `services/risk-scoring/schemas/`). Not part of the root npm workspace — each service manages its own runtime deps (e.g. its own `pg`, separate from root's). `services/risk-scoring/lib/postgres.ts` holds a shared `pg.Pool` plus `getItems<T>(tableName, orgId)`, fetching rows where `org_id IS NULL OR org_id = $1`; throws `InvalidInputError` on missing/invalid `tableName`/`orgId`.
- **`db/schema/`** — Postgres schema as numbered, recreate-safe SQL files (no ORM wired up; raw SQL). Applied in order by `db/apply-schema.js`, run automatically via the root `predev`/`prestart` npm hooks (also callable directly as `npm run db:migrate`).

## Local dev services

`docker compose up --build` runs everything in parallel, source bind-mounted for hot reload:
- `db` — postgres 16, container port 5432, published on host **5433** (user/pass `postgres`, db `governr`) — non-default host port to avoid clashing with other local postgres instances
- `web` — Next.js app, port 3000
- `risk-scoring` — Express service at `services/risk-scoring/`, port 4000

Services reach the db over the compose network at `db:5432` (see `DATABASE_URL` in `docker-compose.yml`), not the published host port.

### Adding a new service

Copy the `services/risk-scoring` pattern: own `package.json`/`tsconfig.json`/`Dockerfile`, then add a service block to `docker-compose.yml` (bind mount + anonymous `node_modules` volume, per existing services).

### Testing

Single root-level Vitest config (`vitest.config.ts`) covers the whole repo, including `services/*/__tests__/`. `vitest`/`supertest` live in the root `package.json` devDependencies (not per-service) since they're dev-time only; run everything with `npm run test` from repo root. A service's own runtime deps (e.g. `risk-scoring`'s `ajv`) still live in that service's own `package.json` since they ship in its Docker image.

### Database schema

Tables (dependency order, matching the `db/schema/NNN_*.sql` filenames): `organizations` → `owners`, `risk_categories`, `contexts` (all scoped to an org) → `models` (owned by an `owner`, scoped to an org) → `model_risks` (a model's risk severity per `risk_categories` × `contexts`) → `audit_log` (append-only; a trigger blocks `UPDATE`/`DELETE`).

Every `_id` foreign key column is `NOT NULL` + indexed + constrained, except `risk_categories.org_id` (nullable — a `NULL` org means the category is global/shared, not org-scoped).

`risk_categories`/`contexts` are seeded with global (`org_id NULL`) defaults by `scripts/populate-categories.ts`, run automatically after `db:migrate` via the root `predev`/`prestart` hooks (also callable directly as `npm run db:seed-global`). Only seeds a table if it's currently empty — safe to run repeatedly.

TypeScript row types for every table are generated from the live schema (via `pg-to-ts`) into `types/postgres.d.ts`. Unlike `db:migrate`/`db:seed-global`, this is **not** wired into `predev`/`prestart` — the generated file is committed to git, so run `npm run db:typegen` manually against a running db whenever `db/schema/` changes and commit the diff.

`scripts/seed-demo.ts` (`npm run db:seed-demo`) populates 2 demo organisations (each with 2 owners, 2 org-scoped risk categories, 2 org-scoped contexts, 4 models, 4 model risks per model) for manually exploring the app. Not wired into `predev`/`prestart` — run manually, optional. Skips an org if one with the same name already exists — safe to run repeatedly.

`npm run db:rebuild` wipes the db clean: drops the `public` schema (`db/drop-schema.js`), then re-runs `db:migrate`, `db:seed-global`, `db:seed-demo` in order. Destructive — local dev reset only.

