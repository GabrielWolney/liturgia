import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getMessaging } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-messaging.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyA8HrJeZ-QHGQHHGTn5-N7L_2CpSUd42gM",
  authDomain: "agape-avisos.firebaseapp.com",
  projectId: "agape-avisos",
  storageBucket: "agape-avisos.firebasestorage.app",
  messagingSenderId: "556421268172",
  appId: "1:556421268172:web:b9cb0955e3e95dd8e8f869",
  measurementId: "G-ZMW9FY1H4N",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const messaging = getMessaging(app);
export const analytics = getAnalytics(app);