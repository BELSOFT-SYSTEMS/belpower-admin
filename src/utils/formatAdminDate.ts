import { formatInTimeZone } from 'date-fns-tz';
import { ADMIN_DISPLAY_TIMEZONE, parseApiDate } from '@/utils/parseApiDate';
import {
  type ApiFieldRecord,
  pickApiDateString,
  pickApiTimestampString,
} from '@/utils/pickApiField';

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

/** Format a datetime from API records that may use camelCase or snake_case keys. */
export function formatRecordAdminDateTime(
  record: ApiFieldRecord,
  camel = 'createdAt',
  snake = 'created_at'
): string {
  return formatAdminDateTime(pickApiDateString(record, camel, snake));
}

export function formatRecordAdminDate(
  record: ApiFieldRecord,
  camel = 'createdAt',
  snake = 'created_at'
): string {
  return formatAdminDate(pickApiDateString(record, camel, snake));
}

export { pickApiTimestampString };

export function formatReviewedAt(
  at: string | null | undefined,
  by: string | null | undefined
): string {
  if (!at) return '—';
  const date = formatAdminDateTime(at);
  return by ? `${date} — ${by}` : date;
}
