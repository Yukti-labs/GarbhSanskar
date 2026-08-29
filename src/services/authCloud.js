import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Platform } from "react-native";
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra || {};

function fromExtra() {
  return {
    apiKey: String(extra.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "").trim(),
    authDomain: String(extra.firebaseAuthDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "").trim(),
    projectId: String(extra.firebaseProjectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "").trim(),
    storageBucket: String(extra.firebaseStorageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "").trim(),
    messagingSenderId: String(extra.firebaseMessagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
    appId: String(extra.firebaseAppId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "").trim(),
  };
}

function isComplete(config) {
  return !!(config?.apiKey && config?.authDomain && config?.projectId && config?.appId);
}

function collectConfigUrls() {
  const urls = [];
  if (typeof window !== "undefined" && window.location?.origin) {
    urls.push(`${window.location.origin}/firebase-config.json`);
    urls.push(`${window.location.origin}/api/public-config`);
  }
  const base = (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  if (base) {
    urls.push(`${base}/firebase-config.json`);
    urls.push(`${base}/api/public-config`);
  }
  return [...new Set(urls)];
}

async function fetchJsonConfig(url) {
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (!response.ok) return {};
  const text = await response.text();
  const trimmed = String(text || "").trim();
  if (!trimmed || trimmed.startsWith("<")) return {};
  const data = JSON.parse(trimmed);
  return data?.firebase && typeof data.firebase === "object" ? data.firebase : {};
}

async function fetchRuntimeFirebaseConfig() {
  const urls = collectConfigUrls();
  for (const url of urls) {
    try {
      const firebase = await fetchJsonConfig(url);
      if (isComplete(firebase)) return firebase;
    } catch (error) {
      console.error("Firebase config fetch error", url, error);
    }
  }
  return {};
}

let app;
let auth;
let db;
let initPromise;

export async function ensureFirebase() {
  if (auth) return true;
  if (!initPromise) {
    initPromise = (async () => {
      const merged = { ...fromExtra(), ...(await fetchRuntimeFirebaseConfig()) };
      if (!isComplete(merged)) return false;
      app = getApps().length ? getApp() : initializeApp(merged);
      auth = getAuth(app);
      db = getFirestore(app);
      return true;
    })();
  }
  return initPromise;
}

export function isFirebaseConfigured() {
  return isComplete(fromExtra()) || !!auth;
}

export function getMissingFirebaseConfigKeys() {
  const config = fromExtra();
  const mapping = {
    EXPO_PUBLIC_FIREBASE_API_KEY: config.apiKey,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: config.authDomain,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: config.projectId,
    EXPO_PUBLIC_FIREBASE_APP_ID: config.appId,
  };
  return Object.keys(mapping).filter((key) => !mapping[key]);
}

export function observeAuth(handler) {
  if (!auth) {
    handler(null);
    return () => {};
  }
  return onAuthStateChanged(auth, handler);
}

export async function tryCompleteRedirectSignIn() {
  const ready = await ensureFirebase();
  if (!ready || !auth || Platform.OS !== "web") return null;
  try {
    return await getRedirectResult(auth);
  } catch (error) {
    console.error("Redirect sign-in error", error);
    throw error;
  }
}

export function getReadableAuthError(error) {
  const code = error?.code || "";
  const message = error?.message || "";

  if (code === "auth/configuration-not-found") {
    return "Firebase मध्ये Google sign-in ची configuration अपूर्ण आहे. Firebase Authentication मध्ये Google provider enable आहे का ते तपासा.";
  }

  if (code === "auth/unauthorized-domain") {
    return "हा domain Firebase मध्ये authorized नाही. Firebase Authentication > Settings मध्ये garbhsanskar-app.vercel.app जोडा.";
  }

  if (code === "auth/operation-not-allowed") {
    return "Google sign-in सध्या Firebase मध्ये enable नाही. Firebase Authentication > Sign-in method मध्ये Google enable करा.";
  }

  if (code === "auth/popup-blocked") {
    return "Popup browser ने block केला. कृपया popup allow करा किंवा पुन्हा प्रयत्न करा.";
  }

  if (code === "auth/popup-closed-by-user") {
    return "Login popup मध्ये sign-in पूर्ण करण्यापूर्वी window बंद झाली.";
  }

  if (code === "auth/account-exists-with-different-credential") {
    return "या email साठी दुसऱ्या sign-in पद्धतीने account आधीच तयार आहे.";
  }

  if (message.toLowerCase().includes("access blocked") || message.toLowerCase().includes("app is blocked")) {
    return "Google OAuth app blocked आहे. Google Cloud OAuth consent screen आणि app publishing status तपासा.";
  }

  if (message.toLowerCase().includes("internal") || message.toLowerCase().includes("workspace")) {
    return "OAuth app ची audience Internal असू शकते. Google Cloud OAuth consent screen मध्ये app External करा.";
  }

  if (message.toLowerCase().includes("not authorized") || message.toLowerCase().includes("unauthorized")) {
    return "हा Google account सध्या authorize नाही. OAuth consent screen, audience, test users आणि production status तपासा.";
  }

  return `${code ? `${code}: ` : ""}${message || "Google sign-in failed"}`;
}

function isIOSSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const vendor = navigator.vendor || "";
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafariEngine = /Safari/.test(ua) && /Apple Computer/.test(vendor);
  const isOtherIOSBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIOSDevice && isSafariEngine && !isOtherIOSBrowser;
}

export async function signInWithGoogle(nativeGoogleTokens = null) {
  const ready = await ensureFirebase();
  if (!ready || !auth) throw new Error("Firebase config missing");

  if (Platform.OS !== "web") {
    const idToken = nativeGoogleTokens?.idToken;
    if (!idToken) {
      throw new Error("iOS/Android Google sign-in साठी idToken मिळाला नाही. Google client IDs तपासा.");
    }

    const credential = GoogleAuthProvider.credential(idToken, nativeGoogleTokens?.accessToken || null);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  await setPersistence(auth, browserLocalPersistence);

  // iOS Safari blocks popups and has ITP restrictions on third-party cookies.
  // Use redirect flow directly on iOS/mobile Safari to avoid silent failures.
  if (isIOSSafari()) {
    await signInWithRedirect(auth, provider);
    return null;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (popupError) {
    const fallbackCodes = [
      "auth/popup-blocked",
      "auth/popup-closed-by-user",
      "auth/cancelled-popup-request",
      "auth/operation-not-supported-in-this-environment",
    ];
    if (fallbackCodes.includes(popupError?.code)) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw popupError;
  }
}

export async function signOutUser() {
  await ensureFirebase();
  if (!auth) return;
  await signOut(auth);
}

function getUserDocRef(uid) {
  return doc(db, "users", uid);
}

export async function loadUserCloud(uid) {
  const ready = await ensureFirebase();
  if (!ready || !db || !uid) return null;
  const snapshot = await getDoc(getUserDocRef(uid));
  if (!snapshot.exists()) return null;
  return snapshot.data();
}

export async function saveUserCloud(uid, payload) {
  const ready = await ensureFirebase();
  if (!ready || !db || !uid) return;
  await setDoc(
    getUserDocRef(uid),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
