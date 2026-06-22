/** Mirrors belpower-back helpers/adminPermissions.js — used for admin detail UI until API wiring. */

export type AdminPermissionCatalogItem = {
  key: string;
  label: string;
  group: string;
};

export const ADMIN_PERMISSION_CATALOG: AdminPermissionCatalogItem[] = [
  { key: 'profile.read', label: 'View own profile', group: 'Profile' },
  { key: 'admins.list', label: 'List admin accounts', group: 'Admin management' },
  { key: 'admins.view', label: 'View admin profiles', group: 'Admin management' },
  { key: 'admins.create', label: 'Register new admins', group: 'Admin management' },
  { key: 'admins.setup', label: 'Setup admin (immediate active)', group: 'Admin management' },
  { key: 'admins.update', label: 'Update admin profiles', group: 'Admin management' },
  { key: 'admins.delete', label: 'Delete / deactivate admins', group: 'Admin management' },
  { key: 'admins.password_reset', label: 'Send admin password reset', group: 'Admin management' },
  { key: 'users.list', label: 'List customer users', group: 'Users' },
  { key: 'users.detail', label: 'View customer user detail', group: 'Users' },
  { key: 'users.block', label: 'Block customer users', group: 'Users' },
  { key: 'users.activate', label: 'Activate customer users', group: 'Users' },
  { key: 'users.suspend', label: 'Suspend customer users', group: 'Users' },
  { key: 'users.clear_suspicion', label: 'Clear user suspicion flag', group: 'Users' },
  { key: 'users.delete', label: 'Delete customer users', group: 'Users' },
  {
    key: 'users.purchase_bills',
    label: 'Purchase bills for customer users',
    group: 'Users',
  },
  {
    key: 'users.wallet_credit_manual',
    label: 'Manual wallet credit (verified bank transfer)',
    group: 'Users',
  },
  { key: 'transactions.list', label: 'List all transactions', group: 'Transactions' },
  { key: 'transactions.detail', label: 'View transaction detail', group: 'Transactions' },
  { key: 'transactions.review', label: 'Mark transaction under review', group: 'Transactions' },
  { key: 'transactions.block', label: 'Block transaction after review', group: 'Transactions' },
  { key: 'transactions.requery', label: 'Manual transaction requery', group: 'Transactions' },
  { key: 'transactions.refund', label: 'Manual transaction refund', group: 'Transactions' },
  { key: 'fraud.view', label: 'View fraud events and alerts', group: 'Security' },
  { key: 'fraud.review', label: 'Review and dismiss fraud events', group: 'Security' },
  { key: 'meters.verify', label: 'Verify meter number', group: 'Meters' },
  { key: 'system.maintenance', label: 'Manage maintenance toggles', group: 'System' },
  { key: 'activity_logs.view', label: 'View activity logs', group: 'Audit' },
  { key: 'sessions.admins.view', label: 'View staff sessions', group: 'Sessions' },
  { key: 'sessions.admins.revoke', label: 'Revoke staff sessions', group: 'Sessions' },
  { key: 'sessions.users.view', label: 'View customer sessions', group: 'Sessions' },
  { key: 'dashboard.view', label: 'View dashboard', group: 'Dashboard' },
  { key: 'dashboard.money_stats', label: 'View money stats on dashboard', group: 'Dashboard' },
  { key: 'reports.view', label: 'View reports', group: 'Reports' },
  { key: 'services.manage', label: 'Manage services', group: 'Services' },
  { key: 'services.availability', label: 'View service reliability', group: 'Services' },
  { key: 'notifications.manage', label: 'Send notifications', group: 'Notifications' },
  { key: 'disco.manage', label: 'Disco / provider status', group: 'Operations' },
  { key: 'permissions.matrix', label: 'View permissions matrix', group: 'System' },
  { key: 'wallet.total_balance', label: 'View total wallet balance', group: 'Finance' },
  { key: '2fa.manage', label: 'Manage two-factor authentication', group: 'Security' },
];

export const ADMIN_ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: 'Full access to all admin panel features',
  admin: 'Manage users and junior staff; includes manual refunds',
  support: 'Dashboard and customer support (no money stats)',
  content_manager: 'Profile only until adverts module ships',
  finance: 'Users, transactions, money stats, refund (cannot activate users)',
};

/** Default role permission keys — aligned with backend ROLE_PERMISSIONS (mock). */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[] | null> = {
  super_admin: null,
  admin: [
    'profile.read',
    'admins.list',
    'admins.view',
    'admins.create',
    'admins.update',
    'admins.password_reset',
    'users.list',
    'users.detail',
    'users.block',
    'users.suspend',
    'users.clear_suspicion',
    'users.purchase_bills',
    'transactions.list',
    'transactions.detail',
    'transactions.review',
    'transactions.block',
    'transactions.requery',
    'transactions.refund',
    'fraud.view',
    'fraud.review',
    'meters.verify',
    'system.maintenance',
    'activity_logs.view',
    'sessions.admins.view',
    'sessions.users.view',
    'dashboard.view',
    'reports.view',
    'services.manage',
    'services.availability',
    'notifications.manage',
    'disco.manage',
    'permissions.matrix',
    '2fa.manage',
  ],
  support: [
    'profile.read',
    'users.list',
    'users.detail',
    'transactions.list',
    'transactions.detail',
    'transactions.review',
    'fraud.view',
    'meters.verify',
    'users.purchase_bills',
    'activity_logs.view',
    'sessions.users.view',
    'dashboard.view',
    'reports.view',
    'services.availability',
    '2fa.manage',
  ],
  finance: [
    'profile.read',
    'users.list',
    'users.detail',
    'users.block',
    'users.suspend',
    'users.wallet_credit_manual',
    'transactions.list',
    'transactions.detail',
    'transactions.review',
    'transactions.block',
    'transactions.requery',
    'transactions.refund',
    'fraud.view',
    'fraud.review',
    'activity_logs.view',
    'dashboard.view',
    'dashboard.money_stats',
    'reports.view',
    'wallet.total_balance',
    'services.availability',
    '2fa.manage',
  ],
  content_manager: ['profile.read', 'notifications.manage', 'services.availability', '2fa.manage'],
};

export function groupPermissionsBySection(
  permissionKeys: string[] | null,
  allAccess = false
): { group: string; items: AdminPermissionCatalogItem[] }[] {
  if (allAccess || permissionKeys === null) {
    const byGroup = new Map<string, AdminPermissionCatalogItem[]>();
    for (const item of ADMIN_PERMISSION_CATALOG) {
      const list = byGroup.get(item.group) ?? [];
      list.push(item);
      byGroup.set(item.group, list);
    }
    return Array.from(byGroup.entries()).map(([group, items]) => ({ group, items }));
  }

  const allowed = new Set(permissionKeys);
  const byGroup = new Map<string, AdminPermissionCatalogItem[]>();
  for (const item of ADMIN_PERMISSION_CATALOG) {
    if (!allowed.has(item.key)) continue;
    const list = byGroup.get(item.group) ?? [];
    list.push(item);
    byGroup.set(item.group, list);
  }
  return Array.from(byGroup.entries()).map(([group, items]) => ({ group, items }));
}
