function pickEnv(env, names) {
  for (const name of names) {
    const value = env[name];
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}

function readFirebaseConfigFromEnv(env = process.env) {
  return {
    apiKey: pickEnv(env, [
      "EXPO_PUBLIC_FIREBASE_API_KEY",
      "FIREBASE_API_KEY",
      "FIREBASE_WEB_API_KEY",
      "NEXT_PUBLIC_FIREBASE_API_KEY",
    ]),
    authDomain: pickEnv(env, [
      "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    ]) || "garbhsanskar-aca16.firebaseapp.com",
    projectId: pickEnv(env, [
      "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
      "FIREBASE_PROJECT_ID",
      "GCLOUD_PROJECT",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    ]) || "garbhsanskar-aca16",
    storageBucket: pickEnv(env, [
      "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
      "FIREBASE_STORAGE_BUCKET",
    ]) || "garbhsanskar-aca16.appspot.com",
    messagingSenderId: pickEnv(env, [
      "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "FIREBASE_MESSAGING_SENDER_ID",
    ]),
    appId: pickEnv(env, [
      "EXPO_PUBLIC_FIREBASE_APP_ID",
      "FIREBASE_APP_ID",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
    ]),
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
