'use client';

import { useMemo, useState } from 'react';
import { FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import '@/styles/adminNotifications.css';
import '@/styles/adminShared.css';
import { AdminTabs } from '@/components/admin/ui/AdminTabs';
import { AdminDropdown } from '@/components/admin/ui/AdminDropdown';
import { AdminMultiSelect } from '@/components/admin/ui/AdminMultiSelect';
import { NotificationUserSearch } from '@/components/admin/notifications/NotificationUserSearch';
import { MOCK_USERS_LIST } from '@/data/adminMockData';
import {
  DISCO_OPTIONS,
  NIGERIAN_STATES,
  getNotificationTemplates,
  getSentNotifications,
  getTemplateById,
  resolveAudienceRecipients,
  sendNotification,
} from '@/data/adminNotificationsMock';
import type { NotificationAudience } from '@/types/adminNotifications';
import {
  getNotificationKindPillClass,
  NOTIFICATION_KIND_LABELS,
} from '@/utils/notificationDisplay';

const AUDIENCE_OPTIONS: {
  id: NotificationAudience;
  label: string;
  hint: string;
}[] = [
  { id: 'all_users', label: 'All users', hint: 'Broadcast to every registered user' },
  { id: 'specific_state', label: 'Users in a state', hint: 'Target by Nigerian state' },
  { id: 'specific_disco', label: 'Users on a DISCO', hint: 'Target by electricity distribution company' },
  { id: 'active_users', label: 'Active users', hint: 'Users active in the last 30 days' },
  { id: 'dormant_users', label: 'Dormant users', hint: 'Users inactive for 60+ days' },
  { id: 'single_user', label: 'Single user', hint: 'Send to one specific user' },
];

export default function NotificationsPage() {
  const templates = useMemo(() => getNotificationTemplates(), []);
  const [activeTab, setActiveTab] = useState('send');
  const [history, setHistory] = useState(() => getSentNotifications());
  const [templateId, setTemplateId] = useState('');
  const [audience, setAudience] = useState<NotificationAudience>('all_users');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedDiscos, setSelectedDiscos] = useState<string[]>([]);
  const [userId, setUserId] = useState('');
  const [banner, setBanner] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const tabs = [
    { id: 'send', label: 'Send' },
    { id: 'history', label: 'History', badge: history.length },
    // { id: 'templates', label: 'Templates', badge: templates.length },
  ];

  const selectedTemplate = templateId ? getTemplateById(templateId) : undefined;
  const selectedAudience = AUDIENCE_OPTIONS.find((opt) => opt.id === audience);

  const templateOptions = useMemo(
    () => [
      { value: '', label: 'Choose a template…' },
      ...templates.map((t) => ({ value: t.id, label: t.title })),
    ],
    [templates]
  );

  const audienceOptions = useMemo(
    () => AUDIENCE_OPTIONS.map((opt) => ({ value: opt.id, label: opt.label })),
    []
  );

  const stateOptions = useMemo(
    () => NIGERIAN_STATES.map((s) => ({ value: s, label: s })),
    []
  );

  const discoOptions = useMemo(
    () => DISCO_OPTIONS.map((d) => ({ value: d.code, label: d.label })),
    []
  );

  const recipientPreview = useMemo(
    () =>
      resolveAudienceRecipients({
        template_id: templateId,
        audience,
        states: audience === 'specific_state' ? selectedStates : undefined,
        discos: audience === 'specific_disco' ? selectedDiscos : undefined,
        user_id: audience === 'single_user' ? userId : undefined,
      }),
    [templateId, audience, selectedStates, selectedDiscos, userId]
  );

  const canSend =
    !!templateId &&
    recipientPreview.count > 0 &&
    (audience !== 'single_user' || !!userId) &&
    (audience !== 'specific_state' || selectedStates.length > 0) &&
    (audience !== 'specific_disco' || selectedDiscos.length > 0);

  const handleSend = () => {
    if (!canSend) return;
    setSending(true);
    const entry = sendNotification({
      template_id: templateId,
      audience,
      states: audience === 'specific_state' ? selectedStates : undefined,
      discos: audience === 'specific_disco' ? selectedDiscos : undefined,
      user_id: audience === 'single_user' ? userId : undefined,
    });
    setHistory(getSentNotifications());
    setBanner(
      `"${entry.template_title}" sent to ${entry.recipient_count.toLocaleString()} recipient(s) successfully.`
    );
    setSending(false);
    setActiveTab('history');
  };

  return (
    <div className="notifications_page">
      <h1>Notifications</h1>
      <p className="page_subtitle">
        Send push and in-app notifications to users. Pick a template, choose your
        audience, and deliver in one step.
      </p>

      {banner && (
        <div className="settings_banner settings_banner_success" role="status">
          <FaCheckCircle style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{banner}</span>
        </div>
      )}

      <section className="stats_section">
        {/* <div className="stats_card border-blue-200">
          <p>Templates</p>
          <h2>{templates.length}</h2>
        </div> */}
        <div className="stats_card border-green-200">
          <p>Sent today</p>
          <h2>
            {
              history.filter(
                (h) => h.sent_at.includes('Just now') || h.sent_at.includes('Jun 3')
              ).length
            }
          </h2>
        </div>
        <div className="stats_card border-purple-200">
          <p>Last broadcast reach</p>
          <h2>{history[0]?.recipient_count.toLocaleString() ?? '—'}</h2>
        </div>
      </section>

      <div className="admin_panel_card tabs_container">
        <AdminTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'send' && (
          <div className="tab_panel">
            <p className="tab_hint">
              Select a template and define who should receive the notification.
            </p>
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
                      if (value !== 'specific_disco') setSelectedDiscos([]);
                    }}
                    options={audienceOptions}
                    placeholder="Choose audience…"
                  />
                  {selectedAudience && (
                    <p className="notif_field_hint">{selectedAudience.hint}</p>
                  )}
                </div>
              </div>

              {selectedTemplate && (
                <div className="notif_preview">
                  <div className="notif_preview_badge">
                    <span
                      className={`pill ${getNotificationKindPillClass(selectedTemplate.kind)}`}
                    >
                      {NOTIFICATION_KIND_LABELS[selectedTemplate.kind]}
                    </span>
                  </div>
                  <h3>{selectedTemplate.title}</h3>
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
                      <label htmlFor="notif-disco">DISCOs</label>
                      <AdminMultiSelect
                        id="notif-disco"
                        values={selectedDiscos}
                        onChange={setSelectedDiscos}
                        options={discoOptions}
                        placeholder="Select one or more DISCOs"
                        aria-label="Select DISCOs"
                      />
                    </div>
                  )}

                  {audience === 'single_user' && (
                    <div className="notif_field">
                      <label htmlFor="notif-user-search">User</label>
                      <NotificationUserSearch
                        users={MOCK_USERS_LIST}
                        selectedUserId={userId}
                        onSelect={setUserId}
                        onClear={() => setUserId('')}
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
                    {recipientPreview.count.toLocaleString()}
                  </strong>
                </div>

                <button
                  type="button"
                  className="btn_send_notif"
                  disabled={!canSend || sending}
                  onClick={handleSend}
                >
                  <FaPaperPlane /> Send notification
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tab_panel">
            <p className="tab_hint">
              Notifications delivered from Command Center (mock).
            </p>
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
                  {history.map((row) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* {activeTab === 'templates' && (
          <div className="tab_panel">
            <p className="tab_hint">
              Pre-built notification templates. Select one on the Send tab to deliver.
            </p>
            <div className="templates_grid">
              {templates.map((t) => (
                <article key={t.id} className="template_card">
                  <div className="template_card_top">
                    <h3>{t.title}</h3>
                    <span className={`pill ${getNotificationKindPillClass(t.kind)}`}>
                      {NOTIFICATION_KIND_LABELS[t.kind]}
                    </span>
                  </div>
                  <p>{t.body}</p>
                  <button
                    type="button"
                    className="template_use_btn"
                    onClick={() => {
                      setTemplateId(t.id);
                      setActiveTab('send');
                    }}
                  >
                    Use template
                  </button>
                </article>
              ))}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}
