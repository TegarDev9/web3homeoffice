import type { PlanId, ProvisionJobStatus } from "@web3homeoffice/shared";

import { AppError } from "@/lib/api/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProvisionJobRow } from "@/types/db";
import type { Database, Json } from "@/types/supabase";

export async function createProvisionJob(params: {
  userId: string;
  planId: PlanId;
  template: "vps-base" | "rpc-placeholder";
  region: string;
  sshPublicKey?: string;
  logs?: Json[];
}) {
  const admin = createSupabaseAdminClient();

  const payload: Database["public"]["Tables"]["provision_jobs"]["Insert"] = {
    user_id: params.userId,
    plan_id: params.planId,
    template: params.template,
    status: "pending",
    region: params.region,
    ssh_public_key: params.sshPublicKey ?? null,
    logs: params.logs ?? []
  };

  const result = await admin
    .from("provision_jobs")
    .insert(payload)
    .select("id,status")
    .single();

  const data = result.data as { id: string; status: ProvisionJobStatus } | null;
  const error = result.error;

  if (error || !data) {
    throw new AppError(error?.message ?? "Failed to create provision job", 500, "PROVISION_JOB_CREATE_FAILED");
  }

  return data;
}

export async function listProvisionJobsForUser(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("provision_jobs")
    .select(
      "id,user_id,plan_id,template,status,region,instance_id,ip,retry_count,max_retries,next_retry_at,last_error,ssh_public_key,logs,created_at,updated_at"
    )
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
    .select(
      "id,user_id,plan_id,template,status,region,instance_id,ip,retry_count,max_retries,next_retry_at,last_error,ssh_public_key,logs,created_at,updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<ProvisionJobRow[]>();

  if (error) {
    throw new AppError(error.message, 500, "PROVISION_JOB_LIST_FAILED");
  }

  return data;
}

export async function retryProvisionJobByAdmin(jobId: string, actorUserId: string) {
  const admin = createSupabaseAdminClient();
  const { data: job, error: jobError } = await admin
    .from("provision_jobs")
    .select("id,status,retry_count,max_retries")
    .eq("id", jobId)
    .maybeSingle();

  if (jobError) {
    throw new AppError(jobError.message, 500, "PROVISION_JOB_READ_FAILED");
  }
  if (!job) {
    throw new AppError("Provision job not found", 404, "PROVISION_JOB_NOT_FOUND");
  }
  if (job.status !== "failed") {
    throw new AppError("Only failed jobs can be retried manually", 409, "PROVISION_JOB_NOT_RETRYABLE");
  }

  const { error: updateError } = await admin
    .from("provision_jobs")
    .update({
      status: "pending",
      retry_count: 0,
      last_error: null,
      next_retry_at: new Date().toISOString()
    })
    .eq("id", jobId);

  if (updateError) {
    throw new AppError(updateError.message, 500, "PROVISION_JOB_RETRY_FAILED");
  }

  const { error: logError } = await admin.rpc("append_provision_job_log", {
    job_id: jobId,
    log_line: {
      ts: new Date().toISOString(),
      level: "warn",
      message: "Provision job manually retried by admin",
      actor_user_id: actorUserId
    }
  });

  if (logError) {
    throw new AppError(logError.message, 500, "PROVISION_JOB_LOG_APPEND_FAILED");
  }
}


