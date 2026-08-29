const fs = require("fs");
const path = require("path");
const { readFirebaseConfigFromEnv, isFirebaseConfigComplete } = require("../lib/firebaseEnv.cjs");

const distDir = path.join(__dirname, "..", "dist");
fs.mkdirSync(distDir, { recursive: true });

const firebase = readFirebaseConfigFromEnv(process.env);
const payload = {
  firebase,
  configured: isFirebaseConfigComplete(firebase),
};

const outFile = path.join(distDir, "firebase-config.json");
fs.writeFileSync(outFile, `${JSON.stringify(payload)}\n`);

if (!payload.configured) {
  console.warn("writeFirebaseConfig: Firebase web config is incomplete at build time. Check Vercel env names (EXPO_PUBLIC_FIREBASE_* or FIREBASE_*).");
} else {
  console.log("writeFirebaseConfig: wrote dist/firebase-config.json");
}
