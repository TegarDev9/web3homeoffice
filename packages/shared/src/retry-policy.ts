const RETRY_DELAYS_MINUTES = [1, 5, 15] as const;

export function retryDelayMinutes(retryAttempt: number) {
  if (retryAttempt <= 0) return RETRY_DELAYS_MINUTES[0];
  return RETRY_DELAYS_MINUTES[Math.min(retryAttempt - 1, RETRY_DELAYS_MINUTES.length - 1)];
}

export function nextRetryAtIso(baseDate: Date, retryAttempt: number) {
  const next = new Date(baseDate.getTime());
  next.setMinutes(next.getMinutes() + retryDelayMinutes(retryAttempt));
  return next.toISOString();
}
