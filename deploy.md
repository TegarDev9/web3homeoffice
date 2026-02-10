# Cloudflare Deployment Guide for Web3 Home Office

## 1) Scope

This guide deploys only `apps/web` to **Cloudflare Workers Builds** using `@opennextjs/cloudflare`.

- `apps/web` runs on Cloudflare Workers.
- `apps/provisioner` stays deployed separately on Tencent VM.
- No long-running provisioning process should run inside the Worker.

## 2) Architecture Snapshot

```text
User Browser
  -> Cloudflare Worker (apps/web, Next.js via OpenNext)
      -> Supabase (Auth, Postgres, RLS)
      -> Creem API/Webhooks

Tencent Provisioner (apps/provisioner on VM)
  -> Polls Supabase provision_jobs queue independently
```

`/api/provision/request` only inserts queue jobs. Provision execution remains external (Tencent worker).

## 3) Prerequisites

- Cloudflare account with Workers Builds enabled
- Git provider connected to Cloudflare (GitHub/GitLab)
- Node.js `>=22`
- pnpm `>=10`
- Supabase project credentials ready
- Creem credentials/webhook secret ready
- Custom domain prepared (optional but recommended)

## 4) Confirm Repo is Cloudflare-Ready (Already Implemented)

This repo already includes Cloudflare/OpenNext setup:

- `apps/web/open-next.config.ts`
- `apps/web/wrangler.jsonc`
- `apps/web/package.json` scripts:
  - `cf:build`
  - `cf:preview`
  - `cf:deploy`
- Root aliases in `package.json`:
  - `pnpm cf:web:build`
  - `pnpm cf:web:build:ci`
  - `pnpm cf:web:preview`
  - `pnpm cf:web:deploy`
  - `pnpm cf:web:deploy:ci`

## 5) Local Preflight Before First Deploy

Run from repository root:

```bash
pnpm install
pnpm --filter @web3homeoffice/web test
pnpm --filter @web3homeoffice/web build
pnpm cf:web:preview
```

Expected outcomes:

- Tests pass
- Next.js production build succeeds
- OpenNext preview starts successfully

## 6) Cloudflare Workers Builds Project Setup

In Cloudflare Dashboard:

1. Create a new **Workers Builds** project from your Git repository.
2. Set production branch (`main` or your selected release branch).
3. Set **Root directory** to:

```text
.
```

Do not set root to `apps/web`, because this is a monorepo and `apps/web` depends on `packages/shared`.

4. Set install/build/deploy commands:

- Install command:

```bash
pnpm install --frozen-lockfile
```

Do not use `bun install` for this workspace.

- Build command:

```bash
pnpm run cf:web:build:ci
```

- Deploy command:

```bash
pnpm run cf:web:deploy:ci
```

5. Set Build Watch Paths:

- `apps/web/**`
- `packages/shared/**`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `package.json`

## 7) Environment Variables and Secrets

Configure variables in Cloudflare for the Worker environment.

| Variable | Required | Secret? | Used by | Example / Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | No | Frontend redirects/links | `https://app.example.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | No | Supabase browser + server clients | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | No | Supabase browser client | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Yes | Server routes/admin flows | Must never be exposed client-side |
| `ADMIN_BOOTSTRAP_EMAILS` | Yes | No | Admin role bootstrap | Comma-separated email list |
| `SUPPORT_EMAIL` | Yes | No | Billing cancellation fallback UI | Example: `support@yourdomain.com` |
| `ACADEMY_EVM_ENABLED` | No | No | Academy feature flag | `false` by default |
| `CREEM_API_KEY` | Yes | Yes | Server billing routes | Creem secret API key |
| `CREEM_WEBHOOK_SECRET` | Yes | Yes | Webhook signature verification | Must match Creem dashboard |
| `CREEM_MODE` | Yes | No | Creem mode switching | `test` or `live` |
| `CREEM_API_BASE_TEST` | No | No | Optional Creem test API override | Keep unset unless needed |
| `CREEM_API_BASE_LIVE` | No | No | Optional Creem live API override | Keep unset unless needed |
| `CREEM_WEBHOOK_SIGNATURE_HEADER` | Yes | No | Webhook verification parser | Example: `x-creem-signature` |
| `CREEM_WEBHOOK_SIGNATURE_ALGORITHM` | Yes | No | Webhook verification parser | Example: `sha256` |
| `TELEGRAM_BOT_TOKEN` | No | Yes | Telegram verify endpoint | Needed only if Telegram linking is enabled |

> [!WARNING]
> Store sensitive values as Cloudflare **Secrets**, not plaintext environment variables.

## 8) Domain and Integration Wiring

1. Attach custom domain to your Worker in Cloudflare.
2. Set `NEXT_PUBLIC_APP_URL` to your final production domain.
3. Supabase Auth configuration:
   - Add production site URL
   - Add redirect URL(s), including OTP redirect to `/dashboard`
4. Creem webhook configuration:
   - Endpoint: `https://<your-domain>/api/billing/webhook`
   - Ensure webhook signature header + algorithm match:
     - `CREEM_WEBHOOK_SIGNATURE_HEADER`
     - `CREEM_WEBHOOK_SIGNATURE_ALGORITHM`

