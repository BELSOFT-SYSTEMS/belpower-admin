'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  FaBan,
  FaClipboardCheck,
  FaUnlock,
  FaCheck,
} from 'react-icons/fa';
import type { AdminTransaction } from '@/data/adminMockData';
import { getTransactionTitle } from '@/data/adminMockData';
import type { TransactionsQuickActions } from '@/types/adminTransactions';
import {
  getTransactionIcon,
  getTransactionIconFallback,
} from '@/utils/transactionIcons';
import {
  getTransactionListDate,
  getTransactionStatusLabel,
  getTransactionStatusPillClass,
  isScheduledTransaction,
} from '@/utils/adminTransactionDisplay';
import {
  getTransactionQuickActionAvailability,
  getTransactionQuickActionTitle,
} from '@/utils/transactionQuickActionState';
import { formatPrice } from '@/utils/FormatPrice';
import { AdminRowCheckbox } from '@/components/admin/ui/AdminRowCheckbox';
import type { AdminReturnContext } from '@/utils/adminReturnNavigation';
import { withAdminReturn } from '@/utils/adminReturnNavigation';

type AdminTransactionRowProps = {
  transaction: AdminTransaction;
  showUser?: boolean;
  showQuickActions?: boolean;
  quickActions?: TransactionsQuickActions;
  isInternalTestAccount?: boolean;
  rowBusy?: boolean;
  disableDetailLinks?: boolean;
  detailReturnContext?: AdminReturnContext;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onReview?: (transaction: AdminTransaction) => void;
  onBlock?: (transaction: AdminTransaction) => void;
  onUnblock?: (transaction: AdminTransaction) => void;
  onClearReview?: (transaction: AdminTransaction) => void;
};

