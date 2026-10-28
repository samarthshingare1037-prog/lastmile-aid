import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/app/store';
import { getUrgency } from '@/lib/urgency';
import type { Urgency } from '@/api/types';

/**
 * Returns the current server time (ms) updated every second.
 */
export function useServerClock() {
  const clockOffset = useAppStore((s) => s.clockOffset);
  const [now, setNow] = useState(() => Date.now() + clockOffset);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now() + clockOffset);
    }, 1000);
    return () => clearInterval(interval);
  }, [clockOffset]);

  return now;
}

/**
 * Returns remaining seconds to an expiry, updated every second.
 */
export function useCountdown(expiryUtc: string): number {
  const serverNow = useServerClock();
  const expiryMs = new Date(expiryUtc).getTime();
  return Math.max(0, Math.floor((expiryMs - serverNow) / 1000));
}

/**
 * Returns the current urgency for a given expiry.
 */
export function useUrgency(expiryUtc: string): Urgency {
  const serverNow = useServerClock();
  return getUrgency(expiryUtc, serverNow);
}

/**
 * Returns the active role from the store.
 */
export function useRole() {
  const user = useAppStore((s) => s.user);
  const activeRole = useAppStore((s) => s.activeRole);
  return { user, activeRole, roles: user?.roles || [] };
}

/**
 * Debounce hook.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Media query hook.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Check if mobile viewport.
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 1023px)');
}
