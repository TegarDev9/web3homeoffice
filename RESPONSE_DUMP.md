### `.env.example`
```example
# Web app
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
ADMIN_BOOTSTRAP_EMAILS=admin@example.com

# Creem
CREEM_API_KEY=YOUR_CREEM_API_KEY
CREEM_WEBHOOK_SECRET=YOUR_CREEM_WEBHOOK_SECRET
CREEM_MODE=test
CREEM_API_BASE_TEST=https://test-api.creem.io
CREEM_API_BASE_LIVE=https://api.creem.io
CREEM_WEBHOOK_SIGNATURE_HEADER=x-creem-signature
CREEM_WEBHOOK_SIGNATURE_ALGORITHM=sha256

# Telegram (optional)
TELEGRAM_BOT_TOKEN=

# Provisioner
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
POLL_INTERVAL_MS=10000
WORKER_BATCH_SIZE=3
TENCENT_SECRET_ID=YOUR_TENCENT_SECRET_ID
TENCENT_SECRET_KEY=YOUR_TENCENT_SECRET_KEY
TENCENT_REGION=ap-singapore
LIGHTHOUSE_BUNDLE_ID=bundle_lighthouse_small
LIGHTHOUSE_BLUEPRINT_ID=lhbp_ubuntu_2204
LIGHTHOUSE_ZONE=ap-singapore-1
LIGHTHOUSE_INSTANCE_TYPE=SML_2CORE_2G
```

### `.gitignore`
```gitignore
node_modules
.pnpm-store
.next
out
dist
coverage
.DS_Store
*.log
.env
.env.*
!.env.example
pnpm-lock.yaml
apps/web/.next
apps/web/coverage
apps/provisioner/dist


```

### `_dump_script.ps1`
```ps1
$files = @('.env.example','.gitignore')
$files += @(rg --files | Where-Object { $_ -ne 'pnpm-lock.yaml' } | Sort-Object)
$sb = New-Object System.Text.StringBuilder

foreach ($file in $files) {
  if (-not (Test-Path $file)) { continue }
  $ext = [System.IO.Path]::GetExtension($file).TrimStart('.')
  if ([string]::IsNullOrWhiteSpace($ext)) { $ext = 'text' }
  switch ($ext) {
    'md' { $ext = 'markdown' }
    'mjs' { $ext = 'javascript' }
    'yaml' { $ext = 'yaml' }
    'yml' { $ext = 'yaml' }
    'sql' { $ext = 'sql' }
    'json' { $ext = 'json' }
    'css' { $ext = 'css' }
    'sh' { $ext = 'bash' }
    default { }
  }

  $path = $file -replace '\\','/'
  $content = Get-Content -Raw -Path $file
  $null = $sb.AppendLine('### `' + $path + '`')
  $null = $sb.AppendLine('```' + $ext)
  $null = $sb.Append($content)
  if (-not $content.EndsWith("`n")) {
    $null = $sb.AppendLine('')
  }
  $null = $sb.AppendLine('```')
  $null = $sb.AppendLine('')
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText('RESPONSE_DUMP.md',$sb.ToString(),$utf8NoBom)
```

### `apps/provisioner/package.json`
```json
{
  "name": "@web3homeoffice/provisioner",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.57.4",
    "@web3homeoffice/shared": "workspace:*",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@types/node": "^24.3.1",
    "tsx": "^4.20.5",
    "typescript": "^5.8.3"
  }
}


```

### `apps/provisioner/README.md`
```markdown
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
- `LIGHTHOUSE_ZONE`
- `LIGHTHOUSE_INSTANCE_TYPE`

## Deployment notes

1. Deploy on a small Tencent VM with Node.js 22+.
2. Run with a process manager (systemd/pm2).
3. Restrict Tencent IAM to Lighthouse + TAT permissions only.
4. Rotate Tencent and Supabase keys regularly.


```

### `apps/provisioner/src/env.ts`
```ts
import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  POLL_INTERVAL_MS: z.coerce.number().default(10000),
  WORKER_BATCH_SIZE: z.coerce.number().default(3),

  TENCENT_SECRET_ID: z.string().min(10),
  TENCENT_SECRET_KEY: z.string().min(10),
  TENCENT_REGION: z.string().default("ap-singapore"),

  LIGHTHOUSE_BUNDLE_ID: z.string().default("bundle_lighthouse_small"),
  LIGHTHOUSE_BLUEPRINT_ID: z.string().default("lhbp_ubuntu_2204"),
  LIGHTHOUSE_ZONE: z.string().default("ap-singapore-1"),
  LIGHTHOUSE_INSTANCE_TYPE: z.string().default("SML_2CORE_2G")
});

export type ProvisionerEnv = z.infer<typeof envSchema>;

let cachedEnv: ProvisionerEnv | null = null;

export function getEnv() {
  if (cachedEnv) return cachedEnv;
  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
}


```

### `apps/provisioner/src/index.ts`
```ts
import { getEnv } from "./env";
import { log } from "./logger";
import { startPoller } from "./worker/poller";

function main() {
  const env = getEnv();
  log("info", "Provisioner worker started", {
    region: env.TENCENT_REGION,
    intervalMs: env.POLL_INTERVAL_MS,
    batchSize: env.WORKER_BATCH_SIZE
  });

  const stop = startPoller();

  const shutdown = () => {
    log("info", "Shutting down provisioner worker");
    stop();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main();


```

### `apps/provisioner/src/logger.ts`
```ts
type LogLevel = "info" | "warn" | "error";

export function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(context ? { context } : {})
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}


```

### `apps/provisioner/src/providers/bootstrap-script.ts`
```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export function buildBootstrapScript(template: "vps-base" | "rpc-placeholder", options?: { sshPublicKey?: string }) {
  const basePath = path.resolve(currentDir, "../templates/vps-base.sh");
  const rpcPath = path.resolve(currentDir, "../templates/rpc-placeholder.sh");

  const base = readFileSync(basePath, "utf-8");
  const rpc = readFileSync(rpcPath, "utf-8");

  const lines = [base];

  if (options?.sshPublicKey) {
    lines.push(
      `mkdir -p /home/web3ho/.ssh`,
      `echo '${options.sshPublicKey.replace(/'/g, "'\\''")}' > /home/web3ho/.ssh/authorized_keys`,
      "chown -R web3ho:web3ho /home/web3ho/.ssh",
      "chmod 700 /home/web3ho/.ssh",
      "chmod 600 /home/web3ho/.ssh/authorized_keys"
    );
  }

  if (template === "rpc-placeholder") {
    lines.push(rpc);
  }

  return `${lines.join("\n\n")}\n`;
}


```

### `apps/provisioner/src/providers/lighthouse.ts`
```ts
import { getEnv } from "../env";
import type { ProvisionJob } from "../supabase";
import { tencentJsonRequest } from "./tencent-auth";
import type { ProvisionProvider, ProvisionResult } from "./types";

type CreateInstancesResponse = {
  Response: {
    InstanceIdSet?: string[];
    RequestId: string;
  };
};

type DescribeInstancesResponse = {
  Response: {
    InstanceSet?: Array<{
      InstanceId: string;
      PublicAddresses?: string[];
    }>;
  };
};

type CreateCommandResponse = {
  Response: {
    CommandId: string;
  };
};

export class LighthouseProvisionProvider implements ProvisionProvider {
  private readonly env = getEnv();

  async createInstance(job: ProvisionJob): Promise<ProvisionResult> {
    const createResponse = await tencentJsonRequest<CreateInstancesResponse>({
      service: "lighthouse",
      endpoint: "lighthouse.tencentcloudapi.com",
      action: "CreateInstances",
      version: "2020-03-24",
      region: job.region,
      payload: {
        BundleId: this.env.LIGHTHOUSE_BUNDLE_ID,
        BlueprintId: this.env.LIGHTHOUSE_BLUEPRINT_ID,
        InstanceChargeType: "POSTPAID_BY_HOUR",
        InstanceCount: 1,
        Zone: this.env.LIGHTHOUSE_ZONE,
        InstanceName: `web3ho-${job.id.slice(0, 8)}`
      }
    });

    const instanceId = createResponse.Response.InstanceIdSet?.[0];
    if (!instanceId) {
      throw new Error(`CreateInstances returned no instance ID for job ${job.id}`);
    }

    // Best effort immediate lookup. IP may not be ready in early lifecycle.
    const describeResponse = await tencentJsonRequest<DescribeInstancesResponse>({
      service: "lighthouse",
      endpoint: "lighthouse.tencentcloudapi.com",
      action: "DescribeInstances",
      version: "2020-03-24",
      region: job.region,
      payload: {
        InstanceIds: [instanceId]
      }
    });

    const instance = describeResponse.Response.InstanceSet?.find((item) => item.InstanceId === instanceId);

    return {
      instanceId,
      publicIp: instance?.PublicAddresses?.[0] ?? null,
      metadata: {
        requestId: createResponse.Response.RequestId
      }
    };
  }

  async bootstrapInstance(job: ProvisionJob, instanceId: string, script: string): Promise<void> {
    const contentBase64 = Buffer.from(script, "utf-8").toString("base64");

    const commandResponse = await tencentJsonRequest<CreateCommandResponse>({
      service: "tat",
      endpoint: "tat.tencentcloudapi.com",
      action: "CreateCommand",
      version: "2020-10-28",
      region: job.region,
      payload: {
        CommandName: `web3ho-bootstrap-${job.id.slice(0, 8)}`,
        CommandType: "SHELL",
        Content: contentBase64,
        Description: "Web3 Home Office bootstrap command"
      }
    });

    const commandId = commandResponse.Response.CommandId;

    await tencentJsonRequest({
      service: "tat",
      endpoint: "tat.tencentcloudapi.com",
      action: "InvokeCommand",
      version: "2020-10-28",
      region: job.region,
      payload: {
        CommandId: commandId,
        InstanceIds: [instanceId],
        Parameters: []
      }
    });
  }
}


```

### `apps/provisioner/src/providers/tencent-auth.ts`
```ts
import { createHash, createHmac } from "node:crypto";

import { getEnv } from "../env";

type TencentRequestInput = {
  service: string;
  endpoint: string;
  action: string;
  version: string;
  region?: string;
  payload: Record<string, unknown>;
};

function sha256Hex(input: string | Buffer) {
  return createHash("sha256").update(input).digest("hex");
}

function hmacSha256(key: Buffer | string, input: string, encoding?: "hex") {
  const digest = createHmac("sha256", key).update(input).digest();
  return encoding === "hex" ? digest.toString("hex") : digest;
}

export async function tencentJsonRequest<T>(input: TencentRequestInput): Promise<T> {
  const env = getEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const payload = JSON.stringify(input.payload);

  const canonicalHeaders =
    `content-type:application/json; charset=utf-8\n` +
    `host:${input.endpoint}\n` +
    `x-tc-action:${input.action.toLowerCase()}\n`;

  const signedHeaders = "content-type;host;x-tc-action";
  const canonicalRequest =
    `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${sha256Hex(payload)}`;

  const credentialScope = `${date}/${input.service}/tc3_request`;
  const stringToSign =
    `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${sha256Hex(canonicalRequest)}`;

  const secretDate = hmacSha256(`TC3${env.TENCENT_SECRET_KEY}`, date) as Buffer;
  const secretService = hmacSha256(secretDate, input.service) as Buffer;
  const secretSigning = hmacSha256(secretService, "tc3_request") as Buffer;
  const signature = hmacSha256(secretSigning, stringToSign, "hex") as string;

  const authorization =
    `TC3-HMAC-SHA256 ` +
    `Credential=${env.TENCENT_SECRET_ID}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;

  const response = await fetch(`https://${input.endpoint}`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json; charset=utf-8",
      Host: input.endpoint,
      "X-TC-Action": input.action,
      "X-TC-Version": input.version,
      "X-TC-Region": input.region ?? env.TENCENT_REGION,
      "X-TC-Timestamp": String(timestamp)
    },
    body: payload
  });

  const body = (await response.json()) as Record<string, any>;
  const maybeError = body?.Response?.Error;

  if (!response.ok || maybeError) {
    const errorPayload = JSON.stringify(body);
    throw new Error(`Tencent API ${input.action} failed: ${response.status} ${errorPayload}`);
  }

  return body as T;
}


```

### `apps/provisioner/src/providers/types.ts`
```ts
import type { ProvisionJob } from "../supabase";

export type ProvisionResult = {
  instanceId: string;
  publicIp: string | null;
  metadata?: Record<string, unknown>;
};

export interface ProvisionProvider {
  createInstance(job: ProvisionJob): Promise<ProvisionResult>;
  bootstrapInstance(job: ProvisionJob, instanceId: string, script: string): Promise<void>;
}


```

### `apps/provisioner/src/supabase.ts`
```ts
import { createClient } from "@supabase/supabase-js";

import type { PlanId, ProvisionJobStatus } from "@web3homeoffice/shared";

import { getEnv } from "./env";

export type ProvisionJob = {
  id: string;
  user_id: string;
  plan_id: PlanId;
  template: "vps-base" | "rpc-placeholder";
  status: ProvisionJobStatus;
  region: string;
  instance_id: string | null;
  ip: string | null;
  logs: unknown;
  created_at: string;
  updated_at: string;
};

const env = getEnv();

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export async function dequeueProvisionJobs(batchSize: number) {
  const { data, error } = await supabaseAdmin.rpc("dequeue_provision_jobs", {
    batch_size: batchSize
  });

  if (error) throw new Error(`Failed to dequeue jobs: ${error.message}`);

  return (data ?? []) as ProvisionJob[];
}

export async function appendJobLog(jobId: string, level: "info" | "warn" | "error", message: string, context?: unknown) {
  const { error } = await supabaseAdmin.rpc("append_provision_job_log", {
    job_id: jobId,
    log_line: {
      ts: new Date().toISOString(),
      level,
      message,
      context: context ?? null
    }
  });

  if (error) throw new Error(`Failed to append job log: ${error.message}`);
}

export async function updateProvisionJob(jobId: string, patch: Partial<Pick<ProvisionJob, "status" | "instance_id" | "ip">>) {
  const { error } = await supabaseAdmin.from("provision_jobs").update(patch).eq("id", jobId);

  if (error) throw new Error(`Failed to update job ${jobId}: ${error.message}`);
}


```

### `apps/provisioner/src/templates/rpc-placeholder.sh`
```bash
#!/usr/bin/env bash
set -euxo pipefail

# Non-operational placeholder for an RPC-like service scaffold.

