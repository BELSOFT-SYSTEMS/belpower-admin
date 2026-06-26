'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import '@/styles/adminNotifications.css';
import '@/styles/adminShared.css';
import { AdminTabs } from '@/components/admin/ui/AdminTabs';
import { AdminDropdown } from '@/components/admin/ui/AdminDropdown';
import { AdminMultiSelect } from '@/components/admin/ui/AdminMultiSelect';
import { NotificationUserSearch } from '@/components/admin/notifications/NotificationUserSearch';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminAnalytics } from '@/context/AdminAnalyticsContext';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import {
  buildProviderDropdownOptions,
  type NotificationUserOption,
} from '@/lib/adminNotifications';
import type { NotificationAudience } from '@/types/adminNotifications';
import {
  getNotificationKindPillClass,
  getNotificationChannelPillClass,
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_KIND_LABELS,
} from '@/utils/notificationDisplay';
import {
  canSendNotifications,
  canViewNotificationHistory,
} from '@/utils/adminNotificationAccess';

const AUDIENCE_HINTS: Record<NotificationAudience, string> = {
  all_users: 'Broadcast to every registered user',
  specific_state: 'Target by Nigerian state (primary meter address)',
  specific_disco: 'Target by electricity DISCO or other provider',
  active_users: 'Users active in the last 30 days',
  dormant_users: 'Users inactive for 60+ days',
  single_user: 'Send to one specific user',
};

