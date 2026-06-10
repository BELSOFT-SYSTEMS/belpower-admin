'use client';

import {
  ADMIN_ROLE_DESCRIPTIONS,
  DEFAULT_ROLE_PERMISSIONS,
  groupPermissionsBySection,
} from '@/constants/adminPermissionCatalog';
import type { AdminAccount } from '@/types/adminManagement';
import { formatAdminRole } from '@/utils/adminRoleDisplay';

type AdminPermissionsPanelProps = {
  admin: AdminAccount;
};

export function AdminPermissionsPanel({ admin }: AdminPermissionsPanelProps) {
  const allAccess = Boolean(admin.all_access || admin.role === 'super_admin');
  const permissionKeys =
    admin.permissions ??
    DEFAULT_ROLE_PERMISSIONS[admin.role] ??
    [];
  const sections = groupPermissionsBySection(
    allAccess ? null : permissionKeys,
    allAccess
  );

  return (
    <div className="admin_permissions_panel">
      <div className="admin_permissions_summary">
        <div className="overview_field">
          <span className="overview_label">Role</span>
          <span className="overview_value">{formatAdminRole(admin.role)}</span>
        </div>
        <div className="overview_field">
          <span className="overview_label">Access level</span>
          <span className="overview_value">
            {allAccess ? (
              <span className="pill pill_role_super_admin">Full access</span>
            ) : (
              `${permissionKeys.length} permissions`
            )}
          </span>
        </div>
      </div>
      <p className="admin_permissions_role_desc">
        {ADMIN_ROLE_DESCRIPTIONS[admin.role] ?? 'Custom permission set'}
      </p>
      {sections.length > 0 ? (
        <div className="admin_permissions_groups">
          {sections.map((section) => (
            <section key={section.group} className="admin_permissions_group">
              <h3>{section.group}</h3>
              <ul>
                {section.items.map((item) => (
                  <li key={item.key}>
                    <span className="admin_permission_label">{item.label}</span>
                    <span className="admin_permission_key">{item.key}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="empty_fallback">No permissions assigned.</p>
      )}
    </div>
  );
}
