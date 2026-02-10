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


