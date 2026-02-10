# Cloudflare Deployment Guide for Web3 Home Office

## 1) Platform Decision (Read This First)

Deploy the full app (`apps/web`) to **Cloudflare Workers Builds** using `@opennextjs/cloudflare`.

- `apps/web` is a full-stack Next.js App Router app with server routes (`app/api/**`), auth/session checks, billing webhook flows, and admin/provisioning routes.
- `apps/provisioner` remains a separate worker process on Tencent VM.
- Cloudflare Pages is valid for **static exports only**. It is not the correct primary target for this repo's full feature set.

Limits and pricing assumptions in this guide were verified from official docs on **February 10, 2026**.

## 2) Free-Tier Reality Check (Cloudflare)

| Item | Free-tier behavior | Why it matters here |
|---|---|---|
| Pages static asset requests | Free and unlimited (when request does not invoke Functions) | Good for static-only sites |
| Pages Functions requests | Count against Workers free quota | Not unlimited for server logic |
| Workers free requests | `100,000` requests/day, shared quota; resets at midnight UTC | Full-stack traffic must be monitored |
| Pages builds (Git-integrated) | `500` builds/month | High commit volume can hit build cap |

Interpretation: for this repo, "unlimited free" is only true for static assets. Full-stack Next.js is **free within quotas**, not unlimited.

## 3) Scope

This guide deploys only `apps/web` to Cloudflare Workers Builds.

- In scope: Next.js web app runtime and API routes on Cloudflare Workers.
- Out of scope: migrating app architecture to Pages static export, Terraform/stateful infra changes.

## 4) Architecture Snapshot

```text
User Browser
  -> Cloudflare Worker (apps/web, Next.js via OpenNext)
      -> Supabase (Auth, Postgres, RLS)
      -> Creem API/Webhooks

Tencent Provisioner (apps/provisioner on VM)
  -> Polls Supabase provision_jobs queue independently
```

`/api/provision/request` only inserts queue jobs. Provision execution remains external (Tencent worker).

## 5) Prerequisites

- Cloudflare account with Workers Builds enabled
- Git provider connected to Cloudflare (GitHub/GitLab)
- Node.js `>=22`
- pnpm `>=10`
- Supabase project credentials ready
- Creem credentials/webhook secret ready
- Custom domain prepared (optional but recommended)

## 6) Confirm Repo Is Workers-Ready (Already Implemented)

This repo already includes Cloudflare/OpenNext setup:

- `apps/web/open-next.config.ts`
- `apps/web/wrangler.jsonc`
- `apps/web/package.json` scripts:
  - `cf:build`
  - `cf:preview`
  - `cf:deploy`
- Root aliases in `package.json`:
  - `pnpm ci:verify-lockfile`
  - `pnpm cf:web:build`
  - `pnpm cf:web:build:ci`
  - `pnpm cf:web:preview`
  - `pnpm cf:web:deploy`
  - `pnpm cf:web:deploy:ci`

## 7) Quick Deploy Path (Workers Builds)

### Step 1: Local preflight

Run from repository root:

```bash
pnpm run ci:verify-lockfile
pnpm install
pnpm --filter @web3homeoffice/web test
pnpm --filter @web3homeoffice/web build
pnpm cf:web:preview
```

Expected outcomes:

- Tests pass
- Next.js production build succeeds
- OpenNext preview starts successfully

### Step 2: Configure Workers Builds project in Cloudflare

In Cloudflare dashboard:

1. Create a **Workers Builds** project from your Git repository.
2. Set production branch (`main` or selected release branch).
3. Set **Root directory** to:

```text
.
```

Do not set root to `apps/web`, because this monorepo depends on `packages/shared`.

4. Set install/build/deploy commands:

Install command:

```bash
pnpm install --frozen-lockfile
```

Build command:

```bash
pnpm run cf:web:build:ci
```

Deploy command:

```bash
pnpm run cf:web:deploy:ci
```

Do not use `bun install` for this workspace. `pnpm-lock.yaml` must be committed and not ignored.

5. Set Build Watch Paths:

- `apps/web/**`
- `packages/shared/**`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `package.json`

### Step 3: Configure environment variables and secrets

Set these in Cloudflare Worker environment:

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
> Store sensitive values as Cloudflare **Secrets**, not plaintext variables.

### Step 4: Wire domain and integrations

1. Attach custom domain to Worker.
2. Set `NEXT_PUBLIC_APP_URL` to final production domain.
3. Supabase Auth:
   - Add production site URL.
   - Add redirect URL(s), including OTP redirect to `/dashboard`.
4. Creem webhook:
   - Endpoint: `https://<your-domain>/api/billing/webhook`
   - Ensure values match:
     - `CREEM_WEBHOOK_SIGNATURE_HEADER`
     - `CREEM_WEBHOOK_SIGNATURE_ALGORITHM`