> [!WARNING]
> If Supabase redirect URLs do not match your production domain exactly, OTP login can fail or redirect incorrectly.

## 9) Deploy Flow (First Release and Updates)

First release:

1. Push configured branch to Git.
2. Workers Builds executes build/deploy pipeline.
3. Verify deployment status in Cloudflare dashboard.

Subsequent updates:

- Push to production branch to trigger automatic deploy.

Optional local/manual fallback:

```bash
pnpm cf:web:deploy
```

## 10) Post-Deploy Smoke Checklist

Manual checks after deployment:

1. `GET /` loads successfully.
2. OTP login works and redirects to `/dashboard`.
3. `/billing` renders and checkout action reaches backend route.
4. `/api/billing/webhook` rejects invalid signatures (`401`).
5. `/api/provision/request` creates queue jobs (no long-running task in Worker).
6. `/academy` loads and access gating behaves as expected.

Negative webhook test example:

```bash
curl -i -X POST "https://<your-domain>/api/billing/webhook" ^
  -H "content-type: application/json" ^
  -H "x-creem-signature: invalid-signature" ^
  --data "{\"type\":\"subscription.active\"}"
```

Expected result: `401 Unauthorized`.

## 11) Troubleshooting

### Case 1: Build fails because workspace package is missing

- Failure signature:
  - dependency step runs `bun install`
  - log contains `No packages! Deleted empty lockfile`
  - build fails with `opennextjs-cloudflare: not found`
  - pnpm warns `Local package.json exists, but node_modules missing`
- Cause: Workers Builds install command is misconfigured, so workspace dependencies were not installed.
- Fix:
  - Set root directory to `.` (repo root), not `apps/web`.
  - Set install command to `pnpm install --frozen-lockfile`.
  - Set build command to `pnpm run cf:web:build:ci`.
  - Set deploy command to `pnpm run cf:web:deploy:ci`.
- Expected successful log signals:
  - dependency step shows `pnpm install --frozen-lockfile`
  - build step starts with `pnpm run cf:web:build:ci`
  - OpenNext banner appears and build completes without `opennextjs-cloudflare: not found`

### Case 2: Runtime route fails due missing env variable

- Cause: Variable not configured in Cloudflare environment.
- Fix: Add the variable (or secret) in Worker environment settings, then redeploy.

### Case 3: OTP redirect mismatch

- Cause: Supabase Auth URL mismatch.
- Fix:
  - Ensure `NEXT_PUBLIC_APP_URL` matches production domain.
  - Ensure Supabase allowed redirect URLs include `/dashboard`.

### Case 4: Creem webhook verification fails

- Cause: Secret/header/algo mismatch between Creem and Worker env.
- Fix:
  - Verify `CREEM_WEBHOOK_SECRET`
  - Verify `CREEM_WEBHOOK_SIGNATURE_HEADER`
  - Verify `CREEM_WEBHOOK_SIGNATURE_ALGORITHM`

### Case 5: Node compatibility/runtime issue

- Cause: Worker compatibility mismatch.
- Fix:
  - Confirm `nodejs_compat` is enabled in `apps/web/wrangler.jsonc`.
  - Keep `compatibility_date` current.

## 12) Rollback and Safety

- Rollback strategy: redeploy last known-good Git commit.
- After rollback, verify webhook auditability:
  - confirm events continue to be recorded in `webhook_events`.
- This web deployment should not modify Terraform/stateful infrastructure.
- Provisioning execution continues to run only on Tencent provisioner service.
