/* BelPower Command Center — web push for ops alerts */

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'BelPower', body: event.data.text() };
  }

  const title = payload.title || 'BelPower Command Center';
  const body = payload.body || payload.message || 'You have a new alert';
  const targetUrl = payload.data?.actionUrl || payload.data?.action_url || '/command-center';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: payload.icon || '/belpower_full.png',
      badge: '/belpower_full.png',
      data: { url: targetUrl },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  let url = event.notification.data?.url || '/command-center';
  if (typeof url === 'string' && url.startsWith('/admin/')) {
    url = url.replace('/admin/', '/command-center/');
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
      return undefined;
    })
  );
});
