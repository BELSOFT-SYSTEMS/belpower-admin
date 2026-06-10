import { formatDistanceToNow } from 'date-fns';
import { parseApiDate } from '@/utils/parseApiDate';

export type LastActiveSource = {
  lastActiveAt?: string | null;
  lastActive?: string | null;
  lastLoginAt?: string | null;
};

/**
 * Activity timestamp for relative "last active" display.
 * Uses lastActiveAt only — never lastLoginAt (login is absolute UI only).
 */
export function pickUserLastActiveDate(
  source: LastActiveSource | string | null | undefined
): Date | null {
  if (typeof source === 'string' || source == null) {
    return parseApiDate(source);
  }

  return (
    parseApiDate(source.lastActiveAt) ??
    parseApiDate(source.lastActive)
  );
}

/** Relative "last active" — from lastActiveAt (any recent activity). */
export function formatUserLastActive(
  source: LastActiveSource | string | null | undefined
): string {
  const date = pickUserLastActiveDate(source);
  if (!date) return '—';

  try {
    return formatDistanceToNow(date, { addSuffix: true, includeSeconds: true });
  } catch {
    return '—';
  }
}
