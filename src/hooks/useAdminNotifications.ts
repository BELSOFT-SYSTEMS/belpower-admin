'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  estimateNotificationAudience,
  getAudienceOptions,
  getNotificationHistory,
  getNotificationStats,
  getNotificationTemplates,
  searchNotificationUsers,
  sendNotificationCampaign,
  type NotificationUserOption,
} from '@/lib/adminNotifications';
import type {
  NotificationAudience,
  NotificationStats,
  NotificationTemplate,
  SendNotificationPayload,
  SentNotification,
} from '@/types/adminNotifications';
import type { NotificationProviderOption } from '@/types/adminNotifications';

type UseAdminNotificationsOptions = {
  canViewHistory: boolean;
  historyScope: 'mine' | 'all';
};

export function useAdminNotifications({
  canViewHistory,
  historyScope,
}: UseAdminNotificationsOptions) {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [providers, setProviders] = useState<NotificationProviderOption[]>([]);
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBaseData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [templateData, audienceData] = await Promise.all([
        getNotificationTemplates(),
        getAudienceOptions(),
      ]);

      setTemplates(templateData);
      setStates(audienceData.states);
      setProviders(audienceData.providers);

      if (canViewHistory) {
        const [historyData, statsData] = await Promise.all([
          getNotificationHistory({ scope: historyScope }),
          getNotificationStats(historyScope),
        ]);
        setHistory(historyData.history);
        setStats(statsData);
      } else {
        setHistory([]);
        setStats(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [canViewHistory, historyScope]);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  const refreshHistory = useCallback(async () => {
    if (!canViewHistory) return;

    const [historyData, statsData] = await Promise.all([
      getNotificationHistory({ scope: historyScope }),
      getNotificationStats(historyScope),
    ]);
    setHistory(historyData.history);
    setStats(statsData);
  }, [canViewHistory, historyScope]);

  const estimateAudience = useCallback(async (payload: SendNotificationPayload) => {
    setIsEstimating(true);
    try {
      return await estimateNotificationAudience(payload);
    } finally {
      setIsEstimating(false);
    }
  }, []);

  const sendCampaign = useCallback(
    async (payload: SendNotificationPayload) => {
      setIsSending(true);
      setError(null);
      try {
        const result = await sendNotificationCampaign(payload);
        if (canViewHistory) {
          await refreshHistory();
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send notification';
        setError(message);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [canViewHistory, refreshHistory]
  );

  const searchUsers = useCallback(async (query: string): Promise<NotificationUserOption[]> => {
    return searchNotificationUsers(query);
  }, []);

  return {
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
    refreshHistory,
    reload: loadBaseData,
  };
}

export type { NotificationUserOption, NotificationAudience };
