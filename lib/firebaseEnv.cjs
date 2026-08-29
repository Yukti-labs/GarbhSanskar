function pickEnv(env, names) {
  for (const name of names) {
    const value = env[name];
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}

// Public web SDK config from Firebase console (not a secret). Env vars override.
const FIREBASE_WEB_DEFAULTS = {
  apiKey: "AIzaSyCCTAELuOmQGfvaEnwiKfg6_1DeB0QBcLU",
  authDomain: "garbhsanskar-aca16.firebaseapp.com",
  projectId: "garbhsanskar-aca16",
  storageBucket: "garbhsanskar-aca16.firebasestorage.app",
  messagingSenderId: "354457842059",
  appId: "1:354457842059:web:c46f2d411795b8f3abff8e",
  measurementId: "G-MN6G5XKFDG",
};

function readFirebaseConfigFromEnv(env = process.env) {
  return {
    apiKey: pickEnv(env, [
      "EXPO_PUBLIC_FIREBASE_API_KEY",
      "FIREBASE_API_KEY",
      "FIREBASE_WEB_API_KEY",
      "NEXT_PUBLIC_FIREBASE_API_KEY",
    ]) || FIREBASE_WEB_DEFAULTS.apiKey,
    authDomain: pickEnv(env, [
      "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    ]) || FIREBASE_WEB_DEFAULTS.authDomain,
    projectId: pickEnv(env, [
      "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
      "FIREBASE_PROJECT_ID",
      "GCLOUD_PROJECT",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    ]) || FIREBASE_WEB_DEFAULTS.projectId,
    storageBucket: pickEnv(env, [
      "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
      "FIREBASE_STORAGE_BUCKET",
    ]) || FIREBASE_WEB_DEFAULTS.storageBucket,
    messagingSenderId: pickEnv(env, [
      "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "FIREBASE_MESSAGING_SENDER_ID",
    ]) || FIREBASE_WEB_DEFAULTS.messagingSenderId,
    appId: pickEnv(env, [
      "EXPO_PUBLIC_FIREBASE_APP_ID",
      "FIREBASE_APP_ID",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
    ]) || FIREBASE_WEB_DEFAULTS.appId,
    measurementId: pickEnv(env, [
      "EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID",
      "FIREBASE_MEASUREMENT_ID",
    ]) || FIREBASE_WEB_DEFAULTS.measurementId,
  };
}

function isFirebaseConfigComplete(config) {
  return !!(config?.apiKey && config?.authDomain && config?.projectId && config?.appId);
}

module.exports = {
  pickEnv,
  readFirebaseConfigFromEnv,
  isFirebaseConfigComplete,
};
