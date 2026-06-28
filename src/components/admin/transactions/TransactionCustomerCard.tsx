'use client';

import Link from 'next/link';
import { getAvatarBackground, getInitialsFromDisplayName } from '@/utils/userAvatar';
import type { TransactionUserInfo } from '@/types/adminTransactions';

import type { AdminReturnContext } from '@/utils/adminReturnNavigation';
import { withAdminReturn } from '@/utils/adminReturnNavigation';

type Props = {
  customer: TransactionUserInfo;
  isInternalTestAccount?: boolean;
  returnContext?: AdminReturnContext;
};

function displayValue(value?: string | null) {
  const text = value?.trim();
  return text && text.length > 0 ? text : '—';
}

function profileHref(
  customer: TransactionUserInfo,
  returnContext?: AdminReturnContext
): string | null {
  if (customer.customerType === 'user' && customer.id) {
    const href = `/command-center/users/${customer.id}`;
    return returnContext ? withAdminReturn(href, returnContext) : href;
  }

  if (customer.customerType === 'partner' && customer.partnerId) {
    const href = `/command-center/partners/${customer.partnerId}`;
    return returnContext ? withAdminReturn(href, returnContext) : href;
  }

  return null;
}

function profileHint(customer: TransactionUserInfo) {
  if (customer.customerType === 'partner') return 'View partner profile →';
  if (customer.customerType === 'user') return 'View user profile →';
  return null;
}

function avatarSeed(customer: TransactionUserInfo) {
  return customer.partnerId || customer.id || customer.fullName || 'customer';
}

export function TransactionCustomerCard({
  customer,
  isInternalTestAccount,
  returnContext,
}: Props) {
  const href = profileHref(customer, returnContext);
  const hint = profileHint(customer);
  const avatar = (
    <span
      className="txn_overview_user_avatar"
      aria-hidden
      style={{
        backgroundColor: getAvatarBackground(avatarSeed(customer)),
        color: '#ffffff',
      }}
    >
      {getInitialsFromDisplayName(customer.fullName)}
    </span>
  );

  const body = (
    <div className="txn_overview_user_body">
      <span className="txn_overview_user_name">{customer.fullName}</span>
      <div className="txn_customer_fields">
        <div className="txn_customer_field">
          <span className="txn_customer_label">Email</span>
          <span className="txn_customer_value">{displayValue(customer.email)}</span>
        </div>
        <div className="txn_customer_field">
          <span className="txn_customer_label">Phone</span>
          <span className="txn_customer_value">{displayValue(customer.phone)}</span>
        </div>
      </div>
      {isInternalTestAccount ? (
        <span className="pill pill_internal_test">Internal test</span>
      ) : null}
      {customer.customerType === 'partner' ? (
        <span className="pill pill_partner">Partner</span>
      ) : null}
      {customer.customerType === 'guest' || customer.customerType === 'anonymous' ? (
        <span className="pill pill_guest">Guest</span>
      ) : null}
      {hint ? <span className="txn_overview_user_hint">{hint}</span> : null}
    </div>
  );

  return (
    <section className="txn_overview_section txn_overview_user_card txn_detail_customer_card">
      {href ? (
        <Link href={href} className="txn_overview_user_link">
          {avatar}
          {body}
        </Link>
      ) : (
        <div className="txn_overview_user_static">
          {avatar}
          {body}
        </div>
      )}
    </section>
  );
}
