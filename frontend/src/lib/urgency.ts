import type { Urgency } from '@/api/types';

/**
 * Compute urgency level from expiry and current server time.
 * Never stored on client — always derived.
 *
 * > 2h: NORMAL
 * 30m–2h: URGENT
 * < 30m: CRITICAL
 * ≤ 0: EXPIRED
 */
export function getUrgency(expiryUtc: string, serverNowMs: number): Urgency {
  const expiryMs = new Date(expiryUtc).getTime();
  const remainingMs = expiryMs - serverNowMs;
  const remainingMin = remainingMs / (1000 * 60);

  if (remainingMin <= 0) return 'EXPIRED';
  if (remainingMin < 30) return 'CRITICAL';
  if (remainingMin < 120) return 'URGENT';
  return 'NORMAL';
}

/**
 * Get urgency for display with server offset.
 */
export function getUrgencyWithOffset(expiryUtc: string, serverOffsetMs: number = 0): Urgency {
  const serverNowMs = Date.now() + serverOffsetMs;
  return getUrgency(expiryUtc, serverNowMs);
}
