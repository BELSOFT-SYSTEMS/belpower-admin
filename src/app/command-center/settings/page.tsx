'use client';

import { useCallback, useState } from 'react';
import { FaCheckCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import '@/styles/adminSettings.css';
import '@/styles/adminShared.css';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminMaintenance } from '@/hooks/useAdminMaintenance';
import type { MaintenanceToggleKey } from '@/types/adminMaintenance';
import { canManageMaintenance } from '@/utils/adminSettingsAccess';

type MaintenanceToggle = {
  id: MaintenanceToggleKey;
  label: string;
  description: string;
};

type BannerState = {
  variant: 'success' | 'info' | 'error';
  title: string;
  message: string;
};

const MAINTENANCE_TOGGLES: MaintenanceToggle[] = [
  {
    id: 'stop_login',
    label: 'Stop login',
    description: 'Prevent users from signing in to the app during maintenance.',
  },
  {
    id: 'stop_all_purchases',
    label: 'Stop all purchases',
    description: 'Block every purchase type across the platform.',
  },
  {
    id: 'stop_wallet_funding',
    label: 'Stop wallet funding',
    description: 'Disable wallet top-ups and deposits.',
  },
  {
    id: 'stop_airtime',
    label: 'Stop airtime',
    description: 'Disable airtime purchases only.',
  },
  {
    id: 'stop_data',
    label: 'Stop data',
    description: 'Disable data bundle purchases only.',
  },
  {
    id: 'stop_electricity',
    label: 'Stop electricity',
    description: 'Disable electricity bill payments only.',
  },
  {
    id: 'stop_cable',
    label: 'Stop cable',
    description: 'Disable cable TV subscription purchases only.',
  },
];

const BANNER_ON: Record<MaintenanceToggleKey, string> = {
  stop_login: 'User login has been stopped for maintenance. All non-deleted users were notified.',
  stop_all_purchases: 'All purchases have been stopped for maintenance. All non-deleted users were notified.',
  stop_wallet_funding: 'Wallet funding has been stopped for maintenance. All non-deleted users were notified.',
  stop_airtime: 'Airtime purchases have been stopped for maintenance. All non-deleted users were notified.',
  stop_data: 'Data purchases have been stopped for maintenance. All non-deleted users were notified.',
  stop_electricity: 'Electricity purchases have been stopped for maintenance. All non-deleted users were notified.',
  stop_cable: 'Cable purchases have been stopped for maintenance. All non-deleted users were notified.',
};

const BANNER_OFF: Record<MaintenanceToggleKey, string> = {
  stop_login: 'User login has been re-enabled. All non-deleted users were notified.',
  stop_all_purchases: 'All purchases have been re-enabled. All non-deleted users were notified.',
  stop_wallet_funding: 'Wallet funding has been re-enabled. All non-deleted users were notified.',
  stop_airtime: 'Airtime purchases have been re-enabled. All non-deleted users were notified.',
  stop_data: 'Data purchases have been re-enabled. All non-deleted users were notified.',
  stop_electricity: 'Electricity purchases have been re-enabled. All non-deleted users were notified.',
  stop_cable: 'Cable purchases have been re-enabled. All non-deleted users were notified.',
};

function getBannerForToggle(id: MaintenanceToggleKey, enabled: boolean): BannerState {
  if (enabled) {
    return {
      variant: 'success',
      title: 'Maintenance enabled',
      message: BANNER_ON[id],
    };
  }

  return {
    variant: 'info',
    title: 'Service restored',
    message: BANNER_OFF[id],
  };
}

export default function SettingsPage() {
  const { admin } = useAdminAuth();
  const canManage = canManageMaintenance(admin);
  const { flags, isLoading, updatingKey, error, updateToggle } = useAdminMaintenance(canManage);
  const [banner, setBanner] = useState<BannerState | null>(null);

  const handleToggle = useCallback(
    async (id: MaintenanceToggleKey, enabled: boolean) => {
      try {
        await updateToggle(id, enabled);
        setBanner(getBannerForToggle(id, enabled));
      } catch {
        setBanner({
          variant: 'error',
          title: 'Update failed',
          message: 'Could not save this setting. Please try again.',
        });
      }
    },
    [updateToggle]
  );

  if (!canManage) {
    return (
      <div className="settings_page">
        <h1>Settings</h1>
        <p className="page_subtitle">You do not have permission to manage maintenance settings.</p>
      </div>
    );
  }

  return (
    <div className="settings_page">
      <h1>Settings</h1>
      <p className="page_subtitle">
        Maintenance controls for the consumer app. Each toggle updates live immediately and
        sends in-app and push notifications to all users except deleted accounts (including
        internal testers).
      </p>

      {(banner || error) && (
        <div
          className={`settings_banner settings_banner_${banner?.variant ?? 'error'}`}
          role="status"
        >
          <span className="settings_banner_icon" aria-hidden>
            {banner?.variant === 'success' ? (
              <FaCheckCircle />
            ) : (
              <FaInfoCircle />
            )}
          </span>
          <div className="settings_banner_body">
            <strong>{banner?.title ?? 'Error'}</strong>
            <p>{banner?.message ?? error}</p>
          </div>
          <button
            type="button"
            className="settings_banner_dismiss"
            aria-label="Dismiss message"
            onClick={() => setBanner(null)}
          >
            <FaTimes />
          </button>
        </div>
      )}

      <section className="settings_card">
        <div className="settings_card_header">
          <h2>Maintenance mode</h2>
          <p>Seven independent switches. Turning one on or off notifies all eligible users.</p>
        </div>

        {isLoading ? (
          <p className="page_subtitle">Loading maintenance settings…</p>
        ) : (
          <ul className="settings_toggle_list">
            {MAINTENANCE_TOGGLES.map((toggle) => {
              const enabled = flags?.[toggle.id] ?? false;
              const isUpdating = updatingKey === toggle.id;

              return (
                <li
                  key={toggle.id}
                  className={`settings_toggle_row${enabled ? ' is_active' : ''}`}
                >
                  <div className="settings_toggle_copy">
                    <span className="settings_toggle_label">{toggle.label}</span>
                    <p className="settings_toggle_desc">{toggle.description}</p>
                  </div>
                  <label className="settings_switch">
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={isUpdating || !flags}
                      onChange={(e) => handleToggle(toggle.id, e.target.checked)}
                      aria-label={`${toggle.label} maintenance`}
                    />
                    <span className="settings_switch_track" />
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
