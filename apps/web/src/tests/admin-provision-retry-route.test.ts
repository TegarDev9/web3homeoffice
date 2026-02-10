import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

import { AppError } from "@/lib/api/errors";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
  retryProvisionJobByAdmin: vi.fn()
}));

vi.mock("@/lib/auth/session", () => ({
  requireUser: mocks.requireUser
}));

vi.mock("@/lib/auth/guards", () => ({
  requireAdmin: mocks.requireAdmin
}));

vi.mock("@/lib/provisioning/jobs", () => ({
  retryProvisionJobByAdmin: mocks.retryProvisionJobByAdmin
}));

function createJsonRequest(payload: unknown) {
  return new Request("http://localhost/api/admin/provision-jobs/retry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  }) as unknown as NextRequest;
}

describe("admin provision retry route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "00000000-0000-0000-0000-000000000001" });
  });

  it("returns 403 for non-admin users", async () => {
    mocks.requireAdmin.mockRejectedValue(new AppError("Admin access required", 403, "FORBIDDEN"));

    const route = await import("@/app/api/admin/provision-jobs/retry/route");
    const response = await route.POST(
      createJsonRequest({
        jobId: "123e4567-e89b-12d3-a456-426614174000"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
    expect(mocks.retryProvisionJobByAdmin).not.toHaveBeenCalled();
  });

  it("retries job for admin users", async () => {
    mocks.requireAdmin.mockResolvedValue({ role: "admin" });
    mocks.retryProvisionJobByAdmin.mockResolvedValue(undefined);

    const route = await import("@/app/api/admin/provision-jobs/retry/route");
    const response = await route.POST(
      createJsonRequest({
        jobId: "123e4567-e89b-12d3-a456-426614174000"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ retried: true });
    expect(mocks.retryProvisionJobByAdmin).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174000",
      "00000000-0000-0000-0000-000000000001"
    );
  });
});
