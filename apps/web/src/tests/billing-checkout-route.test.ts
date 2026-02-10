import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getPlanById: vi.fn(),
  planPriceId: vi.fn(),
  armAutoInstallPreference: vi.fn(),
  createCreemCheckoutSession: vi.fn()
}));

vi.mock("@/lib/auth/session", () => ({
  requireUser: mocks.requireUser
}));

vi.mock("@/lib/billing/subscription-service", () => ({
  getPlanById: mocks.getPlanById,
  planPriceId: mocks.planPriceId,
  armAutoInstallPreference: mocks.armAutoInstallPreference
}));

vi.mock("@/lib/billing/creem-client", () => ({
  createCreemCheckoutSession: mocks.createCreemCheckoutSession
}));

function createJsonRequest(payload: unknown) {
  return new Request("http://localhost/api/billing/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  }) as unknown as NextRequest;
}

describe("billing checkout route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

    mocks.requireUser.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000001",
      email: "user@example.com"
    });
    mocks.getPlanById.mockResolvedValue({
      plan_id: "starter",
      monthly_price_id: "price_monthly",
      yearly_price_id: "price_yearly"
    });
    mocks.planPriceId.mockReturnValue("price_monthly");
    mocks.armAutoInstallPreference.mockResolvedValue(undefined);
    mocks.createCreemCheckoutSession.mockResolvedValue({
      id: "checkout_123",
      url: "https://checkout.example/session"
    });
  });

  it("arms default auto-install preference when payload omits autoInstall", async () => {
    const route = await import("@/app/api/billing/checkout/route");
    const response = await route.POST(
      createJsonRequest({
        planId: "starter",
        interval: "monthly",
        successPath: "/billing/success",
        cancelPath: "/billing"
      })
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.checkoutUrl).toBe("https://checkout.example/session");
    expect(mocks.armAutoInstallPreference).toHaveBeenCalledWith({
      userId: "00000000-0000-0000-0000-000000000001",
      template: "vps-base",
      os: "ubuntu"
    });
    expect(mocks.createCreemCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          auto_install_template: "vps-base",
          auto_install_os: "ubuntu"
        })
      })
    );
  });

  it("uses desktop-provided autoInstall config when supplied", async () => {
    const route = await import("@/app/api/billing/checkout/route");
    const response = await route.POST(
      createJsonRequest({
        planId: "pro",
        interval: "yearly",
        autoInstall: {
          template: "rpc-placeholder",
          os: "debian"
        }
      })
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.checkoutUrl).toBe("https://checkout.example/session");
    expect(mocks.armAutoInstallPreference).toHaveBeenCalledWith({
      userId: "00000000-0000-0000-0000-000000000001",
      template: "rpc-placeholder",
      os: "debian"
    });
    expect(mocks.createCreemCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          auto_install_template: "rpc-placeholder",
          auto_install_os: "debian"
        })
      })
    );
  });
});

