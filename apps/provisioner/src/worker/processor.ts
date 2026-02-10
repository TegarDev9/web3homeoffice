import { buildBootstrapScript } from "../providers/bootstrap-script";
import type { ProvisionProvider } from "../providers/types";
import type { ProvisionJob } from "../supabase";
import { appendJobLog, updateProvisionJob } from "../supabase";
import { computeRetryOutcome } from "./retry-policy";

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

    const script = buildBootstrapScript(job.template, {
      sshPublicKey: job.ssh_public_key ?? undefined
    });
    await provider.bootstrapInstance(job, provisioned.instanceId, script);

    await appendJobLog(job.id, "info", "Bootstrap command submitted");

    await updateProvisionJob(job.id, {
      status: "provisioned",
      instance_id: provisioned.instanceId,
      ip: provisioned.publicIp,
      last_error: null
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "unknown error";
    const retryOutcome = computeRetryOutcome(job.retry_count, job.max_retries);

    await appendJobLog(job.id, "error", "Provision workflow failed", {
      message: errorMessage,
      retryCount: retryOutcome.retryCount,
      maxRetries: job.max_retries
    });

    if (!retryOutcome.isTerminalFailure) {
      await appendJobLog(job.id, "warn", "Scheduling retry", {
        retryCount: retryOutcome.retryCount,
        maxRetries: job.max_retries,
        nextRetryAt: retryOutcome.nextRetryAt
      });

      await updateProvisionJob(job.id, {
        status: "pending",
        retry_count: retryOutcome.retryCount,
        next_retry_at: retryOutcome.nextRetryAt,
        last_error: errorMessage
      });
    } else {
      await appendJobLog(job.id, "error", "Retry limit reached, job marked failed", {
        retryCount: retryOutcome.retryCount,
        maxRetries: job.max_retries
      });

      await updateProvisionJob(job.id, {
        status: "failed",
        retry_count: retryOutcome.retryCount,
        next_retry_at: retryOutcome.nextRetryAt,
        last_error: errorMessage
      });
    }

    throw error;
  }
}


