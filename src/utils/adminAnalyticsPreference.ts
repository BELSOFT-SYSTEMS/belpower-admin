export const ADMIN_EXCLUDE_INTERNAL_TEST_KEY = 'adminExcludeInternalTest';
export const ADMIN_ANALYTICS_PREFERENCE_EVENT = 'admin-analytics-preference-changed';

export function getExcludeInternalTestPreference(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(ADMIN_EXCLUDE_INTERNAL_TEST_KEY);
  if (stored === 'false') return false;
  return true;
}

export function setExcludeInternalTestPreference(exclude: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_EXCLUDE_INTERNAL_TEST_KEY, exclude ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent(ADMIN_ANALYTICS_PREFERENCE_EVENT));
}

export function appendAnalyticsHeaders(headers: Record<string, string>): void {
  headers['X-Exclude-Internal-Test'] = getExcludeInternalTestPreference() ? 'true' : 'false';
}
