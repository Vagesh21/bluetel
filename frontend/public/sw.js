/* Service Worker for Push Notifications - The Blues Hotel Collective */
/* eslint-disable no-restricted-globals */

self.addEventListener('push', function(event) {
  let data = { title: 'The Blues Hotel', body: 'New content available!', url: '/' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: 'https://theblueshotel.com.au/wp-content/uploads/2026/02/Untitled.png',
    badge: 'https://theblueshotel.com.au/wp-content/uploads/2026/02/Untitled.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [{ action: 'open', title: 'Open' }],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
