# 🕉️ गर्भसंस्कार — Marathi AI Pregnancy Tracker

A complete **week-by-week Marathi pregnancy tracker** powered by AI.  
AI-powered content across 6 pillars, all in Marathi (Devanagari).

---

## 📱 Features

| Section | Description |
|---------|-------------|
| 🍼 बाळाची वाढ | Baby development, size, weight, milestones |
| 💬 बाळाशी बोला | Messages & affirmations to speak to baby |
| 🧘 योग | Trimester-safe yoga poses in Marathi |
| 🥗 पोषण | Weekly nutrition — what to eat, what to avoid + recipe |
| 🕉️ गर्भसंस्कार | Shlokas, music (ragas), stories, meditation |
| 👶 नाव सुचवणी | Baby names by Rashi/Nakshatra or browse by alphabet |

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS or Android)

### Step 1: Install Dependencies
```bash
cd GarbhSanskarApp
npm install
```

### Step 2: Add environment variables in `.env`

Create a `.env` file in project root (copy from `.env.example`) and set:

```bash
EXPO_PUBLIC_API_BASE_URL=https://your-app.vercel.app
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GROK_API_KEY=your_grok_api_key_here
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=garbhsanskar-aca16.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=garbhsanskar-aca16
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=garbhsanskar-aca16.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

Copy the **apiKey**, **appId**, and **messagingSenderId** from Firebase Console → Project settings → Your apps (Web).

Expo web **does not read Vercel env at click-time** unless they were present during `expo export`, or the app loads `/api/public-config` (this project now does that on login). Name the variables `EXPO_PUBLIC_FIREBASE_*` **or** `FIREBASE_API_KEY` / `FIREBASE_APP_ID` / `FIREBASE_PROJECT_ID` / `FIREBASE_AUTH_DOMAIN`. Then **Redeploy**.

On Vercel: Project → Settings → Environment Variables for Production, Preview, and Development, then **Redeploy**.

After deploy, open `https://your-app.vercel.app/firebase-config.json` — you should see JSON with `"configured": true`. If you open `/api/public-config` and get the login page instead of JSON, a catch-all rewrite is sending API URLs to the SPA (fixed in vercel.json).

Google login and cross-device user data sync use Firebase Auth + Firestore.

> ⚠️ Keep `GEMINI_API_KEY`, `OPENAI_API_KEY`, `GROK_API_KEY` only in server env vars (Vercel Project Settings), never in `EXPO_PUBLIC_*`.

### Step 3: Start the App
```bash
npx expo start
```

Scan the QR code with Expo Go on your phone.

### If Expo Go does not open on phone

If the terminal shows a URL like `exp://127.0.0.1:8084`, the project is running in localhost mode. A physical phone cannot open `127.0.0.1` from your computer, so Expo Go will appear to fail even though the app is fine.

Use one of these instead:

```bash
npm run start:lan
```

On Windows this script now auto-detects your Wi-Fi/LAN IP and forces Expo to use it, so Expo Go does not get stuck on `127.0.0.1`.

or, if LAN is blocked by firewall / office Wi-Fi / hotspot restrictions:

```bash
npm run start:tunnel
```

Other fallbacks:

- Use an Android emulator on the same PC
- Open the web build in the phone browser
- Create an Android APK with EAS Build for direct install

### Expo Go version compatibility

This project now uses Expo SDK 54, so it is compatible with the current Expo Go release for Android and iOS.

If Expo Go still shows a connection error, usually the cause is network-related rather than SDK compatibility. In that case, try:

- `npm run start:lan`
- `npm run start:tunnel`
- An Android APK / development build if Expo Go is blocked by local network restrictions

---

## 📁 Project Structure

```
GarbhSanskarApp/
├── App.js                          # Root app + navigation
├── app.json                        # Expo config
├── package.json
└── src/
    ├── screens/
    │   ├── OnboardingScreen.js     # 4-step setup wizard
    │   ├── HomeScreen.js           # Dashboard with week info
    │   ├── WeeksScreen.js          # All 40 weeks grid
    │   ├── WeekDetailScreen.js     # 5 content tabs per week
    │   ├── NamesScreen.js          # Baby name suggestions
    │   └── ProfileScreen.js        # Settings & profile
    ├── components/
    │   └── UIComponents.js         # Reusable UI components
    ├── services/
    │   └── claudeApi.js            # Client-side content endpoint caller + content shaping
    ├── constants/
    │   └── theme.js                # Colors, fonts, spacing, data
    └── hooks/
        └── useStorage.js           # AsyncStorage hooks
```

---

## 🎨 Design System

- **Primary Color**: Terracotta `#C2714F`
- **Accent**: Deep Teal `#2D7D72`
- **Gold**: `#D4A843`
- **Background**: Warm Ivory `#FDF6EE`
- **Trimester 1**: Soft Peach
- **Trimester 2**: Sage Green
- **Trimester 3**: Lavender

---

## 🤖 AI Content (Server Proxy)

All 6 content sections fetch AI-generated Marathi content via a server endpoint:

```
Week selected → API call with Marathi system prompt → JSON response → Beautiful UI
```

Content is **cached per week per tab** so you don't re-fetch if you revisit.
Pull-to-refresh forces a fresh AI generation.

---

## 📲 Building for Production

### Android APK
```bash
npx expo build:android
```

### iOS (requires Mac + Apple Developer account)
```bash
npx expo build:ios
```

### EAS Build (recommended)
```bash
npm install -g eas-cli
eas build --platform android
```

---

## 🙏 Cultural Notes

- All content is in **शुद्ध मराठी** (pure Marathi in Devanagari script)
- Garbh Sanskar content follows Indian traditional practices
- Name suggestions include both **Sanskrit** and **Marathi** origin names
- Rashi/Nakshatra system follows **Vedic astrology**
- Yoga recommendations follow **pregnancy-safe Hatha Yoga**

---

## ⚕️ Medical Disclaimer

This app is for **informational and cultural guidance only**.  
Always consult a qualified doctor (OB/GYN) for medical decisions.  
The AI content is not a substitute for professional medical advice.

---

Made with ❤️ for Marathi mothers | मराठी मातांसाठी प्रेमाने बनवले
