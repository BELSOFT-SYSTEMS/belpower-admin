'use client';

import { useEffect, useRef } from 'react';
import {
  getAdminPushConfig,
  registerAdminWebPush,
} from '@/lib/adminInboxNotifications';
import { getStoredAdmin } from '@/lib/adminAuth';

const SW_PATH = '/admin-push-sw.js';
const DEVICE_ID_KEY = 'admin_web_push_device_id';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

function getOrCreateDeviceId(adminId: string): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = `admin-web-${adminId}-${crypto.randomUUID()}`;
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

async function subscribeAdminWebPush(): Promise<void> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return;
  }

  const config = await getAdminPushConfig();
  if (!config.webPushEnabled || !config.vapidPublicKey) {
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return;
  }

  const registration = await navigator.serviceWorker.register(SW_PATH, {
    scope: '/',
  });

  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        config.vapidPublicKey
      ) as BufferSource,
    });
  }

  const admin = getStoredAdmin();
  const deviceId = admin?.id ? getOrCreateDeviceId(admin.id) : undefined;

  await registerAdminWebPush(subscription.toJSON(), deviceId);
}

/**
 * Registers admin web push once per authenticated session (bell modal / ops alerts).
 */
export function useAdminWebPush(enabled: boolean) {
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!enabled || attemptedRef.current) return;
    attemptedRef.current = true;

    subscribeAdminWebPush().catch((err) => {
      console.warn('Admin web push registration skipped:', err);
    });
  }, [enabled]);
}
