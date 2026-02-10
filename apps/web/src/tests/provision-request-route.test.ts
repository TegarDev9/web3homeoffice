import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireActiveSubscriptionForApi: vi.fn(),
  ensureProvisionWithinLimit: vi.fn(),
  createProvisionJob: vi.fn()
}));

vi.mock("@/lib/auth/session", () => ({
  requireUser: mocks.requireUser
}));

vi.mock("@/lib/auth/guards", () => ({
  requireActiveSubscriptionForApi: mocks.requireActiveSubscriptionForApi
}));

vi.mock("@/lib/provisioning/limits", () => ({
  ensureProvisionWithinLimit: mocks.ensureProvisionWithinLimit
}));

vi.mock("@/lib/provisioning/jobs", () => ({
  createProvisionJob: mocks.createProvisionJob
}));

function createJsonRequest(payload: unknown) {
  return new Request("http://localhost/api/provision/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  }) as unknown as NextRequest;
}

describe("provision request route", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.requireUser.mockResolvedValue({ id: "user-1" });
    mocks.requireActiveSubscriptionForApi.mockResolvedValue({
      plan_id: "starter",
      status: "active"
    });
    mocks.ensureProvisionWithinLimit.mockResolvedValue({
      instances: 1,
      regions: ["ap-singapore"]
    });
    mocks.createProvisionJob.mockResolvedValue({
      id: "job_1",
      status: "pending"
    });
  });

  it("uses ubuntu as default os for manual request", async () => {
    const route = await import("@/app/api/provision/request/route");
    const response = await route.POST(
      createJsonRequest({
        planTemplate: "vps-base",
        region: "ap-singapore"
      })
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.jobId).toBe("job_1");
    expect(mocks.createProvisionJob).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "vps-base",
        os: "ubuntu",
        requestSource: "manual"
      })
    );
  });

  it("uses provided os override for manual request", async () => {
    const route = await import("@/app/api/provision/request/route");

    await route.POST(
      createJsonRequest({
        planTemplate: "rpc-placeholder",
        region: "ap-singapore",
        os: "kali"
      })
    );

    expect(mocks.createProvisionJob).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "rpc-placeholder",
        os: "kali",
        requestSource: "manual"
      })
    );
  });
});

