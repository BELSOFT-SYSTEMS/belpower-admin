import { devGroup, devLog, devWarn } from '@/utils/devLog';
import type { TransactionDetailData } from '@/types/adminTransactions';
import { getTransactionQuickActionAvailability } from '@/utils/transactionQuickActionState';
import { mapApiTransactionDetail } from '@/utils/mapApiTransactionDetail';

type RawRecord = Record<string, unknown>;

function pickFraudFields(raw: RawRecord) {
  const fraud = (raw.fraud ?? raw.fraud_info ?? {}) as RawRecord;

  return {
    status: raw.status ?? null,
    isSuspicious: raw.isSuspicious ?? raw.is_suspicious ?? raw.suspicious ?? null,
    isBlocked: raw.isBlocked ?? raw.is_blocked ?? raw.blocked ?? null,
    fraudReason: raw.fraudReason ?? raw.fraud_reason ?? null,
    fraudObject: raw.fraud ?? raw.fraud_info ?? null,
    reviewStatus: fraud.reviewStatus ?? fraud.review_status ?? null,
    riskReason: fraud.riskReason ?? fraud.risk_reason ?? null,
    auditorNotes: fraud.auditorNotes ?? fraud.auditor_notes ?? null,
    lastReviewedAt: fraud.lastReviewedAt ?? fraud.last_reviewed_at ?? null,
    lastReviewedBy: fraud.lastReviewedBy ?? fraud.last_reviewed_by ?? null,
  };
}

/** Dev-only: log raw + normalized fraud/status fields from GET /transactions/:id. */
export function devLogTransactionDetailResponse(
  transactionId: string,
  rawData: RawRecord,
  normalized?: TransactionDetailData
): void {
  devGroup(`[Transactions API] GET /transactions/${transactionId} — detail (raw)`, () => {
    devLog('raw data:', rawData);
    devLog('fraud/status fields (extracted):', pickFraudFields(rawData));
    devLog('requery (raw):', rawData.requery ?? null);

    if (normalized) {
      devLog('normalized:', {
        id: normalized.id,
        reference: normalized.reference,
        status: normalized.status,
        isSuspicious: normalized.isSuspicious,
        isBlocked: normalized.isBlocked,
        fraud: normalized.fraud,
        requery: normalized.requery,
      });

      if (!rawData.fraud && !rawData.fraud_info) {
        devWarn(
          'No fraud object in API response — reviewStatus was derived from isSuspicious:',
          normalized.fraud.reviewStatus
        );
      }

      if (!rawData.requery) {
        devWarn('No requery block in API response — using empty defaults');
      }

      const mapped = mapApiTransactionDetail(normalized);
      const computed = getTransactionQuickActionAvailability(mapped, {
        reviewStatus: normalized.fraud.reviewStatus,
        requeryRecommended: normalized.requery.recommended,
        requeryReason: normalized.requery.reason,
      });

      devLog('quickActions (API role flags):', normalized.quickActions);
      devLog('quickActions (computed enable/disable):', computed);
      devLog('manual requery UI:', {
        showButton:
          normalized.quickActions.requery && normalized.requery.recommended,
        reason: normalized.requery.reason,
      });
    }
  });
}
