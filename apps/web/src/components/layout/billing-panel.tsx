"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CreditCard, LoaderCircle, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

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
  supportEmail: string;
};

export function BillingPanel({
  plans,
  activePlanId,
  activeInterval,
  subscriptionStatus,
  supportEmail
}: BillingPanelProps) {
  const [interval, setInterval] = useState<"monthly" | "yearly">(activeInterval ?? "monthly");
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelRequest, setShowCancelRequest] = useState(false);
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
        | { url: string | null; fallback: "support" | null; canRequestCancellation: boolean }
        | { error: { message: string } };

      if (!response.ok || "error" in payload) {
        setMessage("error" in payload ? payload.error.message : "Unable to open portal");
      } else if (payload.url) {
        window.location.href = payload.url;
      } else {
        setShowCancelRequest(payload.canRequestCancellation);
        setMessage(`Customer portal unavailable. Contact ${supportEmail} for billing support.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open portal");
    }

    setPortalBusy(false);
  };

  const onRequestCancellation = async () => {
    setCancelBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/billing/cancel-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason: cancelReason
        })
      });

      const payload = (await response.json()) as
        | { requested: boolean }
        | { error: { message: string } };

      if (!response.ok || "error" in payload) {
        setMessage("error" in payload ? payload.error.message : "Unable to submit cancellation request");
      } else {
        setCancelReason("");
        setMessage("Cancellation request submitted. Our team will review it shortly.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit cancellation request");
    }

    setCancelBusy(false);
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

          {showCancelRequest ? (
            <div className="space-y-2 rounded-md border border-border/60 bg-black/20 p-3">
              <p className="text-sm font-medium text-text">Request cancellation</p>
              <Textarea
                placeholder="Tell us why you want to cancel (minimum 10 characters)"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
              />
              <Button
                variant="outline"
                onClick={onRequestCancellation}
                disabled={cancelBusy || cancelReason.trim().length < 10}
              >
                {cancelBusy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit cancellation request
              </Button>
            </div>
          ) : null}

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
                {plan.limits.instances} instances · Regions: {plan.limits.regions.join(", ")}
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


