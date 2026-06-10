'use client';

import Link from 'next/link';
import { AdminTransaction } from '@/data/adminMockData';
import { getAvatarBackground, getInitialsFromDisplayName } from '@/utils/userAvatar';

type Props = {
  transaction: AdminTransaction;
  userEmail?: string | null;
  isInternalTestAccount?: boolean;
};

export function TransactionCustomerCard({
  transaction,
  userEmail,
  isInternalTestAccount,
}: Props) {
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
        <div className="txn_overview_user_body">
          <span className="txn_overview_user_name">{transaction.user_name}</span>
          {userEmail && <span className="txn_overview_user_email">{userEmail}</span>}
          {isInternalTestAccount && (
            <span className="pill pill_internal_test">Internal test</span>
          )}
          <span className="txn_overview_user_hint">View user profile →</span>
        </div>
      </Link>
    </section>
  );
}
