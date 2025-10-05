// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase Hosting
// If you do not want to use Firebase Hosting, see https://firebase.google.com/docs/web/setup

try {
  importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');
} catch (error) {
  console.error('Failed to load Firebase scripts:', error);
}

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyBBWG3nQIXH_f7cWxWjyMOURT_Kq4V4wOY",
  authDomain: "drone4s-406d4.firebaseapp.com",
  databaseURL: "https://drone4s-406d4-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "drone4s-406d4",
  storageBucket: "drone4s-406d4.firebasestorage.app",
  messagingSenderId: "283191484161",
  appId: "1:283191484161:web:c104d33345a7e712f94500",
  measurementId: "G-FCGSEWZSJ8"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
let messaging;
try {
  messaging = firebase.messaging();
  console.log('[firebase-messaging-sw.js] Firebase messaging initialized successfully');
} catch (error) {
  console.error('[firebase-messaging-sw.js] Failed to initialize Firebase messaging:', error);
}

// Optional: Handle background messages
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    // Customize notification here
    const notificationTitle = payload.notification?.title || 'Background Message Title';
    const notificationOptions = {
      body: payload.notification?.body || 'Background Message body.',
      icon: '/firebase-logo.svg',
      badge: '/firebase-logo.svg',
      tag: 'background-message',
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Open App'
        }
      ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.error('[firebase-messaging-sw.js] Messaging not initialized, cannot handle background messages');
}

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({
      type: "window"
    }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url == '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
