import { describe, expect, it } from "vitest";

import { computeRetryOutcome } from "../../../provisioner/src/worker/retry-policy";

describe("provisioning retry policy", () => {
  it("sets first failure to pending with +1 minute backoff", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const outcome = computeRetryOutcome(0, 3, now);

    expect(outcome.retryCount).toBe(1);
    expect(outcome.isTerminalFailure).toBe(false);
    expect(outcome.nextRetryAt).toBe("2026-01-01T00:01:00.000Z");
  });

  it("sets second failure to pending with +5 minute backoff", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const outcome = computeRetryOutcome(1, 3, now);

    expect(outcome.retryCount).toBe(2);
    expect(outcome.isTerminalFailure).toBe(false);
    expect(outcome.nextRetryAt).toBe("2026-01-01T00:05:00.000Z");
  });

  it("sets third failure to terminal failed state", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const outcome = computeRetryOutcome(2, 3, now);

    expect(outcome.retryCount).toBe(3);
    expect(outcome.isTerminalFailure).toBe(true);
    expect(outcome.nextRetryAt).toBe("2026-01-01T00:00:00.000Z");
  });
});
