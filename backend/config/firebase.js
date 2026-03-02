const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let firebaseInitialized = false;

const initFirebase = () => {
  if (firebaseInitialized) return;

  try {
    // Prefer env vars (production-safe, no JSON file needed)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Env vars store \n literally — convert back to real newlines
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      firebaseInitialized = true;
      console.log("🔔 Firebase Admin initialized (env vars)");
      return;
    }

    // Fallback: read service account JSON file
    const serviceAccountPath =
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      path.join(__dirname, "vcrackers-fe6ae-firebase-adminsdk-fbsvc-ec9d89c244.json");

    if (!fs.existsSync(serviceAccountPath)) {
      console.warn(
        "⚠️  Firebase service account JSON not found. Push notifications disabled.",
      );
      console.warn(`   Expected at: ${serviceAccountPath}`);
      return;
    }

    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log("🔔 Firebase Admin initialized (JSON file)");
  } catch (err) {
    console.error("❌ Firebase init failed:", err.message);
  }
};

/**
 * Send push notification to a single device token
 */
const sendPushToToken = async (token, title, body, data = {}, imageUrl) => {
  if (!firebaseInitialized) return null;

  const message = {
    token,
    notification: { title, body },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)]),
    ),
    webpush: {
      notification: {
        icon: "/v-crackers-logo.png",
        badge: "/v-crackers-logo.png",
        ...(imageUrl ? { image: imageUrl } : {}),
      },
      fcmOptions: {
        link: data.actionUrl || "/",
      },
    },
  };

  try {
    const result = await admin.messaging().send(message);
    return result;
  } catch (err) {
    // Token may be invalid/expired — remove it
    if (
      err.code === "messaging/invalid-registration-token" ||
      err.code === "messaging/registration-token-not-registered"
    ) {
      return { error: "invalid_token", token };
    }
    console.error("Push send error:", err.message);
    return null;
  }
};

/**
 * Send push notification to multiple tokens
 */
const sendPushToTokens = async (tokens, title, body, data = {}, imageUrl) => {
  if (!firebaseInitialized || !tokens.length) return [];

  const results = [];
  const invalidTokens = [];

  for (const token of tokens) {
    const result = await sendPushToToken(token, title, body, data, imageUrl);
    if (result?.error === "invalid_token") {
      invalidTokens.push(result.token);
    }
    results.push(result);
  }

  return { results, invalidTokens };
};

module.exports = { initFirebase, sendPushToToken, sendPushToTokens };
