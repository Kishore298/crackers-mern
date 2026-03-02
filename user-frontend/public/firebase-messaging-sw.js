/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals */
/* global firebase */

importScripts(
  "https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js",
);

const firebaseConfig = {
  apiKey: "AIzaSyA4nw3YMwf1F5PABhr4-SGqxhziSTB2NZI",
  authDomain: "vcrackers-fe6ae.firebaseapp.com",
  projectId: "vcrackers-fe6ae",
  storageBucket: "vcrackers-fe6ae.firebasestorage.app",
  messagingSenderId: "441338173414",
  appId: "1:441338173414:web:32d1ae1250aa55201ee827",
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log(
      "[firebase-messaging-sw.js] Received background message ",
      payload,
    );

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: payload.notification.image || "/v-crackers-logo.png",
      data: payload.data,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (err) {
  console.log("Failed to initialize Firebase SW:", err);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.actionUrl || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        // If none, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      }),
  );
});
