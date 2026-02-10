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
      os: payload.os,
      region: payload.region,
      requestSource: "manual",
      sshPublicKey: payload.sshPublicKey,
      logs: [
        {
          ts: new Date().toISOString(),
          level: "info",
          message: "Provision job created",
          template: payload.planTemplate,
          os: payload.os,
          requestSource: "manual",
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