export default function NotificationsPage() {
  const { admin } = useAdminAuth();
  const { refreshKey } = useAdminAnalytics();
  const canViewHistory = canViewNotificationHistory(admin);
  const canSend = canSendNotifications(admin);
  const [historyScope, setHistoryScope] = useState<'mine' | 'all'>('mine');
  const {
    templates,
    states,
    providers,
    history,
    stats,
    isLoading,
    isEstimating,
    isSending,
    error,
    estimateAudience,
    sendCampaign,
    searchUsers,
  } = useAdminNotifications({ canViewHistory, historyScope });

  const [activeTab, setActiveTab] = useState('send');
  const [templateId, setTemplateId] = useState('');
  const [audience, setAudience] = useState<NotificationAudience>('all_users');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [userId, setUserId] = useState('');
  const [userOptions, setUserOptions] = useState<NotificationUserOption[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [recipientPreview, setRecipientPreview] = useState({ count: 0, label: 'No audience selected' });

  const tabs = useMemo(() => {
    const items: { id: string; label: string; badge?: number }[] = [
      { id: 'send', label: 'Send' },
    ];
    if (canViewHistory) {
      items.push({ id: 'history', label: 'History', badge: history.length });
    }
    return items;
  }, [canViewHistory, history.length]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId),
    [templates, templateId]
  );

  const templateOptions = useMemo(
    () => [
      { value: '', label: 'Choose a template…' },
      ...templates.map((template) => ({
        value: template.id,
        label: `${template.title} (${NOTIFICATION_CHANNEL_LABELS[template.channel]})`,
      })),
    ],
    [templates]
  );

  const audienceOptions = useMemo(
    () =>
      (Object.keys(AUDIENCE_HINTS) as NotificationAudience[]).map((id) => ({
        value: id,
        label:
          id === 'all_users'
            ? 'All users'
            : id === 'specific_state'
              ? 'Users in a state'
              : id === 'specific_disco'
                ? 'Users on a provider'
                : id === 'active_users'
                  ? 'Active users'
                  : id === 'dormant_users'
                    ? 'Dormant users'
                    : 'Single user',
      })),
    []
  );

  const stateOptions = useMemo(
    () => states.map((state) => ({ value: state, label: state })),
    [states]
  );

  const providerOptions = useMemo(
    () => buildProviderDropdownOptions(providers),
    [providers]
  );

  const estimatePayload = useMemo(
    () => ({
      template_id: templateId,
      audience,
      states: audience === 'specific_state' ? selectedStates : undefined,
      providers: audience === 'specific_disco' ? selectedProviders : undefined,
      user_id: audience === 'single_user' ? userId : undefined,
    }),
    [templateId, audience, selectedStates, selectedProviders, userId]
  );

  useEffect(() => {
    if (!templateId || !canSend) {
      setRecipientPreview({ count: 0, label: 'No audience selected' });
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const preview = await estimateAudience(estimatePayload);
        if (!cancelled) setRecipientPreview(preview);
      } catch {
        if (!cancelled) {
          setRecipientPreview({ count: 0, label: 'Unable to estimate recipients' });
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [templateId, estimatePayload, estimateAudience, canSend, refreshKey]);

  const handleUserSearch = useCallback(
    async (query: string) => {
      setIsSearchingUsers(true);
      try {
        const users = await searchUsers(query);
        setUserOptions(users);
      } finally {
        setIsSearchingUsers(false);
      }
    },
    [searchUsers]
  );

  const canSubmit =
    canSend &&
    !!templateId &&
    recipientPreview.count > 0 &&
    (audience !== 'single_user' || !!userId) &&
    (audience !== 'specific_state' || selectedStates.length > 0) &&
    (audience !== 'specific_disco' || selectedProviders.length > 0);

  const handleSend = async () => {
    if (!canSubmit) return;
    setBanner(null);

    try {
      const result = await sendCampaign(estimatePayload);
      const pushNote =
        result.push && result.push.delivered > 0
          ? ` Push delivered to ${result.push.delivered.toLocaleString()} device(s).`
          : result.push && result.push.skipped_no_tokens > 0
            ? ' Push not sent — selected user(s) have no registered device tokens.'
            : result.push && result.push.failed > 0
              ? ` Push failed for ${result.push.failed.toLocaleString()} user(s) — check Firebase/VAPID config.`
              : '';
      const emailNote =
        result.email && result.email.delivered > 0
          ? ` Email delivered to ${result.email.delivered.toLocaleString()} user(s).`
          : result.email && result.email.failed > 0
            ? ` Email failed for ${result.email.failed.toLocaleString()} user(s).`
            : '';
      setBanner(`${result.message || `"${result.broadcast.template_title}" sent successfully.`}${pushNote}${emailNote}`);
      if (canViewHistory) {
        setActiveTab('history');
      }
    } catch {
      // error surfaced via hook state
    }
  };

  if (!canSend) {
    return (
      <div className="notifications_page">
        <h1>Notifications</h1>
        <p className="page_subtitle">You do not have permission to send notifications.</p>
      </div>
    );
  }

  return (
    <div className="notifications_page">
      <h1>Notifications</h1>
      <p className="page_subtitle">
        Send push, in-app, or email notifications to users. Pick a template, choose your audience,
        and deliver in one step.
      </p>

      {banner && (
        <div className="settings_banner settings_banner_success" role="status">
          <FaCheckCircle style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{banner}</span>
        </div>
      )}

      {error && (
        <div className="settings_banner settings_banner_error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {canViewHistory && stats && (
        <section className="stats_section">
          <div className="stats_card border-green-200">
            <p>Sent today</p>
            <h2>{stats.sent_today.toLocaleString()}</h2>
          </div>
          <div className="stats_card border-purple-200">
            <p>Last broadcast reach</p>
            <h2>
              {stats.last_broadcast_reach !== null
                ? stats.last_broadcast_reach.toLocaleString()
                : '—'}
            </h2>
          </div>
        </section>
      )}

      <div className="admin_panel_card tabs_container">
        <AdminTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'send' && (
          <div className="tab_panel">
            <p className="tab_hint">
              Select a template and define who should receive the notification.
            </p>

            {isLoading ? (
              <p className="tab_hint">Loading templates and audience options…</p>
            ) : (
              <div className="notif_form">
                <div className="notif_form_primary">
                  <div className="notif_field">
                    <label htmlFor="notif-template">Notification template</label>
                    <AdminDropdown
                      id="notif-template"
                      value={templateId}
                      onChange={setTemplateId}
                      options={templateOptions}
                      placeholder="Choose a template…"
                    />
                  </div>

                  <div className="notif_field">
                    <label htmlFor="notif-audience">Audience</label>
                    <AdminDropdown
                      id="notif-audience"
                      value={audience}
                      onChange={(value) => {
                        setAudience(value as NotificationAudience);
                        if (value !== 'single_user') setUserId('');
                        if (value !== 'specific_state') setSelectedStates([]);
                        if (value !== 'specific_disco') setSelectedProviders([]);
                      }}
                      options={audienceOptions}
                      placeholder="Choose audience…"
                    />
                    <p className="notif_field_hint">{AUDIENCE_HINTS[audience]}</p>
                  </div>
                </div>

                {selectedTemplate && (
                  <div className="notif_preview">
                    <div className="notif_preview_badge">
                      <span
                        className={`pill ${getNotificationChannelPillClass(selectedTemplate.channel)}`}
                      >
                        {NOTIFICATION_CHANNEL_LABELS[selectedTemplate.channel]}
                      </span>
                      <span
                        className={`pill ${getNotificationKindPillClass(selectedTemplate.kind)}`}
                      >
                        {NOTIFICATION_KIND_LABELS[selectedTemplate.kind]}
                      </span>
                    </div>
                    {selectedTemplate.channel === 'email' && selectedTemplate.email_subject ? (
                      <>
                        <h3>{selectedTemplate.email_subject}</h3>
                        <p className="notif_preview_label">Email preview</p>
                      </>
                    ) : (
                      <h3>{selectedTemplate.title}</h3>
                    )}
                    <p>{selectedTemplate.body}</p>
                  </div>
                )}

                {(audience === 'specific_state' ||
                  audience === 'specific_disco' ||
                  audience === 'single_user') && (
                  <div className="notif_target_section">
                    <h3 className="notif_target_title">Targeting</h3>

                    {audience === 'specific_state' && (
                      <div className="notif_field">
                        <label htmlFor="notif-state">States</label>
                        <AdminMultiSelect
                          id="notif-state"
                          values={selectedStates}
                          onChange={setSelectedStates}
                          options={stateOptions}
                          placeholder="Select one or more states"
                          aria-label="Select states"
                        />
                      </div>
                    )}

                    {audience === 'specific_disco' && (
                      <div className="notif_field">
                        <label htmlFor="notif-provider">Providers</label>
                        <AdminMultiSelect
                          id="notif-provider"
                          values={selectedProviders}
                          onChange={setSelectedProviders}
                          options={providerOptions}
                          placeholder="Select one or more providers"
                          aria-label="Select providers"
                        />
                      </div>
                    )}

                    {audience === 'single_user' && (
                      <div className="notif_field">
                        <label htmlFor="notif-user-search">User</label>
                        <NotificationUserSearch
                          users={userOptions}
                          selectedUserId={userId}
                          onSelect={setUserId}
                          onClear={() => setUserId('')}
                          onSearch={handleUserSearch}
                          isSearching={isSearchingUsers}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="notif_form_footer">
                  <div className="recipient_estimate">
                    <div className="recipient_estimate_copy">
                      <span className="recipient_estimate_label">Estimated recipients</span>
                      <strong>{recipientPreview.label}</strong>
                    </div>
                    <strong className="recipient_estimate_count">
                      {isEstimating ? '…' : recipientPreview.count.toLocaleString()}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="btn_send_notif"
                    disabled={!canSubmit || isSending}
                    onClick={handleSend}
                  >
                    <FaPaperPlane />{' '}
                    {selectedTemplate?.channel === 'email' ? 'Send email' : 'Send notification'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && canViewHistory && (
          <div className="tab_panel">
            <div className="notif_history_header">
              <p className="tab_hint">Notifications delivered from Command Center.</p>
              {stats?.can_view_all && (
                <AdminDropdown
                  id="notif-history-scope"
                  value={historyScope}
                  onChange={(value) => setHistoryScope(value as 'mine' | 'all')}
                  options={[
                    { value: 'mine', label: 'My sends' },
                    { value: 'all', label: 'All admins' },
                  ]}
                  placeholder="Scope"
                />
              )}
            </div>
            <div className="history_table_wrap">
              <table className="admin_data_table">
                <thead>
                  <tr>
                    <th>Template</th>
                    <th>Type</th>
                    <th>Audience</th>
                    <th>Reach</th>
                    <th>Sent by</th>
                    <th>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No notifications sent yet.</td>
                    </tr>
                  ) : (
                    history.map((row) => (
                      <tr key={row.id}>
                        <td>{row.template_title}</td>
                        <td>
                          <span className={`pill ${getNotificationKindPillClass(row.kind)}`}>
                            {NOTIFICATION_KIND_LABELS[row.kind]}
                          </span>
                        </td>
                        <td>{row.audience_label}</td>
                        <td>{row.recipient_count.toLocaleString()}</td>
                        <td>{row.sent_by}</td>
                        <td>{row.sent_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
