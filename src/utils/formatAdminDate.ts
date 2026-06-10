import { formatInTimeZone } from 'date-fns-tz';
import { ADMIN_DISPLAY_TIMEZONE, parseApiDate } from '@/utils/parseApiDate';

/** Absolute datetime in Nigeria time — never use UTC or getUTCHours() for display. */
export function formatAdminDateTime(iso: string | null | undefined): string {
  const date = parseApiDate(iso);
  if (!date) return '—';

  return formatInTimeZone(date, ADMIN_DISPLAY_TIMEZONE, 'MMM d, yyyy, h:mm aa');
}

export function formatAdminDate(iso: string | null | undefined): string {
  const date = parseApiDate(iso);
  if (!date) return '—';

  return formatInTimeZone(date, ADMIN_DISPLAY_TIMEZONE, 'MMM d, yyyy');
}

export function formatReviewedAt(
  at: string | null | undefined,
  by: string | null | undefined
): string {
  if (!at) return '—';
  const date = formatAdminDateTime(at);
  return by ? `${date} — ${by}` : date;
}