mkdir -p /opt/web3ho/rpc
cat <<'EOF' >/opt/web3ho/rpc/docker-compose.yml
services:
  rpc-placeholder:
    image: ghcr.io/nginxinc/nginx-unprivileged:stable-alpine
    ports:
      - "8545:8080"
    command: ["nginx", "-g", "daemon off;"]
EOF

cat <<'EOF' >/opt/web3ho/rpc/README.txt
This is a placeholder workload only.
Replace with your own legal and compliant node/client stack.
EOF

docker compose -f /opt/web3ho/rpc/docker-compose.yml up -d


```

### `apps/provisioner/src/templates/vps-base.sh`
```bash
#!/usr/bin/env bash
set -euxo pipefail

# Base VPS hardening + Docker bootstrap for Web3 Home Office.

if ! id -u web3ho >/dev/null 2>&1; then
  useradd -m -s /bin/bash web3ho
fi

apt-get update
apt-get install -y --no-install-recommends ca-certificates curl ufw fail2ban

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y --no-install-recommends docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

usermod -aG docker web3ho

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw --force enable

sed -i 's/^#*PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh || systemctl restart sshd

systemctl enable docker
systemctl start docker
systemctl enable fail2ban
systemctl restart fail2ban


```

### `apps/provisioner/src/worker/dequeue.ts`
```ts
import { dequeueProvisionJobs } from "../supabase";

export async function dequeue(batchSize: number) {
  return dequeueProvisionJobs(batchSize);
}


```

### `apps/provisioner/src/worker/poller.ts`
```ts
import { getEnv } from "../env";
import { log } from "../logger";
import { LighthouseProvisionProvider } from "../providers/lighthouse";
import { dequeue } from "./dequeue";
import { processJob } from "./processor";

let timer: NodeJS.Timeout | null = null;

export function startPoller() {
  const env = getEnv();
  const provider = new LighthouseProvisionProvider();

  const tick = async () => {
    try {
      const jobs = await dequeue(env.WORKER_BATCH_SIZE);

      if (!jobs.length) {
        log("info", "No pending jobs in queue");
        return;
      }

      log("info", "Dequeued jobs", { count: jobs.length });

      for (const job of jobs) {
        try {
          await processJob(provider, job);
          log("info", "Job completed", { jobId: job.id });
        } catch (error) {
          log("error", "Job failed", {
            jobId: job.id,
            message: error instanceof Error ? error.message : "unknown"
          });
        }
      }
    } catch (error) {
      log("error", "Poller tick failed", {
        message: error instanceof Error ? error.message : "unknown"
      });
    }
  };

  void tick();
  timer = setInterval(() => void tick(), env.POLL_INTERVAL_MS);

  return () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}


```

### `apps/provisioner/src/worker/processor.ts`
```ts
import { buildBootstrapScript } from "../providers/bootstrap-script";
import type { ProvisionProvider } from "../providers/types";
import type { ProvisionJob } from "../supabase";
import { appendJobLog, updateProvisionJob } from "../supabase";

export async function processJob(provider: ProvisionProvider, job: ProvisionJob) {
  await appendJobLog(job.id, "info", "Starting provisioning workflow", {
    plan: job.plan_id,
    template: job.template,
    region: job.region
  });

  try {
    const provisioned = await provider.createInstance(job);

    await appendJobLog(job.id, "info", "Instance created", {
      instanceId: provisioned.instanceId,
      publicIp: provisioned.publicIp
    });

    const script = buildBootstrapScript(job.template);
    await provider.bootstrapInstance(job, provisioned.instanceId, script);

    await appendJobLog(job.id, "info", "Bootstrap command submitted");

    await updateProvisionJob(job.id, {
      status: "provisioned",
      instance_id: provisioned.instanceId,
      ip: provisioned.publicIp
    });
  } catch (error) {
    await appendJobLog(job.id, "error", "Provision workflow failed", {
      message: error instanceof Error ? error.message : "unknown error"
    });

    await updateProvisionJob(job.id, {
      status: "failed"
    });

    throw error;
  }
}


```

### `apps/provisioner/tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"],
    "noUncheckedIndexedAccess": false,
    "noEmit": false
  },
  "include": ["src/**/*.ts"]
}


```

### `apps/web/components.json`
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib"
  }
}


```

### `apps/web/middleware.ts`
```ts
import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-web3ho-path", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};


```

### `apps/web/next.config.ts`
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@web3homeoffice/shared"],
  experimental: {
    reactCompiler: false
  }
};

export default nextConfig;


```

### `apps/web/next-env.d.ts`
```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference path="./.next/types/routes.d.ts" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
```

### `apps/web/package.json`
```json
{
  "name": "@web3homeoffice/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "test:smoke": "vitest run src/tests/smoke.test.ts"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@react-three/drei": "^10.7.6",
    "@react-three/fiber": "^9.4.0",
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.57.4",
    "@web3homeoffice/shared": "workspace:*",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.543.0",
    "next": "^15.5.3",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "three": "^0.179.1",
    "tailwind-merge": "^3.3.1",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.13",
    "@types/node": "^24.3.1",
    "@types/react": "^19.1.12",
    "@types/react-dom": "^19.1.9",
    "@types/three": "^0.179.0",
    "jsdom": "^26.1.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.13",
    "typescript": "^5.8.3",
    "vitest": "^3.2.4"
  }
}


```

### `apps/web/postcss.config.mjs`
```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {}
  }
};


```

### `apps/web/src/app/(marketing)/page.tsx`
```tsx
import Link from "next/link";
import { ArrowRight, Boxes, Cloud, CreditCard, Server, Shield } from "lucide-react";

import { AuthCard } from "@/components/layout/auth-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  {
    icon: Boxes,
    title: "3D Office Hub",
    description: "Explore your infrastructure in an interactive cyberpunk control room."
  },
  {
    icon: CreditCard,
    title: "Creem Billing",
    description: "Monthly and yearly subscriptions with webhook-backed access control."
  },
  {
    icon: Cloud,
    title: "Tencent Provisioning",
    description: "Queue jobs in Supabase, then provision VPS via worker safely outside Vercel."
  },
  {
    icon: Shield,
    title: "Supabase + RLS",
    description: "Email OTP authentication and policy-protected data model."
  }
];

export default function LandingPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(32,212,255,0.2),transparent_45%),radial-gradient(circle_at_85%_15%,rgba(255,57,184,0.22),transparent_35%)]" />
          <CardHeader className="relative space-y-3">
            <CardTitle className="text-4xl leading-tight">Web3 Home Office SaaS</CardTitle>
            <CardDescription className="max-w-2xl text-base">
              Launch, track, and monetize blockchain infra from one Next.js app: 3D hub, subscription billing,
              Supabase auth, and Tencent Cloud provisioning.
            </CardDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild>
                <Link href="/app">
                  Enter 3D Hub
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/dashboard">
                  <Server className="mr-2 h-4 w-4" />
                  Open Dashboard
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/billing">Manage Billing</Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
        <AuthCard />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="h-5 w-5 text-accent" />
                  {item.title}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          );
        })}
      </section>
    </div>
  );
}


```

### `apps/web/src/app/admin/page.tsx`
```tsx
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { listProvisionJobsAdmin } from "@/lib/provisioning/jobs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import type { SubscriptionRow } from "@/types/db";

export default async function AdminPage() {
  let user;

  try {
    user = await requireUser();
  } catch {
    redirect("/");
  }

  try {
    await requireAdmin(user.id);
  } catch {
    redirect("/dashboard");
  }

  const admin = createSupabaseAdminClient();
  const [usersResult, subscriptionsResult, jobs] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 50 }),
    admin
      .from("subscriptions")
      .select("user_id,status,plan_id,interval,current_period_end,updated_at")
      .order("updated_at", { ascending: false })
      .limit(50)
      .returns<SubscriptionRow[]>(),
    listProvisionJobsAdmin(50)
  ]);

  if (usersResult.error) throw new Error(usersResult.error.message);
  if (subscriptionsResult.error) throw new Error(subscriptionsResult.error.message);

  const subscriptions = subscriptionsResult.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin"
        description="Users, subscriptions, and provisioning jobs."
        statusLabel="protected"
      />

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Supabase auth users (latest 50).</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.1em] text-muted">
              <tr>
                <th className="pb-2">User ID</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {usersResult.data.users.map((item) => (
                <tr key={item.id} className="border-t border-border/40 text-muted">
                  <td className="py-2 font-mono text-xs text-text">{item.id}</td>
                  <td className="py-2">{item.email ?? "-"}</td>
                  <td className="py-2">{formatDate(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>Webhook-synced subscription state.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.1em] text-muted">
              <tr>
                <th className="pb-2">User ID</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Plan</th>
                <th className="pb-2">Interval</th>
                <th className="pb-2">Period End</th>
                <th className="pb-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={`${sub.user_id}-${sub.updated_at}`} className="border-t border-border/40 text-muted">
                  <td className="py-2 font-mono text-xs text-text">{sub.user_id}</td>
                  <td className="py-2">{sub.status}</td>
                  <td className="py-2">{sub.plan_id ?? "-"}</td>
                  <td className="py-2">{sub.interval ?? "-"}</td>
                  <td className="py-2">{formatDate(sub.current_period_end)}</td>
                  <td className="py-2">{formatDate(sub.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provisioning Jobs</CardTitle>
          <CardDescription>Queue and provider outcomes.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.1em] text-muted">
              <tr>
                <th className="pb-2">Job ID</th>
                <th className="pb-2">User</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Region</th>
                <th className="pb-2">Instance</th>
                <th className="pb-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-border/40 text-muted">
                  <td className="py-2 font-mono text-xs text-text">{job.id}</td>
                  <td className="py-2 font-mono text-xs">{job.user_id}</td>
                  <td className="py-2">{job.status}</td>
                  <td className="py-2">{job.region}</td>
                  <td className="py-2">{job.instance_id ?? "-"}</td>
                  <td className="py-2">{formatDate(job.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}


```

### `apps/web/src/app/api/admin/provision-jobs/route.ts`
```ts
import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { requireAdmin } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { listProvisionJobsAdmin } from "@/lib/provisioning/jobs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    await requireAdmin(user.id);

    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "100");
    const jobs = await listProvisionJobsAdmin(limit);

    return ok({ jobs });
  } catch (error) {
    return fail(error);
  }
}


```

### `apps/web/src/app/api/admin/subscriptions/route.ts`
```ts
import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { requireAdmin } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    await requireAdmin(user.id);

    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "100");
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from("subscriptions")
      .select("user_id,creem_customer_id,creem_subscription_id,status,current_period_end,plan_id,interval,updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return ok({ subscriptions: data });
  } catch (error) {
    return fail(error);
  }
}


```

### `apps/web/src/app/api/admin/users/route.ts`
```ts
import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { requireAdmin } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    await requireAdmin(user.id);

    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get("page") ?? "1");
    const perPage = Number(searchParams.get("perPage") ?? "50");

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    return ok({ users: data.users });
  } catch (error) {
    return fail(error);
  }
}


```

### `apps/web/src/app/api/billing/checkout/route.ts`
```ts
import { NextRequest } from "next/server";

import { checkoutPayloadSchema } from "@web3homeoffice/shared";

import { requireUser } from "@/lib/auth/session";
import { createCreemCheckoutSession } from "@/lib/billing/creem-client";
import { getPlanById, planPriceId } from "@/lib/billing/subscription-service";
import { fail, ok } from "@/lib/api/responses";
import { absoluteUrl } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const payload = checkoutPayloadSchema.parse(await request.json());
    const plan = await getPlanById(payload.planId);
    const priceId = planPriceId(plan, payload.interval);

    if (!user.email) {
      throw new Error("Authenticated user must have an email");
    }

    const successUrl = absoluteUrl(payload.successPath ?? "/billing/success");
    const cancelUrl = absoluteUrl(payload.cancelPath ?? "/billing");

    const checkout = await createCreemCheckoutSession({
      priceId,
      customerEmail: user.email,
      successUrl,
      cancelUrl,
      metadata: {
        user_id: user.id,
        plan_id: payload.planId,
        interval: payload.interval
      }
    });

    return ok({ checkoutUrl: checkout.url });
  } catch (error) {
    return fail(error);
  }
}


```

### `apps/web/src/app/api/billing/portal/route.ts`
```ts
import { fail, ok } from "@/lib/api/responses";
import { requireUser } from "@/lib/auth/session";
import { getCreemPortalUrl } from "@/lib/billing/creem-client";
import { getUserSubscription } from "@/lib/auth/guards";

export async function POST() {
  try {
    const user = await requireUser();
    const subscription = await getUserSubscription(user.id);

    if (!subscription?.creem_customer_id) {
      return ok({ url: null, fallback: "support" as const });
    }

    const url = await getCreemPortalUrl(subscription.creem_customer_id);
    if (!url) {
      return ok({ url: null, fallback: "support" as const });
    }

    return ok({ url, fallback: null });
  } catch (error) {
    return fail(error);
  }
}


```

### `apps/web/src/app/api/billing/webhook/route.ts`
```ts
import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getServerEnv } from "@/lib/env";
import { assertCreemWebhookSignature } from "@/lib/billing/creem-signature";
import {
  normalizeCreemEvent,
  recordWebhookEvent,
  syncSubscriptionFromEvent
} from "@/lib/billing/subscription-service";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const env = getServerEnv();
    const signature = request.headers.get(env.CREEM_WEBHOOK_SIGNATURE_HEADER);

    assertCreemWebhookSignature(rawBody, signature);

    const payload = JSON.parse(rawBody) as unknown;
    const event = normalizeCreemEvent(payload);

    const shouldProcess = await recordWebhookEvent(event);
    if (!shouldProcess) {
      return ok({ received: true, duplicate: true });
    }

    await syncSubscriptionFromEvent(event);

    return ok({ received: true });
  } catch (error) {
    return fail(error);
  }
}


```

### `apps/web/src/app/api/platform/base/manifest/route.ts`
```ts
import { ok } from "@/lib/api/responses";
import { absoluteUrl } from "@/lib/utils";

export function GET() {
  return ok({
    name: "Web3 Home Office",
    description: "Manage subscriptions and provision Tencent Cloud VPS in one mini app-ready hub.",
    iconUrl: absoluteUrl("/icon.png"),
    url: absoluteUrl("/app"),
    supportedChains: ["base"]
  });
}


```

### `apps/web/src/app/api/platform/farcaster/manifest/route.ts`
```ts
import { ok } from "@/lib/api/responses";
import { getFarcasterManifest } from "@/lib/platforms/farcaster";

export function GET() {
  return ok(getFarcasterManifest());
}


