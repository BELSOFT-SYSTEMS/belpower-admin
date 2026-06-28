import type { PartnerListItem, PartnerStatus } from '@/types/adminPartners';

export function getPartnerDisplayName(partner: {
  tradingName?: string | null;
  businessName: string;
}): string {
  return partner.tradingName?.trim() || partner.businessName;
}

export function formatPartnerStatusLabel(status: PartnerStatus): string {
  return status.replace(/_/g, ' ');
}

export function partnerStatusClass(status: PartnerStatus): string {
  if (status === 'active') return 'pill pill_active';
  if (status === 'pending_review') return 'pill pill_pending';
  if (status === 'rejected' || status === 'blocked') return 'pill pill_blocked';
  return 'pill pill_inactive';
}

export function getPartnerQuickActionAvailability(partner: PartnerListItem) {
  return {
    canApprove: partner.status === 'pending_review',
    canReject: partner.status === 'pending_review',
    canReopenReview: partner.status === 'rejected',
    canBlock: partner.status === 'active',
    canUnblock: partner.status === 'blocked',
    canDeactivate: partner.status === 'active',
    canUnblockRefunds: Boolean(partner.refundsBlocked),
  };
}

export function getPartnerQuickActionDisabledTitle(
  action:
    | 'approve'
    | 'reject'
    | 'reopenReview'
    | 'block'
    | 'unblock'
    | 'deactivate'
    | 'refundsUnblock',
  partner: PartnerListItem
): string {
  const availability = getPartnerQuickActionAvailability(partner);

  if (action === 'approve' && !availability.canApprove) {
    return 'Only pending applications can be approved';
  }
  if (action === 'reject' && !availability.canReject) {
    return 'Only pending applications can be rejected';
  }
  if (action === 'reopenReview' && !availability.canReopenReview) {
    return 'Only rejected applications can be reopened for review';
  }
  if (action === 'block' && !availability.canBlock) {
    return 'Only active partners can be blocked';
  }
  if (action === 'unblock' && !availability.canUnblock) {
    return 'Only blocked partners can be unblocked';
  }
  if (action === 'deactivate' && !availability.canDeactivate) {
    return 'Only active partners can be deactivated';
  }
  if (action === 'refundsUnblock' && !availability.canUnblockRefunds) {
    return 'Partner refunds are not blocked';
  }

  return '';
}
