'use client';

import { FaTimes } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import type { FraudScanResult } from '@/types/adminFraud';

type RunFraudScanModalProps = {
  open: boolean;
  isSubmitting: boolean;
  result: FraudScanResult | null;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function RunFraudScanModal({
  open,
  isSubmitting,
  result,
  error,
  onClose,
  onConfirm,
}: RunFraudScanModalProps) {
  if (!open) return null;

  const showResult = result && !isSubmitting;

  return (
    <div className="admin_modal_overlay" role="presentation" onClick={onClose}>
      <div
        className="admin_modal admin_modal_form_dialog"
        role="dialog"
        aria-labelledby="run-fraud-scan-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin_modal_header">
          <h2 id="run-fraud-scan-title">Run fraud scan</h2>
          <button
            type="button"
            className="admin_modal_close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="admin_modal_body">
          {!showResult ? (
            <>
              <p className="admin_confirm_message">
                This runs the same background checks as the scheduled job: wallet mismatches,
                negative amounts, cap breaches, and flagged transactions needing review.
              </p>
              <p className="admin_form_hint">
                New findings create fraud events and notify ops. Internal test accounts are
                flagged only — never auto-suspended.
              </p>
              {error && <p className="fraud_scan_modal_error">{error}</p>}
            </>
          ) : (
            <div className="fraud_scan_result">
              <p className="admin_confirm_message">
                Scan finished. <strong>{result.created}</strong> new event
                {result.created === 1 ? '' : 's'} created, <strong>{result.skipped}</strong>{' '}
                skipped (recent duplicate).
              </p>
              {result.errors.length > 0 && (
                <div className="fraud_scan_result_errors">
                  <p className="fraud_scan_result_errors_title">Partial errors</p>
                  <ul>
                    {result.errors.map((entry) => (
                      <li key={`${entry.check}-${entry.message}`}>
                        <strong>{entry.check}:</strong> {entry.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="admin_modal_actions">
          {showResult ? (
            <button type="button" className="btn_primary" onClick={onClose}>
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn_secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn_primary"
                onClick={onConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="inline-spinner" style={{ width: 14, height: 14 }} />{' '}
                    Scanning…
                  </>
                ) : (
                  'Run scan now'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