```

### `apps/web/src/app/api/platform/telegram/verify/route.ts`
```ts
import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";
import { getServerEnv } from "@/lib/env";
import { requireUser } from "@/lib/auth/session";
import { verifyTelegramInitData } from "@/lib/platforms/telegram-verify";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  initData: z.string().min(10)
});

export async function POST(request: NextRequest) {
  try {
    const env = getServerEnv();
    if (!env.TELEGRAM_BOT_TOKEN) {
      throw new AppError("TELEGRAM_BOT_TOKEN is not configured", 500, "TELEGRAM_NOT_CONFIGURED");
    }

    const user = await requireUser();
    const payload = bodySchema.parse(await request.json());
    const verified = verifyTelegramInitData(payload.initData, env.TELEGRAM_BOT_TOKEN);

    const admin = createSupabaseAdminClient();
    const { error } = await (admin.from("platform_accounts") as any).upsert(
      {
        user_id: user.id,
        platform: "telegram",
        platform_user_id: String(verified.user.id),
        username: verified.user.username ?? null,
        metadata: {
          auth_date: verified.authDate ?? null,
          first_name: verified.user.first_name ?? null,
          last_name: verified.user.last_name ?? null
        }
      },
      { onConflict: "platform,platform_user_id" }
    );

    if (error) throw error;

    return ok({ linked: true });
  } catch (error) {
    return fail(error);
  }
}


```

### `apps/web/src/app/api/provision/jobs/route.ts`
```ts
import { fail, ok } from "@/lib/api/responses";
import { requireUser } from "@/lib/auth/session";
import { listProvisionJobsForUser } from "@/lib/provisioning/jobs";

export async function GET() {
  try {
    const user = await requireUser();
    const jobs = await listProvisionJobsForUser(user.id);
    return ok({ jobs });
  } catch (error) {
    return fail(error);
  }
}


```

### `apps/web/src/app/api/provision/request/route.ts`
```ts
import { NextRequest } from "next/server";

import { createProvisionJobSchema } from "@web3homeoffice/shared";

import { AppError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/responses";
import { requireActiveSubscriptionForApi } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { createProvisionJob } from "@/lib/provisioning/jobs";
import { ensureProvisionWithinLimit } from "@/lib/provisioning/limits";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const subscription = await requireActiveSubscriptionForApi(user.id);

    if (!subscription.plan_id) {
      throw new AppError("Active subscription is missing a plan assignment", 409, "SUBSCRIPTION_PLAN_MISSING");
    }

    const payload = createProvisionJobSchema.parse(await request.json());
    const limits = await ensureProvisionWithinLimit(user.id, subscription.plan_id);

    if (!limits.regions.includes(payload.region)) {
      throw new AppError(`Region '${payload.region}' is not allowed for your plan`, 400, "REGION_NOT_ALLOWED");
    }

    const job = await createProvisionJob({
      userId: user.id,
      planId: subscription.plan_id,
      template: payload.planTemplate,
      region: payload.region,
      logs: [
        {
          ts: new Date().toISOString(),
          level: "info",
          message: "Provision job created",
          template: payload.planTemplate,
          region: payload.region,
          hasSshKey: Boolean(payload.sshPublicKey)
        }
      ]
    });

    return ok({
      jobId: job.id,
      status: job.status
    });
  } catch (error) {
    return fail(error);
  }
}


```

### `apps/web/src/app/app/page.tsx`
```tsx
import { redirect } from "next/navigation";

import { OfficeHubClient } from "@/components/hub/OfficeHubClient";
import { ensureProfileForUser } from "@/lib/auth/admin-bootstrap";
import { requireActiveSubscription } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { listProvisionJobsForUser } from "@/lib/provisioning/jobs";

export default async function AppPage() {
  let user;

  try {
    user = await requireUser();
  } catch {
    redirect("/");
  }

  await ensureProfileForUser(user);
  const subscription = await requireActiveSubscription(user.id);
  const jobs = await listProvisionJobsForUser(user.id);

  return (
    <OfficeHubClient
      userEmail={user.email ?? "anonymous"}
      subscriptionStatus={subscription.status}
      jobs={jobs.map((job) => ({ id: job.id, status: job.status, logs: job.logs }))}
    />
  );
}


```

### `apps/web/src/app/billing/page.tsx`
```tsx
import { redirect } from "next/navigation";

import { BillingPanel } from "@/components/layout/billing-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureProfileForUser } from "@/lib/auth/admin-bootstrap";
import { getUserSubscription } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PlanRow } from "@/types/db";

function parseLimits(limits: unknown) {
  const source = limits as { instances?: unknown; regions?: unknown };
  return {
    instances: Number(source.instances ?? 1),
    regions: Array.isArray(source.regions) ? source.regions.map(String) : ["ap-singapore"]
  };
}

export default async function BillingPage() {
  let user;

  try {
    user = await requireUser();
  } catch {
    redirect("/");
  }

  await ensureProfileForUser(user);
  const subscription = await getUserSubscription(user.id);

  const admin = createSupabaseAdminClient();
  const { data: plans, error } = await admin
    .from("plans")
    .select("plan_id,name,creem_product_id,monthly_price_id,yearly_price_id,limits,active,created_at,updated_at")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .returns<PlanRow[]>();

  if (error || !plans) {
    throw new Error(error?.message ?? "Failed to load plans");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Pick a monthly/yearly plan, start checkout, and manage subscription."
        statusLabel={subscription?.status ?? "inactive"}
      />

      <BillingPanel
        plans={plans.map((plan) => ({
          planId: plan.plan_id,
          name: plan.name,
          monthlyPriceId: plan.monthly_price_id,
          yearlyPriceId: plan.yearly_price_id,
          limits: parseLimits(plan.limits)
        }))}
        activePlanId={subscription?.plan_id ?? null}
        activeInterval={subscription?.interval ?? null}
        subscriptionStatus={subscription?.status ?? null}
      />

      <Card>
        <CardHeader>
          <CardTitle>Cancellation flow</CardTitle>
          <CardDescription>
            If the customer portal is unavailable, the app shows support escalation and keeps access status visible.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          <p>
            Access is revoked by webhook events (`canceled` or `expired`) and reflected immediately in route guards.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


```

### `apps/web/src/app/billing/success/page.tsx`
```tsx
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillingSuccessPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Checkout received</CardTitle>
          <CardDescription>
            We are waiting for the latest webhook sync. Refresh in a few seconds if status has not updated yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/billing">Back to billing</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


```

### `apps/web/src/app/dashboard/page.tsx`
```tsx
import { redirect } from "next/navigation";

import { DEFAULT_REGION } from "@web3homeoffice/shared";

import { PageHeader } from "@/components/layout/page-header";
import { ProvisionRequestForm } from "@/components/layout/provision-request-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureProfileForUser } from "@/lib/auth/admin-bootstrap";
import { requireActiveSubscription } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/session";
import { listProvisionJobsForUser } from "@/lib/provisioning/jobs";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  let user;

  try {
    user = await requireUser();
  } catch {
    redirect("/");
  }

  await ensureProfileForUser(user);
  const subscription = await requireActiveSubscription(user.id);
  const jobs = await listProvisionJobsForUser(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Subscription status, provisioned instances, and job logs."
        statusLabel={subscription.status}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Plan and billing interval synced from Creem webhooks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted">
            <p>
              Plan: <span className="font-medium text-text">{subscription.plan_id ?? "unknown"}</span>
            </p>
            <p>
              Interval: <span className="font-medium text-text">{subscription.interval ?? "-"}</span>
            </p>
            <p>
              Current period end:{" "}
              <span className="font-medium text-text">{formatDate(subscription.current_period_end)}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access</CardTitle>
            <CardDescription>Feature gate is subscription-driven.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Badge variant="success">Active</Badge>
            <p className="text-muted">Provisioning APIs and 3D hub are enabled for active subscribers only.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Region</CardTitle>
            <CardDescription>Used when a provisioning request has no region override.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted">
            <p>
              Region: <span className="font-medium text-text">{DEFAULT_REGION}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <ProvisionRequestForm defaultRegion={DEFAULT_REGION} />

      <Card>
        <CardHeader>
          <CardTitle>Provisioning Jobs</CardTitle>
          <CardDescription>Queue state from Supabase.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.1em] text-muted">
              <tr>
                <th className="pb-2">Job ID</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Region</th>
                <th className="pb-2">Instance</th>
                <th className="pb-2">IP</th>
                <th className="pb-2">Updated</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-border/40">
                  <td className="py-2 font-mono text-xs text-text">{job.id}</td>
                  <td className="py-2">{job.status}</td>
                  <td className="py-2">{job.region}</td>
                  <td className="py-2">{job.instance_id ?? "-"}</td>
                  <td className="py-2">{job.ip ?? "-"}</td>
                  <td className="py-2">{formatDate(job.updated_at)}</td>
                </tr>
              ))}
              {!jobs.length ? (
                <tr>
                  <td className="py-4 text-muted" colSpan={6}>
                    No jobs yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}


```

### `apps/web/src/app/globals.css`
```css
@import "tailwindcss";

:root {
  --radius-lg: 0.95rem;
  --color-bg: #020617;
  --color-panel: rgba(2, 23, 38, 0.68);
  --color-border: rgba(127, 159, 190, 0.35);
  --color-glow: #20d4ff;
  --color-accent: #20d4ff;
  --color-accent-2: #ff39b8;
  --color-text: #e2e8f0;
  --color-muted: #9aa9bc;
}

@theme inline {
  --font-body: var(--font-body);
  --font-display: var(--font-display);
}

body {
  background:
    radial-gradient(circle at 20% 0%, rgba(0, 194, 255, 0.12), transparent 40%),
    radial-gradient(circle at 90% 15%, rgba(255, 57, 184, 0.1), transparent 35%),
    linear-gradient(170deg, #020617 0%, #020b1e 45%, #020617 100%);
  min-height: 100vh;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: var(--font-display), sans-serif;
  letter-spacing: 0.02em;
}

.font-body {
  font-family: var(--font-body), sans-serif;
}

.glass {
  backdrop-filter: blur(12px);
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.42));
  border: 1px solid var(--color-border);
}

.safe-area {
  padding-top: max(1rem, env(safe-area-inset-top));
  padding-right: max(1rem, env(safe-area-inset-right));
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
  padding-left: max(1rem, env(safe-area-inset-left));
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}


```

### `apps/web/src/app/layout.tsx`
```tsx
import type { Metadata } from "next";
import { Orbitron, Rajdhani } from "next/font/google";

import { MarketingHeader } from "@/components/layout/marketing-header";
import { Providers } from "@/components/layout/providers";

import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-display"
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Web3 Home Office",
  description: "Cyberpunk SaaS hub for billing, provisioning, and web3 infra management."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${orbitron.variable} ${rajdhani.variable} bg-bg font-body text-text antialiased`}>
        <Providers>
          <MarketingHeader />
          <main className="mx-auto w-full max-w-7xl px-4 pb-8 pt-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
}


```

### `apps/web/src/app/platforms/page.tsx`
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlatformsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-text">Platform Adapters</h1>
        <p className="mt-1 text-sm text-muted">
          Test and deploy guidance for Telegram Mini Apps, Farcaster Mini Apps, and Base Mini Apps.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Telegram Mini App</CardTitle>
            <CardDescription>Verify `tgWebAppData` server-side and map users into `platform_accounts`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted">
            <p>1. Configure `TELEGRAM_BOT_TOKEN`.</p>
            <p>2. Launch with `tgWebAppData` query param.</p>
            <p>3. POST payload to `/api/platform/telegram/verify`.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Farcaster Mini App</CardTitle>
            <CardDescription>Expose metadata endpoint for mini app entry.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted">
            <p>Manifest endpoint: `/api/platform/farcaster/manifest`.</p>
            <p>Set valid app URLs and account association fields before publishing.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Base Mini App</CardTitle>
            <CardDescription>Use MiniKit provider wrapper with browser-safe fallback.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted">
            <p>Manifest endpoint: `/api/platform/base/manifest`.</p>
            <p>Safe-area handling is enabled by default for embedded mobile contexts.</p>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted">See repository README for environment setup and publishing checklist.</p>
    </div>
  );
}


```

### `apps/web/src/components/hub/CameraRig.tsx`
```tsx
"use client";

import { useFrame } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";

import { getPlayerPosition } from "@/components/hub/PlayerController";

const desiredPosition = new Vector3();

export function CameraRig() {
  useFrame(({ camera }, delta) => {
    const player = getPlayerPosition();
    desiredPosition.set(player.x, player.y + 1.6, player.z + 0.1);
    camera.position.lerp(desiredPosition, MathUtils.clamp(delta * 8, 0, 1));
  });

  return null;
}


```

### `apps/web/src/components/hub/HUDTopBar.tsx`
```tsx
"use client";

