'use client';

import Link from 'next/link';
import { AdminTransaction } from '@/data/adminMockData';
import { getAvatarBackground, getInitialsFromDisplayName } from '@/utils/userAvatar';

type Props = {
  transaction: AdminTransaction;
};

export function TransactionCustomerCard({ transaction }: Props) {
  return (
    <section className="txn_overview_section txn_overview_user_card txn_detail_customer_card">
      <Link
        href={`/command-center/users/${transaction.user_id}`}
        className="txn_overview_user_link"
      >
        <span
          className="txn_overview_user_avatar"
          aria-hidden
          style={{
            backgroundColor: getAvatarBackground(transaction.user_id),
            color: '#ffffff',
          }}
        >
          {getInitialsFromDisplayName(transaction.user_name)}
        </span>
        <div>
          <span className="txn_overview_user_name">{transaction.user_name}</span>
          <span className="txn_overview_user_hint">View user profile →</span>
        </div>
      </Link>
    </section>
  );
}
