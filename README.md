# Web3 Home Office

Production-oriented monorepo for a Next.js SaaS stack with:

- Static landing on Cloudflare Pages (`apps/landing`)
- Full-stack Next.js runtime on Cloudflare Worker (`apps/web` via OpenNext)
- Supabase auth + Postgres + RLS
- Creem billing checkout/webhook flows
- Tencent provisioning queue worker (`apps/provisioner`)

## Monorepo structure

```text
apps/landing      # Next.js static export for Pages root domain
apps/web          # Next.js full-stack app for Cloudflare Worker (basePath /app)
apps/provisioner  # Node worker on Tencent VM for provisioning execution
packages/shared   # Shared plans/types/zod schemas
```

## Prerequisites

- Node.js 22+
- pnpm 10+
- Supabase project
- Creem account + webhook secret
- Tencent Cloud sub-account keys (least privilege)

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy env template and fill values:

```bash
cp .env.example .env
```

3. Run Supabase SQL migrations from `apps/web/supabase/migrations` in order `0001` -> `0008`.

4. Start local apps:

```bash
pnpm dev
pnpm --filter @web3homeoffice/landing dev
```

- `apps/web` defaults to `http://localhost:3000`
- `apps/landing` defaults to `http://localhost:3001`

## Environment variables

### Worker backend (`apps/web`)

- `NEXT_PUBLIC_APP_URL` (example: `http://localhost:3000`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_BOOTSTRAP_EMAILS`
- `SUPPORT_EMAIL`
- `ACADEMY_EVM_ENABLED` (`false` default)
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`
- `CREEM_MODE` (`test` or `live`)
- `CREEM_API_BASE_TEST` (optional)
- `CREEM_API_BASE_LIVE` (optional)
- `CREEM_WEBHOOK_SIGNATURE_HEADER` (default `x-creem-signature`)
- `CREEM_WEBHOOK_SIGNATURE_ALGORITHM` (default `sha256`)
- `TELEGRAM_BOT_TOKEN` (optional)

### Pages proxy worker (`apps/landing/public/_worker.js`)

- `BACKEND_ORIGIN` (required in Pages env, e.g. `https://<worker-subdomain>.workers.dev`)

### Provisioner worker (`apps/provisioner`)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `POLL_INTERVAL_MS` (default `10000`)
- `WORKER_BATCH_SIZE` (default `3`)
- `TENCENT_SECRET_ID`
- `TENCENT_SECRET_KEY`
- `TENCENT_REGION` (default `ap-singapore`)
- `LIGHTHOUSE_BUNDLE_ID`
- `LIGHTHOUSE_BLUEPRINT_ID`
- `LIGHTHOUSE_BLUEPRINT_ID_UBUNTU` (optional)
- `LIGHTHOUSE_BLUEPRINT_ID_DEBIAN` (optional)
- `LIGHTHOUSE_BLUEPRINT_ID_KALI` (optional)
- `LIGHTHOUSE_ZONE`
- `LIGHTHOUSE_INSTANCE_TYPE`

## Routing model (Pages + Worker)

Public routes preserved on primary domain:

- `/api/*` -> Worker `/app/api/*`
- `/dashboard*` -> Worker `/app/dashboard*`
- `/billing*` -> Worker `/app/billing*`
- `/academy*` -> Worker `/app/academy*`
- `/admin*` -> Worker `/app/admin*`
- `/platforms*` -> Worker `/app/platforms*`
- `/app` -> Worker `/app/app`
- `/app/*` -> Worker `/app/*`

`POST /api/provision/request` contract is unchanged. It still enqueues `provision_jobs`; Tencent provisioner executes jobs asynchronously.

## Creem integration

- Checkout: `POST /api/billing/checkout`
- Webhook: `POST /api/billing/webhook`
- Portal: `POST /api/billing/portal`
- Cancellation request: `POST /api/billing/cancel-request`

Webhook endpoint in production:

```text
https://<your-domain>/api/billing/webhook
```

## Provisioning architecture

1. User requests provision (`POST /api/provision/request`).
2. App inserts `provision_jobs` with `pending`.
3. Provisioner polls `dequeue_provision_jobs()`.
4. Provisioner creates Tencent Lighthouse instance.
5. Provisioner bootstraps via Tencent TAT command.
6. Provisioner retries failures with backoff.
7. Job status/logs update in Supabase.

## Deploy

See full guide: [`deploy.md`](deploy.md)

### A) Deploy Worker backend (`apps/web`)

```bash
pnpm run cf:web:deploy:ci
```

### B) Deploy Pages landing (`apps/landing`)

```bash
CF_PAGES_PROJECT_NAME=<pages-project> pnpm run cf:landing:deploy:ci
```

Optional metadata envs for Pages deploy:

- `CF_PAGES_BRANCH`
- `CF_PAGES_COMMIT_HASH`
- `CF_PAGES_COMMIT_MESSAGE`

### C) Recommended deployment order

1. Deploy Worker backend first.
2. Deploy Pages static + proxy second.

Or run combined helper:

```bash
pnpm run cf:stack:deploy:ci
```

## Scripts

- `pnpm dev` - run `apps/web` in dev mode
- `pnpm build` - build all workspace packages
- `pnpm typecheck` - typecheck all packages
- `pnpm test` - run web tests
- `pnpm smoke` - web smoke + workspace typecheck
- `pnpm ci:verify-lockfile` - fail early if lockfile missing/untracked

Worker scripts:

- `pnpm cf:web:build`
- `pnpm cf:web:build:ci`
- `pnpm cf:web:preview`
- `pnpm cf:web:deploy`
- `pnpm cf:web:deploy:ci`
- `pnpm cf:web:typegen`

Pages landing scripts:

- `pnpm cf:landing:build`
- `pnpm cf:landing:deploy`
- `pnpm cf:landing:deploy:ci`
- `pnpm cf:stack:deploy:ci`

## Testing

Minimal critical tests are under `apps/web/src/tests`, including:

- billing webhook signature handling
- subscription access guards
- provisioning limits and retry policy
- API route validation

Run:

```bash
pnpm test
pnpm smoke
```