import type { ComponentType } from "react";
import { Bell, CreditCard, ShieldCheck, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type BadgeItem = {
  icon: ComponentType<{ className?: string }>;
  text: string;
};

type HUDTopBarProps = {
  email: string;
  badges: BadgeItem[];
  isTwoDMode: boolean;
  pointerLockEnabled: boolean;
  onToggleTwoDMode: () => void;
  onTogglePointerLock: () => void;
};

export function HUDTopBar({
  email,
  badges,
  isTwoDMode,
  pointerLockEnabled,
  onToggleTwoDMode,
  onTogglePointerLock
}: HUDTopBarProps) {
  return (
    <Card className="pointer-events-auto mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-accent" />
        <div>
          <p className="text-sm font-semibold">Mission Control</p>
          <p className="text-xs text-muted">{email}</p>
        </div>
      </div>

      <div className="hidden flex-wrap gap-2 md:flex">
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <span
              key={badge.text}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-black/20 px-2 py-1 text-xs text-muted"
            >
              <Icon className="h-3.5 w-3.5 text-accent" />
              {badge.text}
            </span>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onToggleTwoDMode}>
          {isTwoDMode ? "Switch 3D" : "Switch 2D"}
        </Button>
        <Button variant="secondary" size="sm" onClick={onTogglePointerLock}>
          {pointerLockEnabled ? "Pointer Lock On" : "Pointer Lock Off"}
        </Button>
        <Button variant="outline" size="sm">
          <Wallet className="mr-2 h-4 w-4" />
          Wallet
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Billing">
          <CreditCard className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}


```

### `apps/web/src/components/hub/InteractableTerminal.tsx`
```tsx
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

type InteractableTerminalProps = {
  roomId: string;
  marker: string;
  reducedMotion: boolean;
  onInteract: (roomId: string) => void;
  onTeleport: (roomId: string) => void;
};

export function InteractableTerminal({
  roomId,
  marker,
  reducedMotion,
  onInteract,
  onTeleport
}: InteractableTerminalProps) {
  const meshRef = useRef<Mesh>(null);
  const markerChars = useMemo(() => marker.split(""), [marker]);

  useFrame(({ clock }) => {
    if (!meshRef.current || reducedMotion) return;
    meshRef.current.position.y = 0.35 + Math.sin(clock.elapsedTime * 2.4) * 0.08;
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[0, 0.35, 2.6]}
        onClick={(event) => {
          event.stopPropagation();
          onInteract(roomId);
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onTeleport(roomId);
        }}
      >
        <boxGeometry args={[1.8, 0.6, 0.8]} />
        <meshStandardMaterial color="#032848" emissive="#1ad7ff" emissiveIntensity={0.7} />
      </mesh>

      {markerChars.map((char, index) => (
        <mesh key={`${roomId}-${char}-${index}`} position={[-0.35 + index * 0.35, 0.8, 2.95]}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshStandardMaterial color="#90f9ff" emissive="#7ee8ff" emissiveIntensity={0.7} />
        </mesh>
      ))}
    </group>
  );
}


```

### `apps/web/src/components/hub/MiniMap.tsx`
```tsx
"use client";

import { useEffect, useMemo, useState } from "react";

import { getPlayerPosition } from "@/components/hub/PlayerController";
import { Card } from "@/components/ui/card";

type RoomDef = {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  marker: string;
};

type MiniMapProps = {
  rooms: RoomDef[];
  selectedRoomId: string;
};

export function MiniMap({ rooms, selectedRoomId }: MiniMapProps) {
  const points = useMemo(
    () =>
      rooms.map((room) => ({
        id: room.id,
        marker: room.marker,
        x: room.position[0],
        z: room.position[2]
      })),
    [rooms]
  );

  const [player, setPlayer] = useState({ x: 0, z: 0 });

  useEffect(() => {
    const timer = window.setInterval(() => {
      const position = getPlayerPosition();
      setPlayer({ x: position.x, z: position.z });
    }, 120);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <Card className="w-56 p-3">
      <p className="mb-2 text-xs uppercase tracking-[0.15em] text-muted">Mini Map</p>
      <div className="relative h-40 rounded-md border border-border bg-black/20">
        {points.map((point) => (
          <div
            key={point.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-black/70 px-1.5 py-0.5 text-[10px]"
            style={{
              left: `${50 + point.x * 2}%`,
              top: `${50 + point.z * 2}%`,
              color: point.id === selectedRoomId ? "#20d4ff" : "#e2e8f0"
            }}
          >
            {point.marker}
          </div>
        ))}

        <div
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-neon"
          style={{
            left: `${50 + player.x * 2}%`,
            top: `${50 + player.z * 2}%`
          }}
        />
      </div>
    </Card>
  );
}


```

### `apps/web/src/components/hub/MobileDpad.tsx`
```tsx
"use client";

import { setMobileDirection } from "@/components/hub/PlayerController";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Dir = "forward" | "backward" | "left" | "right";

function bindDirection(direction: Dir) {
  return {
    onPointerDown: () => setMobileDirection(direction, true),
    onPointerUp: () => setMobileDirection(direction, false),
    onPointerCancel: () => setMobileDirection(direction, false),
    onPointerLeave: () => setMobileDirection(direction, false),
    onTouchEnd: () => setMobileDirection(direction, false)
  };
}

export function MobileDpad() {
  return (
    <Card className="grid grid-cols-3 gap-2 p-2">
      <span />
      <Button size="sm" variant="secondary" {...bindDirection("forward")}>?</Button>
      <span />
      <Button size="sm" variant="secondary" {...bindDirection("left")}>?</Button>
      <span />
      <Button size="sm" variant="secondary" {...bindDirection("right")}>?</Button>
      <span />
      <Button size="sm" variant="secondary" {...bindDirection("backward")}>?</Button>
      <span />
    </Card>
  );
}


```

### `apps/web/src/components/hub/OfficeHubClient.tsx`
```tsx
"use client";

import { useMemo, useState } from "react";
import { Bell, Compass, Gamepad2, Radar, ShieldCheck } from "lucide-react";

import { setTeleportTarget } from "@/components/hub/PlayerController";
import { HUDTopBar } from "@/components/hub/HUDTopBar";
import { MiniMap } from "@/components/hub/MiniMap";
import { MobileDpad } from "@/components/hub/MobileDpad";
import { QuickActionsDock } from "@/components/hub/QuickActionsDock";
import { RoomPanel } from "@/components/hub/RoomPanel";
import { SceneCanvas } from "@/components/hub/SceneCanvas";
import { SettingsPanel } from "@/components/hub/SettingsPanel";
import { TwoDModeFallback } from "@/components/hub/TwoDModeFallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { detectPlatformContext } from "@/lib/platforms/detect";
import type { GraphicsQuality } from "@/types/domain";

type RoomDef = {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  marker: string;
};

type ProvisionJobSummary = {
  id: string;
  status: string;
  logs: unknown;
};

type OfficeHubClientProps = {
  userEmail: string;
  subscriptionStatus: string;
  jobs: ProvisionJobSummary[];
};

const ROOMS: RoomDef[] = [
  {
    id: "command",
    name: "Command Nexus",
    description: "Global status, alerts, and infra overview.",
    position: [0, 0, 0],
    marker: "CN"
  },
  {
    id: "provision",
    name: "Provision Bay",
    description: "Launch and inspect Tencent Cloud instances.",
    position: [10, 0, 0],
    marker: "PB"
  },
  {
    id: "billing",
    name: "Billing Core",
    description: "Manage plan, invoices, and subscription lifecycle.",
    position: [-10, 0, 0],
    marker: "BC"
  },
  {
    id: "security",
    name: "Security Lab",
    description: "SSH keys, hardening profile, and audit timelines.",
    position: [0, 0, -10],
    marker: "SL"
  },
  {
    id: "telemetry",
    name: "Telemetry Deck",
    description: "Job logs and system traces by workload.",
    position: [0, 0, 10],
    marker: "TD"
  }
];

export function OfficeHubClient({ userEmail, subscriptionStatus, jobs }: OfficeHubClientProps) {
  const platform = useMemo(() => detectPlatformContext(), []);
  const [quality, setQuality] = useState<GraphicsQuality>(platform.shouldDefaultLowGraphics ? "low" : "medium");
  const [reducedMotion, setReducedMotion] = useState<boolean>(platform.shouldDefaultLowGraphics);
  const [isTwoDMode, setIsTwoDMode] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(ROOMS[0].id);
  const [roomPanelOpen, setRoomPanelOpen] = useState(false);
  const [pointerLockEnabled, setPointerLockEnabled] = useState(false);

  const roomById = useMemo(() => new Map(ROOMS.map((room) => [room.id, room])), []);

  const selectedRoom = roomById.get(selectedRoomId) ?? ROOMS[0];

  const teleportToRoom = (roomId: string) => {
    const room = roomById.get(roomId);
    if (!room) return;

    setSelectedRoomId(roomId);
    setTeleportTarget([room.position[0], room.position[1], room.position[2] + 3.4]);
  };

  const hudBadges = [
    { icon: ShieldCheck, text: `Subscription: ${subscriptionStatus}` },
    { icon: Bell, text: `Jobs: ${jobs.length}` },
    { icon: Compass, text: `Platform: ${platform.isTelegram ? "Telegram" : "Web"}` }
  ];

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden rounded-xl border border-border/50 bg-black/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(10,200,255,0.2),transparent_40%),radial-gradient(circle_at_90%_20%,rgba(255,57,184,0.2),transparent_35%),radial-gradient(circle_at_40%_90%,rgba(72,255,170,0.16),transparent_30%)]" />
      {isTwoDMode ? (
        <TwoDModeFallback
          rooms={ROOMS}
          selectedRoomId={selectedRoom.id}
          onRoomSelect={(roomId) => {
            teleportToRoom(roomId);
            setRoomPanelOpen(true);
          }}
        />
      ) : (
        <SceneCanvas
          rooms={ROOMS}
          quality={quality}
          reducedMotion={reducedMotion}
          pointerLockEnabled={pointerLockEnabled}
          onRoomInteract={(roomId) => {
            setSelectedRoomId(roomId);
            setRoomPanelOpen(true);
          }}
          onTeleport={teleportToRoom}
        />
      )}

      <div className="pointer-events-none absolute inset-0">
        <HUDTopBar
          email={userEmail}
          badges={hudBadges}
          isTwoDMode={isTwoDMode}
          onToggleTwoDMode={() => setIsTwoDMode((current) => !current)}
          pointerLockEnabled={pointerLockEnabled}
          onTogglePointerLock={() => setPointerLockEnabled((current) => !current)}
        />

        <div className="pointer-events-auto absolute bottom-4 left-4 hidden md:block">
          <MiniMap rooms={ROOMS} selectedRoomId={selectedRoom.id} />
        </div>

        <div className="pointer-events-auto absolute bottom-4 right-4 max-w-[min(620px,92vw)]">
          <QuickActionsDock
            rooms={ROOMS}
            onTeleport={(roomId) => {
              teleportToRoom(roomId);
            }}
            onOpenRoom={(roomId) => {
              setSelectedRoomId(roomId);
              setRoomPanelOpen(true);
            }}
          />
        </div>

        <div className="pointer-events-auto absolute right-4 top-20 w-[290px]">
          <SettingsPanel
            quality={quality}
            reducedMotion={reducedMotion}
            onQualityChange={setQuality}
            onReducedMotionChange={setReducedMotion}
          />
        </div>

        <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 -translate-x-1/2 md:hidden">
          <MobileDpad />
        </div>
      </div>

      <RoomPanel
        open={roomPanelOpen}
        onOpenChange={setRoomPanelOpen}
        room={selectedRoom}
        logs={jobs.map((job) => `#${job.id} ${job.status}`)}
      />

      <Card className="pointer-events-none absolute left-4 top-20 hidden p-3 md:block">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Gamepad2 className="h-4 w-4 text-accent" />
          WASD to move, click terminal to interact
        </div>
      </Card>

      <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 -translate-x-1/2 md:hidden">
        <Button variant="secondary" size="sm" onClick={() => setRoomPanelOpen(true)}>
          <Radar className="mr-2 h-4 w-4" />
          Open {selectedRoom.name}
        </Button>
      </div>

      <div className="absolute right-4 top-4 z-20">
        <Badge>{quality.toUpperCase()}</Badge>
      </div>
    </div>
  );
}


```

### `apps/web/src/components/hub/PlayerController.tsx`
```tsx
"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const movement = {
  forward: false,
  backward: false,
  left: false,
  right: false
};

const forwardVector = new THREE.Vector3();
const rightVector = new THREE.Vector3();
const moveVector = new THREE.Vector3();
const playerPosition = new THREE.Vector3(0, 0, 8);

export function getPlayerPosition() {
  return playerPosition;
}

export function setTeleportTarget(position: [number, number, number]) {
  playerPosition.set(position[0], position[1], position[2]);
}

export function setMobileDirection(direction: "forward" | "backward" | "left" | "right", active: boolean) {
  movement[direction] = active;
}

function onKeyDown(event: KeyboardEvent) {
  if (event.code === "KeyW") movement.forward = true;
  if (event.code === "KeyS") movement.backward = true;
  if (event.code === "KeyA") movement.left = true;
  if (event.code === "KeyD") movement.right = true;
}

function onKeyUp(event: KeyboardEvent) {
  if (event.code === "KeyW") movement.forward = false;
  if (event.code === "KeyS") movement.backward = false;
  if (event.code === "KeyA") movement.left = false;
  if (event.code === "KeyD") movement.right = false;
}

export function PlayerController() {
  const speedRef = useRef(6.2);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame(({ camera }, delta) => {
    const forward = Number(movement.forward) - Number(movement.backward);
    const right = Number(movement.right) - Number(movement.left);

    moveVector.set(0, 0, 0);

    if (forward !== 0 || right !== 0) {
      camera.getWorldDirection(forwardVector);
      forwardVector.y = 0;
      forwardVector.normalize();

      rightVector.crossVectors(forwardVector, camera.up).normalize();

      moveVector.addScaledVector(forwardVector, forward);
      moveVector.addScaledVector(rightVector, -right);

      if (moveVector.lengthSq() > 0.01) {
        moveVector.normalize().multiplyScalar(speedRef.current * delta);
        playerPosition.add(moveVector);
      }
    }

    playerPosition.x = THREE.MathUtils.clamp(playerPosition.x, -20, 20);
    playerPosition.z = THREE.MathUtils.clamp(playerPosition.z, -20, 20);
  });

  return null;
}


```

### `apps/web/src/components/hub/QuickActionsDock.tsx`
```tsx
"use client";

import { Compass, PanelRightOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type RoomDef = {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  marker: string;
};

type QuickActionsDockProps = {
  rooms: RoomDef[];
  onTeleport: (roomId: string) => void;
  onOpenRoom: (roomId: string) => void;
};

export function QuickActionsDock({ rooms, onTeleport, onOpenRoom }: QuickActionsDockProps) {
  return (
    <Card className="flex flex-wrap items-center gap-2 p-2">
      {rooms.map((room) => (
        <div key={room.id} className="flex items-center gap-1">
          <Button size="sm" variant="secondary" onClick={() => onTeleport(room.id)}>
            <Compass className="mr-1 h-3.5 w-3.5" />
            {room.marker}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onOpenRoom(room.id)}>
            <PanelRightOpen className="mr-1 h-3.5 w-3.5" />
            {room.name}
          </Button>
        </div>
      ))}
    </Card>
  );
}


```

### `apps/web/src/components/hub/RoomGrid.tsx`
```tsx
"use client";

import { InteractableTerminal } from "@/components/hub/InteractableTerminal";

type RoomDef = {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  marker: string;
};

type RoomGridProps = {
  rooms: RoomDef[];
  reducedMotion: boolean;
  onRoomInteract: (roomId: string) => void;
  onTeleport: (roomId: string) => void;
};

