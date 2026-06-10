import type { AdminUserDetail } from '@/types/adminUserDetail';
import type { UserDisplayStatus } from '@/types/adminUsers';

export type DetailActionAvailability = {
  canBlock: boolean;
  canSuspend: boolean;
  canActivate: boolean;
};

export function getDetailActionAvailability(
  displayStatus: UserDisplayStatus
): DetailActionAvailability {
  if (displayStatus === 'deleted') {
    return { canBlock: false, canSuspend: false, canActivate: false };
  }

  const isBlocked = displayStatus === 'blocked';
  const isSuspended = displayStatus === 'suspended';
  const isRestricted = isBlocked || isSuspended;

  return {
    canBlock: !isBlocked,
    canSuspend: !isSuspended && !isBlocked,
    canActivate: isRestricted,
  };
}

export function getDetailActionTitle(
  action: 'block' | 'suspend' | 'activate',
  displayStatus: UserDisplayStatus
): string {
  const availability = getDetailActionAvailability(displayStatus);

  if (action === 'block' && availability.canBlock) return 'Block user';
  if (action === 'suspend' && availability.canSuspend) return 'Suspend user';
  if (action === 'activate' && availability.canActivate) return 'Activate user';

  if (displayStatus === 'deleted') {
    return 'User account is deleted';
  }

  if (action === 'block') return 'User is already blocked';
  if (action === 'suspend') {
    return displayStatus === 'blocked'
      ? 'Cannot suspend a blocked user'
      : 'User is already suspended';
  }
  return 'User is already active';
}

export function canShowClearFlag(detail: AdminUserDetail): boolean {
  const isFlagged = detail.suspiciousActivity || detail.isSuspicious;
  return detail.quickActions.clearSuspicion && isFlagged;
}
