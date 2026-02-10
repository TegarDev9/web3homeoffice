import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getUserSubscription: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
  from: vi.fn(),
  insert: vi.fn()
}));

vi.mock("@/lib/auth/session", () => ({
  requireUser: mocks.requireUser
}));

vi.mock("@/lib/auth/guards", () => ({
  getUserSubscription: mocks.getUserSubscription
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createSupabaseAdminClient
}));

function createJsonRequest(payload: unknown) {
  return new Request("http://localhost/api/billing/cancel-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  }) as unknown as NextRequest;
}

describe("billing cancel request route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({
      insert: mocks.insert
    });
    mocks.createSupabaseAdminClient.mockReturnValue({
      from: mocks.from
    });
  });

  it("creates cancellation request row for current user", async () => {
    mocks.requireUser.mockResolvedValue({ id: "00000000-0000-0000-0000-000000000001" });
    mocks.getUserSubscription.mockResolvedValue({
      creem_subscription_id: "sub_123"
    });
    mocks.insert.mockResolvedValue({ error: null });

    const route = await import("@/app/api/billing/cancel-request/route");
    const response = await route.POST(createJsonRequest({ reason: "Need to reduce monthly cost burden." }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ requested: true });
    expect(mocks.from).toHaveBeenCalledWith("cancellation_requests");
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "00000000-0000-0000-0000-000000000001",
        subscription_id: "sub_123",
        status: "open"
      })
    );
  });

  it("returns an error response when reason is invalid", async () => {
    mocks.requireUser.mockResolvedValue({ id: "00000000-0000-0000-0000-000000000001" });
    mocks.getUserSubscription.mockResolvedValue({
      creem_subscription_id: "sub_123"
    });

    const route = await import("@/app/api/billing/cancel-request/route");
    const response = await route.POST(createJsonRequest({ reason: "short" }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