export function RoomGrid({ rooms, reducedMotion, onRoomInteract, onTeleport }: RoomGridProps) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#04142a" />
      </mesh>

      <gridHelper args={[70, 24, "#18ffff", "#07305b"]} />

      {rooms.map((room) => (
        <group key={room.id} position={room.position}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[6, 3, 6]} />
            <meshStandardMaterial color="#091a2f" emissive="#07223f" emissiveIntensity={0.35} />
          </mesh>

          <mesh position={[0, 1.7, 0]}>
            <boxGeometry args={[4.8, 0.15, 4.8]} />
            <meshStandardMaterial color="#0b2f54" emissive="#15b4ff" emissiveIntensity={0.4} />
          </mesh>

          <InteractableTerminal
            roomId={room.id}
            marker={room.marker}
            reducedMotion={reducedMotion}
            onInteract={onRoomInteract}
            onTeleport={onTeleport}
          />
        </group>
      ))}
    </group>
  );
}


```

### `apps/web/src/components/hub/RoomPanel.tsx`
```tsx
"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RoomDef = {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  marker: string;
};

type RoomPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: RoomDef;
  logs: string[];
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function RoomTabs({ room, logs }: { room: RoomDef; logs: string[] }) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="actions">Actions</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-2">
        <p className="text-sm text-muted">{room.description}</p>
        <p className="text-xs text-muted">Coordinates: [{room.position.join(", ")}]</p>
      </TabsContent>
      <TabsContent value="actions" className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href="/dashboard">Open dashboard</a>
          </Button>
          <Button variant="secondary" asChild>
            <a href="/billing">Manage subscription</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/dashboard#provision">Provision VPS</a>
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="logs" className="max-h-60 space-y-1 overflow-auto">
        {logs.length ? (
          logs.map((line, index) => (
            <p key={`${line}-${index}`} className="text-xs text-muted">
              {line}
            </p>
          ))
        ) : (
          <p className="text-xs text-muted">No logs yet.</p>
        )}
      </TabsContent>
    </Tabs>
  );
}

export function RoomPanel({ open, onOpenChange, room, logs }: RoomPanelProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[82vh] overflow-auto rounded-t-lg border-t">
          <SheetHeader>
            <SheetTitle>{room.name}</SheetTitle>
            <SheetDescription>Interactive room controls and status.</SheetDescription>
          </SheetHeader>
          <RoomTabs room={room} logs={logs} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{room.name}</DialogTitle>
          <DialogDescription>Interactive room controls and status.</DialogDescription>
        </DialogHeader>
        <RoomTabs room={room} logs={logs} />
      </DialogContent>
    </Dialog>
  );
}


```

### `apps/web/src/components/hub/SceneCanvas.tsx`
```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { PointerLockControls, Stars } from "@react-three/drei";

import { CameraRig } from "@/components/hub/CameraRig";
import { PlayerController } from "@/components/hub/PlayerController";
import { RoomGrid } from "@/components/hub/RoomGrid";
import type { GraphicsQuality } from "@/types/domain";

type RoomDef = {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  marker: string;
};

type SceneCanvasProps = {
  rooms: RoomDef[];
  quality: GraphicsQuality;
  reducedMotion: boolean;
  pointerLockEnabled: boolean;
  onRoomInteract: (roomId: string) => void;
  onTeleport: (roomId: string) => void;
};

const QUALITY_PRESET = {
  low: { stars: 120, shadows: false, fogFar: 28, dpr: 1 },
  medium: { stars: 400, shadows: false, fogFar: 36, dpr: 1.4 },
  high: { stars: 800, shadows: true, fogFar: 48, dpr: 2 }
} as const;

export function SceneCanvas({ rooms, quality, reducedMotion, pointerLockEnabled, onRoomInteract, onTeleport }: SceneCanvasProps) {
  const preset = QUALITY_PRESET[quality];

  return (
    <div id="hub-canvas-wrapper" className="h-[calc(100vh-64px)] w-full">
      <Canvas camera={{ position: [0, 2, 12], fov: 60 }} shadows={preset.shadows} dpr={[1, preset.dpr]}>
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 7, preset.fogFar]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 12, 2]} intensity={0.8} castShadow={preset.shadows} />

        {!reducedMotion ? <Stars count={preset.stars} radius={60} depth={40} factor={2} saturation={0} fade speed={0.5} /> : null}

        <RoomGrid
          rooms={rooms}
          onRoomInteract={onRoomInteract}
          onTeleport={onTeleport}
          reducedMotion={reducedMotion}
        />

        <PlayerController />
        <CameraRig />

        {pointerLockEnabled ? <PointerLockControls selector="#hub-canvas-wrapper" /> : null}
      </Canvas>
    </div>
  );
}


```

### `apps/web/src/components/hub/SettingsPanel.tsx`
```tsx
"use client";

import type { GraphicsQuality } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type SettingsPanelProps = {
  quality: GraphicsQuality;
  reducedMotion: boolean;
  onQualityChange: (quality: GraphicsQuality) => void;
  onReducedMotionChange: (value: boolean) => void;
};

export function SettingsPanel({
  quality,
  reducedMotion,
  onQualityChange,
  onReducedMotionChange
}: SettingsPanelProps) {
  return (
    <Card className="pointer-events-auto space-y-3 p-3">
      <p className="text-xs uppercase tracking-[0.15em] text-muted">Settings</p>
      <div className="space-y-2">
        <Label htmlFor="graphics-quality">Graphics quality</Label>
        <Select value={quality} onValueChange={(value) => onQualityChange(value as GraphicsQuality)}>
          <SelectTrigger id="graphics-quality">
            <SelectValue placeholder="Select quality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="reduced-motion">Reduced motion</Label>
        <Switch
          id="reduced-motion"
          checked={reducedMotion}
          onCheckedChange={(value) => onReducedMotionChange(value)}
        />
      </div>
    </Card>
  );
}


```

### `apps/web/src/components/hub/TwoDModeFallback.tsx`
```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type RoomDef = {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  marker: string;
};

type TwoDModeFallbackProps = {
  rooms: RoomDef[];
  selectedRoomId: string;
  onRoomSelect: (roomId: string) => void;
};

export function TwoDModeFallback({ rooms, selectedRoomId, onRoomSelect }: TwoDModeFallbackProps) {
  return (
    <div className="relative z-10 mx-auto grid h-[calc(100vh-64px)] w-full max-w-6xl content-start gap-4 p-4 md:grid-cols-2">
      {rooms.map((room) => (
        <Card
          key={room.id}
          className={`space-y-2 p-4 ${selectedRoomId === room.id ? "border-accent shadow-neon" : ""}`}
        >
          <p className="text-xs uppercase tracking-[0.15em] text-muted">{room.marker}</p>
          <h3 className="text-lg font-semibold text-text">{room.name}</h3>
          <p className="text-sm text-muted">{room.description}</p>
          <Button size="sm" onClick={() => onRoomSelect(room.id)}>
            Open room panel
          </Button>
        </Card>
      ))}
    </div>
  );
}


```

### `apps/web/src/components/layout/auth-card.tsx`
```tsx
"use client";

import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthCard({ emailHint }: { emailHint?: string }) {
  const [email, setEmail] = useState(emailHint ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onOtp = async () => {
    setBusy(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Magic link sent. Check your inbox.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start OTP login.");
    }

    setBusy(false);
  };

  const onSignOut = async () => {
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.reload();
    } catch {
      setMessage("Unable to sign out.");
    }
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Email OTP authentication via Supabase.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
        <div className="flex gap-2">
          <Button onClick={onOtp} disabled={busy || !email}>
            {busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send OTP
          </Button>
          <Button variant="secondary" onClick={onSignOut} disabled={busy}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
```

### `apps/web/src/components/layout/billing-panel.tsx`
```tsx
"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CreditCard, LoaderCircle, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export type BillingPlanCard = {
  planId: "starter" | "pro" | "scale";
  name: string;
  monthlyPriceId: string;
  yearlyPriceId: string;
  limits: {
    instances: number;
    regions: string[];
  };
};

type BillingPanelProps = {
  plans: BillingPlanCard[];
  activePlanId: string | null;
  activeInterval: "monthly" | "yearly" | null;
  subscriptionStatus: string | null;
};

export function BillingPanel({ plans, activePlanId, activeInterval, subscriptionStatus }: BillingPanelProps) {
  const [interval, setInterval] = useState<"monthly" | "yearly">(activeInterval ?? "monthly");
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.limits.instances - b.limits.instances),
    [plans]
  );

  const onCheckout = async (planId: string) => {
    setBusyPlanId(planId);
    setMessage(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          planId,
          interval,
          successPath: "/billing/success",
          cancelPath: "/billing"
        })
      });

      const payload = (await response.json()) as
        | { checkoutUrl: string }
        | { error: { message: string } };

      if (!response.ok || "error" in payload) {
        setMessage("error" in payload ? payload.error.message : "Unable to create checkout session");
      } else {
        window.location.href = payload.checkoutUrl;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create checkout session");
    }

    setBusyPlanId(null);
  };

  const onManage = async () => {
    setPortalBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const payload = (await response.json()) as
        | { url: string | null; fallback: "support" | null }
        | { error: { message: string } };

      if (!response.ok || "error" in payload) {
        setMessage("error" in payload ? payload.error.message : "Unable to open portal");
      } else if (payload.url) {
        window.location.href = payload.url;
      } else {
        setMessage("Customer portal unavailable. Contact support@yourdomain for cancellation or billing support.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open portal");
    }

    setPortalBusy(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Subscription status</CardTitle>
          <CardDescription>
            Current status: <span className="font-medium text-text">{subscriptionStatus ?? "none"}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-[220px] space-y-1">
            <label htmlFor="interval" className="text-sm font-medium text-text">
              Billing interval
            </label>
            <Select value={interval} onValueChange={(value) => setInterval(value as "monthly" | "yearly")}>
              <SelectTrigger id="interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="secondary" onClick={onManage} disabled={portalBusy}>
            {portalBusy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Settings className="mr-2 h-4 w-4" />}
            Manage subscription
          </Button>

          {message ? <p className="text-sm text-muted">{message}</p> : null}
        </CardContent>
      </Card>

      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        {sortedPlans.map((plan) => (
          <Card key={plan.planId} className={plan.planId === activePlanId ? "border-accent shadow-neon" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                <CreditCard className="h-4 w-4 text-accent" />
              </CardTitle>
              <CardDescription>
                {plan.limits.instances} instances Â· Regions: {plan.limits.regions.join(", ")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => onCheckout(plan.planId)}
                disabled={busyPlanId === plan.planId}
              >
                {busyPlanId === plan.planId ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                {plan.planId === activePlanId ? "Change plan" : `Subscribe ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


```

### `apps/web/src/components/layout/marketing-header.tsx`
```tsx
import Link from "next/link";
import { Bell, Box, CreditCard, Home, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/app", label: "Hub", icon: Box },
  { href: "/dashboard", label: "Dashboard", icon: Bell },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/admin", label: "Admin", icon: Shield }
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-semibold text-text">
          Web3 Home Office
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Button key={link.href} variant="ghost" size="sm" asChild>
                <Link href={link.href} className="gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}


```

### `apps/web/src/components/layout/page-header.tsx`
```tsx
import { Badge } from "@/components/ui/badge";

type PageHeaderProps = {
  title: string;
  description: string;
  statusLabel?: string;
};

export function PageHeader({ title, description, statusLabel }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-text">{title}</h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {statusLabel ? <Badge variant="secondary">{statusLabel}</Badge> : null}
    </div>
  );
}


```

### `apps/web/src/components/layout/providers.tsx`
```tsx
"use client";

import { MiniKitProvider } from "@/lib/platforms/minikit";

export function Providers({ children }: { children: React.ReactNode }) {
  return <MiniKitProvider>{children}</MiniKitProvider>;
}


```

### `apps/web/src/components/layout/provision-request-form.tsx`
```tsx
"use client";

import { useState } from "react";
import { LoaderCircle, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProvisionRequestFormProps = {
  defaultRegion: string;
};

export function ProvisionRequestForm({ defaultRegion }: ProvisionRequestFormProps) {
  const [template, setTemplate] = useState<"vps-base" | "rpc-placeholder">("vps-base");
  const [region, setRegion] = useState(defaultRegion);
  const [sshPublicKey, setSshPublicKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/provision/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          planTemplate: template,
          region,
          sshPublicKey: sshPublicKey.trim() || undefined
        })
      });

      const payload = (await response.json()) as
        | { jobId: string; status: string }
        | { error: { message: string } };

      if (!response.ok || "error" in payload) {
        setMessage("error" in payload ? payload.error.message : "Failed to create provision job.");
      } else {
        setMessage(`Job ${payload.jobId} queued with status ${payload.status}.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create provision job.");
    }

    setBusy(false);
  };

  return (
    <Card id="provision">
      <CardHeader>
        <CardTitle>Provision VPS</CardTitle>
        <CardDescription>Create a provisioning job processed by the Tencent worker.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="template">Template</Label>
          <Select value={template} onValueChange={(value) => setTemplate(value as "vps-base" | "rpc-placeholder")}>
            <SelectTrigger id="template">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vps-base">VPS Base</SelectItem>
              <SelectItem value="rpc-placeholder">RPC Placeholder</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="region">Region</Label>
          <Input id="region" value={region} onChange={(event) => setRegion(event.target.value)} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="ssh">SSH Public Key (optional)</Label>
          <Input
            id="ssh"
            value={sshPublicKey}
            onChange={(event) => setSshPublicKey(event.target.value)}
            placeholder="ssh-ed25519 AAAA..."
          />
        </div>

        <Button onClick={onSubmit} disabled={busy}>
          {busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
          Request provisioning
        </Button>

        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </CardContent>
    </Card>
  );
}


```

### `apps/web/src/components/ui/badge.tsx`
```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent/30 text-accent",
        secondary: "border-border bg-panel text-text",
        success: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
        warn: "border-amber-400/40 bg-amber-500/10 text-amber-300",
        danger: "border-rose-400/40 bg-rose-500/10 text-rose-300"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };


```

### `apps/web/src/components/ui/button.tsx`
```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow",
  {
    variants: {
      variant: {
        default: "bg-accent text-slate-950 hover:brightness-110 shadow-neon",
        secondary: "bg-panel text-text border border-border hover:bg-panel/80",
        ghost: "text-text hover:bg-white/10",
        danger: "bg-rose-500 text-white hover:bg-rose-400",
        outline: "border border-border bg-transparent text-text hover:bg-white/5"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-5",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };


```

### `apps/web/src/components/ui/card.tsx`
```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border/70 bg-panel/70 text-text shadow-panel backdrop-blur-xl",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h3 ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-muted", className)} {...props} />
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
);
CardFooter.displayName = "CardFooter";

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };


```

### `apps/web/src/components/ui/dialog.tsx`
```tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/70 backdrop-blur-sm", className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-border bg-panel/95 p-6 text-text shadow-panel duration-200",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />);
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted", className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
};


```

### `apps/web/src/components/ui/input.tsx`
```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };


```

### `apps/web/src/components/ui/label.tsx`
```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("text-sm font-medium leading-none text-text", className)} {...props} />
  )
);
Label.displayName = "Label";

