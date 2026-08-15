@AGENTS.md

## Architecture

Small multi-service app, orchestrated locally via `docker-compose.yml`:

- **`app/`** — Next.js app (root `package.json`). Main product UI.
- **`services/<name>/`** — standalone Node/Express microservices, each with its own `package.json`, `tsconfig.json`, and `Dockerfile`. Currently just `risk-scoring` (hello-world stub). Not part of the root npm workspace — each service manages its own deps.
- **`db/schema/`** — intended home for Postgres schema/migrations (empty so far; no ORM wired up yet).

## Local dev services

`docker compose up --build` runs everything in parallel, source bind-mounted for hot reload:
- `db` — postgres 16, container port 5432, published on host **5433** (user/pass `postgres`, db `governr`) — non-default host port to avoid clashing with other local postgres instances
- `web` — Next.js app, port 3000
- `risk-scoring` — Express service at `services/risk-scoring/`, port 4000

Services reach the db over the compose network at `db:5432` (see `DATABASE_URL` in `docker-compose.yml`), not the published host port.

### Adding a new service

Copy the `services/risk-scoring` pattern: own `package.json`/`tsconfig.json`/`Dockerfile`, then add a service block to `docker-compose.yml` (bind mount + anonymous `node_modules` volume, per existing services).

