@AGENTS.md

## Architecture

Small multi-service app, orchestrated locally via `docker-compose.yml`:

- **`app/`** — Next.js app (root `package.json`). Main product UI.
- **`services/<name>/`** — standalone Node/Express microservices, each with its own `package.json`, `tsconfig.json`, and `Dockerfile`. Currently just `risk-scoring` (hello-world stub). Not part of the root npm workspace — each service manages its own deps.
- **`db/schema/`** — Postgres schema as numbered, recreate-safe SQL files (no ORM wired up; raw SQL). Applied in order by `db/apply-schema.js`, run automatically via the root `predev`/`prestart` npm hooks (also callable directly as `npm run db:migrate`).

## Local dev services

`docker compose up --build` runs everything in parallel, source bind-mounted for hot reload:
- `db` — postgres 16, container port 5432, published on host **5433** (user/pass `postgres`, db `governr`) — non-default host port to avoid clashing with other local postgres instances
- `web` — Next.js app, port 3000
- `risk-scoring` — Express service at `services/risk-scoring/`, port 4000

Services reach the db over the compose network at `db:5432` (see `DATABASE_URL` in `docker-compose.yml`), not the published host port.

### Adding a new service

Copy the `services/risk-scoring` pattern: own `package.json`/`tsconfig.json`/`Dockerfile`, then add a service block to `docker-compose.yml` (bind mount + anonymous `node_modules` volume, per existing services).

### Database schema

Tables (dependency order, matching the `db/schema/NNN_*.sql` filenames): `organizations` → `owners`, `risk_categories`, `contexts` (all scoped to an org) → `models` (owned by an `owner`, scoped to an org) → `model_risks` (a model's risk severity per `risk_categories` × `contexts`) → `audit_log` (append-only; a trigger blocks `UPDATE`/`DELETE`).

Every `_id` foreign key column is `NOT NULL` + indexed + constrained, except `risk_categories.organization_id` (nullable — a `NULL` org means the category is global/shared, not org-scoped).

