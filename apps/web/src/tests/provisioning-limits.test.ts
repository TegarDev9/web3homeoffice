import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/lib/api/errors";
import { ensureProvisionWithinLimit, parsePlanLimits } from "@/lib/provisioning/limits";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn()
}));

const mockedCreateSupabaseAdminClient = vi.mocked(createSupabaseAdminClient);

function createMockAdminClient(instances: number, count: number) {
  const planRow = {
    plan_id: "starter",
    name: "Starter",
    creem_product_id: "prod_starter",
    monthly_price_id: "price_starter_monthly",
    yearly_price_id: "price_starter_yearly",
    limits: {
      instances,
      regions: ["ap-singapore"]
    },
    active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  };

  return {
    from: vi.fn((table: string) => {
      if (table === "plans") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: planRow,
                  error: null
                })
              })
            })
          })
        };
      }

      if (table === "provision_jobs") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                count,
                error: null
              })
            })
          })
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    })
  };
}

describe("provisioning limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses valid plan limits", () => {
    const limits = parsePlanLimits({
      instances: 3,
      regions: ["ap-singapore", "ap-jakarta"]
    });

    expect(limits.instances).toBe(3);
    expect(limits.regions).toEqual(["ap-singapore", "ap-jakarta"]);
  });

  it("rejects when active/pending/running count reaches plan limit", async () => {
    mockedCreateSupabaseAdminClient.mockReturnValue(createMockAdminClient(1, 1) as never);

    await expect(ensureProvisionWithinLimit("user-1", "starter")).rejects.toMatchObject({
      status: 409,
      code: "PROVISION_LIMIT_REACHED"
    } satisfies Pick<AppError, "status" | "code">);
  });

  it("allows provisioning when usage is below plan limit", async () => {
    mockedCreateSupabaseAdminClient.mockReturnValue(createMockAdminClient(3, 2) as never);

    const limits = await ensureProvisionWithinLimit("user-1", "starter");
    expect(limits.instances).toBe(3);
    expect(limits.regions).toContain("ap-singapore");
  });
});
