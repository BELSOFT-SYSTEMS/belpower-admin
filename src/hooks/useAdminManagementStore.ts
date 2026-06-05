'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  getAdminDetailSnapshot,
  getAdmins,
  subscribeAdmins,
} from '@/data/adminManagementMock';

export function useAdminManagementStore() {
  return useSyncExternalStore(subscribeAdmins, getAdmins, getAdmins);
}

export function useAdminDetailStore(adminId: string) {
  const getSnapshot = useCallback(
    () => getAdminDetailSnapshot(adminId),
    [adminId]
  );
  return useSyncExternalStore(subscribeAdmins, getSnapshot, getSnapshot);
}
