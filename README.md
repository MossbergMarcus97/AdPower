# AdVariant Swiss Precision Prototype

AdVariant prototype focused on the Swiss Precision direction from the master specification.

Other visual directions (Neon Editorial, Soft Tech, Dark Luxury) are archived and route back to Swiss.

## What is implemented

- Swiss app at `/`
- Legacy routes (`/swiss`, `/neon`, `/soft-tech`, `/dark-luxury`) redirect to `/`
- Shared UX flows from spec:
  - Client → Campaign → Ad context
  - Dashboard metrics + active campaigns
  - 6-step campaign wizard with AI assist notes
  - Generation modes (quick/custom/iterate)
  - Generation job progress states and feedback
  - Review grid with batch approval/rejection
  - Export configuration by platform/format/grouping
- Personality microcopy:
  - Time-aware greeting messages
  - Loading states
  - Friendly success/error messaging
- Functional navbar and CTA interactions:
  - Top nav buttons switch working views
  - Dashboard/campaign/review action buttons update state and workflows

## Tech stack

- React + TypeScript + Vite
- React Router
- CSS variable-based multi-theme architecture

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Deploy to Cloudflare Pages

Set your project name, then deploy:

```bash
export CLOUDFLARE_PROJECT_NAME="advariant-visual-prototype"
npm run deploy:cloudflare
```

Notes:

- `public/_redirects` is included for SPA route handling on Pages.
- Requires Cloudflare auth (`wrangler login`) on the machine.

## Publish to GitHub

Initialize and push:

```bash
git init
git add .
git commit -m "Build AdVariant multi-style prototype"
gh repo create AdPower --public --source=. --remote=origin --push
```

If you already have a remote:

```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```
