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
  retry_count: number;
  max_retries: number;
  next_retry_at: string;
  last_error: string | null;
  ssh_public_key: string | null;
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

export async function updateProvisionJob(
  jobId: string,
  patch: Partial<
    Pick<
      ProvisionJob,
      "status" | "instance_id" | "ip" | "retry_count" | "next_retry_at" | "last_error"
    >
  >
) {
  const { error } = await supabaseAdmin.from("provision_jobs").update(patch).eq("id", jobId);

  if (error) throw new Error(`Failed to update job ${jobId}: ${error.message}`);
}


