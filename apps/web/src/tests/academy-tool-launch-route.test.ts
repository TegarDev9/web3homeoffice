import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAcademyAccessContext: vi.fn(),
  getAcademyToolById: vi.fn(),
  createAcademyActivityLog: vi.fn(),
  isAcademyEvmEnabled: vi.fn()
}));

vi.mock("@/lib/academy/access", () => ({
  getAcademyAccessContext: mocks.getAcademyAccessContext
}));

vi.mock("@/lib/academy/catalog", () => ({
  getAcademyToolById: mocks.getAcademyToolById
}));

vi.mock("@/lib/academy/logs", () => ({
  createAcademyActivityLog: mocks.createAcademyActivityLog
}));

vi.mock("@/lib/env", () => ({
  isAcademyEvmEnabled: mocks.isAcademyEvmEnabled
}));

describe("academy tool launch route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAcademyEvmEnabled.mockReturnValue(false);
  });

  it("blocks preview users on member-only tool", async () => {
    mocks.getAcademyAccessContext.mockResolvedValue({
      accessLevel: "preview",
      userId: null,
      hasActiveSubscription: false
    });
    mocks.getAcademyToolById.mockResolvedValue({
      id: "123e4567-e89b-12d3-a456-426614174001",
      room_id: "nft-digital-ownership",
      tool_key: "nft-ticketing-flow",
      is_member_only: true
    });
    mocks.createAcademyActivityLog.mockResolvedValue(undefined);

    const route = await import("@/app/api/academy/tools/[toolId]/launch/route");
    const response = await route.POST(
      new Request("http://localhost/api/academy/tools/123e4567-e89b-12d3-a456-426614174001/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      }),
      {
        params: Promise.resolve({
          toolId: "123e4567-e89b-12d3-a456-426614174001"
        })
      }
    );

    const body = await response.json();
    expect(response.status).toBe(402);
    expect(body.error.code).toBe("SUBSCRIPTION_REQUIRED");
  });

  it("allows launch for accessible tool", async () => {
    mocks.getAcademyAccessContext.mockResolvedValue({
      accessLevel: "member",
      userId: "user-1",
      hasActiveSubscription: true
    });
    mocks.getAcademyToolById.mockResolvedValue({
      id: "123e4567-e89b-12d3-a456-426614174002",
      room_id: "nft-digital-ownership",
      tool_key: "nft-membership-pass",
      is_member_only: false,
      action_kind: "demo",
      action_payload: { demo: "membership-pass" }
    });
    mocks.createAcademyActivityLog.mockResolvedValue(undefined);

    const route = await import("@/app/api/academy/tools/[toolId]/launch/route");
    const response = await route.POST(
      new Request("http://localhost/api/academy/tools/123e4567-e89b-12d3-a456-426614174002/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      }),
      {
        params: Promise.resolve({
          toolId: "123e4567-e89b-12d3-a456-426614174002"
        })
      }
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.allowed).toBe(true);
    expect(body.tool.toolKey).toBe("nft-membership-pass");
  });
});
