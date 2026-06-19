'use client';

import { useAdminAnalytics } from '@/context/AdminAnalyticsContext';
import '@/components/admin/layouts/topbar/internalTestToggle.css';

export function InternalTestExclusionToggle() {
  const { excludeInternalTest, canToggleInternalTestExclusion, setExcludeInternalTest } =
    useAdminAnalytics();

  if (!canToggleInternalTestExclusion) {
    return null;
  }

  return (
    <label className="internal_test_toggle" title="Exclude QA/internal test accounts from counts and lists">
      <input
        type="checkbox"
        checked={excludeInternalTest}
        onChange={(event) => setExcludeInternalTest(event.target.checked)}
      />
      <span>Exclude internal test accounts</span>
    </label>
  );
}
