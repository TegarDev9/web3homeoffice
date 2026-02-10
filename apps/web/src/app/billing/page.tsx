import { redirect } from "next/navigation";

import { BillingPanel } from "@/components/layout/billing-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureProfileForUser } from "@/lib/auth/admin-bootstrap";
import { getUserSubscription } from "@/lib/auth/guards";
import { getSupportEmail } from "@/lib/env";
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
  const supportEmail = getSupportEmail();

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
        supportEmail={supportEmail}
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


