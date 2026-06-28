const ADMIN_BASE = '/command-center';

export type AdminReturnContext = {
  href: string;
  label: string;
};

export function isSafeAdminReturnPath(path: string): boolean {
  if (!path.startsWith(ADMIN_BASE)) return false;
  if (path.includes('://')) return false;
  return true;
}

export function withAdminReturn(
  targetPath: string,
  returnContext: AdminReturnContext
): string {
  const [pathname, existingQuery = ''] = targetPath.split('?');
  const params = new URLSearchParams(existingQuery);
  params.set('returnTo', returnContext.href);
  params.set('returnLabel', returnContext.label);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getAdminReturnFromSearchParams(
  searchParams: Pick<URLSearchParams, 'get'>,
  defaults: AdminReturnContext
): AdminReturnContext {
  const returnTo = searchParams.get('returnTo');
  const returnLabel = searchParams.get('returnLabel');

  if (returnTo && isSafeAdminReturnPath(returnTo)) {
    return {
      href: returnTo,
      label: returnLabel?.trim() || defaults.label,
    };
  }

  return defaults;
}

export function buildUsersListReturn(): AdminReturnContext {
  return { href: '/command-center/users', label: 'Back to users' };
}

export function buildUserDetailReturn(
  userId: string,
  userName?: string | null,
  options?: { tab?: string }
): AdminReturnContext {
  const params = new URLSearchParams();
  if (options?.tab) params.set('tab', options.tab);
  const query = params.toString();

  return {
    href: query
      ? `/command-center/users/${userId}?${query}`
      : `/command-center/users/${userId}`,
    label: userName?.trim() ? `Back to ${userName.trim()}` : 'Back to user',
  };
}

export function buildTransactionDetailReturn(
  transactionId: string,
  reference?: string | null,
  options?: { tab?: string }
): AdminReturnContext {
  const params = new URLSearchParams();
  if (options?.tab) params.set('tab', options.tab);
  const query = params.toString();
  const display = reference?.trim() || transactionId.slice(0, 8);

  return {
    href: query
      ? `/command-center/transactions/${transactionId}?${query}`
      : `/command-center/transactions/${transactionId}`,
    label: `Back to Transaction ${display}`,
  };
}

export function buildTransactionsListReturn(queryString?: string): AdminReturnContext {
  return {
    href: queryString
      ? `/command-center/transactions?${queryString}`
      : '/command-center/transactions',
    label: 'Back to transactions',
  };
}

export function buildFraudEventsReturn(queryString?: string): AdminReturnContext {
  return {
    href: queryString
      ? `/command-center/security/fraud-events?${queryString}`
      : '/command-center/security/fraud-events',
    label: 'Back to fraud events',
  };
}

export function buildWalletReturn(): AdminReturnContext {
  return { href: '/command-center/wallet', label: 'Back to wallet' };
}

export function buildPartnerDetailReturn(
  partnerId: string,
  partnerName?: string | null,
  options?: { tab?: string }
): AdminReturnContext {
  const params = new URLSearchParams();
  if (options?.tab) params.set('tab', options.tab);
  const query = params.toString();

  return {
    href: query
      ? `/command-center/partners/${partnerId}?${query}`
      : `/command-center/partners/${partnerId}`,
    label: partnerName?.trim() ? `Back to ${partnerName.trim()}` : 'Back to partner',
  };
}

export function buildPartnersListReturn(): AdminReturnContext {
  return { href: '/command-center/partners', label: 'Back to partners' };
}

export function buildDashboardReturn(): AdminReturnContext {
  return { href: '/command-center', label: 'Back to dashboard' };
}

export function buildCheckMeterReturn(queryString?: string): AdminReturnContext {
  return {
    href: queryString
      ? `/command-center/check-meter?${queryString}`
      : '/command-center/check-meter',
    label: 'Back to check meter',
  };
}