export { Label };


```

### `apps/web/src/components/ui/select.tsx`
```tsx
"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-text",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn("z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-panel p-1 text-text shadow-panel", className)}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
        <ChevronUp className="h-4 w-4" />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
        <ChevronDown className="h-4 w-4" />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-white/10",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };


```

### `apps/web/src/components/ui/separator.tsx`
```tsx
"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn("shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };


```

### `apps/web/src/components/ui/sheet.tsx`
```tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn("fixed inset-0 z-50 bg-black/70 backdrop-blur-sm", className)}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: "top" | "right" | "bottom" | "left" }
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 border-border bg-panel/95 p-6 text-text shadow-panel",
        side === "right" && "inset-y-0 right-0 h-full w-4/5 max-w-md border-l",
        side === "left" && "inset-y-0 left-0 h-full w-4/5 max-w-md border-r",
        side === "top" && "inset-x-0 top-0 border-b",
        side === "bottom" && "inset-x-0 bottom-0 border-t",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = DialogPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-4 flex flex-col gap-1.5", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />);
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted", className)} {...props} />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger };


```

### `apps/web/src/components/ui/switch.tsx`
```tsx
"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-white/20 transition-colors data-[state=checked]:bg-accent",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5"
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };


```

### `apps/web/src/components/ui/tabs.tsx`
```tsx
"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("inline-flex h-10 items-center justify-center rounded-md bg-black/30 p-1 text-muted", className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-accent data-[state=active]:text-slate-900",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-2 rounded-md border border-border/80 bg-black/20 p-4", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };


```

### `apps/web/src/components/ui/textarea.tsx`
```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };


```

### `apps/web/src/lib/api/errors.ts`
```ts
export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 400, code = "BAD_REQUEST") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function asAppError(error: unknown) {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError(error.message, 500, "INTERNAL_ERROR");
  }
  return new AppError("Unexpected error", 500, "INTERNAL_ERROR");
}


```

### `apps/web/src/lib/api/responses.ts`
```ts
import { NextResponse } from "next/server";

import { asAppError } from "@/lib/api/errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(error: unknown) {
  const normalized = asAppError(error);
  return NextResponse.json(
    {
      error: {
        code: normalized.code,
        message: normalized.message
      }
    },
    { status: normalized.status }
  );
}


```

### `apps/web/src/lib/auth/admin-bootstrap.ts`
```ts
import { createHash } from "node:crypto";

import type { User } from "@supabase/supabase-js";

import { getAdminBootstrapEmails } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function ensureProfileForUser(user: User) {
  const admin = createSupabaseAdminClient();
  const email = user.email?.toLowerCase() ?? "";
  const defaultHandle = email ? email.split("@")[0] : `user-${user.id.slice(0, 8)}`;
  const bootstrapEmails = getAdminBootstrapEmails();
  const role: "admin" | "user" = bootstrapEmails.has(email) ? "admin" : "user";

  const payload = {
    user_id: user.id,
    handle: sanitizeHandle(defaultHandle),
    role
  };

  const { error } = await (admin.from("profiles") as any).upsert(payload, { onConflict: "user_id" });

  if (error) {
    throw new Error(`Failed to upsert profile: ${error.message}`);
  }
}

function sanitizeHandle(input: string) {
  const slug = input.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 24);
  if (slug.length >= 3) return slug;
  return `user-${createHash("sha1").update(input).digest("hex").slice(0, 10)}`;
}


```

### `apps/web/src/lib/auth/guards.ts`
```ts
import { redirect } from "next/navigation";

import { ACTIVE_SUBSCRIPTION_STATUSES, type SubscriptionStatus } from "@web3homeoffice/shared";

import { AppError } from "@/lib/api/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProfileRow, SubscriptionRow } from "@/types/db";

export async function getUserSubscription(userId: string): Promise<SubscriptionRow | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select(
      "user_id,creem_customer_id,creem_subscription_id,status,current_period_end,plan_id,interval,updated_at"
    )
    .eq("user_id", userId)
    .maybeSingle<SubscriptionRow>();

  if (error) throw new AppError(error.message, 500, "SUBSCRIPTION_READ_FAILED");
  return data;
}

export function isSubscriptionActive(status: SubscriptionStatus | null | undefined) {
  if (!status) return false;
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(status);
}

export async function requireActiveSubscription(userId: string, redirectPath = "/billing") {
  const subscription = await getUserSubscription(userId);
  if (!isSubscriptionActive(subscription?.status)) {
    redirect(redirectPath);
  }
  return subscription as SubscriptionRow;
}

export async function requireActiveSubscriptionForApi(userId: string) {
  const subscription = await getUserSubscription(userId);
  if (!isSubscriptionActive(subscription?.status)) {
    throw new AppError("An active subscription is required", 402, "SUBSCRIPTION_REQUIRED");
  }
  return subscription as SubscriptionRow;
}

export async function requireAdmin(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("user_id,handle,role,created_at,updated_at")
    .eq("user_id", userId)
    .maybeSingle<ProfileRow>();

  if (error) throw new AppError(error.message, 500, "PROFILE_READ_FAILED");
  if (!data || data.role !== "admin") {
    throw new AppError("Admin access required", 403, "FORBIDDEN");
  }

  return data;
}


```

### `apps/web/src/lib/auth/session.ts`
```ts
import type { User } from "@supabase/supabase-js";

import { AppError } from "@/lib/api/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/db";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new AppError(error.message, 401, "AUTH_ERROR");
  return data.user;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  return user;
}

export async function getCurrentProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,handle,role,created_at,updated_at")
    .eq("user_id", userId)
    .maybeSingle<ProfileRow>();

  if (error) throw new AppError(error.message, 500, "PROFILE_READ_FAILED");
  return data;
}


```

### `apps/web/src/lib/billing/creem-client.ts`
```ts
import { AppError } from "@/lib/api/errors";
import { getServerEnv } from "@/lib/env";

const DEFAULT_TEST_BASE_URL = "https://test-api.creem.io";
const DEFAULT_LIVE_BASE_URL = "https://api.creem.io";

type HttpMethod = "GET" | "POST";

type CreemRequestOptions = {
  method?: HttpMethod;
  body?: Record<string, unknown>;
};

export type CreemCheckoutRequest = {
  priceId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

export type CreemCheckoutResponse = {
  id: string;
  url: string;
};

export async function creemRequest<T>(path: string, options: CreemRequestOptions = {}) {
  const env = getServerEnv();
  const baseUrl = env.CREEM_MODE === "test"
    ? env.CREEM_API_BASE_TEST ?? DEFAULT_TEST_BASE_URL
    : env.CREEM_API_BASE_LIVE ?? DEFAULT_LIVE_BASE_URL;

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${env.CREEM_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new AppError(`Creem request failed: ${response.status} ${text}`, 502, "CREEM_API_ERROR");
  }

  return (await response.json()) as T;
}

export async function createCreemCheckoutSession(payload: CreemCheckoutRequest) {
  const response = await creemRequest<CreemCheckoutResponse>("/v1/checkouts", {
    method: "POST",
    body: {
      price_id: payload.priceId,
      customer_email: payload.customerEmail,
      success_url: payload.successUrl,
      cancel_url: payload.cancelUrl,
      metadata: payload.metadata ?? {}
    }
  });

  if (!response.url) {
    throw new AppError("Creem did not return a checkout URL", 502, "CREEM_NO_CHECKOUT_URL");
  }

  return response;
}

export async function getCreemPortalUrl(creemCustomerId: string) {
  try {
    const data = await creemRequest<{ url?: string }>(`/v1/customers/${creemCustomerId}/portal`, {
      method: "POST"
    });
    return data.url ?? null;
  } catch {
    return null;
  }
}


```

### `apps/web/src/lib/billing/creem-signature.ts`
```ts
import { createHmac, timingSafeEqual } from "node:crypto";

import { AppError } from "@/lib/api/errors";
import { getServerEnv } from "@/lib/env";

function parseSignatureValue(raw: string) {
  if (!raw) return "";
  const normalized = raw.trim();
  if (!normalized.includes("=")) return normalized;

  const pairs = normalized.split(",").map((part) => part.trim());
  const direct = pairs.find((pair) => pair.startsWith("v1="));
  if (direct) return direct.replace("v1=", "");

  const fallback = pairs[0]?.split("=")[1];
  return fallback ?? "";
}

export function verifyCreemWebhookSignature(rawBody: string, headerValue: string | null) {
  const env = getServerEnv();
  if (!headerValue) return false;

  const algorithm = env.CREEM_WEBHOOK_SIGNATURE_ALGORITHM.toLowerCase();
  const signature = parseSignatureValue(headerValue);

  if (!signature) return false;

  const expected = createHmac(algorithm, env.CREEM_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (sigBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(sigBuffer, expectedBuffer);
}

export function assertCreemWebhookSignature(rawBody: string, headerValue: string | null) {
  if (!verifyCreemWebhookSignature(rawBody, headerValue)) {
    throw new AppError("Invalid webhook signature", 401, "INVALID_WEBHOOK_SIGNATURE");
  }
}


```

### `apps/web/src/lib/billing/subscription-service.ts`
```ts
import type { BillingInterval, PlanId, SubscriptionStatus } from "@web3homeoffice/shared";

import { AppError } from "@/lib/api/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PlanRow } from "@/types/db";
import type { Json } from "@/types/supabase";

export type NormalizedCreemEvent = {
  id: string;
  type: string;
  subscriptionId: string | null;
  customerId: string | null;
  customerEmail: string | null;
  status: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
  interval: BillingInterval | null;
  planId: PlanId | null;
  raw: unknown;
};

export function normalizeCreemEvent(payload: unknown): NormalizedCreemEvent {
  const event = payload as Record<string, any>;
  const data = (event.data ?? {}) as Record<string, any>;
  const object = (data.object ?? data.subscription ?? data) as Record<string, any>;

  const type = String(event.type ?? "unknown");
  const id = String(event.id ?? object.id ?? crypto.randomUUID());

  const status = normalizeSubscriptionStatus(object.status ?? object.subscription_status ?? type);
  const planId = normalizePlanId(object.metadata?.plan_id ?? object.plan_id ?? null);

  return {
    id,
    type,
    subscriptionId: object.id ? String(object.id) : null,
    customerId: object.customer_id ? String(object.customer_id) : null,
    customerEmail: object.customer_email ? String(object.customer_email).toLowerCase() : null,
    status,
    currentPeriodEnd: object.current_period_end
      ? new Date(object.current_period_end).toISOString()
      : null,
    interval: normalizeInterval(object.interval ?? object.billing_interval ?? null),
    planId,
    raw: payload
  };
}

function normalizeSubscriptionStatus(input: unknown): SubscriptionStatus | null {
  if (!input) return null;
  const value = String(input).toLowerCase();

  if (value.includes("trial")) return "trialing";
  if (value.includes("active") || value.includes("created")) return "active";
  if (value.includes("past_due") || value.includes("past-due")) return "past_due";
  if (value.includes("cancel")) return "canceled";
  if (value.includes("expire")) return "expired";

  return null;
}

function normalizeInterval(input: unknown): BillingInterval | null {
  if (!input) return null;
  const value = String(input).toLowerCase();
  if (value.startsWith("month")) return "monthly";
  if (value.startsWith("year")) return "yearly";
  return null;
}

function normalizePlanId(input: unknown): PlanId | null {
  if (!input) return null;
  const value = String(input).toLowerCase();
  if (value === "starter" || value === "pro" || value === "scale") return value;
  return null;
}

export async function recordWebhookEvent(event: NormalizedCreemEvent) {
  const admin = createSupabaseAdminClient();
  const { error } = await (admin.from("webhook_events") as any).insert({
    id: event.id,
    provider: "creem",
    type: event.type,
    payload: event.raw as Json
  });

  if (!error) return true;

  if (error.code === "23505") {
    return false;
  }

  throw new AppError(error.message, 500, "WEBHOOK_EVENT_WRITE_FAILED");
}

export async function syncSubscriptionFromEvent(event: NormalizedCreemEvent) {
  if (!event.customerEmail) {
    throw new AppError("Webhook payload missing customer email", 400, "WEBHOOK_EMAIL_REQUIRED");
  }
  if (!event.status) {
    throw new AppError("Webhook payload missing status", 400, "WEBHOOK_STATUS_REQUIRED");
  }

  const admin = createSupabaseAdminClient();
  const { data: userLookup, error: userLookupError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200
  });

  if (userLookupError) {
    throw new AppError(userLookupError.message, 500, "USER_LOOKUP_FAILED");
  }

  const user = userLookup.users.find((candidate) => candidate.email?.toLowerCase() === event.customerEmail);
  if (!user) {
    throw new AppError("No user found for webhook customer email", 404, "USER_NOT_FOUND");
  }

  const payload = {
    user_id: user.id,
    creem_customer_id: event.customerId,
    creem_subscription_id: event.subscriptionId,
    status: event.status,
    current_period_end: event.currentPeriodEnd,
    plan_id: event.planId,
    interval: event.interval
  };

  const { error } = await (admin.from("subscriptions") as any).upsert(payload, { onConflict: "user_id" });
  if (error) {
    throw new AppError(error.message, 500, "SUBSCRIPTION_UPSERT_FAILED");
  }

  return payload;
}

export async function getPlanById(planId: PlanId): Promise<PlanRow> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("plans")
    .select(
      "plan_id,name,creem_product_id,monthly_price_id,yearly_price_id,limits,active,created_at,updated_at"
    )
    .eq("plan_id", planId)
    .eq("active", true)
    .single<PlanRow>();

  if (error) {
    throw new AppError(error.message, 404, "PLAN_NOT_FOUND");
  }

  return data;
}

export function planPriceId(plan: PlanRow, interval: BillingInterval) {
  return interval === "monthly" ? plan.monthly_price_id : plan.yearly_price_id;
}


```

### `apps/web/src/lib/env.ts`
```ts
import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10)
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  CREEM_API_KEY: z.string().min(10),
  CREEM_WEBHOOK_SECRET: z.string().min(10),
  CREEM_MODE: z.enum(["test", "live"]).default("test"),
  CREEM_API_BASE_TEST: z.string().url().optional(),
  CREEM_API_BASE_LIVE: z.string().url().optional(),
  CREEM_WEBHOOK_SIGNATURE_HEADER: z.string().default("x-creem-signature"),
  CREEM_WEBHOOK_SIGNATURE_ALGORITHM: z.string().default("sha256"),
  ADMIN_BOOTSTRAP_EMAILS: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional()
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedPublicEnv: PublicEnv | null = null;
let cachedServerEnv: ServerEnv | null = null;

