import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../constants/theme";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ onGoogleSignIn, onDemoStart, colors = COLORS, errorText = "", isBusy = false }) {
  const isWeb = Platform.OS === "web";

  if (isWeb) {
    return (
      <WebLogin
        onGoogleSignIn={onGoogleSignIn}
        onDemoStart={onDemoStart}
        colors={colors}
        errorText={errorText}
        isBusy={isBusy}
      />
    );
  }

  return (
    <NativeLogin
      onGoogleSignIn={onGoogleSignIn}
      onDemoStart={onDemoStart}
      colors={colors}
      errorText={errorText}
      isBusy={isBusy}
    />
  );
}

function WebLogin({ onGoogleSignIn, onDemoStart, colors, errorText, isBusy }) {
  const [localError, setLocalError] = useState("");

  async function handleLogin() {
    setLocalError("");
    try {
      await onGoogleSignIn?.();
    } catch (error) {
      setLocalError(error?.message || "Google sign-in failed");
    }
  }

  return renderLoginCard({
    colors,
    isBusy,
    buttonLabel: isBusy ? "कृपया थांबा..." : "Google ने सुरू करा",
    onPress: handleLogin,
    onDemoStart,
    errorText,
    localError,
    showNativeNote: false,
  });
}

function NativeLogin({ onGoogleSignIn, onDemoStart, colors, errorText, isBusy }) {
  const [localError, setLocalError] = useState("");

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === "error") {
      setLocalError("Google login अयशस्वी. पुन्हा प्रयत्न करा.");
      return;
    }

    if (response.type === "success") {
      const idToken = response.authentication?.idToken;
      const accessToken = response.authentication?.accessToken;

      if (!idToken) {
        setLocalError("Google idToken मिळाला नाही. Google client IDs तपासा.");
        return;
      }

      Promise.resolve(onGoogleSignIn?.({ idToken, accessToken })).catch((error) => {
        setLocalError(error?.message || "Google sign-in failed");
      });
    }
  }, [response]);

  async function handleLogin() {
    setLocalError("");
    try {
      if (!request) {
        setLocalError("Google sign-in सेटअप पूर्ण नाही. Client IDs तपासा.");
        return;
      }

      await promptAsync();
    } catch (error) {
      setLocalError(error?.message || "Google sign-in failed");
    }
  }

  return renderLoginCard({
    colors,
    isBusy,
    buttonLabel: isBusy ? "कृपया थांबा..." : "Google ने सुरू करा",
    onPress: handleLogin,
    onDemoStart,
    errorText,
    localError,
    showNativeNote: true,
  });
}

function renderLoginCard({
  colors,
  isBusy,
  buttonLabel,
  onPress,
  onDemoStart,
  errorText,
  localError,
  showNativeNote,
}) {
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}> 
        <Text style={styles.logo}>🕉️</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>गर्भसंस्कार</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Google ने लॉगिन करा आणि तुमचा डेटा सर्व डिव्हाइसमध्ये सुरक्षित ठेवा.</Text>

        <TouchableOpacity
          style={[styles.googleBtn, { backgroundColor: colors.primary }, isBusy && styles.googleBtnDisabled]}
          onPress={onPress}
          disabled={isBusy}
        >
          <Text style={styles.googleBtnText}>{buttonLabel}</Text>
        </TouchableOpacity>

        {!!onDemoStart && (
          <TouchableOpacity
            style={[styles.demoBtn, { borderColor: colors.borderLight, backgroundColor: colors.bgWarm }]}
            onPress={onDemoStart}
            disabled={isBusy}
          >
            <Text style={[styles.demoBtnText, { color: colors.textPrimary }]}>डेमो पहा (लॉगिनशिवाय)</Text>
          </TouchableOpacity>
        )}

        {showNativeNote && (
          <Text style={[styles.note, { color: colors.textSecondary }]}>टीप: iOS/Android साठी Google Client IDs आवश्यक आहेत.</Text>
        )}

        {!!(errorText || localError) && (
          <Text style={styles.errorText}>{errorText || localError}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  logo: {
    fontSize: 56,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONTS.h1,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    marginTop: SPACING.sm,
    fontSize: FONTS.body,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  googleBtn: {
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: "center",
    ...SHADOWS.sm,
  },
  googleBtnDisabled: {
    opacity: 0.7,
  },
  demoBtn: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: "center",
    borderWidth: 1,
  },
  demoBtnText: {
    fontSize: FONTS.body,
    fontWeight: "800",
  },
  googleBtnText: {
    color: COLORS.textWhite,
    fontSize: FONTS.body,
    fontWeight: "800",
  },
  note: {
    marginTop: SPACING.md,
    fontSize: FONTS.small,
    textAlign: "center",
  },
  errorText: {
    marginTop: SPACING.md,
    color: COLORS.error,
    fontSize: FONTS.small,
    textAlign: "center",
    fontWeight: "700",
  },
});
