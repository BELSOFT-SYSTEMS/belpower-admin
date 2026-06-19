import type { AdminTransaction } from '@/data/adminMockData';
import type { ApiTransactionListItem } from '@/types/adminTransactions';

export function mapApiTransactionListItem(tx: ApiTransactionListItem): AdminTransaction {
  return {
    id: tx.id,
    reference: tx.reference,
    user_id: tx.userId,
    user_name: tx.userName,
    type: tx.type,
    service: tx.service,
    provider: tx.provider,
    amount: tx.amount,
    amount_purchased: tx.amountPurchased ?? undefined,
    total_amount: tx.totalAmount,
    service_charge: tx.serviceCharge,
    vat: tx.vat,
    status: tx.status,
    created_at: tx.createdAt,
    completed_at: tx.completedAt,
    is_scheduled: tx.isScheduled,
    scheduled_info: tx.scheduledInfo
      ? {
          frequency: tx.scheduledInfo.frequency,
          next_purchase: tx.scheduledInfo.nextPurchaseAt,
        }
      : undefined,
    suspicious: tx.isSuspicious,
    is_blocked: tx.isBlocked,
    review_status: tx.reviewStatus ?? null,
    can_clear_review: tx.canClearReview ?? false,
    fraud_reason: tx.fraudReason ?? undefined,
    avatar: '',
    payment_method: tx.paymentMethod ?? undefined,
    requery_recommended: tx.requeryRecommended ?? false,
    requery_reason: tx.requeryReason ?? undefined,
    is_refund: tx.isRefund ?? false,
    is_cashback: tx.isCashback ?? false,
    original_transaction_id: tx.originalTransactionId ?? undefined,
    refund_reason: tx.refundReason ?? undefined,
    cashback_source_type: tx.cashbackSourceType ?? undefined,
    cashback_rate: tx.cashbackRate ?? undefined,
    cashback_description: tx.cashbackDescription ?? undefined,
  };
}