export function getPublicEnv(): PublicEnv {
  if (cachedPublicEnv) return cachedPublicEnv;
  cachedPublicEnv = publicEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });
  return cachedPublicEnv;
}

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;
  cachedServerEnv = serverEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CREEM_API_KEY: process.env.CREEM_API_KEY,
    CREEM_WEBHOOK_SECRET: process.env.CREEM_WEBHOOK_SECRET,
    CREEM_MODE: process.env.CREEM_MODE,
    CREEM_API_BASE_TEST: process.env.CREEM_API_BASE_TEST,
    CREEM_API_BASE_LIVE: process.env.CREEM_API_BASE_LIVE,
    CREEM_WEBHOOK_SIGNATURE_HEADER: process.env.CREEM_WEBHOOK_SIGNATURE_HEADER,
    CREEM_WEBHOOK_SIGNATURE_ALGORITHM: process.env.CREEM_WEBHOOK_SIGNATURE_ALGORITHM,
    ADMIN_BOOTSTRAP_EMAILS: process.env.ADMIN_BOOTSTRAP_EMAILS,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN
  });
  return cachedServerEnv;
}

export function getAdminBootstrapEmails() {
  const env = getServerEnv();
  if (!env.ADMIN_BOOTSTRAP_EMAILS) return new Set<string>();
  return new Set(
    env.ADMIN_BOOTSTRAP_EMAILS.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}


```

### `apps/web/src/lib/platforms/detect.ts`
```ts
export type PlatformContext = {
  isTelegram: boolean;
  isFarcaster: boolean;
  isBaseMiniApp: boolean;
  shouldDefaultLowGraphics: boolean;
};

export function detectPlatformContext(searchParams?: URLSearchParams): PlatformContext {
  const source = searchParams ?? new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const tgData = source.get("tgWebAppData");
  const farcaster = source.get("farcaster") ?? source.get("fc") ?? "";
  const base = source.get("baseMiniApp") ?? source.get("base") ?? "";

  const isTelegram = Boolean(tgData);
  const isFarcaster = farcaster === "1";
  const isBaseMiniApp = base === "1";

  return {
    isTelegram,
    isFarcaster,
    isBaseMiniApp,
    shouldDefaultLowGraphics: isTelegram || isFarcaster || isBaseMiniApp
  };
}


```

### `apps/web/src/lib/platforms/farcaster.ts`
```ts
import { absoluteUrl } from "@/lib/utils";

export function getFarcasterManifest() {
  return {
    accountAssociation: {
      header: "",
      payload: "",
      signature: ""
    },
    miniapp: {
      version: "1",
      name: "Web3 Home Office",
      iconUrl: absoluteUrl("/icon.png"),
      homeUrl: absoluteUrl("/app"),
      subtitle: "Provision and manage your web3 home office infra.",
      description: "Neon cyberpunk hub to manage subscriptions and VPS provisioning.",
      screenshotUrls: [absoluteUrl("/screenshot-1.png")],
      primaryCategory: "developer-tools"
    }
  };
}


```

### `apps/web/src/lib/platforms/minikit.tsx`
```tsx
"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";

type MiniKitState = {
  enabled: boolean;
};

const MiniKitContext = createContext<MiniKitState>({ enabled: false });

export function MiniKitProvider({ children }: { children: ReactNode }) {
  const value = useMemo<MiniKitState>(() => {
    if (typeof window === "undefined") return { enabled: false };
    const hasProvider = Boolean((window as Window & { BaseMiniKit?: unknown }).BaseMiniKit);
    return { enabled: hasProvider };
  }, []);

  return <MiniKitContext.Provider value={value}>{children}</MiniKitContext.Provider>;
}

export function useMiniKit() {
  return useContext(MiniKitContext);
}


```

### `apps/web/src/lib/platforms/safe-area.ts`
```ts
export const SAFE_AREA_STYLE_VARS = {
  "--safe-top": "env(safe-area-inset-top)",
  "--safe-right": "env(safe-area-inset-right)",
  "--safe-bottom": "env(safe-area-inset-bottom)",
  "--safe-left": "env(safe-area-inset-left)"
} as const;

export function safeAreaPaddingClass() {
  return "pt-[max(1rem,var(--safe-top))] pr-[max(1rem,var(--safe-right))] pb-[max(1rem,var(--safe-bottom))] pl-[max(1rem,var(--safe-left))]";
}


```

### `apps/web/src/lib/platforms/telegram-verify.ts`
```ts
import { createHmac } from "node:crypto";

import { AppError } from "@/lib/api/errors";

export type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export function verifyTelegramInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    throw new AppError("Telegram init data missing hash", 400, "TELEGRAM_HASH_MISSING");
  }

  params.delete("hash");
  const pairs = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort();

  const dataCheckString = pairs.join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculated = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (calculated !== hash) {
    throw new AppError("Telegram init data hash mismatch", 401, "TELEGRAM_HASH_INVALID");
  }

  const userRaw = params.get("user");
  if (!userRaw) {
    throw new AppError("Telegram init data missing user payload", 400, "TELEGRAM_USER_MISSING");
  }

  let user: TelegramUser;

  try {
    user = JSON.parse(userRaw) as TelegramUser;
  } catch {
    throw new AppError("Telegram user payload is invalid JSON", 400, "TELEGRAM_USER_INVALID");
  }

  return {
    user,
    authDate: params.get("auth_date")
  };
}


```

### `apps/web/src/lib/provisioning/jobs.ts`
```ts
import type { PlanId, ProvisionJobStatus } from "@web3homeoffice/shared";

import { AppError } from "@/lib/api/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProvisionJobRow } from "@/types/db";

export async function createProvisionJob(params: {
  userId: string;
  planId: PlanId;
  template: "vps-base" | "rpc-placeholder";
  region: string;
  logs?: Array<Record<string, unknown>>;
}) {
  const admin = createSupabaseAdminClient();

  const result = await (admin.from("provision_jobs") as any)
    .insert({
      user_id: params.userId,
      plan_id: params.planId,
      template: params.template,
      status: "pending",
      region: params.region,
      logs: params.logs ?? []
    })
    .select("id,status")
    .single();

  const data = result.data as { id: string; status: ProvisionJobStatus } | null;
  const error = result.error as { message: string } | null;

  if (error || !data) {
    throw new AppError(error?.message ?? "Failed to create provision job", 500, "PROVISION_JOB_CREATE_FAILED");
  }

  return data;
}

export async function listProvisionJobsForUser(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("provision_jobs")
    .select("id,user_id,plan_id,template,status,region,instance_id,ip,logs,created_at,updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<ProvisionJobRow[]>();

  if (error) {
    throw new AppError(error.message, 500, "PROVISION_JOB_LIST_FAILED");
  }

  return data;
}

export async function listProvisionJobsAdmin(limit = 100) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("provision_jobs")
    .select("id,user_id,plan_id,template,status,region,instance_id,ip,logs,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<ProvisionJobRow[]>();

  if (error) {
    throw new AppError(error.message, 500, "PROVISION_JOB_LIST_FAILED");
  }

  return data;
}


```

### `apps/web/src/lib/provisioning/limits.ts`
```ts
import type { PlanId } from "@web3homeoffice/shared";

import { AppError } from "@/lib/api/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PlanRow } from "@/types/db";

export type PlanLimits = {
  instances: number;
  regions: string[];
};

export function parsePlanLimits(input: unknown): PlanLimits {
  if (!input || typeof input !== "object") {
    throw new AppError("Plan limits are missing", 500, "PLAN_LIMITS_MISSING");
  }

  const candidate = input as { instances?: unknown; regions?: unknown };
  const instances = Number(candidate.instances ?? 0);
  const regions = Array.isArray(candidate.regions) ? candidate.regions.map(String) : [];

  if (!Number.isFinite(instances) || instances < 1) {
    throw new AppError("Invalid plan instance limit", 500, "PLAN_LIMITS_INVALID");
  }

  if (!regions.length) {
    throw new AppError("Plan region limits are missing", 500, "PLAN_LIMITS_INVALID");
  }

  return {
    instances,
    regions
  };
}

export async function getPlanWithLimits(planId: PlanId) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("plans")
    .select(
      "plan_id,name,creem_product_id,monthly_price_id,yearly_price_id,limits,active,created_at,updated_at"
    )
    .eq("plan_id", planId)
    .eq("active", true)
    .single<PlanRow>();

  if (error || !data) {
    throw new AppError("Plan is unavailable", 404, "PLAN_UNAVAILABLE");
  }

  return {
    plan: data,
    limits: parsePlanLimits(data.limits)
  };
}

export async function ensureProvisionWithinLimit(userId: string, planId: PlanId) {
  const { limits } = await getPlanWithLimits(planId);
  const admin = createSupabaseAdminClient();

  const { count, error } = await admin
    .from("provision_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["pending", "running", "provisioned"]);

  if (error) {
    throw new AppError(error.message, 500, "PROVISION_COUNT_FAILED");
  }

  if ((count ?? 0) >= limits.instances) {
    throw new AppError("Provisioning limit reached for your plan", 409, "PROVISION_LIMIT_REACHED");
  }

  return limits;
}


```

### `apps/web/src/lib/supabase/admin.ts`
```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

let client: SupabaseClient<Database> | null = null;

export function createSupabaseAdminClient() {
  if (client) return client;
  const env = getServerEnv();
  client = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  return client;
}


```

### `apps/web/src/lib/supabase/browser.ts`
```ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

let client: SupabaseClient<Database> | null = null;

export function createSupabaseBrowserClient() {
  if (client) return client;
  const env = getPublicEnv();
  client = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return client;
}


```

### `apps/web/src/lib/supabase/server.ts`
```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

export async function createSupabaseServerClient() {
  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components may not allow cookie mutation.
        }
      }
    }
  });
}


```

### `apps/web/src/lib/utils.ts`
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function absoluteUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl}${normalizedPath}`;
}


```

### `apps/web/src/tests/billing-webhook.test.ts`
```ts
import { createHmac } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-123456";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-123456";
  process.env.CREEM_API_KEY = "creem-key-123456";
  process.env.CREEM_WEBHOOK_SECRET = "webhook-secret";
  process.env.CREEM_MODE = "test";
  process.env.CREEM_WEBHOOK_SIGNATURE_HEADER = "x-creem-signature";
  process.env.CREEM_WEBHOOK_SIGNATURE_ALGORITHM = "sha256";
});

describe("creem webhook signature", () => {
  it("accepts valid signature", async () => {
    const rawBody = JSON.stringify({ id: "evt_1", type: "subscription.active" });
    const signature = createHmac("sha256", "webhook-secret").update(rawBody).digest("hex");

    const module = await import("@/lib/billing/creem-signature");
    expect(module.verifyCreemWebhookSignature(rawBody, signature)).toBe(true);
  });

  it("rejects invalid signature", async () => {
    const rawBody = JSON.stringify({ id: "evt_2", type: "subscription.active" });
    const module = await import("@/lib/billing/creem-signature");

    expect(module.verifyCreemWebhookSignature(rawBody, "bad-signature")).toBe(false);
  });
});

describe("webhook payload normalization", () => {
  it("maps active payload", async () => {
    const module = await import("@/lib/billing/subscription-service");
    const normalized = module.normalizeCreemEvent({
      id: "evt_3",
      type: "subscription.active",
      data: {
        object: {
          id: "sub_1",
          customer_id: "cus_1",
          customer_email: "user@example.com",
          status: "active",
          current_period_end: "2026-04-01T00:00:00.000Z",
          interval: "monthly",
          metadata: {
            plan_id: "pro"
          }
        }
      }
    });

    expect(normalized.status).toBe("active");
    expect(normalized.planId).toBe("pro");
    expect(normalized.interval).toBe("monthly");
  });
});


```

### `apps/web/src/tests/smoke.test.ts`
```ts
import { describe, expect, it } from "vitest";

describe("smoke", () => {
  it("loads core modules", async () => {
    const modules = await Promise.all([
      import("@/lib/utils"),
      import("@/lib/platforms/detect"),
      import("@/lib/provisioning/limits"),
      import("@/lib/billing/subscription-service")
    ]);

    expect(modules.length).toBe(4);
  });
});


```

### `apps/web/src/tests/subscription-guards.test.ts`
```ts
import { describe, expect, it } from "vitest";

import { isSubscriptionActive } from "@/lib/auth/guards";

describe("subscription guard", () => {
  it("marks active statuses", () => {
    expect(isSubscriptionActive("active")).toBe(true);
    expect(isSubscriptionActive("trialing")).toBe(true);
  });

  it("marks inactive statuses", () => {
    expect(isSubscriptionActive("canceled")).toBe(false);
    expect(isSubscriptionActive("expired")).toBe(false);
    expect(isSubscriptionActive(null)).toBe(false);
  });
});


```

### `apps/web/src/types/api.ts`
```ts
import type { BillingInterval, PlanId, ProvisionJobStatus } from "@web3homeoffice/shared";

export type CheckoutRequest = {
  planId: PlanId;
  interval: BillingInterval;
  successPath?: string;
  cancelPath?: string;
};

export type CheckoutResponse = {
  checkoutUrl: string;
};

export type CreateProvisionJobRequest = {
  planTemplate: "vps-base" | "rpc-placeholder";
  region?: string;
  sshPublicKey?: string;
};

export type CreateProvisionJobResponse = {
  jobId: string;
  status: ProvisionJobStatus;
};

export type TelegramVerifyRequest = {
  initData: string;
};


```

### `apps/web/src/types/db.ts`
```ts
import type {
  BillingInterval,
  PlanId,
  ProvisionJobStatus,
  SubscriptionStatus
} from "@web3homeoffice/shared";

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ProfileRow = {
  user_id: string;
  handle: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
};

