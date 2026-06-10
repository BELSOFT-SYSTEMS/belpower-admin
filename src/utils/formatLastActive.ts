import { formatDistanceToNow } from 'date-fns';
import { parseApiDate } from '@/utils/parseApiDate';

/**
 * Relative "last active" — compares UTC instants; no display timezone conversion.
 * parseApiDate ensures the API UTC instant is parsed correctly (not as local wall clock).
 */
export function formatLastActive(iso: string | null | undefined): string {
  const date = parseApiDate(iso);
  if (!date) return '—';

  try {
    return formatDistanceToNow(date, { addSuffix: true, includeSeconds: true });
  } catch {
    return '—';
  }
}
