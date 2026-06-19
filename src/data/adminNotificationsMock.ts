/**
 * Mock notification templates & send — replace with API
 */

import { MOCK_USERS_LIST } from '@/data/adminMockData';
import { getUserDetail } from '@/data/adminMockData';
import type {
  NotificationAudience,
  NotificationTemplate,
  SendNotificationPayload,
  SentNotification,
} from '@/types/adminNotifications';

export const NIGERIAN_STATES = [
  'Lagos',
  'Abuja',
  'Rivers',
  'Kaduna',
  'Kano',
  'Enugu',
  'Oyo',
  'Delta',
  'Edo',
] as const;

export const DISCO_OPTIONS = [
  { code: 'IKEDC', label: 'IKEDC — Ikeja' },
  { code: 'EKEDC', label: 'EKEDC — Eko' },
  { code: 'AEDC', label: 'AEDC — Abuja' },
  { code: 'IBEDC', label: 'IBEDC — Ibadan' },
  { code: 'PHED', label: 'PHED — Port Harcourt' },
  { code: 'KAEDC', label: 'KAEDC — Kaduna' },
  { code: 'KEDCO', label: 'KEDCO — Kano' },
  { code: 'JEDC', label: 'JEDC — Jos' },
  { code: 'BEDC', label: 'BEDC — Benin' },
  { code: 'YEDC', label: 'YEDC — Yola' },
] as const;

/** Per-user targeting metadata (mock until user API includes state/disco) */
const USER_TARGET_META: Record<string, { state: string; disco: string }> = {
  'john-travis': { state: 'Lagos', disco: 'IKEDC' },
  'debbie-sam': { state: 'Rivers', disco: 'PHED' },
  'michael-essien': { state: 'Abuja', disco: 'AEDC' },
  'anita-bose': { state: 'Lagos', disco: 'EKEDC' },
  'chris-paul': { state: 'Lagos', disco: 'IKEDC' },
};

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'tpl-welcome',
    title: 'Welcome to BuyPower',
    body: 'Thanks for joining BuyPower! Top up your wallet and pay bills in seconds.',
    kind: 'promotional',
    channel: 'push',
  },
  {
    id: 'tpl-maintenance',
    title: 'Scheduled maintenance tonight',
    body: 'BuyPower will undergo brief maintenance tonight 11 PM–1 AM WAT. Some services may be unavailable.',
    kind: 'maintenance',
    channel: 'push',
  },
  {
    id: 'tpl-payment-success',
    title: 'Payment successful',
    body: 'Your recent payment was successful. Tap to view your receipt and transaction details.',
    kind: 'transactional',
    channel: 'push',
  },
  {
    id: 'tpl-security-alert',
    title: 'Unusual login detected',
    body: 'We noticed a sign-in from a new device. If this was not you, reset your password immediately.',
    kind: 'security',
    channel: 'push',
  },
  {
    id: 'tpl-wallet-low',
    title: 'Wallet low balance reminder',
    body: 'Your wallet balance is running low. Fund your wallet to avoid failed purchases.',
    kind: 'payment',
    channel: 'push',
  },
  {
    id: 'tpl-disco-rates',
    title: 'New DISCO rates effective',
    body: 'Updated electricity tariffs are now live for your DISCO. Review rates before your next purchase.',
    kind: 'service_update',
    channel: 'push',
  },
  {
    id: 'tpl-holiday-promo',
    title: 'Holiday promo — double cashback',
    body: 'Earn double cashback on electricity purchases this weekend. Offer ends Sunday 11:59 PM.',
    kind: 'promotional',
    channel: 'push',
  },
  {
    id: 'mobile-app-launch-push',
    title: '🚀 Belpower is now on Android & iPhone!',
    body: 'Pay electricity, airtime, data & cable TV anytime. Open Belpower for smarter utility payments.',
    kind: 'promotional',
    channel: 'push',
  },
  {
    id: 'mobile-app-launch-push-alt',
    title: '⚡ Belpower Mobile is here!',
    body: 'Your favorite utility payment platform is now on Android and iOS. Fast, secure, and convenient.',
    kind: 'promotional',
    channel: 'push',
  },
  {
    id: 'mobile-app-launch-email',
    title: 'Belpower Mobile App Launch',
    body: 'Dear Valued Customer, the Belpower Mobile App is now available on Android and iPhone.',
    kind: 'promotional',
    channel: 'email',
    email_subject: 'Belpower Mobile App is Now Available on Android & iPhone',
  },
  {
    id: 'tpl-verify-meter',
    title: 'Verify your meter',
    body: 'Confirm your meter details to unlock faster electricity purchases and scheduled payments.',
    kind: 'service_update',
    channel: 'push',
  },
];

