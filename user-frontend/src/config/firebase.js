import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import api from "../services/api";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

let messaging = null;

try {
  const app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
} catch (err) {
  console.warn("Firebase not initialized:", err.message);
}

export const requestFirebaseToken = async () => {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // ⚠️ IMPORTANT: Need VAPID key from Firebase Console -> Cloud Messaging -> Web Push certificates
      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
      });

      if (token) {
        console.log("FCM Token acquired");
        // Register token with backend
        await api.post("/fcm/register", { token }).catch(() => {});
        return token;
      }
    } else {
      console.warn("Notification permission denied");
    }
  } catch (err) {
    console.warn("FCM token failed:", err.message);
  }
  return null;
};

export const onForegroundMessage = () => {
  if (!messaging) return;
  onMessage(messaging, (payload) => {
    console.log("Foreground push note received:", payload);
    // The Socket.IO connection handles in-app toasts natively.
    // If we wanted to show a toast here, we could.
    // But since Socket.IO is faster, we just let it handle it.
  });
};
