const ADMIN_PAGE_TITLES: Record<string, string> = {
  '/command-center': 'Dashboard',
  '/command-center/sign-in': 'Sign In',
  '/command-center/setup-account': 'Complete Setup',
  '/command-center/users': 'Users',
  '/command-center/transactions': 'Transactions',
  '/command-center/check-meter': 'Check Meter',
  '/command-center/wallet': 'Wallet',
  '/command-center/service-availability': 'Service Availability',
  '/command-center/admins': 'Admin Management',
  '/command-center/notifications': 'Notifications',
  '/command-center/messages': 'Messages',
  '/command-center/settings': 'Settings',
};

const DETAIL_ROUTE_TITLES: { prefix: string; title: string }[] = [
  { prefix: '/command-center/users/', title: 'User Details' },
  { prefix: '/command-center/transactions/', title: 'Transaction Details' },
  { prefix: '/command-center/admins/', title: 'Admin Details' },
];

export const ADMIN_SITE_TITLE = 'BelPower Command Center';

export function getAdminPageTitle(pathname: string | null): string | null {
  if (!pathname) return null;

  const exact = ADMIN_PAGE_TITLES[pathname];
  if (exact) return exact;

  const detail = DETAIL_ROUTE_TITLES.find(({ prefix }) => pathname.startsWith(prefix));
  return detail?.title ?? null;
}

export function formatAdminDocumentTitle(pathname: string | null): string {
  const pageTitle = getAdminPageTitle(pathname);
  return pageTitle ? `${pageTitle} · ${ADMIN_SITE_TITLE}` : ADMIN_SITE_TITLE;
}
