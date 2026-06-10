import type {
  AdminAccount,
  AdminLog,
  AdminLogStatus,
  AdminRole,
  AdminStatus,
} from '@/types/adminManagement';
import { formatAdminDate, formatAdminDateTime } from '@/utils/formatAdminDate';

type RawRecord = Record<string, unknown>;

function pick<T>(raw: RawRecord, camel: string, snake: string): T | undefined {
  if (raw[camel] !== undefined && raw[camel] !== null) return raw[camel] as T;
  if (raw[snake] !== undefined && raw[snake] !== null) return raw[snake] as T;
  return undefined;
}

function pickString(raw: RawRecord, camel: string, snake: string): string {
  const value = pick<string>(raw, camel, snake);
  return value != null ? String(value) : '';
}

const ADMIN_ROLES: AdminRole[] = [
  'super_admin',
  'admin',
  'support',
  'finance',
  'content_manager',
];

const ADMIN_STATUSES: AdminStatus[] = ['active', 'suspended', 'pending', 'inactive'];

function normalizeRole(value: unknown): AdminRole {
  const role = String(value ?? 'support').toLowerCase() as AdminRole;
  return ADMIN_ROLES.includes(role) ? role : 'support';
}

function normalizeStatus(value: unknown): AdminStatus {
  const status = String(value ?? 'active').toLowerCase() as AdminStatus;
  return ADMIN_STATUSES.includes(status) ? status : 'active';
}

function humanizeAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildLogDetail(raw: RawRecord, metadata: RawRecord): string {
  const action = String(pick(raw, 'action', 'action') ?? '');
  const entityType = pickString(raw, 'entityType', 'entity_type');
  const entityId = pickString(raw, 'entityId', 'entity_id');

  const reason = metadata.reason != null ? String(metadata.reason) : '';
  const targetUser =
    metadata.target_user_name != null
      ? String(metadata.target_user_name)
      : metadata.target_email != null
        ? String(metadata.target_email)
        : '';

  if (action.includes('BLOCK') || action.toLowerCase().includes('block')) {
    if (targetUser) return `Blocked user ${targetUser}${reason ? ` (${reason})` : ''}`;
  }

  if (action.includes('SUSPEND')) {
    const email = metadata.target_email != null ? String(metadata.target_email) : '';
    return email ? `Suspended admin ${email}` : 'Admin account suspended';
  }

  if (action.includes('ACTIVATE')) {
    const email = metadata.target_email != null ? String(metadata.target_email) : '';
    return email ? `Activated admin ${email}` : 'Admin account activated';
  }

  if (action.includes('UPDATE') || action.includes('PROFILE')) {
    const fields = metadata.updated_fields;
    if (Array.isArray(fields) && fields.length > 0) {
      return `Updated fields: ${fields.join(', ')}`;
    }
  }

  if (entityType && entityId) {
    return `${humanizeAction(action)} — ${entityType} ${entityId}`;
  }

  return humanizeAction(action);
}

export function normalizeAdminAccount(raw: RawRecord): AdminAccount {
  const createdAt = pickString(raw, 'createdAt', 'created_at');
  const lastLoginAt =
    pickString(raw, 'lastLoginAt', 'last_login_at') ||
    pickString(raw, 'lastLogin', 'last_login');

  const metadata = pick<RawRecord>(raw, 'metadata', 'metadata') ?? {};
  const createdBy =
    metadata.created_by_name != null
      ? String(metadata.created_by_name)
      : metadata.created_by != null
        ? String(metadata.created_by)
        : undefined;

  return {
    id: pickString(raw, 'id', 'id'),
    first_name: pickString(raw, 'firstName', 'first_name'),
    last_name: pickString(raw, 'lastName', 'last_name'),
    email: pickString(raw, 'email', 'email'),
    phone: pickString(raw, 'phoneNumber', 'phone_number') || pickString(raw, 'phone', 'phone'),
    role: normalizeRole(pick(raw, 'role', 'role')),
    status: normalizeStatus(pick(raw, 'status', 'status')),
    created_at: createdAt ? formatAdminDate(createdAt) : '—',
    last_login: lastLoginAt ? formatAdminDateTime(lastLoginAt) : 'Never',
    created_by: createdBy,
    email_verified: Boolean(pick(raw, 'emailVerified', 'email_verified')),
    all_access: Boolean(pick(raw, 'allAccess', 'all_access')),
    permissions: (pick<string[]>(raw, 'permissions', 'permissions') ?? undefined) as
      | string[]
      | undefined,
  };
}

export function normalizeAdminLog(raw: RawRecord): AdminLog {
  const metadata = (pick<RawRecord>(raw, 'metadata', 'metadata') ?? {}) as AdminLog['metadata'];
  const statusRaw = String(pick(raw, 'status', 'status') ?? 'success').toLowerCase();
  const status: AdminLogStatus =
    statusRaw === 'failed' || statusRaw === 'warning' ? statusRaw : 'success';

  const createdAt = pickString(raw, 'createdAt', 'created_at');
  const action = String(pick(raw, 'action', 'action') ?? 'Activity');

  return {
    id: pickString(raw, 'id', 'id'),
    admin_id: pickString(raw, 'adminId', 'admin_id'),
    action: humanizeAction(action),
    detail: buildLogDetail(raw, metadata ?? {}),
    timestamp: createdAt ? formatAdminDateTime(createdAt) : '—',
    ip: pickString(raw, 'ipAddress', 'ip_address') || pickString(raw, 'ip', 'ip') || '—',
    status,
    entity_type: pickString(raw, 'entityType', 'entity_type') || null,
    entity_id: pickString(raw, 'entityId', 'entity_id') || null,
    metadata,
  };
}

export type AdminsListData = {
  admins: AdminAccount[];
  total: number;
  page: number;
  totalPages: number;
};

export function normalizeAdminsList(raw: RawRecord): AdminsListData {
  const adminsRaw = (raw.admins ?? raw.data ?? []) as RawRecord[];
  return {
    admins: adminsRaw.map((item) => normalizeAdminAccount(item)),
    total: Number(raw.total ?? adminsRaw.length),
    page: Number(raw.page ?? 1),
    totalPages: Number(raw.totalPages ?? raw.total_pages ?? 1),
  };
}

export function normalizeAdminActivityLogs(raw: RawRecord): {
  logs: AdminLog[];
  total: number;
  page: number;
  totalPages: number;
} {
  const logsRaw = (raw.logs ?? raw.data ?? []) as RawRecord[];
  return {
    logs: logsRaw.map((item) => normalizeAdminLog(item)),
    total: Number(raw.total ?? logsRaw.length),
    page: Number(raw.page ?? 1),
    totalPages: Number(raw.totalPages ?? raw.total_pages ?? 1),
  };
}
