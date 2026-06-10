import { ADMIN_USER_MESSAGING_ENABLED } from '@/constants/adminFeatureFlags';
import type { ApiUser, UserDisplayStatus } from '@/types/adminUsers';

export type UserQuickActionAvailability = {
  canMessage: boolean;
  canBlock: boolean;
  canSuspend: boolean;
  canActivate: boolean;
};

const RESTRICTED_STATUSES: UserDisplayStatus[] = ['blocked', 'suspended'];

export function getUserQuickActionAvailability(user: ApiUser): UserQuickActionAvailability {
  const { displayStatus } = user;

  if (displayStatus === 'deleted') {
    return {
      canMessage: false,
      canBlock: false,
      canSuspend: false,
      canActivate: false,
    };
  }

  const isBlocked = displayStatus === 'blocked';
  const isSuspended = displayStatus === 'suspended';
  const isRestricted = RESTRICTED_STATUSES.includes(displayStatus);

  return {
    canMessage: ADMIN_USER_MESSAGING_ENABLED,
    canBlock: !isBlocked,
    canSuspend: !isSuspended && !isBlocked,
    canActivate: isRestricted,
  };
}

export function getQuickActionDisabledTitle(
  action: 'message' | 'block' | 'suspend' | 'activate',
  user: ApiUser
): string {
  const availability = getUserQuickActionAvailability(user);

  if (action === 'message' && availability.canMessage) return 'Message user';
  if (action === 'block' && availability.canBlock) return 'Block user';
  if (action === 'suspend' && availability.canSuspend) return 'Suspend user';
  if (action === 'activate' && availability.canActivate) return 'Activate user';

  if (user.displayStatus === 'deleted') {
    return 'User account is deleted';
  }

  switch (action) {
    case 'block':
      return 'User is already blocked';
    case 'suspend':
      return user.displayStatus === 'blocked'
        ? 'Cannot suspend a blocked user'
        : 'User is already suspended';
    case 'activate':
      return 'User is already active';
    default:
      return 'Unavailable';
  }
}
