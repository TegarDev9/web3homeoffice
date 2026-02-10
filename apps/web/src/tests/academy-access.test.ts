import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getUserSubscription: vi.fn()
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser
}));

vi.mock("@/lib/auth/guards", () => ({
  getUserSubscription: mocks.getUserSubscription,
  isSubscriptionActive: (status: string | null) => status === "active" || status === "trialing"
}));

describe("academy access context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns preview for guest user", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const module = await import("@/lib/academy/access");
    const access = await module.getAcademyAccessContext();

    expect(access).toEqual({
      accessLevel: "preview",
      userId: null,
      hasActiveSubscription: false
    });
  });

  it("returns member for active subscription", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getUserSubscription.mockResolvedValue({ status: "active" });

    const module = await import("@/lib/academy/access");
    const access = await module.getAcademyAccessContext();

    expect(access.accessLevel).toBe("member");
    expect(access.userId).toBe("user-1");
    expect(access.hasActiveSubscription).toBe(true);
  });
});
