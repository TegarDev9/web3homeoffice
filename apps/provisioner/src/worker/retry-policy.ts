import { nextRetryAtIso, retryDelayMinutes } from "@web3homeoffice/shared";

export { nextRetryAtIso, retryDelayMinutes };

export type RetryOutcome = {
  retryCount: number;
  isTerminalFailure: boolean;
  nextRetryAt: string;
};

export function computeRetryOutcome(currentRetryCount: number, maxRetries: number, now = new Date()): RetryOutcome {
  const retryCount = currentRetryCount + 1;

  if (retryCount < maxRetries) {
    return {
      retryCount,
      isTerminalFailure: false,
      nextRetryAt: nextRetryAtIso(now, retryCount)
    };
  }

  return {
    retryCount,
    isTerminalFailure: true,
    nextRetryAt: now.toISOString()
  };
}
