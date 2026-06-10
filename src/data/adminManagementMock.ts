/**
 * Mock admin accounts & activity logs — replace with API (GET/POST/PATCH/DELETE /admins)
 */

import { DEFAULT_ROLE_PERMISSIONS } from '@/constants/adminPermissionCatalog';
import type {
  AdminAccount,
  AdminFormValues,
  AdminLog,
  AdminRole,
} from '@/types/adminManagement';

function permissionsForRole(role: AdminRole): string[] | undefined {
  const keys = DEFAULT_ROLE_PERMISSIONS[role];
  return keys ?? undefined;
}

const INITIAL_ADMINS: AdminAccount[] = [
  {
    id: 'james-okafor',
    first_name: 'James',
    last_name: 'Okafor',
    email: 'j.okafor@belpower.com',
    phone: '+234 803 111 2201',
    role: 'super_admin',
    status: 'active',
    created_at: 'Jan 8, 2024',
    last_login: 'Today, 9:14 AM',
    created_by: 'System',
    email_verified: true,
    all_access: true,
  },
  {
    id: 'sarah-mendes',
    first_name: 'Sarah',
    last_name: 'Mendes',
    email: 's.mendes@belpower.com',
    phone: '+234 802 445 8890',
    role: 'admin',
    status: 'active',
    created_at: 'Mar 2, 2024',
    last_login: 'Today, 8:02 AM',
    created_by: 'James Okafor',
    email_verified: true,
    permissions: permissionsForRole('admin'),
  },
  {
    id: 'tunde-adeyemi',
    first_name: 'Tunde',
    last_name: 'Adeyemi',
    email: 't.adeyemi@belpower.com',
    phone: '+234 701 992 3341',
    role: 'support',
    status: 'active',
    created_at: 'Jun 15, 2024',
    last_login: 'Yesterday, 6:45 PM',
    created_by: 'Sarah Mendes',
    email_verified: true,
    permissions: permissionsForRole('support'),
  },
  {
    id: 'chioma-eze',
    first_name: 'Chioma',
    last_name: 'Eze',
    email: 'c.eze@belpower.com',
    phone: '+234 809 220 1188',
    role: 'finance',
    status: 'suspended',
    created_at: 'Aug 1, 2024',
    last_login: 'May 28, 2025',
    created_by: 'James Okafor',
    email_verified: true,
    permissions: permissionsForRole('finance'),
  },
  {
    id: 'david-okon',
    first_name: 'David',
    last_name: 'Okon',
    email: 'd.okon@belpower.com',
    phone: '+234 816 554 0092',
    role: 'content_manager',
    status: 'active',
    created_at: 'Nov 12, 2024',
    last_login: 'Jun 1, 2026, 11:30 AM',
    created_by: 'Sarah Mendes',
    email_verified: true,
    permissions: permissionsForRole('content_manager'),
  },
];

