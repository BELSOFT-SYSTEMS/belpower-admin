'use client';

import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaFlag,
} from 'react-icons/fa';
import { AdminTransaction } from '@/data/adminMockData';
import type { TransactionFraudInfo } from '@/types/adminTransactions';
import { formatAdminDateTime } from '@/utils/formatAdminDate';
import { getTransactionReviewStatusLabel } from '@/utils/adminTransactionDisplay';

type Props = {
  transaction: AdminTransaction;
  fraud?: TransactionFraudInfo;
};

export function TransactionFraudAudit({ transaction, fraud }: Props) {
  const flagged = transaction.suspicious;
  const reviewStatus = fraud
    ? getTransactionReviewStatusLabel(fraud.reviewStatus)
    : flagged
      ? 'Pending review'
      : 'Cleared';
  const riskReason = fraud?.riskReason ?? transaction.fraud_reason ?? '—';
  const auditorNotes = fraud?.auditorNotes ?? '—';
  const lastReviewedAt = fraud?.lastReviewedAt
    ? formatAdminDateTime(fraud.lastReviewedAt)
    : '—';
  const lastReviewedBy = fraud?.lastReviewedBy ?? '—';

  return (
    <div className="fraud_audit_tab">
      <div
        className={`fraud_audit_banner${flagged ? ' fraud_audit_banner_alert' : ' fraud_audit_banner_clear'}`}
      >
        <div className="fraud_audit_banner_icon" aria-hidden>
          {flagged ? <FaExclamationTriangle /> : <FaShieldAlt />}
        </div>
        <div className="fraud_audit_banner_copy">
          <h3>{flagged ? 'Flagged for review' : 'No fraud flags'}</h3>
          <p>
            {flagged
              ? 'This transaction triggered fraud detection rules and requires admin review.'
              : 'Automated checks passed. No suspicious activity detected on this transaction.'}
          </p>
        </div>
        <span className={`pill ${flagged ? 'pill_fraud' : 'pill_success'}`}>
          {reviewStatus}
        </span>
      </div>

      <div className="fraud_audit_metrics">
        <div className="fraud_audit_metric_card">
          <span className="fraud_audit_metric_label">Suspicious flag</span>
          <span className={`pill ${flagged ? 'pill_fraud' : 'pill_success'}`}>
            {flagged ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="fraud_audit_metric_card">
          <span className="fraud_audit_metric_label">Review status</span>
          <strong className="fraud_audit_metric_value">{reviewStatus}</strong>
        </div>
        <div className="fraud_audit_metric_card">
          <span className="fraud_audit_metric_label">Risk reason</span>
          <strong
            className={`fraud_audit_metric_value${flagged ? ' fraud_audit_metric_warn' : ''}`}
          >
            {flagged ? 'Recorded' : 'None'}
          </strong>
        </div>
        <div className="fraud_audit_metric_card">
          <span className="fraud_audit_metric_label">Auditor notes</span>
          <strong className="fraud_audit_metric_value">
            {fraud?.auditorNotes ? 'On file' : 'None'}
          </strong>
        </div>
      </div>

      <div className="fraud_audit_stack">
        <section className="fraud_audit_panel fraud_audit_panel_full">
          <h4 className="fraud_audit_panel_title">
            <FaFlag aria-hidden /> Audit details
          </h4>
          <div className="fraud_audit_fields">
            <div className="fraud_audit_field">
              <span className="fraud_audit_field_label">Suspicious flag</span>
              <span className="fraud_audit_field_value">{flagged ? 'Yes' : 'No'}</span>
            </div>
            <div className="fraud_audit_field">
              <span className="fraud_audit_field_label">Review status</span>
              <span className="fraud_audit_field_value">{reviewStatus}</span>
            </div>
            <div className="fraud_audit_field">
              <span className="fraud_audit_field_label">Last reviewed</span>
              <span className="fraud_audit_field_value">{lastReviewedAt}</span>
            </div>
            <div className="fraud_audit_field">
              <span className="fraud_audit_field_label">Reviewed by</span>
              <span className="fraud_audit_field_value">{lastReviewedBy}</span>
            </div>
            <div className="fraud_audit_field fraud_audit_field_full">
              <span className="fraud_audit_field_label">Risk reason</span>
              <span className="fraud_audit_field_value">{riskReason}</span>
            </div>
            <div className="fraud_audit_field fraud_audit_field_full">
              <span className="fraud_audit_field_label">Auditor notes</span>
              <span className="fraud_audit_field_value fraud_audit_notes">
                {auditorNotes}
              </span>
            </div>
          </div>
        </section>

        {flagged && (transaction.fraud_reason || fraud?.riskReason) && (
          <section className="fraud_audit_panel fraud_audit_alert_panel">
            <h4 className="fraud_audit_panel_title">
              <FaExclamationTriangle aria-hidden /> Flag reason
            </h4>
            <p className="fraud_audit_reason_text">{riskReason}</p>
          </section>
        )}
      </div>
    </div>
  );
}
