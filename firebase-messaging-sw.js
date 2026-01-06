// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/12.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA8HrJeZ-QHGQHHGTn5-N7L_2CpSUd42gM",
  projectId: "agape-avisos",
  messagingSenderId: "556421268172",
  appId: "1:556421268172:web:b9cb0955e3e95dd8e8f869"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'logo-agape.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});