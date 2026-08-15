@AGENTS.md

## Architecture

Small multi-service app, orchestrated locally via `docker-compose.yml`:

- **`app/`** — Next.js app (root `package.json`). Main product UI. Home page (`app/page.tsx`, async server component) renders a "Models overview" table (`app/models-overview-table.tsx`, client component) with expandable per-model rows breaking down risk category × context × severity, plus an "Owner name" column — backed by `fetchModels(orgId)` in `app/lib/postgres.ts` (joins `models`/`owners`/`model_risks`/`risk_categories`/`contexts`, returned flat) transformed via `buildModelsOverview` in `app/lib/models-overview.ts` (groups flat rows per model, dedupes categories/contexts, sums severity-weighted aggregate score). `orgId` is currently hardcoded to `1` in `page.tsx` (no auth/org-selection yet). `app/lib/severity-styles.ts` holds shared `severityColor(severity)`/`scoreColor(score)` helpers mapping the `LOW`/`MODERATE`/`HIGH` enum and numeric aggregate score to consistent badge styling — reuse this rather than re-deriving severity colors elsewhere.
- **`services/<name>/`** — standalone Node/Express microservices, each with its own `package.json`, `tsconfig.json`, and `Dockerfile`. Currently just `risk-scoring` (`POST /assess-risk` — ajv-validated, 400 on shape mismatch; see `services/risk-scoring/schemas/`). Not part of the root npm workspace — each service manages its own runtime deps (e.g. its own `pg`, separate from root's). `services/risk-scoring/lib/postgres.ts` holds a shared `pg.Pool` plus `getItems<T>(tableName, orgId)`, fetching rows where `org_id IS NULL OR org_id = $1`; throws `InvalidInputError` on missing/invalid `tableName`/`orgId`. `app/lib/postgres.ts` mirrors this file for the Next.js app, plus adds `fetchModels`.
- **`db/schema/`** — Postgres schema as numbered, recreate-safe SQL files (no ORM wired up; raw SQL). Applied in order by `db/apply-schema.js`, run automatically via the root `predev`/`prestart` npm hooks (also callable directly as `npm run db:migrate`).

## Local dev services

`docker compose up --build` runs everything in parallel, source bind-mounted for hot reload:
- `db` — postgres 16, container port 5432, published on host **5433** (user/pass `postgres`, db `governr`) — non-default host port to avoid clashing with other local postgres instances
- `web` — Next.js app, port 3000
- `risk-scoring` — Express service at `services/risk-scoring/`, port 4000

Services reach the db over the compose network at `db:5432` (see `DATABASE_URL` in `docker-compose.yml`), not the published host port.

**Gotcha:** each service mounts an anonymous `/app/node_modules` volume to stop the source bind mount shadowing it. Compose carries that volume's *data* over when a container is recreated instead of resetting it from the freshly-built image — so after adding/updating a dependency, a plain `docker compose up --build` can still run against the old `node_modules` and fail with a module-not-found error. Run `docker compose up --build -V` (`--renew-anon-volumes`) instead to force it to pick up the new install. Don't use `docker compose down -v` for this — it also wipes the named `db-data` volume (the local Postgres data).

### Adding a new service

Copy the `services/risk-scoring` pattern: own `package.json`/`tsconfig.json`/`Dockerfile`, then add a service block to `docker-compose.yml` (bind mount + anonymous `node_modules` volume, per existing services).

### Testing

Single root-level Vitest config (`vitest.config.ts`) covers the whole repo, including `services/*/__tests__/`. `vitest`/`supertest` live in the root `package.json` devDependencies (not per-service) since they're dev-time only; run everything with `npm run test` from repo root. A service's own runtime deps (e.g. `risk-scoring`'s `ajv`) still live in that service's own `package.json` since they ship in its Docker image.

### Database schema

Tables (dependency order, matching the `db/schema/NNN_*.sql` filenames): `organizations` → `owners`, `risk_categories`, `contexts` (all scoped to an org) → `models` (owned by an `owner`, scoped to an org) → `model_risks` (a model's risk severity per `risk_categories` × `contexts`) → `audit_log` (append-only; a trigger blocks `UPDATE`/`DELETE`).

Every `_id` foreign key column is `NOT NULL` + indexed + constrained, except `risk_categories.org_id` (nullable — a `NULL` org means the category is global/shared, not org-scoped).

`risk_categories`/`contexts` are seeded with global (`org_id NULL`) defaults by `scripts/populate-categories.ts`, run automatically after `db:migrate` via the root `predev`/`prestart` hooks (also callable directly as `npm run db:seed-global`). Only seeds a table if it's currently empty — safe to run repeatedly.

TypeScript row types for every table are generated from the live schema (via `pg-to-ts`) into `types/postgres.d.ts`. Unlike `db:migrate`/`db:seed-global`, this is **not** wired into `predev`/`prestart` — the generated file is committed to git, so run `npm run db:typegen` manually against a running db whenever `db/schema/` changes and commit the diff.

`scripts/seed-demo.ts` (`npm run db:seed-demo`) populates 2 demo organisations (each with 2 owners, 4 org-scoped risk categories, 3 org-scoped contexts, 4 models) for manually exploring the app. Each model has a `riskProfile` (`LOW`/`MODERATE`/`HIGH`, weighting which severity it mostly rolls) and `riskCount` (how many risk_category × context pairings it fills, out of up to 12 possible) so aggregate risk scores vary across models instead of clustering on one value; a seeded PRNG keeps repeat runs deterministic. Not wired into `predev`/`prestart` — run manually, optional. Skips an org if one with the same name already exists — safe to run repeatedly.

`npm run db:rebuild` wipes the db clean: drops the `public` schema (`db/drop-schema.js`), then re-runs `db:migrate`, `db:seed-global`, `db:seed-demo` in order. Destructive — local dev reset only.

