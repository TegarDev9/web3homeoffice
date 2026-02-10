import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseAdminClient: vi.fn(),
  createProvisionJob: vi.fn()
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createSupabaseAdminClient
}));

vi.mock("@/lib/provisioning/jobs", () => ({
  createProvisionJob: mocks.createProvisionJob
}));

type PreferenceState = {
  user_id: string;
  template: "vps-base" | "rpc-placeholder";
  target_os: "debian" | "ubuntu" | "kali";
  auto_install_armed: boolean;
  arm_expires_at: string | null;
  last_checkout_at: string | null;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
};

type TestState = {
  preference: PreferenceState | null;
};

function createMockAdminClient(state: TestState) {
  return {
    from: vi.fn((table: string) => {
      if (table === "auto_install_preferences") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: state.preference,
                error: null
              })
            })
          }),
          update: vi.fn((patch: Partial<PreferenceState>) => ({
            eq: vi.fn().mockImplementation(async () => {
              if (state.preference) {
                state.preference = {
                  ...state.preference,
                  ...patch,
                  updated_at: new Date().toISOString()
                };
              }

              return { error: null };
            })
          }))
        };
      }

      if (table === "plans") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    plan_id: "starter",
                    name: "Starter",
                    creem_product_id: "prod_starter",
                    monthly_price_id: "price_monthly",
                    yearly_price_id: "price_yearly",
                    limits: {
                      instances: 1,
                      regions: ["ap-singapore"]
                    },
                    active: true,
                    created_at: "2026-01-01T00:00:00.000Z",
                    updated_at: "2026-01-01T00:00:00.000Z"
                  },
                  error: null
                })
              })
            })
          })
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    })
  };
}

function createEvent(status: "active" | "trialing" | "canceled") {
  return {
    id: "evt_1",
    type: `subscription.${status}`,
    subscriptionId: "sub_1",
    customerId: "cus_1",
    customerEmail: "user@example.com",
    status,
    currentPeriodEnd: null,
    interval: "monthly" as const,
    planId: "starter" as const,
    raw: {}
  };
}

function createSubscription(status: "active" | "trialing" | "canceled") {
  return {
    user_id: "user-1",
    creem_customer_id: "cus_1",
    creem_subscription_id: "sub_1",
    status,
    current_period_end: null,
    plan_id: "starter" as const,
    interval: "monthly" as const
  };
}

describe("subscription auto install queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queues auto provision for active event when preference is armed", async () => {
    const state: TestState = {
      preference: {
        user_id: "user-1",
        template: "vps-base",
        target_os: "ubuntu",
        auto_install_armed: true,
        arm_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        last_checkout_at: new Date().toISOString(),
        last_triggered_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };

    mocks.createSupabaseAdminClient.mockReturnValue(createMockAdminClient(state) as never);
    mocks.createProvisionJob.mockResolvedValue({ id: "job_1", status: "pending" });

    const module = await import("@/lib/billing/subscription-service");
    await module.maybeQueueAutoProvision({
      userId: "user-1",
      event: createEvent("active"),
      subscription: createSubscription("active")
    });

    expect(mocks.createProvisionJob).toHaveBeenCalledWith(
      expect.objectContaining({
        requestSource: "subscription_auto",
        subscriptionId: "sub_1",
        template: "vps-base",
        os: "ubuntu",
        region: "ap-singapore"
      })
    );
    expect(state.preference?.auto_install_armed).toBe(false);
    expect(state.preference?.last_triggered_at).toBeTruthy();
  });

  it("does not queue second job for duplicate active webhook", async () => {
    const state: TestState = {
      preference: {
        user_id: "user-1",
        template: "rpc-placeholder",
        target_os: "debian",
        auto_install_armed: true,
        arm_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        last_checkout_at: new Date().toISOString(),
        last_triggered_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };

    mocks.createSupabaseAdminClient.mockReturnValue(createMockAdminClient(state) as never);
    mocks.createProvisionJob.mockResolvedValue({ id: "job_2", status: "pending" });

    const module = await import("@/lib/billing/subscription-service");
    const payload = {
      userId: "user-1",
      event: createEvent("active"),
      subscription: createSubscription("active")
    };

    await module.maybeQueueAutoProvision(payload);
    await module.maybeQueueAutoProvision(payload);

    expect(mocks.createProvisionJob).toHaveBeenCalledTimes(1);
  });

  it("skips non-active events", async () => {
    const module = await import("@/lib/billing/subscription-service");

    await module.maybeQueueAutoProvision({
      userId: "user-1",
      event: createEvent("trialing"),
      subscription: createSubscription("trialing")
    });

    expect(mocks.createSupabaseAdminClient).not.toHaveBeenCalled();
    expect(mocks.createProvisionJob).not.toHaveBeenCalled();
  });

  it("does not queue when arm window is expired", async () => {
    const state: TestState = {
      preference: {
        user_id: "user-1",
        template: "vps-base",
        target_os: "kali",
        auto_install_armed: true,
        arm_expires_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        last_checkout_at: new Date().toISOString(),
        last_triggered_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };

    mocks.createSupabaseAdminClient.mockReturnValue(createMockAdminClient(state) as never);

    const module = await import("@/lib/billing/subscription-service");
    await module.maybeQueueAutoProvision({
      userId: "user-1",
      event: createEvent("active"),
      subscription: createSubscription("active")
    });

    expect(mocks.createProvisionJob).not.toHaveBeenCalled();
    expect(state.preference?.auto_install_armed).toBe(false);
  });
});

