# Web3 Home Office

Production-oriented monorepo for a **Next.js App Router SaaS** with:

- Neon cyberpunk UI (shadcn/ui + Tailwind v4 + lucide-react)
- 3D Office Hub (`three.js` via `@react-three/fiber` + `@react-three/drei`)
- Supabase auth (email OTP) + Postgres + RLS
- Creem subscriptions (checkout + webhook + portal fallback)
- Tencent Cloud provisioning queue (Supabase jobs + external worker)
- Mini app adapters (Telegram, Farcaster, Base)

## Monorepo structure

```text
apps/web          # Next.js app (Cloudflare Workers via OpenNext)
apps/provisioner  # Node worker (deploy on Tencent VM)
packages/shared   # shared plan/types/zod schemas
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

3. Run Supabase SQL migrations from `apps/web/supabase/migrations` in order `0001` -> `0007`.

4. Start local web app:

```bash
pnpm dev
```

Web app runs on `http://localhost:3000`.

## Environment variables

### Web app (`apps/web`)

- `NEXT_PUBLIC_APP_URL` (example: `http://localhost:3000`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_BOOTSTRAP_EMAILS` (comma-separated emails)
- `SUPPORT_EMAIL` (displayed in billing fallback when portal is unavailable)
- `ACADEMY_EVM_ENABLED` (`false` by default; toggles EVM demo hooks for academy tools)
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`
- `CREEM_MODE` (`test` or `live`)
- `CREEM_API_BASE_TEST` (optional override)
- `CREEM_API_BASE_LIVE` (optional override)
- `CREEM_WEBHOOK_SIGNATURE_HEADER` (default `x-creem-signature`)
- `CREEM_WEBHOOK_SIGNATURE_ALGORITHM` (default `sha256`)
- `TELEGRAM_BOT_TOKEN` (optional, needed for Telegram verify route)

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
- `LIGHTHOUSE_BLUEPRINT_ID_UBUNTU` (optional override, defaults to `LIGHTHOUSE_BLUEPRINT_ID`)
- `LIGHTHOUSE_BLUEPRINT_ID_DEBIAN` (optional override, defaults to `LIGHTHOUSE_BLUEPRINT_ID`)
- `LIGHTHOUSE_BLUEPRINT_ID_KALI` (optional override, defaults to `LIGHTHOUSE_BLUEPRINT_ID`)
- `LIGHTHOUSE_ZONE`
- `LIGHTHOUSE_INSTANCE_TYPE`

## Creem integration

- Checkout endpoint: `POST /api/billing/checkout`
- Webhook endpoint: `POST /api/billing/webhook`
- Portal endpoint: `POST /api/billing/portal`
- Cancellation request endpoint: `POST /api/billing/cancel-request`
- Academy rooms endpoint: `GET /api/academy/rooms`
- Academy room detail endpoint: `GET /api/academy/rooms/:roomId`
- Academy progress endpoints: `GET/POST /api/academy/progress`
- Academy tool launch endpoint: `POST /api/academy/tools/:toolId/launch`

### Webhook setup

1. Configure Creem webhook to point to:
   - `https://<your-domain>/api/billing/webhook`
2. Set `CREEM_WEBHOOK_SECRET` and header/algo env vars.
3. Keep webhook verification fail-closed (already implemented).

## Provisioning architecture

1. User requests provision (`POST /api/provision/request`).
2. App inserts `provision_jobs` row with `pending`.
3. Worker polls `dequeue_provision_jobs()`.
4. Worker calls Tencent Lighthouse `CreateInstances`.
5. Worker bootstraps via Tencent TAT command.
6. On failure worker retries up to 3 times with backoff (1m, 5m, 15m).
7. Worker updates job (`running -> pending|provisioned|failed`) and appends logs.

### Auto-install on subscription activation

- Checkout now arms an auto-install preference (`template` + `os`) for a short window.
- When webhook status becomes `active`, app creates one `subscription_auto` provision job (idempotent by `subscription_id`).
- Desktop checkout can choose `Debian`/`Ubuntu`/`Kali` + package (`VPS Base`/`Server RPC`); mobile uses default `Ubuntu + VPS Base`.

## Deploy

### Cloudflare Workers Builds (`apps/web`)

This repo uses `@opennextjs/cloudflare` for Next.js App Router deployment on Cloudflare Workers.

#### 1) Connect repo

- In Cloudflare dashboard, create a **Workers Builds** project from your Git repository.
- Set **Production branch** (for example `main`).
- Set **Root directory** to repository root (`.`), not `apps/web`, because `apps/web` imports `packages/shared`.

#### 2) Install + build + deploy commands

- Install command (required):

```bash
pnpm install --frozen-lockfile
```

- Use pnpm install, not `bun install`. This monorepo keeps app dependencies in workspace packages, not root dependencies.
- `pnpm-lock.yaml` must be committed to git and not ignored, or `--frozen-lockfile` will fail in CI.

- Build command:

```bash
pnpm run cf:web:build:ci
```

- Deploy command:

```bash
pnpm run cf:web:deploy:ci
```

- Recommended Build Watch Paths:
  - `apps/web/**`
  - `packages/shared/**`
  - `pnpm-lock.yaml`
  - `package.json`
  - `pnpm-workspace.yaml`

#### 3) Environment variables (Cloudflare)

Add all web env vars in Cloudflare for build/runtime:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_BOOTSTRAP_EMAILS`
- `SUPPORT_EMAIL`
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`
- `CREEM_MODE`
- `CREEM_API_BASE_TEST`
- `CREEM_API_BASE_LIVE`
- `CREEM_WEBHOOK_SIGNATURE_HEADER`
- `CREEM_WEBHOOK_SIGNATURE_ALGORITHM`
- `TELEGRAM_BOT_TOKEN` (optional)

Keep sensitive values as secrets.

#### 4) Domain + integrations

- Attach your custom domain to the Worker.
- Set `NEXT_PUBLIC_APP_URL` to the deployed Cloudflare URL/domain.
- In Supabase Auth, add the Cloudflare domain to allowed site/redirect URLs (`/dashboard` redirect must be allowed).
- Point Creem webhook to:

```text
https://<your-domain>/api/billing/webhook
```

- Ensure webhook signature header/algorithm env values match Creem settings.

#### 5) Local pre-deploy validation

```bash
pnpm run ci:verify-lockfile
pnpm --filter @web3homeoffice/web test
pnpm --filter @web3homeoffice/web build
pnpm --filter @web3homeoffice/web run cf:build
pnpm run cf:web:build:ci
```

### Tencent worker (`apps/provisioner`)

- Deploy on lightweight Tencent VM.
- Copy provisioner env vars.
- Run:

```bash
pnpm install
pnpm --filter @web3homeoffice/provisioner build
pnpm --filter @web3homeoffice/provisioner start
```

- Use systemd/pm2 for process supervision.

## Scripts

- `pnpm dev` - run Next.js app
- `pnpm build` - build all packages/apps
- `pnpm typecheck` - typecheck all workspace packages
- `pnpm test` - run web tests
- `pnpm smoke` - run smoke test + workspace typecheck
- `pnpm ci:verify-lockfile` - fail CI early if `pnpm-lock.yaml` is missing, ignored, or untracked
- `pnpm cf:web:build` - build Cloudflare OpenNext output for `apps/web`
- `pnpm cf:web:build:ci` - CI-safe Cloudflare build (installs workspace deps, then runs OpenNext build)
- `pnpm cf:web:preview` - local Cloudflare preview for `apps/web`
- `pnpm cf:web:deploy` - deploy `apps/web` Worker using OpenNext CLI
- `pnpm cf:web:deploy:ci` - CI-safe Cloudflare deploy (installs workspace deps, then runs OpenNext deploy)
- `pnpm cf:web:typegen` - generate Cloudflare env type definitions

## Cloudflare build troubleshooting

- Failure signature: `bun install` + `No packages!` + `node_modules missing` + `opennextjs-cloudflare: not found`
- Root cause: Workers Builds install command is misconfigured, so workspace dependencies are never installed.
- Fix:
  - Set Root directory to `.`
  - Set Install command to `pnpm install --frozen-lockfile`
  - Set Build command to `pnpm run cf:web:build:ci`
  - Set Deploy command to `pnpm run cf:web:deploy:ci`
- Failure signature: `ERR_PNPM_NO_LOCKFILE Cannot install with "frozen-lockfile" because pnpm-lock.yaml is absent`
- Root cause: `pnpm-lock.yaml` is missing in the Git clone (not committed or still ignored).
- Fix:
  - Remove lockfile ignore rules (if present).
  - Commit `pnpm-lock.yaml`.
  - Run `pnpm run ci:verify-lockfile` locally before pushing.

## Testing

Minimal critical tests are included under `apps/web/src/tests`:

- webhook signature verification
- webhook payload normalization
- subscription access guard logic
- provisioning limit parsing and validation helpers
- retry backoff policy helpers
- cancellation request schema validation
- smoke import test

Run:

```bash
pnpm smoke
```


