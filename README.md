# AdPower (Swiss Precision)

Production-baseline Swiss Precision frontend + Cloudflare Worker AI vertical slice.

## What this now includes

- Swiss-only UI direction (legacy theme routes redirect to `/`)
- Refactored frontend architecture:
  - `src/features/*` view modules
  - `src/components/ui/*` primitives
  - reducer-based workspace state (`src/lib/workspace/*`)
- URL-synced navigation state (`view`, `step`)
- LocalStorage persistence for non-sensitive preferences
- Accessibility hardening:
  - keyboard/focus-visible support
  - `aria-current` top nav state
  - `aria-live` status channel
- Test baseline:
  - reducer/selectors/microcopy unit tests
  - component interaction tests
  - Playwright smoke e2e flow
- AI API vertical slice in Cloudflare Worker:
  - passphrase session gate
  - job queue pipeline
  - dual-provider routing (primary + fallback)
  - D1 + R2 persistence
  - generation/review/export endpoints

## Frontend scripts

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run verify
```

## Cloudflare Pages deploy

```bash
npm run deploy:cloudflare
```

This deploy script is pinned to Pages project `adpower`.

## Worker setup

Worker source: `worker/`

1. Create resources (D1, R2, Queue) in Cloudflare.
2. Update `worker/wrangler.toml` bindings:
   - `database_id`
   - `bucket_name`
   - queue name
3. Set secure vars/secrets:
   - `SESSION_PASSPHRASE`
   - `SESSION_SECRET`
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `GOOGLE_API_KEY`

Apply D1 schema:

```bash
wrangler d1 execute adpower --file=worker/migrations/0001_init.sql --remote
```

Run/deploy worker:

```bash
npm run worker:dev
npm run worker:deploy
```

## API contracts implemented (`/v1`)

- `POST /session`
- `GET /session`
- `POST /generation-jobs`
- `GET /generation-jobs/:jobId`
- `GET /campaigns/:campaignId/variants`
- `PATCH /variants/:variantId/status`
- `POST /exports`
- `GET /exports/:exportId`
- `GET /exports/:exportId/download`

## Local integration

Frontend API base defaults to `/v1`.
To target a remote Worker domain locally:

```bash
VITE_API_BASE_URL="https://<your-worker-domain>/v1" npm run dev
```