const INITIAL_LOGS: AdminLog[] = [
  {
    id: 'log-1',
    admin_id: 'james-okafor',
    action: 'Login',
    detail: 'Signed in to Command Center',
    timestamp: 'Jun 3, 2026 — 9:14 AM',
    ip: '102.89.44.12',
    status: 'success',
    entity_type: 'session',
  },
  {
    id: 'log-2',
    admin_id: 'james-okafor',
    action: 'User blocked',
    detail: 'Blocked user chris-paul (fraud review)',
    timestamp: 'Jun 2, 2026 — 4:22 PM',
    ip: '102.89.44.12',
    status: 'success',
    entity_type: 'user',
    entity_id: 'chris-paul',
    metadata: {
      reason:
        'Multiple failed transactions and duplicate recipient patterns flagged during fraud review',
      target_user_name: 'Chris Paul',
      target_user_id: 'chris-paul',
      target_email: 'chris.paul@example.com',
      review_status: 'blocked',
      fraud_flags: ['velocity', 'duplicate_recipient', 'high_value_wallet'],
      notes: 'Blocked pending manual review by compliance team',
    },
  },
  {
    id: 'log-3',
    admin_id: 'james-okafor',
    action: 'Admin created',
    detail: 'Created admin account for Tunde Adeyemi (support)',
    timestamp: 'Jun 15, 2024 — 10:05 AM',
    ip: '102.89.44.12',
  },
  {
    id: 'log-4',
    admin_id: 'sarah-mendes',
    action: 'Login',
    detail: 'Signed in to Command Center',
    timestamp: 'Jun 3, 2026 — 8:02 AM',
    ip: '197.210.55.88',
  },
  {
    id: 'log-5',
    admin_id: 'sarah-mendes',
    action: 'Transaction reviewed',
    detail: 'Marked TRX-789459 for fraud review',
    timestamp: 'Jun 1, 2026 — 2:18 PM',
    ip: '197.210.55.88',
    entity_type: 'transaction',
    entity_id: 'TRX-789459',
    metadata: {
      reason: 'Unusual payment velocity from new wallet',
      transaction_reference: 'TRX-789459',
      review_status: 'under_review',
      message: 'Escalated to fraud queue for senior review',
    },
  },
  {
    id: 'log-6',
    admin_id: 'sarah-mendes',
    action: 'Admin updated',
    detail: 'Updated David Okon role to content manager',
    timestamp: 'Nov 12, 2024 — 3:40 PM',
    ip: '197.210.55.88',
    entity_type: 'admin',
    entity_id: 'david-okon',
    metadata: {
      previous_role: 'support',
      new_role: 'content_manager',
      updated_fields: ['role'],
      notes: 'Moved to content team for service copy updates',
    },
  },
  {
    id: 'log-7',
    admin_id: 'tunde-adeyemi',
    action: 'Login',
    detail: 'Signed in to Command Center',
    timestamp: 'Jun 2, 2026 — 6:45 PM',
    ip: '41.203.12.77',
  },
  {
    id: 'log-8',
    admin_id: 'tunde-adeyemi',
    action: 'User messaged',
    detail: 'Sent support message to john-travis',
    timestamp: 'Jun 2, 2026 — 5:10 PM',
    ip: '41.203.12.77',
  },
  {
    id: 'log-9',
    admin_id: 'chioma-eze',
    action: 'Login',
    detail: 'Signed in to Command Center',
    timestamp: 'May 28, 2025 — 9:00 AM',
    ip: '105.112.33.19',
  },
  {
    id: 'log-10',
    admin_id: 'chioma-eze',
    action: 'Wallet export',
    detail: 'Exported wallet activity report (CSV)',
    timestamp: 'May 27, 2025 — 11:55 AM',
    ip: '105.112.33.19',
  },
  {
    id: 'log-11',
    admin_id: 'david-okon',
    action: 'Login',
    detail: 'Signed in to Command Center',
    timestamp: 'Jun 1, 2026 — 11:30 AM',
    ip: '197.210.88.201',
  },
  {
    id: 'log-12',
    admin_id: 'david-okon',
    action: 'Content updated',
    detail: 'Updated service availability copy for MTN',
    timestamp: 'May 30, 2026 — 1:15 PM',
    ip: '197.210.88.201',
  },
];

let admins = [...INITIAL_ADMINS];
let logs = [...INITIAL_LOGS];

/** Stable reference for useSyncExternalStore — only replaced on notify() */
let adminsSnapshot: AdminAccount[] = [...INITIAL_ADMINS];

export type AdminDetailSnapshot = {
  admin: AdminAccount | undefined;
  logs: AdminLog[];
};

const adminDetailSnapshots = new Map<string, AdminDetailSnapshot>();

type Listener = () => void;
const listeners = new Set<Listener>();

function refreshSnapshots() {
  adminsSnapshot = [...admins];
  adminDetailSnapshots.clear();
}

function notify() {
  refreshSnapshots();
  listeners.forEach((fn) => fn());
}

