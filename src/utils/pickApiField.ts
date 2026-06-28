export type ApiFieldRecord = Record<string, unknown> | null | undefined;

/** Read a field from API JSON whether the backend sent camelCase or snake_case. */
export function pickApiField<T>(
  raw: ApiFieldRecord,
  camel: string,
  snake: string
): T | undefined {
  if (!raw) return undefined;
  if (raw[camel] !== undefined && raw[camel] !== null) return raw[camel] as T;
  if (raw[snake] !== undefined && raw[snake] !== null) return raw[snake] as T;
  return undefined;
}

export function pickApiDateString(
  raw: ApiFieldRecord,
  camel = 'createdAt',
  snake = 'created_at'
): string | null {
  const value = pickApiField<string | number | Date>(raw, camel, snake);
  if (value === undefined || value === null || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

export const API_TIMESTAMP_FIELDS = {
  created: ['createdAt', 'created_at'] as const,
  updated: ['updatedAt', 'updated_at'] as const,
  completed: ['completedAt', 'completed_at'] as const,
  lastUsed: ['lastUsedAt', 'last_used_at'] as const,
  read: ['readAt', 'read_at'] as const,
  reviewed: ['reviewedAt', 'reviewed_at'] as const,
};

export function pickApiTimestampString(
  raw: ApiFieldRecord,
  field: keyof typeof API_TIMESTAMP_FIELDS = 'created'
): string | null {
  const [camel, snake] = API_TIMESTAMP_FIELDS[field];
  return pickApiDateString(raw, camel, snake);
}
