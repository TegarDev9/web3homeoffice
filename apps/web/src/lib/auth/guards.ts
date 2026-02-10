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


