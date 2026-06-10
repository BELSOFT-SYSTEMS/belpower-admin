export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'support'
  | 'finance'
  | 'content_manager';

export type AdminStatus = 'active' | 'suspended' | 'pending' | 'inactive';

export type AdminAccount = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: AdminRole;
  status: AdminStatus;
  created_at: string;
  last_login: string;
  created_by?: string;
  email_verified?: boolean;
  all_access?: boolean;
  permissions?: string[];
};

export type AdminLogStatus = 'success' | 'failed' | 'warning';

export type AdminLogMetadata = Record<string, unknown>;

export type AdminLog = {
  id: string;
  admin_id: string;
  action: string;
  detail: string;
  timestamp: string;
  ip: string;
  status?: AdminLogStatus;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: AdminLogMetadata;
};

export type AdminFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: AdminRole;
  status: AdminStatus;
};

export const ADMIN_ROLES: AdminRole[] = [
  'super_admin',
  'admin',
  'support',
  'finance',
  'content_manager',
];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  support: 'Support',
  finance: 'Finance',
  content_manager: 'Content manager',
};