export function subscribeAdmins(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Cached snapshot — same array reference until the store mutates */
export function getAdmins(): AdminAccount[] {
  return adminsSnapshot;
}

export function getAdminById(id: string): AdminAccount | undefined {
  return admins.find((a) => a.id === id);
}

export function getAdminLogs(adminId: string): AdminLog[] {
  const cached = adminDetailSnapshots.get(adminId);
  if (cached) return cached.logs;
  return logs.filter((l) => l.admin_id === adminId);
}

/** Cached per adminId until the store mutates */
export function getAdminDetailSnapshot(adminId: string): AdminDetailSnapshot {
  let snap = adminDetailSnapshots.get(adminId);
  if (!snap) {
    snap = {
      admin: admins.find((a) => a.id === adminId),
      logs: logs.filter((l) => l.admin_id === adminId),
    };
    adminDetailSnapshots.set(adminId, snap);
  }
  return snap;
}

function slugify(first: string, last: string): string {
  const base = `${first}-${last}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let id = base;
  let n = 2;
  while (admins.some((a) => a.id === id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

function appendLog(
  adminId: string,
  action: string,
  detail: string,
  ip = '102.89.44.12',
  status: AdminLog['status'] = 'success',
  entity_type?: string | null,
  entity_id?: string | null,
  metadata?: AdminLog['metadata']
) {
  const entry: AdminLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    admin_id: adminId,
    action,
    detail,
    timestamp: 'Just now',
    ip,
    status,
    entity_type,
    entity_id,
    metadata,
  };
  logs = [entry, ...logs];
}

export function createAdmin(
  values: AdminFormValues,
  actorName = 'Current admin'
): AdminAccount {
  const id = slugify(values.first_name, values.last_name);
  const account: AdminAccount = {
    id,
    ...values,
    created_at: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    last_login: 'Never',
    created_by: actorName,
    email_verified: false,
    all_access: values.role === 'super_admin',
    permissions: permissionsForRole(values.role),
  };
  admins = [account, ...admins];
  appendLog(id, 'Account created', `Admin account created (${values.role})`);
  notify();
  return account;
}

export function updateAdmin(id: string, values: AdminFormValues): AdminAccount | null {
  const idx = admins.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const prev = admins[idx];
  const next = { ...prev, ...values, status: values.status ?? prev.status };
  admins = admins.map((a) => (a.id === id ? next : a));
  const updatedFields = (['first_name', 'last_name', 'email', 'phone', 'role'] as const).filter(
    (key) => values[key] !== prev[key]
  );
  appendLog(
    id,
    'Profile updated',
    `Updated ${prev.first_name} ${prev.last_name} account details`,
    '102.89.44.12',
    'success',
    'admin',
    id,
    {
      updated_fields: updatedFields,
      previous_role: prev.role !== next.role ? prev.role : undefined,
      new_role: prev.role !== next.role ? next.role : undefined,
    }
  );
  notify();
  return admins.find((a) => a.id === id) ?? null;
}

export function setAdminStatus(
  id: string,
  status: 'active' | 'suspended'
): AdminAccount | null {
  const idx = admins.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const prev = admins[idx];
  if (prev.status === status) return prev;
  admins = admins.map((a) => (a.id === id ? { ...a, status } : a));
  const action = status === 'suspended' ? 'Account suspended' : 'Account activated';
  appendLog(
    id,
    action,
    `${status === 'suspended' ? 'Suspended' : 'Activated'} ${prev.first_name} ${prev.last_name}`,
    '102.89.44.12',
    'success',
    'admin',
    id,
    {
      previous_status: prev.status,
      new_status: status,
      reason:
        status === 'suspended'
          ? 'Access revoked by admin — account suspended in Command Center'
          : undefined,
    }
  );
  notify();
  return admins.find((a) => a.id === id) ?? null;
}

export function deleteAdmin(id: string): boolean {
  if (!admins.some((a) => a.id === id)) return false;
  admins = admins.filter((a) => a.id !== id);
  logs = logs.filter((l) => l.admin_id !== id);
  notify();
  return true;
}

export function resetAdminPassword(id: string): boolean {
  const admin = admins.find((a) => a.id === id);
  if (!admin) return false;
  appendLog(
    id,
    'Password reset',
    `Password reset link sent to ${admin.email}`
  );
  notify();
  return true;
}

export function countByRole(): Record<AdminRole, number> {
  const counts: Record<AdminRole, number> = {
    super_admin: 0,
    admin: 0,
    support: 0,
    finance: 0,
    content_manager: 0,
  };
  admins.forEach((a) => {
    counts[a.role] += 1;
  });
  return counts;
}
