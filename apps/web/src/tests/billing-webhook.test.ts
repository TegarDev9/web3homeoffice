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


