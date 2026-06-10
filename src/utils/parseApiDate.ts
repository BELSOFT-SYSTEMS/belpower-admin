import { isValid, parseISO } from 'date-fns';
import { devWarn } from '@/utils/devLog';

/** Nigeria time for absolute admin UI timestamps. */
export const ADMIN_DISPLAY_TIMEZONE = 'Africa/Lagos';

/** Space-separated UTC wall clock from legacy user formatters (e.g. "2026-06-09 22:08:00"). */
const WALL_CLOCK_PATTERN = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}(\.\d{1,9})?)$/;

/** ISO 8601 datetime without timezone — API contract: UTC instant, append Z. */
const ISO_WITHOUT_TZ =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?$/;

const HAS_TIMEZONE = /(Z|[+-]\d{2}:?\d{2}(:?\d{2})?)$/i;

function warnInDev(message: string, value: string) {
  devWarn(`[parseApiDate] ${message}`, value);
}

function normalizeApiIso(trimmed: string): string | null {
  const wallClock = trimmed.match(WALL_CLOCK_PATTERN);
  if (wallClock) {
    warnInDev('Treating space-separated datetime as UTC:', trimmed);
    return `${wallClock[1]}T${wallClock[2]}Z`;
  }

  if (HAS_TIMEZONE.test(trimmed)) {
    return trimmed;
  }

  if (ISO_WITHOUT_TZ.test(trimmed)) {
    warnInDev('Treating timezone-less ISO datetime as UTC:', trimmed);
    return `${trimmed}Z`;
  }

  warnInDev('Unrecognized API datetime format:', trimmed);
  return null;
}

/**
 * Parse BelPower API datetimes as UTC instants.
 * Handles: ...Z, +00:00, bare T-ISO (append Z), space-separated UTC wall clock.
 */
export function parseApiDate(iso: string | null | undefined): Date | null {
  if (!iso || iso === 'null' || iso === 'undefined') return null;

  const trimmed = iso.trim();
  if (!trimmed) return null;

  const normalized = normalizeApiIso(trimmed);
  if (!normalized) return null;

  const date = parseISO(normalized);
  return isValid(date) ? date : null;
}