export function AdminTransactionRow({
  transaction: tx,
  showUser = true,
  showQuickActions = false,
  quickActions,
  isInternalTestAccount = false,
  rowBusy = false,
  disableDetailLinks = false,
  detailReturnContext,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  onReview,
  onBlock,
  onUnblock,
  onClearReview,
}: AdminTransactionRowProps) {
  const scheduled = isScheduledTransaction(tx);
  const isRefund = Boolean(tx.is_refund || tx.type === 'refund');
  const isCashback = Boolean(tx.is_cashback || tx.type === 'cashback');
  const refundPillTitle = tx.refund_reason?.trim() || undefined;
  const cashbackPillTitle =
    tx.cashback_description?.trim() ||
    (tx.cashback_rate && tx.cashback_source_type
      ? `${tx.cashback_rate} on ${tx.cashback_source_type} purchase`
      : tx.cashback_rate?.trim()) ||
    undefined;
  const actions = getTransactionQuickActionAvailability(tx);
  const canReview = Boolean(quickActions?.review) && actions.canReview;
  const canBlock = Boolean(quickActions?.block) && actions.canBlock;
  const showUnblock = Boolean(quickActions?.unblock && tx.is_blocked);
  const canUnblock = showUnblock && actions.canUnblock;
  const canClearReview = Boolean(quickActions?.clearReview) && actions.canClearReview;
  const showActionBar = Boolean(
    quickActions?.review || quickActions?.block || quickActions?.clearReview || showUnblock
  );
  const transactionDetailHref = detailReturnContext
    ? withAdminReturn(`/command-center/transactions/${tx.id}`, detailReturnContext)
    : `/command-center/transactions/${tx.id}`;

  const selectionCheckbox = selectionMode ? (
    <AdminRowCheckbox
      checked={selected}
      label={`Select transaction ${tx.reference}`}
      onChange={() => onToggleSelect?.()}
    />
  ) : null;

  const rowContent = (
    <>
      <div className="admin_txn_icon_wrap">
        <Image
          src={getTransactionIcon(tx)}
          alt=""
          width={24}
          height={24}
          onError={(e) => {
            e.currentTarget.src = getTransactionIconFallback(tx.type);
          }}
        />
      </div>
      <div className="admin_txn_row_body">
        <div className="admin_txn_row_top">
          <span className="admin_txn_title">
            {getTransactionTitle(tx)}
            {isRefund && (
              <span className="pill pill_refund" title={refundPillTitle}>
                Refund
              </span>
            )}
            {isCashback && (
              <span className="pill pill_cashback" title={cashbackPillTitle}>
                Cashback
              </span>
            )}
            {isInternalTestAccount && (
              <span className="pill pill_internal_test" title="Internal test account">
                Internal test
              </span>
            )}
          </span>
          <span className={`admin_txn_date${scheduled ? ' admin_txn_date_scheduled' : ''}`}>
            {getTransactionListDate(tx)}
          </span>
        </div>
        <div className="admin_txn_row_bottom">
          <div>
            <span className="admin_txn_amount">{formatPrice(tx.total_amount)}</span>
            {showUser && <span className="admin_txn_user"> · {tx.user_name}</span>}
          </div>
          {!showQuickActions && (
            <div className="admin_txn_pills">
              <span className={`pill ${getTransactionStatusPillClass(tx)}`}>
                {getTransactionStatusLabel(tx)}
              </span>
              {tx.suspicious && <span className="pill pill_fraud">Flagged</span>}
              {tx.is_blocked && <span className="pill pill_blocked">Blocked</span>}
              {tx.requery_recommended && (
                <span
                  className="pill pill_requery"
                  title={tx.requery_reason?.trim() || 'Manual requery recommended'}
                >
                  Requery
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );

  const rowClassName = `admin_txn_row${scheduled ? ' admin_txn_row_scheduled' : ''}`;

  if (!showQuickActions) {
    if (disableDetailLinks) {
      return (
        <div className={`${rowClassName} admin_txn_row_static admin_txn_row_with_checkbox`}>
          {selectionCheckbox}
          {rowContent}
        </div>
      );
    }

    return (
      <div className="admin_txn_row_with_checkbox">
        {selectionCheckbox}
        <Link href={transactionDetailHref} className={rowClassName}>
          {rowContent}
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`admin_txn_row_wrap${scheduled ? ' admin_txn_row_wrap_scheduled' : ''}${
        selectionMode ? ' admin_txn_row_with_checkbox' : ''
      }`}
    >
      {selectionCheckbox}
      {disableDetailLinks ? (
        <div className="admin_txn_row_link admin_txn_row_static">{rowContent}</div>
      ) : (
        <Link href={transactionDetailHref} className="admin_txn_row_link">
          {rowContent}
        </Link>
      )}
      <div className="admin_txn_meta">
        {showActionBar && (
          <div
            className="txn_list_quick_actions"
            role="group"
            aria-label={`Quick actions for ${tx.reference}`}
          >
            {quickActions?.review && (
              <button
                type="button"
                className="txn_quick_action action_review"
                title={
                  disableDetailLinks
                    ? 'Unavailable in demo mode'
                    : getTransactionQuickActionTitle('review', tx)
                }
                aria-label="Review"
                disabled={disableDetailLinks || rowBusy || !canReview}
                onClick={() => {
                  if (rowBusy || !canReview) return;
                  onReview?.(tx);
                }}
              >
                <FaClipboardCheck />
              </button>
            )}
            {quickActions?.block && (
              <button
                type="button"
                className="txn_quick_action action_block"
                title={
                  disableDetailLinks
                    ? 'Unavailable in demo mode'
                    : getTransactionQuickActionTitle('block', tx)
                }
                aria-label="Block"
                disabled={disableDetailLinks || rowBusy || !canBlock}
                onClick={() => {
                  if (rowBusy || !canBlock) return;
                  onBlock?.(tx);
                }}
              >
                <FaBan />
              </button>
            )}
            {showUnblock && (
              <button
                type="button"
                className="txn_quick_action action_unblock"
                title={
                  disableDetailLinks
                    ? 'Unavailable in demo mode'
                    : getTransactionQuickActionTitle('unblock', tx)
                }
                aria-label="Unblock"
                disabled={disableDetailLinks || rowBusy || !canUnblock}
                onClick={() => {
                  if (rowBusy || !canUnblock) return;
                  onUnblock?.(tx);
                }}
              >
                <FaUnlock />
              </button>
            )}
            {quickActions?.clearReview && (
              <button
                type="button"
                className="txn_quick_action action_clear"
                title={
                  disableDetailLinks
                    ? 'Unavailable in demo mode'
                    : getTransactionQuickActionTitle('clearReview', tx)
                }
                aria-label="Clear review"
                disabled={disableDetailLinks || rowBusy || !canClearReview}
                onClick={() => {
                  if (rowBusy || !canClearReview) return;
                  onClearReview?.(tx);
                }}
              >
                <FaCheck />
              </button>
            )}
          </div>
        )}
        {disableDetailLinks ? (
          <div className="admin_txn_meta_link admin_txn_row_static">
            <div className="admin_txn_pills">
              <span className={`pill ${getTransactionStatusPillClass(tx)}`}>
                {getTransactionStatusLabel(tx)}
              </span>
              {tx.suspicious && <span className="pill pill_fraud">Flagged</span>}
              {tx.is_blocked && <span className="pill pill_blocked">Blocked</span>}
              {tx.requery_recommended && (
                <span
                  className="pill pill_requery"
                  title={tx.requery_reason?.trim() || 'Manual requery recommended'}
                >
                  Requery
                </span>
              )}
            </div>
          </div>
        ) : (
          <Link href={transactionDetailHref} className="admin_txn_meta_link">
            <div className="admin_txn_pills">
              <span className={`pill ${getTransactionStatusPillClass(tx)}`}>
                {getTransactionStatusLabel(tx)}
              </span>
              {tx.suspicious && <span className="pill pill_fraud">Flagged</span>}
              {tx.is_blocked && <span className="pill pill_blocked">Blocked</span>}
              {tx.requery_recommended && (
                <span
                  className="pill pill_requery"
                  title={tx.requery_reason?.trim() || 'Manual requery recommended'}
                >
                  Requery
                </span>
              )}
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
