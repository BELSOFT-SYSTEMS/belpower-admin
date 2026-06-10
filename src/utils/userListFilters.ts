import type { UserDisplayStatus, UsersListFilters } from '@/types/adminUsers';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  new: 'New',
  dormant: 'Dormant',
  blocked: 'Blocked',
  suspended: 'Suspended',
  inactive: 'Inactive',
  deleted: 'Deleted',
};

const DEFAULT_STATUSES: UserDisplayStatus[] = [
  'active',
  'new',
  'dormant',
  'blocked',
  'suspended',
  'inactive',
];

export function buildUsersStatusFilterOptions(filters?: UsersListFilters | null) {
  const statuses = filters?.statuses?.length ? filters.statuses : DEFAULT_STATUSES;

  return [
    { value: '__all__', label: 'All status' },
    ...statuses.map((status) => ({
      value: status,
      label: STATUS_LABELS[status] ?? status,
    })),
    { value: 'suspicious', label: 'Suspicious only' },
    { value: 'has_wallet_balance', label: 'Has wallet balance' },
  ];
}
