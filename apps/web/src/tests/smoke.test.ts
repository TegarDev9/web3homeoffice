import { describe, expect, it } from "vitest";

describe("smoke", () => {
  it("loads core modules", async () => {
    const modules = await Promise.all([
      import("@/lib/utils"),
      import("@/lib/platforms/detect"),
      import("@/lib/provisioning/limits"),
      import("@/lib/billing/subscription-service"),
      import("@/components/marketing/landing-data"),
      import("@/components/marketing/section-heading"),
      import("@/components/marketing/metric-strip"),
      import("@/components/marketing/capability-grid"),
      import("@/components/marketing/workflow-steps"),
      import("@/components/marketing/plan-preview"),
      import("@/components/marketing/faq"),
      import("@/lib/academy/access"),
      import("@/lib/academy/catalog"),
      import("@/lib/academy/progress"),
      import("@/lib/academy/logs"),
      import("@/components/academy/AcademyHubClient"),
      import("@/components/academy/AcademySceneCanvas"),
      import("@/components/academy/AcademyRoomPanel")
    ]);

    expect(modules.every(Boolean)).toBe(true);
  });
});


