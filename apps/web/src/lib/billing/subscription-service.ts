import type {
  BillingInterval,
  PlanId,
  ProvisionOs,
  ProvisionTemplate,
  SubscriptionStatus
} from "@web3homeoffice/shared";
import { DEFAULT_PROVISION_OS, DEFAULT_PROVISION_TEMPLATE } from "@web3homeoffice/shared";

import { AppError } from "@/lib/api/errors";
import { createProvisionJob } from "@/lib/provisioning/jobs";
import { parsePlanLimits } from "@/lib/provisioning/limits";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PlanRow } from "@/types/db";
import type { Database, Json } from "@/types/supabase";

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

export const AUTO_INSTALL_ARM_WINDOW_MS = 2 * 60 * 60 * 1000;
export const AUTO_INSTALL_DEFAULTS: {
  template: ProvisionTemplate;
  os: ProvisionOs;
} = {
  template: DEFAULT_PROVISION_TEMPLATE,
  os: DEFAULT_PROVISION_OS
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
  const payload: Database["public"]["Tables"]["webhook_events"]["Insert"] = {
    id: event.id,
    provider: "creem",
    type: event.type,
    payload: event.raw as Json
  };
  const { error } = await admin.from("webhook_events").insert(payload);

  if (!error) return true;

  if (error.code === "23505") {
    return false;
  }

  throw new AppError(error.message, 500, "WEBHOOK_EVENT_WRITE_FAILED");
}

export async function armAutoInstallPreference(params: {
  userId: string;
  template: ProvisionTemplate;
  os: ProvisionOs;
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const armExpiresAt = new Date(now.getTime() + AUTO_INSTALL_ARM_WINDOW_MS).toISOString();

  const payload: Database["public"]["Tables"]["auto_install_preferences"]["Insert"] = {
    user_id: params.userId,
    template: params.template,
    target_os: params.os,
    auto_install_armed: true,
    arm_expires_at: armExpiresAt,
    last_checkout_at: now.toISOString(),
    last_triggered_at: null
  };

  const { error } = await admin
    .from("auto_install_preferences")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    throw new AppError(error.message, 500, "AUTO_INSTALL_PREFERENCE_UPSERT_FAILED");
  }

  return {
    armExpiresAt,
    template: params.template,
    os: params.os
  };
}

async function getAutoInstallPreference(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("auto_install_preferences")
    .select(
      "user_id,template,target_os,auto_install_armed,arm_expires_at,last_checkout_at,last_triggered_at,created_at,updated_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "AUTO_INSTALL_PREFERENCE_READ_FAILED");
  }

  return data;
}

async function disarmAutoInstallPreference(userId: string, triggered: boolean) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const payload: Database["public"]["Tables"]["auto_install_preferences"]["Update"] = {
    auto_install_armed: false,
    arm_expires_at: null,
    last_triggered_at: triggered ? now : undefined
  };

  const { error } = await admin.from("auto_install_preferences").update(payload).eq("user_id", userId);

  if (error) {
    throw new AppError(error.message, 500, "AUTO_INSTALL_PREFERENCE_UPDATE_FAILED");
  }
}

export async function maybeQueueAutoProvision(params: {
  userId: string;
  event: NormalizedCreemEvent;
  subscription: Database["public"]["Tables"]["subscriptions"]["Insert"];
}) {
  if (params.event.status !== "active") return;
  if (!params.event.subscriptionId || !params.subscription.plan_id) return;

  const preference = await getAutoInstallPreference(params.userId);
  if (!preference || !preference.auto_install_armed) return;

  if (preference.arm_expires_at && new Date(preference.arm_expires_at).getTime() < Date.now()) {
    await disarmAutoInstallPreference(params.userId, false);
    return;
  }

  const plan = await getPlanById(params.subscription.plan_id);
  const limits = parsePlanLimits(plan.limits);
  const region = limits.regions[0];

  if (!region) {
    throw new AppError("Plan has no default region for auto install", 500, "PLAN_REGION_MISSING");
  }

  await createProvisionJob({
    userId: params.userId,
    planId: params.subscription.plan_id,
    template: preference.template,
    os: preference.target_os,
    region,
    requestSource: "subscription_auto",
    subscriptionId: params.event.subscriptionId,
    logs: [
      {
        ts: new Date().toISOString(),
        level: "info",
        message: "Provision job created from subscription activation",
        requestSource: "subscription_auto",
        subscriptionId: params.event.subscriptionId,
        template: preference.template,
        os: preference.target_os,
        region
      }
    ]
  });

  await disarmAutoInstallPreference(params.userId, true);
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

  const payload: Database["public"]["Tables"]["subscriptions"]["Insert"] = {
    user_id: user.id,
    creem_customer_id: event.customerId,
    creem_subscription_id: event.subscriptionId,
    status: event.status,
    current_period_end: event.currentPeriodEnd,
    plan_id: event.planId,
    interval: event.interval
  };

  const { error } = await admin.from("subscriptions").upsert(payload, { onConflict: "user_id" });
  if (error) {
    throw new AppError(error.message, 500, "SUBSCRIPTION_UPSERT_FAILED");
  }

  await maybeQueueAutoProvision({
    userId: user.id,
    event,
    subscription: payload
  });

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

