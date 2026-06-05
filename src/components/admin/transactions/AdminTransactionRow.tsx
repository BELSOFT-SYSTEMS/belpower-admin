'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { AdminTransaction } from '@/data/adminMockData';
import { getTransactionTitle } from '@/data/adminMockData';
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
import { formatPrice } from '@/utils/FormatPrice';

type AdminTransactionRowProps = {
  transaction: AdminTransaction;
  showUser?: boolean;
};

export function AdminTransactionRow({
  transaction: tx,
  showUser = true,
}: AdminTransactionRowProps) {
  return (
    <Link
      href={`/command-center/transactions/${tx.id}`}
      className={`admin_txn_row${isScheduledTransaction(tx) ? ' admin_txn_row_scheduled' : ''}`}
    >
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
          <span className="admin_txn_title">{getTransactionTitle(tx)}</span>
          <span
            className={`admin_txn_date${isScheduledTransaction(tx) ? ' admin_txn_date_scheduled' : ''}`}
          >
            {getTransactionListDate(tx)}
          </span>
        </div>
        <div className="admin_txn_row_bottom">
          <div>
            <span className="admin_txn_amount">{formatPrice(tx.total_amount)}</span>
            {showUser && <span className="admin_txn_user"> · {tx.user_name}</span>}
          </div>
          <div className="admin_txn_pills">
            <span className={`pill ${getTransactionStatusPillClass(tx)}`}>
              {getTransactionStatusLabel(tx)}
            </span>
            {tx.suspicious && <span className="pill pill_fraud">Flagged</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