let sentHistory: SentNotification[] = [
  {
    id: 'sn-1',
    template_title: 'Scheduled maintenance tonight',
    kind: 'maintenance',
    audience_label: 'All users',
    recipient_count: 1240,
    sent_at: 'Jun 2, 2026 — 4:30 PM',
    sent_by: 'James Okafor',
  },
  {
    id: 'sn-2',
    template_title: 'Wallet low balance reminder',
    kind: 'payment',
    audience_label: 'Active users',
    recipient_count: 892,
    sent_at: 'Jun 1, 2026 — 10:00 AM',
    sent_by: 'Sarah Mendes',
  },
  {
    id: 'sn-3',
    template_title: 'New DISCO rates effective',
    kind: 'service_update',
    audience_label: 'IKEDC customers',
    recipient_count: 318,
    sent_at: 'May 30, 2026 — 2:15 PM',
    sent_by: 'Tunde Adeyemi',
  },
];

function getUserMeta(userId: string) {
  if (USER_TARGET_META[userId]) return USER_TARGET_META[userId];
  const detail = getUserDetail(userId);
  const disco = detail?.primary_meter.disco ?? 'IKEDC';
  const address = detail?.primary_meter.address ?? '';
  const state = address.includes('Lagos')
    ? 'Lagos'
    : address.includes('Abuja')
      ? 'Abuja'
      : address.includes('Port Harcourt')
        ? 'Rivers'
        : 'Lagos';
  return { state, disco };
}

export function resolveAudienceRecipients(payload: SendNotificationPayload): {
  count: number;
  label: string;
} {
  const { audience, states, discos, user_id } = payload;

  if (audience === 'single_user' && user_id) {
    const user = MOCK_USERS_LIST.find((u) => u.id === user_id);
    return {
      count: user ? 1 : 0,
      label: user ? `${user.first_name} ${user.last_name}` : 'Selected user',
    };
  }

  if (audience === 'all_users') {
    return { count: 1240, label: 'All users' };
  }

  if (audience === 'active_users') {
    const mockCount = MOCK_USERS_LIST.filter((u) => u.status === 'active').length;
    return { count: Math.max(mockCount * 178, mockCount), label: 'Active users' };
  }

  if (audience === 'dormant_users') {
    const mockCount = MOCK_USERS_LIST.filter((u) => u.status === 'dormant').length;
    return { count: Math.max(mockCount * 42, mockCount), label: 'Dormant users' };
  }

  if (audience === 'specific_state' && states && states.length > 0) {
    const mockCount = MOCK_USERS_LIST.filter((u) =>
      states.includes(getUserMeta(u.id).state)
    ).length;
    const label =
      states.length === 1
        ? `Users in ${states[0]}`
        : `Users in ${states.length} states`;
    return {
      count: Math.max(mockCount * 95 * states.length, mockCount),
      label,
    };
  }

  if (audience === 'specific_disco' && discos && discos.length > 0) {
    const mockCount = MOCK_USERS_LIST.filter((u) =>
      discos.includes(getUserMeta(u.id).disco)
    ).length;
    const label =
      discos.length === 1
        ? `${DISCO_OPTIONS.find((d) => d.code === discos[0])?.label ?? discos[0]} customers`
        : `${discos.length} DISCOs selected`;
    return {
      count: Math.max(mockCount * 120 * discos.length, mockCount),
      label,
    };
  }

  return { count: 0, label: 'No audience selected' };
}

export function getNotificationTemplates(): NotificationTemplate[] {
  return NOTIFICATION_TEMPLATES;
}

export function getTemplateById(id: string): NotificationTemplate | undefined {
  return NOTIFICATION_TEMPLATES.find((t) => t.id === id);
}

export function getSentNotifications(): SentNotification[] {
  return [...sentHistory];
}

export function sendNotification(
  payload: SendNotificationPayload,
  sentBy = 'Current admin'
): SentNotification {
  const template = getTemplateById(payload.template_id);
  const { count, label } = resolveAudienceRecipients(payload);
  const entry: SentNotification = {
    id: `sn-${Date.now()}`,
    template_title: template?.title ?? 'Custom notification',
    kind: template?.kind ?? 'transactional',
    audience_label: label,
    recipient_count: count,
    sent_at: 'Just now',
    sent_by: sentBy,
  };
  sentHistory = [entry, ...sentHistory];
  return entry;
}