> [!WARNING]
> If Supabase redirect URLs do not match production domain exactly, OTP login may fail or redirect incorrectly.

### Step 5: Deploy and update flow

First release:

1. Push configured branch to Git.
2. Workers Builds executes install/build/deploy pipeline.
3. Verify deployment status in Cloudflare dashboard.

Subsequent updates:

- Push to production branch to trigger automatic deploy.

Optional local/manual fallback:

```bash
pnpm cf:web:deploy
```

## 8) Post-Deploy Smoke Checklist

Manual checks:

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

## 9) Stay on Free Tier (Guardrails)

1. Treat Workers requests as a daily budget (`100,000`/day on Free).
2. Remember free request quota resets at midnight UTC.
3. Reduce noisy production logs and debug-only traffic.
4. Monitor request usage and build counts in Cloudflare dashboard daily/weekly.
5. Keep synthetic checks/load tests controlled so they do not consume most of daily quota.
6. If sustained traffic exceeds free quota, upgrade to Workers Paid before user-facing failures.

## 10) Troubleshooting

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

### Case 2: `ERR_PNPM_NO_LOCKFILE` during install

- Failure signature:
  - install step logs `ERR_PNPM_NO_LOCKFILE`
  - message includes `pnpm-lock.yaml is absent`
- Cause: `pnpm-lock.yaml` is missing in Git clone because it was not committed (or was ignored).
- Fix:
  - Ensure `.gitignore` does not exclude `pnpm-lock.yaml`.
  - Commit `pnpm-lock.yaml`.
  - Run `pnpm run ci:verify-lockfile` locally before pushing.

### Case 3: Runtime route fails due missing env variable

- Cause: Variable not configured in Cloudflare environment.
- Fix: Add variable/secret in Worker environment settings, then redeploy.

### Case 4: OTP redirect mismatch

- Cause: Supabase Auth URL mismatch.
- Fix:
  - Ensure `NEXT_PUBLIC_APP_URL` matches production domain.
  - Ensure Supabase allowed redirect URLs include `/dashboard`.

### Case 5: Creem webhook verification fails

- Cause: Secret/header/algo mismatch between Creem and Worker env.
- Fix:
  - Verify `CREEM_WEBHOOK_SECRET`.
  - Verify `CREEM_WEBHOOK_SIGNATURE_HEADER`.
  - Verify `CREEM_WEBHOOK_SIGNATURE_ALGORITHM`.

### Case 6: Node compatibility/runtime issue

- Cause: Worker compatibility mismatch.
- Fix:
  - Confirm `nodejs_compat` is enabled in `apps/web/wrangler.jsonc`.
  - Keep `compatibility_date` current.

### Case 7: "I expected Pages unlimited free, but hit quota"

- Symptom:
  - Full-stack requests fail or throttle after daily volume spikes.
  - Static assets still serve, but dynamic endpoints are constrained.
- Cause:
  - "Unlimited" applies to static asset requests.
  - Requests invoking Functions/Workers consume Workers quota.
- Fix:
  - Distinguish static traffic from function/worker invocations.
  - Keep this app on Workers for full features and monitor daily request usage.
  - Upgrade Workers plan when sustained traffic exceeds free tier.

## 11) Rollback and Safety

- Rollback strategy: redeploy last known-good Git commit.
- After rollback, verify webhook auditability:
  - confirm events continue to be recorded in `webhook_events`.
- This web deployment should not modify Terraform/stateful infrastructure.
- Provisioning execution continues to run only on Tencent provisioner service.

## 12) Appendix: If You Still Want Cloudflare Pages Static-Only

Use this only for a separate static site use case. It is not a full replacement for this repo's current web app runtime.

### What breaks on static export for this repo

- Auth/session-dependent pages (server-side user/subscription checks).
- Route handlers under `app/api/**`.
- Billing, provisioning, and admin flows that require server runtime.

### Why

Current Next.js static export mode does not support many server/runtime features used by this app (for example: runtime Route Handlers, cookies/session-driven server logic, and middleware-like request-time behavior).

### Safe path

1. Keep full app (`apps/web`) on Workers.
2. Optionally create a separate static marketing app for Pages, then link to Worker-hosted app routes for authenticated/product features.

For static-only Next.js on Pages, use Cloudflare's dedicated static guide and ensure the app is intentionally built for static export.

## 13) References (Official Docs)

- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare Pages Functions pricing: https://developers.cloudflare.com/pages/functions/pricing/
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare Next.js on Pages guide index: https://developers.cloudflare.com/pages/framework-guides/nextjs/
- Cloudflare static Next.js Pages guide: https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/
- Next.js static export docs (unsupported features): https://nextjs.org/docs/14/app/building-your-application/deploying/static-exports
