'use client';

import { useSyncExternalStore } from 'react';
import {
  getConversationsSnapshot,
  getMessagesStoreVersion,
  subscribeMessages,
} from '@/data/adminMessagesMock';

export function useMessagesStore() {
  return useSyncExternalStore(
    subscribeMessages,
    getConversationsSnapshot,
    getConversationsSnapshot
  );
}

export function useMessagesStoreVersion() {
  return useSyncExternalStore(
    subscribeMessages,
    getMessagesStoreVersion,
    getMessagesStoreVersion
  );
}
