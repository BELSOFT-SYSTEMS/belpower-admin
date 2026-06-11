'use client';

import { Loader2 } from 'lucide-react';
import { useAdminDemo } from '@/context/AdminDemoContext';

export function AdminDemoToggle() {
  const { enabled, isUpdating, canToggle, setEnabled } = useAdminDemo();

  if (!canToggle) return null;

  return (
    <label className="admin_demo_toggle" title="Switch the whole admin panel to demo data for team review">
      <span className="admin_demo_toggle_label">Demo mode</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        className={`admin_demo_toggle_track${enabled ? ' is_on' : ''}`}
        disabled={isUpdating}
        onClick={() => setEnabled(!enabled)}
      >
        <span className="admin_demo_toggle_thumb" />
      </button>
      {isUpdating && <Loader2 className="admin_demo_toggle_spinner" size={16} aria-hidden />}
      <span className="admin_demo_toggle_state">{enabled ? 'On' : 'Off'}</span>
    </label>
  );
}
