import { describe, expect, it } from "vitest";

import { isSubscriptionActive } from "@/lib/auth/guards";

describe("subscription guard", () => {
  it("marks active statuses", () => {
    expect(isSubscriptionActive("active")).toBe(true);
    expect(isSubscriptionActive("trialing")).toBe(true);
  });

  it("marks inactive statuses", () => {
    expect(isSubscriptionActive("canceled")).toBe(false);
    expect(isSubscriptionActive("expired")).toBe(false);
    expect(isSubscriptionActive(null)).toBe(false);
  });
});


