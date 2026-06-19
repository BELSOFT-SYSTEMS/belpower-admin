'use client';

import { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaSearch, FaTimes } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import type { FraudScanStepState } from '@/constants/fraudScanSteps';
import type { FraudScanResult } from '@/types/adminFraud';

type RunFraudScanModalProps = {
  open: boolean;
  isScanning: boolean;
  steps: FraudScanStepState[];
  result: FraudScanResult | null;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

function AnimatedCount({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value <= 0) {
      setDisplayValue(0);
      return;
    }

    const durationMs = 450;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      setDisplayValue(Math.round(value * progress));
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return <>{displayValue}</>;
}

function ScanStepRow({ step }: { step: FraudScanStepState }) {
  const isScanning = step.status === 'scanning';
  const isComplete = step.status === 'complete';
  const isError = step.status === 'error';

  return (
    <li
      className={`fraud_scan_step_row fraud_scan_step_row_${step.status}${
        isScanning ? ' fraud_scan_step_row_active' : ''
      }`}
    >
      <span className="fraud_scan_step_icon" aria-hidden>
        {isScanning ? (
          <Loader2 className="fraud_scan_step_spinner" />
        ) : isComplete ? (
          <FaCheckCircle className="fraud_scan_step_icon_done" />
        ) : isError ? (
          <FaExclamationCircle className="fraud_scan_step_icon_error" />
        ) : (
          <FaSearch className="fraud_scan_step_icon_pending" />
        )}
      </span>
      <div className="fraud_scan_step_body">
        <span className="fraud_scan_step_label">{step.label}</span>
        {isScanning && <span className="fraud_scan_step_status_text">Scanning…</span>}
        {isComplete && (
          <span className="fraud_scan_step_status_text">
            <AnimatedCount value={step.found} /> found
            {step.created > 0 ? ` · ${step.created} new` : ''}
          </span>
        )}
        {isError && <span className="fraud_scan_step_status_text">Check failed</span>}
      </div>
      <span className="fraud_scan_step_count" aria-live="polite">
        {isComplete ? <AnimatedCount value={step.found} /> : isScanning ? '…' : '—'}
      </span>
    </li>
  );
}

export function RunFraudScanModal({
  open,
  isScanning,
  steps,
  result,
  error,
  onClose,
  onConfirm,
}: RunFraudScanModalProps) {
  if (!open) return null;

  const showProgress = isScanning || Boolean(result);
  const showResult = Boolean(result) && !isScanning;

  return (
    <div className="admin_modal_overlay" role="presentation" onClick={onClose}>
      <div
        className="admin_modal admin_modal_form_dialog fraud_scan_modal"
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
            disabled={isScanning}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="admin_modal_body">
          {!showProgress ? (
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
            <div className="fraud_scan_progress">
              <div
                className={`fraud_scan_progress_header${
                  isScanning ? ' fraud_scan_progress_header_active' : ''
                }`}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="fraud_scan_progress_spinner" />
                    <span>Scanning for fraud signals…</span>
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="fraud_scan_progress_done_icon" />
                    <span>Scan complete</span>
                  </>
                )}
              </div>

              <ul className="fraud_scan_steps_list">
                {steps.map((step) => (
                  <ScanStepRow key={step.id} step={step} />
                ))}
              </ul>

              {showResult && result && (
                <div className="fraud_scan_result">
                  <p className="admin_confirm_message">
                    <strong>{result.created}</strong> new event
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

              {error && !isScanning && <p className="fraud_scan_modal_error">{error}</p>}
            </div>
          )}
        </div>

        <div className="admin_modal_footer">
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
                  disabled={isScanning}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn_primary"
                  onClick={onConfirm}
                  disabled={isScanning}
                >
                  {isScanning ? (
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
    </div>
  );
}
