import { formatAdminDateTime } from '@/utils/formatAdminDate';
import type {
  NotificationAudience,
  NotificationProviderOption,
  NotificationStats,
  NotificationTemplate,
  SentNotification,
} from '@/types/adminNotifications';

function pick<T>(source: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key] as T;
    }
  }
  return undefined;
}

export function normalizeNotificationTemplate(raw: Record<string, unknown>): NotificationTemplate {
  return {
    id: String(pick(raw, 'id') ?? ''),
    title: String(pick(raw, 'title') ?? ''),
    body: String(pick(raw, 'body') ?? ''),
    kind: (pick(raw, 'kind') as NotificationTemplate['kind']) ?? 'transactional',
  };
}

export function normalizeProviderOption(raw: Record<string, unknown>): NotificationProviderOption {
  return {
    code: String(pick(raw, 'code') ?? '').toUpperCase(),
    label: String(pick(raw, 'label') ?? pick(raw, 'code') ?? ''),
    category: (pick(raw, 'category') as NotificationProviderOption['category']) ?? 'electricity',
  };
}

export function normalizeSentNotification(raw: Record<string, unknown>): SentNotification {
  const sentAt = pick<string>(raw, 'sent_at', 'created_at');

  return {
    id: String(pick(raw, 'id') ?? ''),
    template_title: String(pick(raw, 'template_title') ?? ''),
    kind: (pick(raw, 'kind') as SentNotification['kind']) ?? 'transactional',
    audience_label: String(pick(raw, 'audience_label') ?? ''),
    recipient_count: Number(pick(raw, 'recipient_count') ?? 0),
    sent_at: sentAt ? formatAdminDateTime(sentAt) : '—',
    sent_by: String(pick(raw, 'sent_by') ?? 'Unknown admin'),
  };
}

export function normalizeNotificationStats(raw: Record<string, unknown>): NotificationStats {
  return {
    scope: (pick(raw, 'scope') as NotificationStats['scope']) ?? 'mine',
    can_view_all: Boolean(pick(raw, 'can_view_all')),
    sent_today: Number(pick(raw, 'sent_today') ?? 0),
    last_broadcast_reach:
      pick(raw, 'last_broadcast_reach') === null || pick(raw, 'last_broadcast_reach') === undefined
        ? null
        : Number(pick(raw, 'last_broadcast_reach')),
    total_sent: Number(pick(raw, 'total_sent') ?? 0),
  };
}

export type AudienceOptionsData = {
  audiences: { id: NotificationAudience; label: string }[];
  states: string[];
  providers: NotificationProviderOption[];
};

export function normalizeAudienceOptions(raw: Record<string, unknown>): AudienceOptionsData {
  const audiencesRaw = pick<unknown[]>(raw, 'audiences') ?? [];
  const statesRaw = pick<unknown[]>(raw, 'states') ?? [];
  const providersRaw = pick<unknown[]>(raw, 'providers') ?? [];

  return {
    audiences: audiencesRaw.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        id: String(pick(row, 'id') ?? '') as NotificationAudience,
        label: String(pick(row, 'label') ?? ''),
      };
    }),
    states: statesRaw.map((state) => String(state)),
    providers: providersRaw.map((item) =>
      normalizeProviderOption(item as Record<string, unknown>)
    ),
  };
}
