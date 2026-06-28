import type { PartnerStatus } from '@/types/adminPartners';

export function buildPartnersStatusFilterOptions(filters: { statuses?: PartnerStatus[] } | null) {
  const statuses = filters?.statuses ?? [
    'pending_review',
    'active',
    'rejected',
    'blocked',
    'deactivated',
  ];

  return [
    { value: '__all__', label: 'All statuses' },
    ...statuses.map((status) => ({
      value: status,
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    })),
    { value: 'refunds_blocked', label: 'Refunds blocked' },
  ];
}
