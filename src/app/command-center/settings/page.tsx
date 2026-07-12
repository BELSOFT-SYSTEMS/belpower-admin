'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
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
  section?: 'maintenance' | 'dva';
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
    id: 'stop_paystack_dva',
    label: 'Disable Paystack DVA',
    description:
      'Blocks Paystack DVA wallet funding and electricity/cable purchases. Card and wallet payments stay available.',
    section: 'dva',
  },
  {
    id: 'stop_buypower_dva',
    label: 'Disable BuyPower DVA',
    description:
      'Blocks BuyPower DVA wallet top-up and electricity/cable purchases. Card and wallet payments stay available.',
    section: 'dva',
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
  {
    id: 'stop_betting',
    label: 'Stop betting',
    description: 'Disable betting wallet top-ups only.',
  },
];

const BANNER_ON: Record<MaintenanceToggleKey, string> = {
  stop_login: 'User login has been stopped for maintenance. All non-deleted users were notified.',
  stop_all_purchases: 'All purchases have been stopped for maintenance. All non-deleted users were notified.',
  stop_wallet_funding: 'Wallet funding has been stopped for maintenance. All non-deleted users were notified.',
  stop_paystack_dva:
    'Paystack DVA has been disabled. Wallet funding and electricity/cable via Paystack DVA are unavailable. All non-deleted users were notified.',
  stop_buypower_dva:
    'BuyPower DVA has been disabled. Wallet top-up and electricity/cable via BuyPower DVA are unavailable. All non-deleted users were notified.',
  stop_airtime: 'Airtime purchases have been stopped for maintenance. All non-deleted users were notified.',
  stop_data: 'Data purchases have been stopped for maintenance. All non-deleted users were notified.',
  stop_electricity: 'Electricity purchases have been stopped for maintenance. All non-deleted users were notified.',
  stop_cable: 'Cable purchases have been stopped for maintenance. All non-deleted users were notified.',
  stop_betting: 'Betting purchases have been stopped for maintenance. All non-deleted users were notified.',
};

const BANNER_OFF: Record<MaintenanceToggleKey, string> = {
  stop_login: 'User login has been re-enabled. All non-deleted users were notified.',
  stop_all_purchases: 'All purchases have been re-enabled. All non-deleted users were notified.',
  stop_wallet_funding: 'Wallet funding has been re-enabled. All non-deleted users were notified.',
  stop_paystack_dva: 'Paystack DVA has been re-enabled for wallet funding and utility purchases. All non-deleted users were notified.',
  stop_buypower_dva: 'BuyPower DVA has been re-enabled for wallet top-up and utility purchases. All non-deleted users were notified.',
  stop_airtime: 'Airtime purchases have been re-enabled. All non-deleted users were notified.',
  stop_data: 'Data purchases have been re-enabled. All non-deleted users were notified.',
  stop_electricity: 'Electricity purchases have been re-enabled. All non-deleted users were notified.',
  stop_cable: 'Cable purchases have been re-enabled. All non-deleted users were notified.',
  stop_betting: 'Betting purchases have been re-enabled. All non-deleted users were notified.',
};

function getBannerForToggle(id: MaintenanceToggleKey, enabled: boolean): BannerState {
  const isDvaToggle = id === 'stop_paystack_dva' || id === 'stop_buypower_dva';

  if (enabled) {
    return {
      variant: 'success',
      title: isDvaToggle ? 'DVA provider disabled' : 'Maintenance enabled',
      message: BANNER_ON[id],
    };
  }

  return {
    variant: 'info',
    title: isDvaToggle ? 'DVA provider enabled' : 'Service restored',
    message: BANNER_OFF[id],
  };
}

const MAINTENANCE_SECTION_TOGGLES = MAINTENANCE_TOGGLES.filter((toggle) => toggle.section !== 'dva');
const DVA_SECTION_TOGGLES = MAINTENANCE_TOGGLES.filter((toggle) => toggle.section === 'dva');
const SETTINGS_TOAST_AUTO_DISMISS_MS = 6000;
const PARTNER_API_DOCS_URL = 'https://partners.belpower.ng/docs';

function SettingsPageHeader() {
  return (
    <div className="settings_page_header">
      <h1>Settings</h1>
      <a
        href={PARTNER_API_DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="settings_docs_link"
      >
        BelPower API docs
        <ExternalLink className="settings_docs_link_icon" aria-hidden />
      </a>
    </div>
  );
}

function renderToggleList(
  toggles: MaintenanceToggle[],
  flags: Record<MaintenanceToggleKey, boolean> | null,
  updatingKey: MaintenanceToggleKey | null,
  handleToggle: (id: MaintenanceToggleKey, enabled: boolean) => void
) {
  return (
    <ul className="settings_toggle_list">
      {toggles.map((toggle) => {
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
  );
}

export default function SettingsPage() {
  const { admin } = useAdminAuth();
  const canManage = canManageMaintenance(admin);
  const { flags, isLoading, updatingKey, error, updateToggle } = useAdminMaintenance(canManage);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [toastDismissed, setToastDismissed] = useState(false);

  const activeToast: BannerState | null = banner
    ?? (error && !toastDismissed
      ? { variant: 'error', title: 'Error', message: error }
      : null);

  useEffect(() => {
    setToastDismissed(false);
  }, [banner, error]);

  useEffect(() => {
    if (!banner || banner.variant === 'error') return;

    const timer = window.setTimeout(() => setBanner(null), SETTINGS_TOAST_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [banner]);

  const dismissToast = useCallback(() => {
    setBanner(null);
    setToastDismissed(true);
  }, []);

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
        <SettingsPageHeader />
        <p className="page_subtitle">You do not have permission to manage maintenance settings.</p>
      </div>
    );
  }

  return (
    <div className="settings_page">
      {activeToast && (
        <div
          className={`settings_toast settings_toast_${activeToast.variant}`}
          role="status"
        >
          <span className="settings_toast_icon" aria-hidden>
            {activeToast.variant === 'success' ? (
              <FaCheckCircle />
            ) : activeToast.variant === 'error' ? (
              <FaTimes />
            ) : (
              <FaInfoCircle />
            )}
          </span>
          <div className="settings_toast_body">
            <strong>{activeToast.title}</strong>
            <p>{activeToast.message}</p>
          </div>
          <button
            type="button"
            className="settings_toast_dismiss"
            aria-label="Dismiss message"
            onClick={dismissToast}
          >
            <FaTimes />
          </button>
        </div>
      )}

      <SettingsPageHeader />
      <p className="page_subtitle">
        Maintenance controls for the consumer app. Each toggle updates live immediately and
        sends in-app, push, and email notifications to all users except deleted accounts (including
        internal testers).
      </p>

      <section className="settings_card">
        <div className="settings_card_header">
          <h2>Maintenance mode</h2>
          <p>Eight independent switches. Turning one on or off notifies all eligible users by in-app, push, and email.</p>
        </div>

        {isLoading
          ? <p className="page_subtitle">Loading maintenance settings…</p>
          : renderToggleList(MAINTENANCE_SECTION_TOGGLES, flags, updatingKey, handleToggle)}
      </section>

      <section className="settings_card">
        <div className="settings_card_header">
          <h2>DVA provider controls</h2>
          <p>
            Disable Paystack or BuyPower DVA independently for wallet funding and electricity/cable.
          </p>
        </div>

        {isLoading
          ? <p className="page_subtitle">Loading DVA settings…</p>
          : renderToggleList(DVA_SECTION_TOGGLES, flags, updatingKey, handleToggle)}
      </section>
    </div>
  );
}
