'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  FaBan,
  FaClipboardCheck,
  FaUnlock,
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

type AdminTransactionRowProps = {
  transaction: AdminTransaction;
  showUser?: boolean;
  showQuickActions?: boolean;
  quickActions?: TransactionsQuickActions;
  isInternalTestAccount?: boolean;
  rowBusy?: boolean;
  onReview?: (transaction: AdminTransaction) => void;
  onBlock?: (transaction: AdminTransaction) => void;
  onUnblock?: (transaction: AdminTransaction) => void;
};

export function AdminTransactionRow({
  transaction: tx,
  showUser = true,
  showQuickActions = false,
  quickActions,
  isInternalTestAccount = false,
  rowBusy = false,
  onReview,
  onBlock,
  onUnblock,
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
  const showActionBar = Boolean(
    quickActions?.review || quickActions?.block || showUnblock
  );

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

  if (!showQuickActions) {
    return (
      <Link
        href={`/command-center/transactions/${tx.id}`}
        className={`admin_txn_row${scheduled ? ' admin_txn_row_scheduled' : ''}`}
      >
        {rowContent}
      </Link>
    );
  }

  return (
    <div className={`admin_txn_row_wrap${scheduled ? ' admin_txn_row_wrap_scheduled' : ''}`}>
      <Link href={`/command-center/transactions/${tx.id}`} className="admin_txn_row_link">
        {rowContent}
      </Link>
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
                title={getTransactionQuickActionTitle('review', tx)}
                aria-label="Review"
                disabled={rowBusy || !canReview}
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
                title={getTransactionQuickActionTitle('block', tx)}
                aria-label="Block"
                disabled={rowBusy || !canBlock}
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
                title={getTransactionQuickActionTitle('unblock', tx)}
                aria-label="Unblock"
                disabled={rowBusy || !canUnblock}
                onClick={() => {
                  if (rowBusy || !canUnblock) return;
                  onUnblock?.(tx);
                }}
              >
                <FaUnlock />
              </button>
            )}
          </div>
        )}
        <Link href={`/command-center/transactions/${tx.id}`} className="admin_txn_meta_link">
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
      </div>
    </div>
  );
}
