import { formatDistanceToNow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { devGroup, devLog } from '@/utils/devLog';
import { ADMIN_DISPLAY_TIMEZONE, parseApiDate } from '@/utils/parseApiDate';

type RawRecord = Record<string, unknown>;

function pickActivityFields(raw: RawRecord) {
  return {
    id: raw.id ?? raw.userId ?? raw.user_id ?? null,
    email: raw.email ?? null,
    lastActiveAt: raw.lastActiveAt ?? raw.last_active_at ?? null,
    lastActive: raw.lastActive ?? raw.last_active ?? null,
    lastLoginAt: raw.lastLoginAt ?? raw.last_login_at ?? null,
  };
}

function describeActivityFields(fields: ReturnType<typeof pickActivityFields>) {
  const activeDate = parseApiDate(
    fields.lastActiveAt != null ? String(fields.lastActiveAt) : null
  );
  const loginDate = parseApiDate(
    fields.lastLoginAt != null ? String(fields.lastLoginAt) : null
  );

  return {
    ...fields,
    parsed: {
      lastActiveRelative: activeDate
        ? formatDistanceToNow(activeDate, { addSuffix: true, includeSeconds: true })
        : null,
      lastLoginLagos: loginDate
        ? formatInTimeZone(loginDate, ADMIN_DISPLAY_TIMEZONE, 'PPp')
        : null,
    },
  };
}

/** Dev-only: log raw API activity timestamps from GET /users. */
export function devLogUsersListActivityResponse(rawData: RawRecord): void {
  devGroup('[Users API] GET /users — activity fields (raw)', () => {
    const users = (rawData.users ?? []) as RawRecord[];
    devLog('total users in page:', users.length);

    const sample = users.slice(0, 10).map((row) => describeActivityFields(pickActivityFields(row)));
    devLog('sample (first 10):', sample);

    if (users.length > 10) {
      devLog(`… and ${users.length - 10} more rows (not shown)`);
    }
  });
}

/** Dev-only: log raw API activity timestamps from GET /users/:id. */
export function devLogUserDetailActivityResponse(rawData: RawRecord): void {
  devGroup('[Users API] GET /users/:id — activity fields (raw)', () => {
    devLog(describeActivityFields(pickActivityFields(rawData)));
  });
}