export type PlanRow = {
  plan_id: PlanId;
  name: string;
  creem_product_id: string;
  monthly_price_id: string;
  yearly_price_id: string;
  limits: Json;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type SubscriptionRow = {
  user_id: string;
  creem_customer_id: string | null;
  creem_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_end: string | null;
  plan_id: PlanId | null;
  interval: BillingInterval | null;
  updated_at: string;
};

export type ProvisionJobRow = {
  id: string;
  user_id: string;
  plan_id: PlanId;
  template: "vps-base" | "rpc-placeholder";
  status: ProvisionJobStatus;
  region: string;
  instance_id: string | null;
  ip: string | null;
  logs: Json;
  created_at: string;
  updated_at: string;
};

export type PlatformAccountRow = {
  id: string;
  user_id: string;
  platform: "telegram" | "farcaster" | "base";
  platform_user_id: string;
  username: string | null;
  metadata: Json;
  created_at: string;
};

export type WebhookEventRow = {
  id: string;
  provider: string;
  type: string;
  payload: Json;
  received_at: string;
};


```

### `apps/web/src/types/domain.ts`
```ts
export type PlanId = "starter" | "pro" | "scale";
export type BillingInterval = "monthly" | "yearly";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";
export type ProvisionJobStatus =
  | "pending"
  | "running"
  | "provisioned"
  | "failed"
  | "revoked";
export type GraphicsQuality = "low" | "medium" | "high";


```

### `apps/web/src/types/supabase.ts`
```ts
import type { BillingInterval, PlanId, ProvisionJobStatus, SubscriptionStatus } from "@web3homeoffice/shared";

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          handle: string | null;
          role: "user" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          handle?: string | null;
          role?: "user" | "admin";
        };
        Update: {
          handle?: string | null;
          role?: "user" | "admin";
          updated_at?: string;
        };
      };
      plans: {
        Row: {
          plan_id: PlanId;
          name: string;
          creem_product_id: string;
          monthly_price_id: string;
          yearly_price_id: string;
          limits: Json;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          plan_id: PlanId;
          name: string;
          creem_product_id: string;
          monthly_price_id: string;
          yearly_price_id: string;
          limits: Json;
          active?: boolean;
        };
        Update: {
          name?: string;
          creem_product_id?: string;
          monthly_price_id?: string;
          yearly_price_id?: string;
          limits?: Json;
          active?: boolean;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          user_id: string;
          creem_customer_id: string | null;
          creem_subscription_id: string | null;
          status: SubscriptionStatus;
          current_period_end: string | null;
          plan_id: PlanId | null;
          interval: BillingInterval | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          creem_customer_id?: string | null;
          creem_subscription_id?: string | null;
          status?: SubscriptionStatus;
          current_period_end?: string | null;
          plan_id?: PlanId | null;
          interval?: BillingInterval | null;
        };
        Update: {
          creem_customer_id?: string | null;
          creem_subscription_id?: string | null;
          status?: SubscriptionStatus;
          current_period_end?: string | null;
          plan_id?: PlanId | null;
          interval?: BillingInterval | null;
          updated_at?: string;
        };
      };
      provision_jobs: {
        Row: {
          id: string;
          user_id: string;
          plan_id: PlanId;
          template: "vps-base" | "rpc-placeholder";
          status: ProvisionJobStatus;
          region: string;
          instance_id: string | null;
          ip: string | null;
          logs: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: PlanId;
          template: "vps-base" | "rpc-placeholder";
          status?: ProvisionJobStatus;
          region: string;
          instance_id?: string | null;
          ip?: string | null;
          logs?: Json;
        };
        Update: {
          status?: ProvisionJobStatus;
          instance_id?: string | null;
          ip?: string | null;
          logs?: Json;
          updated_at?: string;
        };
      };
      platform_accounts: {
        Row: {
          id: string;
          user_id: string;
          platform: "telegram" | "farcaster" | "base";
          platform_user_id: string;
          username: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: "telegram" | "farcaster" | "base";
          platform_user_id: string;
          username?: string | null;
          metadata?: Json;
        };
        Update: {
          username?: string | null;
          metadata?: Json;
        };
      };
      webhook_events: {
        Row: {
          id: string;
          provider: string;
          type: string;
          payload: Json;
          received_at: string;
        };
        Insert: {
          id: string;
          provider: string;
          type: string;
          payload: Json;
        };
        Update: {
          type?: string;
          payload?: Json;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      dequeue_provision_jobs: {
        Args: { batch_size?: number };
        Returns: Database["public"]["Tables"]["provision_jobs"]["Row"][];
      };
      append_provision_job_log: {
        Args: { job_id: string; log_line: Json };
        Returns: undefined;
      };
    };
    Enums: {
      subscription_status: SubscriptionStatus;
      billing_interval: BillingInterval;
      provision_job_status: ProvisionJobStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};


```

### `apps/web/supabase/migrations/0001_init.sql`
```sql
create extension if not exists pgcrypto;

create type public.app_role as enum ('user', 'admin');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'expired');
create type public.billing_interval as enum ('monthly', 'yearly');
create type public.provision_job_status as enum ('pending', 'running', 'provisioned', 'failed', 'revoked');
create type public.provision_template as enum ('vps-base', 'rpc-placeholder');
create type public.platform_name as enum ('telegram', 'farcaster', 'base');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  role public.app_role not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.plans (
  plan_id text primary key check (plan_id in ('starter', 'pro', 'scale')),
  name text not null,
  creem_product_id text not null,
  monthly_price_id text not null,
  yearly_price_id text not null,
  limits jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  creem_customer_id text,
  creem_subscription_id text,
  status public.subscription_status not null default 'expired',
  current_period_end timestamptz,
  plan_id text references public.plans(plan_id),
  interval public.billing_interval,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.provision_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.plans(plan_id),
  template public.provision_template not null,
  status public.provision_job_status not null default 'pending',
  region text not null,
  instance_id text,
  ip text,
  logs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platform_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform public.platform_name not null,
  platform_user_id text not null,
  username text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique(platform, platform_user_id)
);

create table if not exists public.webhook_events (
  id text primary key,
  provider text not null,
  type text not null,
  payload jsonb not null,
  received_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_provision_jobs_user_status on public.provision_jobs(user_id, status);
create index if not exists idx_provision_jobs_status_created on public.provision_jobs(status, created_at);
create index if not exists idx_platform_accounts_user on public.platform_accounts(user_id);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_plans_updated_at
before update on public.plans
for each row
execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

create trigger set_provision_jobs_updated_at
before update on public.provision_jobs
for each row
execute function public.set_updated_at();


```

### `apps/web/supabase/migrations/0002_rls_policies.sql`
```sql
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.provision_jobs enable row level security;
alter table public.platform_accounts enable row level security;
alter table public.webhook_events enable row level security;

create or replace function public.is_admin(user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = user_uuid and p.role = 'admin'
  );
$$;

create policy "profiles_select_self" on public.profiles
for select
using (auth.uid() = user_id);

create policy "profiles_update_self" on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "profiles_admin_all" on public.profiles
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "plans_public_read" on public.plans
for select
using (active = true);

create policy "plans_admin_all" on public.plans
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "subscriptions_select_self" on public.subscriptions
for select
using (auth.uid() = user_id);

create policy "subscriptions_admin_all" on public.subscriptions
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "provision_jobs_select_self" on public.provision_jobs
for select
using (auth.uid() = user_id);

create policy "provision_jobs_admin_all" on public.provision_jobs
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "platform_accounts_select_self" on public.platform_accounts
for select
using (auth.uid() = user_id);

create policy "platform_accounts_admin_all" on public.platform_accounts
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "webhook_events_admin_read" on public.webhook_events
for select
using (public.is_admin(auth.uid()));


```

### `apps/web/supabase/migrations/0003_queue_functions.sql`
```sql
create or replace function public.dequeue_provision_jobs(batch_size int default 5)
returns setof public.provision_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidate as (
    select pj.id
    from public.provision_jobs pj
    where pj.status = 'pending'
    order by pj.created_at asc
    for update skip locked
    limit batch_size
  ),
  updated as (
    update public.provision_jobs pj
    set status = 'running',
        updated_at = timezone('utc', now()),
        logs = pj.logs || jsonb_build_array(
          jsonb_build_object(
            'ts', timezone('utc', now()),
            'level', 'info',
            'message', 'Job claimed by worker'
          )
        )
    where pj.id in (select id from candidate)
    returning pj.*
  )
  select * from updated;
end;
$$;

create or replace function public.append_provision_job_log(job_id uuid, log_line jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  update public.provision_jobs
  set logs = logs || jsonb_build_array(log_line),
      updated_at = timezone('utc', now())
  where id = job_id;
$$;


```

### `apps/web/supabase/migrations/0004_seed_plans.sql`
```sql
insert into public.plans (plan_id, name, creem_product_id, monthly_price_id, yearly_price_id, limits)
values
  (
    'starter',
    'Starter',
    'creem_prod_starter',
    'creem_price_starter_monthly',
    'creem_price_starter_yearly',
    '{"instances": 1, "regions": ["ap-singapore"]}'::jsonb
  ),
  (
    'pro',
    'Pro',
    'creem_prod_pro',
    'creem_price_pro_monthly',
    'creem_price_pro_yearly',
    '{"instances": 3, "regions": ["ap-singapore", "ap-jakarta"]}'::jsonb
  ),
  (
    'scale',
    'Scale',
    'creem_prod_scale',
    'creem_price_scale_monthly',
    'creem_price_scale_yearly',
    '{"instances": 10, "regions": ["ap-singapore", "ap-jakarta", "ap-hongkong"]}'::jsonb
  )
on conflict (plan_id)
do update set
  name = excluded.name,
  creem_product_id = excluded.creem_product_id,
  monthly_price_id = excluded.monthly_price_id,
  yearly_price_id = excluded.yearly_price_id,
  limits = excluded.limits,
  active = true,
  updated_at = timezone('utc', now());


```

### `apps/web/tailwind.config.ts`
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        panel: "var(--color-panel)",
        border: "var(--color-border)",
        glow: "var(--color-glow)",
        accent: "var(--color-accent)",
        "accent-2": "var(--color-accent-2)",
        text: "var(--color-text)",
        muted: "var(--color-muted)"
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "calc(var(--radius-lg) - 2px)",
        sm: "calc(var(--radius-lg) - 6px)"
      },
      boxShadow: {
        neon: "0 0 18px rgba(32, 212, 255, 0.45)",
        panel: "0 12px 40px rgba(2, 6, 23, 0.35)"
      }
    }
  },
  darkMode: ["class"],
  plugins: []
};

export default config;


```

### `apps/web/tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "jsx": "preserve",
    "incremental": true,
    "noUncheckedIndexedAccess": false,
    "noImplicitAny": false,
    "paths": {
      "@/*": [
        "src/*"
      ]
    },
    "types": [
      "vitest/globals",
      "node"
    ],
    "noEmit": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    "src/**/*.ts",
    "src/**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

### `apps/web/vitest.config.ts`
```ts
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"]
  }
});


```

### `package.json`
```json
{
  "name": "web3homeoffice",
  "private": true,
  "version": "0.1.0",
  "packageManager": "pnpm@10.29.2",
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "dev": "pnpm --filter @web3homeoffice/web dev",
    "build": "pnpm -r build",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm --filter @web3homeoffice/web test",
    "smoke": "pnpm --filter @web3homeoffice/web test:smoke && pnpm -r typecheck"
  }
}


```

### `packages/shared/package.json`
```json
{
  "name": "@web3homeoffice/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}

```

### `packages/shared/src/index.ts`
```ts
export * from "./plans";
export * from "./statuses";
export * from "./zod-schemas";

```

### `packages/shared/src/plans.ts`
```ts
export type PlanId = "starter" | "pro" | "scale";
export type BillingInterval = "monthly" | "yearly";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  description: string;
  limits: {
    instances: number;
    regions: string[];
  };
};

export const PLAN_IDS = ["starter", "pro", "scale"] as const;

export const DEFAULT_REGION = "ap-singapore";

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Solo builder tier with one managed node.",
    limits: {
      instances: 1,
      regions: [DEFAULT_REGION]
    }
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing teams with multi-instance workloads.",
    limits: {
      instances: 3,
      regions: [DEFAULT_REGION, "ap-jakarta"]
    }
  },
  {
    id: "scale",
    name: "Scale",
    description: "Production scale with expanded regional footprint.",
    limits: {
      instances: 10,
      regions: [DEFAULT_REGION, "ap-jakarta", "ap-hongkong"]
    }
  }
];

```

### `packages/shared/src/statuses.ts`
```ts
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export type ProvisionJobStatus =
  | "pending"
  | "running"
  | "provisioned"
  | "failed"
  | "revoked";

export const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ["trialing", "active"];

export const TERMINAL_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ["canceled", "expired"];

export const OPEN_PROVISION_JOB_STATUSES: ProvisionJobStatus[] = ["pending", "running"];

```

### `packages/shared/src/zod-schemas.ts`
```ts
import { z } from "zod";

import { PLAN_IDS } from "./plans";

export const planIdSchema = z.enum(PLAN_IDS);

export const billingIntervalSchema = z.enum(["monthly", "yearly"]);

export const checkoutPayloadSchema = z.object({
  planId: planIdSchema,
  interval: billingIntervalSchema,
  successPath: z.string().optional(),
  cancelPath: z.string().optional()
});

export const provisionTemplateSchema = z.enum(["vps-base", "rpc-placeholder"]);

export const createProvisionJobSchema = z.object({
  planTemplate: provisionTemplateSchema,
  region: z.string().default("ap-singapore"),
  sshPublicKey: z.string().min(20).max(4096).optional()
});

```

### `packages/shared/tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "declaration": true,
    "emitDeclarationOnly": false,
    "noUncheckedIndexedAccess": false,
    "noEmit": false
  },
  "include": ["src/**/*.ts"]
}

```

### `pnpm-workspace.yaml`
```yaml
packages:
  - "apps/*"
  - "packages/*"


```

### `README.md`
```markdown
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
apps/web          # Next.js app (Vercel)
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

3. Run Supabase SQL migrations from `apps/web/supabase/migrations` in order `0001` -> `0004`.

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
- `LIGHTHOUSE_ZONE`
- `LIGHTHOUSE_INSTANCE_TYPE`

## Creem integration

- Checkout endpoint: `POST /api/billing/checkout`
- Webhook endpoint: `POST /api/billing/webhook`
- Portal endpoint: `POST /api/billing/portal`

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
6. Worker updates job (`running -> provisioned|failed`) and appends logs.

## Deploy

### Vercel (`apps/web`)

- Import repo into Vercel.
- Set root directory to `apps/web` or use framework auto-detection.
- Add all web env vars in Vercel project settings.
- Configure Creem webhook target to deployed URL.

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

## Testing

Minimal critical tests are included under `apps/web/src/tests`:

- webhook signature verification
- webhook payload normalization
- subscription access guard logic
- smoke import test

Run:

```bash
pnpm smoke
```


```

### `tsconfig.base.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "allowJs": false,
    "checkJs": false,
    "strict": true,
    "skipLibCheck": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": "."
  }
}


```

