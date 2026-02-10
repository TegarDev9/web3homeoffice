# Provisioner Worker

Node.js worker service for Tencent Cloud provisioning outside Vercel constraints.

## Run locally

```bash
pnpm install
pnpm --filter @web3homeoffice/provisioner dev
```

## Required environment

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

## Deployment notes

1. Deploy on a small Tencent VM with Node.js 22+.
2. Run with a process manager (systemd/pm2).
3. Restrict Tencent IAM to Lighthouse + TAT permissions only.
4. Rotate Tencent and Supabase keys regularly.


