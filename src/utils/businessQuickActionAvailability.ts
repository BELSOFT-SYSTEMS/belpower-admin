import type { BusinessDetail, BusinessListItem } from '@/types/adminBusinesses';

type BusinessStatusSource = Pick<BusinessListItem, 'status'> | Pick<BusinessDetail, 'status'>;

export function getBusinessQuickActionAvailability(business: BusinessStatusSource) {
  return {
    canBlock: business.status === 'active',
    canUnblock: business.status === 'suspended',
    canDeactivate: business.status === 'active' || business.status === 'suspended',
  };
}

export function getBusinessQuickActionDisabledTitle(
  action: 'block' | 'unblock' | 'deactivate',
  business: BusinessStatusSource
): string {
  const availability = getBusinessQuickActionAvailability(business);

  if (action === 'block' && !availability.canBlock) {
    return 'Only active businesses can be blocked';
  }
  if (action === 'unblock' && !availability.canUnblock) {
    return 'Only suspended businesses can be unblocked';
  }
  if (action === 'deactivate' && !availability.canDeactivate) {
    return 'Only active or suspended businesses can be deactivated';
  }

  return '';
}
