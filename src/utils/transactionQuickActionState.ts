import type { AdminTransaction } from '@/data/adminMockData';
import type { TransactionReviewStatus } from '@/types/adminTransactions';

export type TransactionQuickActionAvailability = {
  canReview: boolean;
  canBlock: boolean;
  canUnblock: boolean;
  canClearReview: boolean;
  canRequery: boolean;
};

export type TransactionQuickActionContext = {
  reviewStatus?: TransactionReviewStatus;
  requeryEligible?: boolean;
  requeryRecommended?: boolean;
  requeryReason?: string | null;
};

function resolveReviewStatus(
  tx: AdminTransaction,
  context?: TransactionQuickActionContext
): TransactionReviewStatus {
  if (context?.reviewStatus) return context.reviewStatus;
  return tx.suspicious ? 'under_review' : 'cleared';
}

function isUnderReview(
  tx: AdminTransaction,
  reviewStatus: TransactionReviewStatus
): boolean {
  return (
    tx.suspicious ||
    reviewStatus === 'under_review' ||
    reviewStatus === 'pending' ||
    reviewStatus === 'escalated'
  );
}

function isFraudCleared(
  tx: AdminTransaction,
  reviewStatus: TransactionReviewStatus
): boolean {
  return reviewStatus === 'cleared' && !tx.suspicious;
}

/** Cleared fraud check and transaction is not in pending status. */
function isIdleClearedTransaction(
  tx: AdminTransaction,
  reviewStatus: TransactionReviewStatus
): boolean {
  return isFraudCleared(tx, reviewStatus) && tx.status !== 'pending';
}

export function getTransactionQuickActionAvailability(
  tx: AdminTransaction,
  context?: TransactionQuickActionContext
): TransactionQuickActionAvailability {
  const isBlocked = Boolean(tx.is_blocked);
  const reviewStatus = resolveReviewStatus(tx, context);
  const underReview = isUnderReview(tx, reviewStatus);
  const idleCleared = isIdleClearedTransaction(tx, reviewStatus);

  return {
    canReview: !idleCleared,
    canBlock: !isBlocked && !idleCleared,
    canUnblock: isBlocked && !underReview,
    canClearReview: underReview && !isBlocked,
    canRequery:
      context?.requeryEligible === true ||
      context?.requeryRecommended === true ||
      tx.requery_recommended === true,
  };
}

export type TransactionQuickActionType =
  | 'review'
  | 'block'
  | 'unblock'
  | 'clearReview'
  | 'requery';

export function getTransactionQuickActionTitle(
  action: TransactionQuickActionType,
  tx: AdminTransaction,
  context?: TransactionQuickActionContext
): string {
  const availability = getTransactionQuickActionAvailability(tx, context);
  const reviewStatus = resolveReviewStatus(tx, context);
  const underReview = isUnderReview(tx, reviewStatus);
  const idleCleared = isIdleClearedTransaction(tx, reviewStatus);
  const isBlocked = Boolean(tx.is_blocked);

  if (action === 'review' && availability.canReview) return 'Review transaction';
  if (action === 'block' && availability.canBlock) return 'Block transaction';
  if (action === 'unblock' && availability.canUnblock) return 'Unblock transaction';
  if (action === 'clearReview' && availability.canClearReview) {
    return 'Clear review — release hold and resume auto-requery';
  }
  if (action === 'requery' && availability.canRequery) {
    return (
      context?.requeryReason?.trim() ||
      'Manually requery provider for this transaction'
    );
  }

  if (action === 'review') {
    return idleCleared ? 'Transaction cleared — no review needed' : 'No review needed';
  }

  if (action === 'block') {
    if (isBlocked) return 'Transaction is already blocked';
    if (idleCleared) return 'Cannot block a cleared transaction';
    return 'Block unavailable';
  }

  if (action === 'unblock') {
    if (!isBlocked) return 'Transaction is not blocked';
    if (underReview) return 'Resolve review before unblocking';
    return 'Unblock unavailable';
  }

  if (action === 'clearReview') {
    if (isBlocked) return 'Unblock first — use Unblock for blocked transactions';
    if (!underReview) return 'Review is already cleared';
    return 'Clear review unavailable';
  }

  if (action === 'requery') {
    return context?.requeryReason?.trim() || 'Manual requery not available for this transaction';
  }

  return 'Unavailable';
}
