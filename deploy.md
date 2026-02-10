# Cloudflare Deployment Guide for Web3 Home Office

## 1) Target Architecture

This repository now runs with a **dual-project Cloudflare setup**:

- `apps/landing` -> **Cloudflare Pages** (static export)
- `apps/web` -> **Cloudflare Worker** (OpenNext full-stack runtime)
- `apps/provisioner` -> Tencent VM worker (unchanged)

Pages handles the root static site. Dynamic routes are reverse-proxied by Pages `_worker.js` to the Worker backend.

Verified against Cloudflare docs on **February 10, 2026**.

## 2) Why This Split

- Next.js server features (auth/session, `app/api/**`, billing webhook, admin tools) remain on Worker runtime.
- Static marketing shell and root domain delivery use Pages.
- Existing public URLs stay usable, including `/api/provision/request`.

## 3) Request Flow

```text
Browser -> Cloudflare Pages (apps/landing static)
        -> Pages _worker.js (advanced mode routing)
             -> Cloudflare Worker (apps/web)
                  -> Supabase / Creem APIs

Tencent provisioner (apps/provisioner)
  -> Polls provision_jobs and executes provisioning
```

`POST /api/provision/request` remains queue-only. Execution is still performed by `apps/provisioner` on Tencent.

## 4) Route Rewrite Matrix (Pages -> Worker)

| Public route on root domain | Worker target path |
|---|---|
| `/api/*` | `/app/api/*` |
| `/dashboard*` | `/app/dashboard*` |
| `/billing*` | `/app/billing*` |
| `/academy*` | `/app/academy*` |
| `/admin*` | `/app/admin*` |
| `/platforms*` | `/app/platforms*` |
| `/app` | `/app/app` |
| `/app/*` | `/app/*` |

Notes:

- Backend app uses `basePath: "/app"` in `apps/web/next.config.ts`.
- This prevents `/_next/*` asset collisions between static Pages output and Worker runtime assets.

## 5) Repository State

### Backend Worker (`apps/web`)

- OpenNext Cloudflare runtime
- Full-stack Next.js routes preserved
- `basePath: "/app"` enabled

### Static Landing (`apps/landing`)

- Next.js static export (`output: "export"`)
- `_worker.js` in `public/` for advanced-mode proxy routing
- No server runtime features (`app/api/**`, middleware, server-only flows)

## 6) Prerequisites

- Cloudflare account
- Workers + Pages enabled
- Node.js `>=22`
- pnpm `>=10`
- Git-integrated Cloudflare projects
- Supabase + Creem credentials

## 7) Local Preflight

Run from repository root:

```bash
pnpm run ci:verify-lockfile
pnpm install
pnpm --filter @web3homeoffice/web test
pnpm --filter @web3homeoffice/web build
pnpm --filter @web3homeoffice/landing build
```

Optional Worker preview:

```bash
pnpm run cf:web:preview
```

## 8) Cloudflare Project Setup

### A) Worker backend project (`apps/web`)

Create a Workers Builds project:

- Root directory: `.`
- Install command:

```bash
pnpm install --frozen-lockfile
```

- Build command:

```bash
pnpm run cf:web:build:ci
```

- Deploy command:

```bash
pnpm run cf:web:deploy:ci
```

Build watch paths:

- `apps/web/**`
- `packages/shared/**`
- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`

### B) Pages static project (`apps/landing`)

Create a Pages project:

- Root directory: `.`
- Install command:

```bash
pnpm install --frozen-lockfile
```

- Build command:

```bash
pnpm run cf:landing:build
```

- Build output directory:

```text
apps/landing/out
```

Build watch paths:

- `apps/landing/**`
- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`

## 9) Environment Variables

### Worker backend (`apps/web` runtime)

| Variable | Required | Secret? |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Yes |
| `ADMIN_BOOTSTRAP_EMAILS` | Yes | No |
| `SUPPORT_EMAIL` | Yes | No |
| `ACADEMY_EVM_ENABLED` | No | No |
| `CREEM_API_KEY` | Yes | Yes |
| `CREEM_WEBHOOK_SECRET` | Yes | Yes |
| `CREEM_MODE` | Yes | No |
| `CREEM_API_BASE_TEST` | No | No |
| `CREEM_API_BASE_LIVE` | No | No |
| `CREEM_WEBHOOK_SIGNATURE_HEADER` | Yes | No |
| `CREEM_WEBHOOK_SIGNATURE_ALGORITHM` | Yes | No |
| `TELEGRAM_BOT_TOKEN` | No | Yes |

### Pages proxy worker (`apps/landing/public/_worker.js`)

| Variable | Required | Secret? | Purpose |
|---|---|---|---|
| `BACKEND_ORIGIN` | Yes | No | Worker backend origin, e.g. `https://<worker>.workers.dev` |

Store secrets in Cloudflare Secrets, not plaintext vars.

## 10) Deploy Order

Always deploy backend first, then Pages:

```bash
pnpm run cf:web:deploy:ci
pnpm run cf:landing:deploy:ci
```

Combined helper:

```bash
pnpm run cf:stack:deploy:ci
```

`cf:landing:deploy:ci` requires `CF_PAGES_PROJECT_NAME` environment variable.

Optional vars:

- `CF_PAGES_BRANCH`
- `CF_PAGES_COMMIT_HASH`
- `CF_PAGES_COMMIT_MESSAGE`

## 11) Domain Wiring

1. Keep Worker reachable at its worker domain (or dedicated subdomain).
2. Attach primary domain to Pages.
3. Set Pages env `BACKEND_ORIGIN` to Worker origin.
4. Ensure `NEXT_PUBLIC_APP_URL` points to primary production domain.
5. In Supabase Auth, add production URLs and redirect targets (including `/dashboard`).
6. In Creem, use webhook endpoint on primary domain:

```text
https://<your-domain>/api/billing/webhook
```

## 12) Post-Deploy Validation

1. `GET /` serves static landing from Pages.
2. `GET /dashboard` loads backend app through proxy.
3. `POST /api/provision/request` still creates queue job.
4. `POST /api/billing/webhook` rejects bad signature (`401`).
5. OTP login redirects correctly to `/dashboard`.
6. Backend assets are served from `/app/_next/*` without collision.
7. `/app` opens Hub route (mapped to backend `/app/app`).

## 13) Rollback

Fast rollback strategy:

1. Point DNS/custom domain back to last known-good Worker-only setup.
2. Keep backend Worker deployed at previous working commit.
3. Confirm webhook ingestion and queue creation still function.

## 14) Troubleshooting

### Case A: Dynamic routes return 500 on Pages

- Cause: `BACKEND_ORIGIN` missing or invalid.
- Fix: Set Pages env var to valid Worker origin and redeploy Pages.

### Case B: `/_next` asset conflict

- Cause: Backend not using base path.
- Fix: Ensure `apps/web/next.config.ts` includes `basePath: "/app"`.

### Case C: `/api/provision/request` fails after migration

- Cause: proxy rewrite misconfiguration.
- Fix: confirm `_worker.js` rewrites `/api/*` to `/app/api/*`.

### Case D: Build cannot resolve workspace packages

- Cause: wrong root directory or install command.
- Fix: root must be `.` and install command must be `pnpm install --frozen-lockfile`.

## 15) References

- Cloudflare Workers + Next.js: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- Cloudflare Pages static Next.js: https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/
- Cloudflare Pages advanced mode: https://developers.cloudflare.com/pages/functions/advanced-mode/
- Cloudflare Pages bindings: https://developers.cloudflare.com/pages/functions/bindings/
