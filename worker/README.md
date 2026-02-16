# AdPower Worker API

Cloudflare Worker backend for the AI vertical slice.

## Required bindings

- `DB` (D1)
- `ASSETS` (R2)
- `GEN_QUEUE` (Queue producer + consumer)

## Required vars/secrets

- `SESSION_PASSPHRASE`
- `SESSION_SECRET`
- `MAX_VARIANTS_PER_JOB`
- `MAX_JOBS_PER_DAY`
- `ENABLE_PROVIDER_TEST_MODE`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`

## Observability endpoint

- `GET /v1/metrics/summary?windowHours=24`

## Run

```bash
npm run worker:dev
```

## Deploy

```bash
npm run worker:deploy
```

## Migrations

```bash
wrangler d1 execute adpower --file=worker/migrations/0001_init.sql --remote
wrangler d1 execute adpower --file=worker/migrations/0002_metrics_indexes.sql --remote
```
