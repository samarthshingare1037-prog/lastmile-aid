import { format, formatDistanceToNow, differenceInMinutes, differenceInSeconds } from 'date-fns';

/**
 * Format a UTC ISO string to local display using server-clock offset.
 */
export function formatLocal(utcIso: string): string {
  return format(new Date(utcIso), 'MMM d, yyyy h:mm a');
}

/**
 * Format a UTC ISO string as a relative time (e.g., "5 minutes ago").
 */
export function formatRelative(utcIso: string): string {
  return formatDistanceToNow(new Date(utcIso), { addSuffix: true });
}

/**
 * Format remaining time for countdowns.
 * > 1h: "Xh Ym"
 * < 1h: "MM:SS"
 * ≤ 0: "Expired"
 */
export function formatCountdown(remainingSeconds: number): string {
  if (remainingSeconds <= 0) return 'Expired';

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = Math.floor(remainingSeconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get remaining seconds from an expiry UTC string, adjusted by server offset.
 */
export function getRemainingSeconds(expiryUtc: string, serverOffsetMs: number = 0): number {
  const now = Date.now() + serverOffsetMs;
  const expiry = new Date(expiryUtc).getTime();
  return Math.max(0, Math.floor((expiry - now) / 1000));
}

/**
 * Format a date for display in event logs.
 */
export function formatEventTime(utcIso: string): string {
  return format(new Date(utcIso), 'HH:mm:ss');
}

export { differenceInMinutes, differenceInSeconds };
