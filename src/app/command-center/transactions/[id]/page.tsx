'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  FaPrint,
  FaBan,
  FaUnlock,
  FaClipboardCheck,
  FaClock,
  FaCheckCircle,
  FaCreditCard,
  FaRedo,
  FaWallet,
} from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/utils/FormatPrice';
import { TransactionAmountBreakdown } from '@/components/admin/transactions/TransactionAmountBreakdown';
import { TransactionServiceDetail } from '@/components/admin/transactions/TransactionServiceDetail';
import { TransactionPaymentReferences } from '@/components/admin/transactions/TransactionPaymentReferences';
import { TransactionFraudAudit } from '@/components/admin/transactions/TransactionFraudAudit';
import { BreakableTransactionReference } from '@/components/admin/transactions/BreakableTransactionReference';
import { TransactionCustomerCard } from '@/components/admin/transactions/TransactionCustomerCard';
import { AdminBackButton } from '@/components/admin/ui/AdminBackButton';
import { AdminTabs } from '@/components/admin/ui/AdminTabs';
import {
  getTransactionIcon,
  getTransactionIconFallback,
} from '@/utils/transactionIcons';
import { getTransactionTitle } from '@/data/adminMockData';
import { formatAdminDateTime } from '@/utils/formatAdminDate';
import { getPaymentMethodLabel } from '@/utils/transactionAmountDisplay';
import {
  formatScheduledFrequency,
  formatTxnDateTime,
  getTransactionStatusLabel,
  getTransactionStatusPillClass,
  isScheduledTransaction,
} from '@/utils/adminTransactionDisplay';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { resolveCanViewInternalTest } from '@/utils/adminInternalTestAccess';
import { useAdminTransactionDetail } from '@/hooks/useAdminTransactionDetail';
import { getAdminDemoMode } from '@/lib/adminDemoMode';
import {
  blockTransaction,
  clearTransactionReview,
  refundTransaction,
  requeryTransaction,
  unblockTransaction,
} from '@/lib/adminTransactions';
import { mapApiTransactionDetail } from '@/utils/mapApiTransactionDetail';
import {
  getReceiptScheduleProps,
  mapAdminTransactionToReceipt,
} from '@/utils/mapAdminTransactionToReceipt';
import { downloadTransactionReceiptPDF } from '@/utils/pdfUtils';
import {
  getTransactionQuickActionAvailability,
  getTransactionQuickActionTitle,
} from '@/utils/transactionQuickActionState';
import '@/styles/adminTransactionDetails.css';
import '@/styles/adminShared.css';
import {
  buildTransactionDetailReturn,
  buildTransactionsListReturn,
} from '@/utils/adminReturnNavigation';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'service', label: 'Service details' },
  { id: 'payment', label: 'Payment & references' },
  { id: 'fraud', label: 'Fraud & audit' },
];

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const transactionId = params?.id ?? '';
  const { canAccess, admin } = useAdminAuth();
  const showInternalTestBadge = resolveCanViewInternalTest(null, admin);
  const { detail, isLoading, error, errorCode, refresh } =
    useAdminTransactionDetail(transactionId);
  const [activeTab, setActiveTab] = useState('overview');
  const [isActing, setIsActing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && TABS.some((item) => item.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const transaction = useMemo(
    () => (detail ? mapApiTransactionDetail(detail) : null),
    [detail]
  );

  const transactionReturnContext = useMemo(
    () =>
      transaction
        ? buildTransactionDetailReturn(transaction.id, transaction.reference, {
            tab: activeTab !== 'overview' ? activeTab : undefined,
          })
        : buildTransactionsListReturn(),
    [transaction, activeTab]
  );

  const quickActionContext = detail
    ? {
        reviewStatus: detail.fraud.reviewStatus,
        requeryEligible: detail.requery.eligible,
        requeryRecommended: detail.requery.recommended,
        requeryReason: detail.requery.reason,
      }
    : undefined;

  const quickActionAvailability = transaction
    ? getTransactionQuickActionAvailability(transaction, quickActionContext)
    : null;

  const handleReview = () => {
    if (!quickActionAvailability?.canReview) return;
    setActiveTab('fraud');
    router.replace(`/command-center/transactions/${transactionId}?tab=fraud`);
  };

  const handleBlock = async () => {
    if (!transaction || !quickActionAvailability?.canBlock) return;
    if (getAdminDemoMode()) {
      toast.success(`Demo: block action simulated for ${transaction.reference}.`);
      return;
    }
    setIsActing(true);
    try {
      await blockTransaction(transaction.id);
      toast.success(`Transaction ${transaction.reference} blocked.`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to block transaction.');
    } finally {
      setIsActing(false);
    }
  };

  const handleUnblock = async () => {
    if (!transaction || !quickActionAvailability?.canUnblock) return;
    if (getAdminDemoMode()) {
      toast.success(`Demo: unblock action simulated for ${transaction.reference}.`);
      return;
    }
    setIsActing(true);
    try {
      await unblockTransaction(transaction.id);
      toast.success(`Transaction ${transaction.reference} unblocked.`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to unblock transaction.');
    } finally {
      setIsActing(false);
    }
  };

  const handleClearReview = async () => {
    if (!transaction || !quickActionAvailability?.canClearReview) return;
    if (getAdminDemoMode()) {
      toast.success(`Demo: review clear simulated for ${transaction.reference}.`);
      return;
    }
    setIsActing(true);
    try {
      await clearTransactionReview(transaction.id);
      toast.success(`Review cleared for ${transaction.reference}.`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to clear review.');
    } finally {
      setIsActing(false);
    }
  };

  const handleRequery = async () => {
    if (!transaction || !detail?.requery.eligible) return;
    if (getAdminDemoMode()) {
      toast.success(`Demo: requery simulated for ${transaction.reference}.`);
      return;
    }
    setIsActing(true);
    try {
      await requeryTransaction(transaction.id);
      toast.success(`Requery started for ${transaction.reference}.`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to requery transaction.');
    } finally {
      setIsActing(false);
    }
  };

  const handleRefund = async () => {
    if (!transaction || !detail?.quickActions.refund || !detail.refund.eligible) return;
    if (getAdminDemoMode()) {
      toast.success(`Demo: refund simulated for ${transaction.reference}.`);
      return;
    }

    const refundAmount = detail.refund.amount ?? transaction.totalAmount;
    const confirmed = window.confirm(
      `Refund ${formatPrice(refundAmount)} to ${detail.user.fullName}'s wallet?\n\nThis credits the customer wallet for a failed/pending transaction where payment was taken.`
    );
    if (!confirmed) return;

    const reasonInput = window.prompt('Optional refund reason for audit log:');
    if (reasonInput === null) return;

    setIsActing(true);
    try {
      await refundTransaction(transaction.id, reasonInput || undefined);
      toast.success(`Refund processed for ${transaction.reference}.`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to refund transaction.');
    } finally {
      setIsActing(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!detail) return;
    setIsPrinting(true);
    try {
      const receiptData = mapAdminTransactionToReceipt(detail);
      const schedule = getReceiptScheduleProps(detail);
      const ok = await downloadTransactionReceiptPDF(
        receiptData,
        schedule.isScheduled,
        schedule.frequency,
        schedule.nextPurchaseDate
      );
      if (ok) {
        toast.success('Receipt PDF downloaded.');
      } else {
        toast.error('Failed to generate receipt PDF.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate receipt PDF.');
    } finally {
      setIsPrinting(false);
    }
  };

  if (!canAccess('transactions.list')) {
    return (
      <div className="receipt_page_wrap transaction_details_page">
        <h1>Transaction details</h1>
        <p className="empty_fallback">You do not have access to transactions.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="receipt_page_wrap transaction_details_page">
        <AdminBackButton
          defaultHref="/command-center/transactions"
          defaultLabel="Back to transactions"
        />
        <div className="users_page_loading" style={{ padding: '4rem 0' }}>
          <Loader2 className="animate-spin" size={32} aria-hidden />
          <p>Loading transaction…</p>
        </div>
      </div>
    );
  }

  if (error || !detail || !transaction) {
    return (
      <div className="receipt_page_wrap transaction_details_page">
        <AdminBackButton
          defaultHref="/command-center/transactions"
          defaultLabel="Back to transactions"
        />
        <div className="admin_panel_card">
          <p>{errorCode === 'NOT_FOUND' ? 'Transaction not found.' : error ?? 'Transaction not found.'}</p>
        </div>
      </div>
    );
  }

  const iconSrc = getTransactionIcon(transaction);
  const tabs = [
    ...TABS.slice(0, 3),
    {
      id: 'fraud',
      label: 'Fraud & audit',
      badge: transaction.suspicious ? '!' : undefined,
    },
  ];
  const quickActions = detail.quickActions;
  const showReview = Boolean(quickActions.review);
  const showBlock = Boolean(quickActions.block);
  const showUnblock = Boolean(quickActions.unblock && transaction.is_blocked);
  const showClearReview = Boolean(
    quickActions.clearReview && quickActionAvailability?.canClearReview
  );
  const showRequery = Boolean(
    quickActions.requery && detail.requery.eligible
  );
  const showRefund = Boolean(
    canAccess('transactions.refund') &&
      quickActions.refund &&
      detail.refund.eligible
  );
  const requeryReason = detail.requery.reason?.trim();
  const refundHint = detail.refund.reason?.trim();

  return (
    <div className="receipt_page_wrap transaction_details_page">
      <AdminBackButton
        defaultHref="/command-center/transactions"
        defaultLabel="Back to transactions"
      />

      {transaction.suspicious && (
        <div className="admin_alert admin_alert_danger">
          <span>⚠</span>
          <div>
            <strong>Suspicious transaction</strong>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>
              {detail.fraud.riskReason ??
                transaction.fraud_reason ??
                'Flagged by fraud detection rules.'}
            </p>
          </div>
        </div>
      )}

      {detail.refund.walletRefunded && (
        <div className="admin_alert admin_alert_success">
          <span>✓</span>
          <div>
            <strong>Refunded to wallet</strong>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>
              {detail.refund.refundAmount != null
                ? `${formatPrice(detail.refund.refundAmount)} credited to customer wallet.`
                : 'This transaction has already been refunded.'}
            </p>
          </div>
        </div>
      )}

      <div className="receipt_card">
        <div className="detail_header_row">
          <div className="detail_header_left">
            <div className="detail_header_icon">
              <Image
                src={iconSrc}
                alt=""
                width={40}
                height={40}
                onError={(e) => {
                  e.currentTarget.src = getTransactionIconFallback(transaction.type);
                }}
              />
            </div>
            <div>
              <h1>{getTransactionTitle(transaction)}</h1>
              <p
                className="txn_meta"
                title={`${transaction.reference} · ${detail.user.fullName}`}
              >
                <BreakableTransactionReference
                  value={transaction.reference}
                  className="txn_meta_ref"
                />
                <span className="txn_meta_user_part">
                  {' · '}
                  {detail.user.fullName}
                </span>
              </p>
              <span className={`pill ${getTransactionStatusPillClass(transaction)}`}>
                {getTransactionStatusLabel(transaction)}
              </span>
              {showInternalTestBadge && detail.user.isInternalTestAccount && (
                <span className="pill pill_internal_test">Internal test</span>
              )}
            </div>
          </div>
          <div className="detail_header_right">
            <div className="header_actions">
              <button
                type="button"
                className="header_action_print"
                disabled={isPrinting || isActing}
                title="Download transaction receipt PDF"
                onClick={handlePrintReceipt}
              >
                <FaPrint /> {isPrinting ? 'Generating…' : 'Print'}
              </button>
              {showReview && (
                <button
                  type="button"
                  className="header_action_review"
                  disabled={!quickActionAvailability?.canReview || isActing}
                  title={getTransactionQuickActionTitle('review', transaction, quickActionContext)}
                  onClick={handleReview}
                >
                  <FaClipboardCheck /> Review
                </button>
              )}
              {showBlock && (
                <button
                  type="button"
                  className="header_action_block"
                  disabled={!quickActionAvailability?.canBlock || isActing}
                  title={getTransactionQuickActionTitle('block', transaction, quickActionContext)}
                  onClick={handleBlock}
                >
                  <FaBan /> Block
                </button>
              )}
              {showUnblock && (
                <button
                  type="button"
                  className="header_action_unblock"
                  disabled={!quickActionAvailability?.canUnblock || isActing}
                  title={getTransactionQuickActionTitle('unblock', transaction, quickActionContext)}
                  onClick={handleUnblock}
                >
                  <FaUnlock /> Unblock
                </button>
              )}
              {showClearReview && (
                <button
                  type="button"
                  className="header_action_clear_review"
                  disabled={isActing}
                  title={getTransactionQuickActionTitle(
                    'clearReview',
                    transaction,
                    quickActionContext
                  )}
                  onClick={handleClearReview}
                >
                  <FaCheckCircle /> Clear review
                </button>
              )}
              {showRequery && (
                <button
                  type="button"
                  className="header_action_requery"
                  disabled={isActing}
                  title={getTransactionQuickActionTitle('requery', transaction, quickActionContext)}
                  onClick={handleRequery}
                >
                  <FaRedo /> Manual requery
                </button>
              )}
              {showRefund && (
                <button
                  type="button"
                  className="header_action_refund"
                  disabled={isActing}
                  title={
                    refundHint ||
                    `Refund ${formatPrice(detail.refund.amount ?? transaction.totalAmount)} to customer wallet`
                  }
                  onClick={handleRefund}
                >
                  <FaWallet /> Refund to wallet
                </button>
              )}
            </div>
            {showRequery && detail.requery.recommended && requeryReason && (
              <p className="header_requery_hint">{requeryReason}</p>
            )}
            <TransactionCustomerCard
              transaction={transaction}
              userEmail={detail.user.email}
              isInternalTestAccount={
                showInternalTestBadge && detail.user.isInternalTestAccount
              }
              returnContext={transactionReturnContext}
            />
          </div>
        </div>

        <AdminTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'overview' && (
          <div className="tab_panel txn_overview_tab">
            {(detail.requery.autoRequeryPaused ||
              detail.requery.recommended ||
              detail.requery.requeryCount > 0) && (
              <div className="admin_requery_banner">
                <strong>Requery status</strong>
                {requeryReason && <p>{requeryReason}</p>}
                <p className="admin_requery_meta">
                  Auto attempts: {detail.requery.requeryCount} / {detail.requery.maxRequeryCount}
                  {detail.requery.lastRequeryAt &&
                    ` · Last auto: ${formatAdminDateTime(detail.requery.lastRequeryAt)}`}
                  {detail.requery.nextRetryAt &&
                    ` · Next retry: ${formatAdminDateTime(detail.requery.nextRetryAt)}`}
                  {detail.requery.timeoutReason &&
                    ` · ${detail.requery.timeoutReason.replace(/_/g, ' ')}`}
                </p>
                {detail.requery.autoRequeryPaused && detail.requery.autoRequeryPausedReason && (
                  <p className="admin_requery_note">
                    Auto-requery paused ({detail.requery.autoRequeryPausedReason.replace(/_/g, ' ')}
                    ).
                  </p>
                )}
              </div>
            )}

            {isScheduledTransaction(transaction) && transaction.scheduled_info && (
              <div className="admin_scheduled_banner">
                <strong>Scheduled purchase</strong>
                <p>
                  Repeats {formatScheduledFrequency(transaction.scheduled_info.frequency).toLowerCase()}
                  . Next run:{' '}
                  <strong>{formatAdminDateTime(transaction.scheduled_info.next_purchase)}</strong>
                </p>
                <p className="admin_scheduled_note">
                  Payment is drawn from the user&apos;s wallet on each scheduled date. Ensure
                  sufficient wallet balance before the next run.
                </p>
              </div>
            )}

            <div className="txn_overview_top">
              <div className="txn_overview_service_card">
                <div className="txn_overview_service_icon">
                  <Image
                    src={iconSrc}
                    alt=""
                    width={40}
                    height={40}
                    onError={(e) => {
                      e.currentTarget.src = getTransactionIconFallback(transaction.type);
                    }}
                  />
                </div>
                <div className="txn_overview_service_body">
                  <span className="txn_overview_eyebrow">Service</span>
                  <h3>{getTransactionTitle(transaction)}</h3>
                  <p className="txn_overview_ref">
                    <BreakableTransactionReference
                      value={transaction.reference}
                      className="txn_breakable_ref"
                    />
                    {transaction.order_id ? (
                      <>
                        <span className="txn_overview_ref_sep"> · </span>
                        <BreakableTransactionReference
                          value={transaction.order_id}
                          className="txn_breakable_ref"
                        />
                      </>
                    ) : null}
                  </p>
                  <span className={`pill ${getTransactionStatusPillClass(transaction)}`}>
                    {getTransactionStatusLabel(transaction)}
                  </span>
                </div>
              </div>

              <div className="txn_overview_payment_card">
                <h4 className="txn_overview_card_title">Payment summary</h4>
                <div className="txn_overview_breakdown">
                  <TransactionAmountBreakdown transaction={transaction} />
                </div>
              </div>
            </div>

            <div className="txn_overview_timeline">
              <div className="txn_overview_timeline_item">
                <FaClock className="txn_overview_timeline_icon" aria-hidden />
                <div>
                  <span className="txn_overview_timeline_label">Created</span>
                  <span className="txn_overview_timeline_value">
                    {formatAdminDateTime(transaction.created_at)}
                  </span>
                </div>
              </div>
              <div className="txn_overview_timeline_item">
                <FaCheckCircle className="txn_overview_timeline_icon" aria-hidden />
                <div>
                  <span className="txn_overview_timeline_label">Completed</span>
                  <span className="txn_overview_timeline_value">
                    {formatAdminDateTime(transaction.completed_at)}
                  </span>
                </div>
              </div>
              <div className="txn_overview_timeline_item">
                <FaCreditCard className="txn_overview_timeline_icon" aria-hidden />
                <div>
                  <span className="txn_overview_timeline_label">Payment method</span>
                  <span className="txn_overview_timeline_value">
                    {getPaymentMethodLabel(
                      detail.payment.method ?? transaction.payment_method
                    )}
                  </span>
                </div>
              </div>
              {isScheduledTransaction(transaction) && transaction.scheduled_info && (
                <div className="txn_overview_timeline_item">
                  <FaClock className="txn_overview_timeline_icon txn_timeline_scheduled" aria-hidden />
                  <div>
                    <span className="txn_overview_timeline_label">Next purchase</span>
                    <span className="txn_overview_timeline_value">
                      {formatTxnDateTime(transaction.scheduled_info.next_purchase)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'service' && (
          <div className="tab_panel">
            <TransactionServiceDetail transaction={transaction} />
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="tab_panel">
            <TransactionPaymentReferences transaction={transaction} payment={detail.payment} />
          </div>
        )}

        {activeTab === 'fraud' && (
          <div className="tab_panel">
            <TransactionFraudAudit transaction={transaction} fraud={detail.fraud} />
          </div>
        )}
      </div>
    </div>
  );
}
