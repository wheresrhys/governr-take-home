@AGENTS.md

## Local dev services

`docker compose up` runs all three in parallel:
- `db` — postgres, port 5432 (user/pass `postgres`, db `governr`)
- `web` — Next.js app, port 3000
- `risk-scoring` — Express service at `services/risk-scoring/`, port 4000

