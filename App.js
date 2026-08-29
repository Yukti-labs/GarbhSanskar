import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Platform, useWindowDimensions, ActivityIndicator,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, getColors, COLORS_DARK } from "./src/constants/theme";
import { setUIColors } from "./src/components/UIComponents";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import WeeksScreen from "./src/screens/WeeksScreen";
import WeekDetailScreen from "./src/screens/WeekDetailScreen";
import NamesScreen from "./src/screens/NamesScreen";
import CareHubScreen from "./src/screens/CareHubScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import PregnancyChatScreen from "./src/screens/PregnancyChatScreen";
import HealthLogScreen from "./src/screens/HealthLogScreen";
import RitualScreen from "./src/screens/RitualScreen";
import FamilyCareScreen from "./src/screens/FamilyCareScreen";
import PostpartumTrackScreen from "./src/screens/PostpartumTrackScreen";
import VercelAnalytics from "./src/components/VercelAnalytics";
import { getDailyGeetaShlok } from "./src/services/claudeApi";
import { getDefaultCareData, mergeCareData } from "./src/utils/careData";
import {
  isFirebaseConfigured,
  ensureFirebase,
  observeAuth,
  signInWithGoogle,
  loadUserCloud,
  saveUserCloud,
  tryCompleteRedirectSignIn,
  signOutUser,
  getReadableAuthError,
} from "./src/services/authCloud";

// Keep the native splash visible until auth state is resolved
SplashScreen.preventAutoHideAsync().catch(() => {});

const DARK_MODE_KEY = "garbh_dark_mode";
const IS_WEB = Platform.OS === "web";
const ONBOARDING_RELEASE_VERSION = 2;
const DEMO_UID = "demo-local";
const getProfileCacheKey = (uid) => `garbh_profile_${uid}`;
const getNamesCacheKey = (uid) => `garbh_names_${uid}`;
const getCareCacheKey = (uid) => `garbh_care_${uid}`;

class LoginErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Login screen failed to load",
    };
  }

  componentDidCatch(error) {
    console.error("Login screen render error", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={[styles.loginFallbackRoot, { backgroundColor: this.props.colors?.bg || COLORS.bg }]}>
          <Text style={styles.loginFallbackEmoji}>🕉️</Text>
          <Text style={[styles.loginFallbackTitle, { color: this.props.colors?.textPrimary || COLORS.textPrimary }]}>गर्भसंस्कार</Text>
          <Text style={[styles.loginFallbackText, { color: this.props.colors?.textSecondary || COLORS.textSecondary }]}>लॉगिन स्क्रीन लोड होत नाही. कृपया पुन्हा प्रयत्न करा.</Text>
          <TouchableOpacity
            style={[styles.loginFallbackBtn, { backgroundColor: this.props.colors?.primary || COLORS.primary }]}
            onPress={this.props.onRetry}
          >
            <Text style={styles.loginFallbackBtnText}>पुन्हा प्रयत्न करा</Text>
          </TouchableOpacity>
          {!!this.state.message && (
            <Text style={[styles.loginFallbackError, { color: this.props.colors?.error || COLORS.error }]}>{this.state.message}</Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const NAV_TABS = [
  { id: "home", emoji: "🏠", label: "मुख्यपान", hint: "आजचा प्रवास" },
  { id: "weeks", emoji: "📅", label: "आठवडे", hint: "संपूर्ण टाइमलाइन" },
  { id: "names", emoji: "👶", label: "नावे", hint: "नाव सुचवणी" },
  { id: "care", emoji: "🩺", label: "सहाय्य", hint: "दैनिक मदत" },
  { id: "profile", emoji: "👩", label: "प्रोफाइल", hint: "तुमची माहिती" },
];

function stackScreenTitle(stackEntry) {
  if (!stackEntry) return "";
  if (stackEntry.screen === "weekDetail") return `आठवडा ${stackEntry.params?.week}`;
  const titles = {
    chatbot: "सल्ला चॅट",
    healthLog: "आरोग्य नोंद",
    ritual: "दैनिक संस्कार",
    family: "कुटुंब",
    postpartum: "प्रसूतीनंतर",
  };
  return titles[stackEntry.screen] || "";
}

export default function App() {
  const { width } = useWindowDimensions();
  const [authUser, setAuthUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [navigationStack, setNavigationStack] = useState([]);
  const [savedNames, setSavedNames] = useState([]);
  const [careData, setCareData] = useState(getDefaultCareData());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [needsReOnboarding, setNeedsReOnboarding] = useState(false);
  const [loginScreenKey, setLoginScreenKey] = useState(0);
  const [firebaseReady, setFirebaseReady] = useState(isFirebaseConfigured());
  const demoSessionRef = useRef(false);

  const currentColors = isDarkMode ? COLORS_DARK : COLORS;
  const isMobileWeb = IS_WEB && width < 900;
  setUIColors(currentColors);

  useEffect(() => {
    loadUiPrefs();
  }, []);

  // Dismiss native splash on mount; app-level loader handles auth wait state
  useEffect(() => {
    if (!IS_WEB) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let unsubscribe = () => {};

    async function setupAuth() {
      const ready = await ensureFirebase();
      if (!mounted) return;

      if (!ready) {
        setFirebaseReady(false);
        setIsAuthReady(true);
        setIsLoading(false);
        return;
      }

      setFirebaseReady(true);

      try {
        await tryCompleteRedirectSignIn();
      } catch (error) {
        if (mounted) {
          setLoginError(getReadableAuthError(error));
        }
      }

      unsubscribe = observeAuth(async (user) => {
        if (!mounted) return;
        if (demoSessionRef.current) return;

        setAuthUser(user);

        if (!user) {
          setProfile(null);
          setSavedNames([]);
          setCareData(getDefaultCareData());
          setNeedsReOnboarding(false);
          setNavigationStack([]);
          setActiveTab("home");
          setIsAuthReady(true);
          setIsLoading(false);
          return;
        }

        let hasUsableCachedProfile = false;
        try {
          const [cachedProfileRaw, cachedNamesRaw, cachedCareRaw] = await Promise.all([
            AsyncStorage.getItem(getProfileCacheKey(user.uid)),
            AsyncStorage.getItem(getNamesCacheKey(user.uid)),
            AsyncStorage.getItem(getCareCacheKey(user.uid)),
          ]);

          if (cachedNamesRaw) {
            const parsedNames = JSON.parse(cachedNamesRaw);
            if (Array.isArray(parsedNames)) {
              setSavedNames(parsedNames);
            }
          }

          if (cachedCareRaw) {
            const parsedCare = JSON.parse(cachedCareRaw);
            if (parsedCare && typeof parsedCare === "object") {
              setCareData(mergeCareData(parsedCare));
            }
          }

          if (cachedProfileRaw) {
            const cachedProfile = JSON.parse(cachedProfileRaw);
            const cachedVersion = cachedProfile?.onboardingVersion || 0;
            const parsedCachedProfile = { ...cachedProfile };
            if (parsedCachedProfile?.lmpDate) {
              const diffMs = new Date() - new Date(parsedCachedProfile.lmpDate);
              parsedCachedProfile.currentWeek = Math.max(
                1,
                Math.min(40, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)) + 1)
              );
            }

            if (cachedVersion >= ONBOARDING_RELEASE_VERSION) {
              setProfile(parsedCachedProfile);
              setNeedsReOnboarding(false);
              setIsAuthReady(true);
              setIsLoading(false);
              hasUsableCachedProfile = true;
            }
          }

          const cloud = await loadUserCloud(user.uid);
          const cloudProfile = cloud?.profile || null;
          const onboardingVersion = cloud?.onboardingVersion || cloudProfile?.onboardingVersion || 0;
          const mustOnboard = !cloudProfile || onboardingVersion < ONBOARDING_RELEASE_VERSION;

          setSavedNames(Array.isArray(cloud?.savedNames) ? cloud.savedNames : []);
          setCareData(cloud?.careData ? mergeCareData(cloud.careData) : getDefaultCareData());

          if (mustOnboard) {
            setProfile(null);
            setNeedsReOnboarding(true);
          } else {
            const parsedProfile = { ...cloudProfile };
            if (parsedProfile.lmpDate) {
              const diffMs = new Date() - new Date(parsedProfile.lmpDate);
              parsedProfile.currentWeek = Math.max(
                1,
                Math.min(40, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)) + 1)
              );
            }
            setProfile(parsedProfile);
            setNeedsReOnboarding(false);
            await Promise.all([
              AsyncStorage.setItem(getProfileCacheKey(user.uid), JSON.stringify(parsedProfile)),
              AsyncStorage.setItem(getNamesCacheKey(user.uid), JSON.stringify(Array.isArray(cloud?.savedNames) ? cloud.savedNames : [])),
              AsyncStorage.setItem(getCareCacheKey(user.uid), JSON.stringify(cloud?.careData ? mergeCareData(cloud.careData) : getDefaultCareData())),
            ]);
          }
        } catch (e) {
          console.error("Cloud load error", e);
          if (!hasUsableCachedProfile) {
            setProfile(null);
            setSavedNames([]);
            setNeedsReOnboarding(true);
          }
        } finally {
          setIsAuthReady(true);
          setIsLoading(false);
        }
      });
    }

    setupAuth();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  async function loadUiPrefs() {
    try {
      const darkModeData = await AsyncStorage.getItem(DARK_MODE_KEY);
      if (darkModeData) setIsDarkMode(JSON.parse(darkModeData));
    } catch (e) {
      console.error("Load error", e);
    }
  }

  async function saveProfile(newProfile) {
    if (!authUser?.uid) return;
    try {
      const profileToSave = {
        diet: "veg",
        pregnancyType: "singleton",
        healthFlags: [],
        viewerRole: "mother",
        plusUnlocked: false,
        ...profile,
        ...newProfile,
        onboardingVersion: ONBOARDING_RELEASE_VERSION,
        familyCode: newProfile.familyCode || profile?.familyCode || `GS${String(authUser.uid).slice(0, 6).toUpperCase()}`,
      };
      setProfile(profileToSave);
      setNeedsReOnboarding(false);

      await Promise.all([
        AsyncStorage.setItem(getProfileCacheKey(authUser.uid), JSON.stringify(profileToSave)),
        AsyncStorage.setItem(getNamesCacheKey(authUser.uid), JSON.stringify(savedNames)),
        AsyncStorage.setItem(getCareCacheKey(authUser.uid), JSON.stringify(careData)),
      ]);

      if (authUser.uid !== DEMO_UID) {
        saveUserCloud(authUser.uid, {
          profile: profileToSave,
          savedNames,
          careData,
          onboardingVersion: ONBOARDING_RELEASE_VERSION,
        }).catch((error) => {
          console.error("Cloud save profile error", error);
        });
      }
    } catch (e) {
      console.error("Save error", e);
    }
  }

  async function toggleSaveName(nameObj) {
    if (!authUser?.uid) return;
    try {
      const exists = savedNames.find((item) => item.name === nameObj.name);
      const updated = exists
        ? savedNames.filter((item) => item.name !== nameObj.name)
        : [...savedNames, nameObj];
      setSavedNames(updated);
      await AsyncStorage.setItem(getNamesCacheKey(authUser.uid), JSON.stringify(updated));
      if (authUser.uid !== DEMO_UID) {
        saveUserCloud(authUser.uid, { savedNames: updated }).catch((error) => {
          console.error("Cloud save name error", error);
        });
      }
    } catch (e) {
      console.error("Save name error", e);
    }
  }

  async function saveCareData(nextCareData) {
    if (!authUser?.uid) return;
    const merged = mergeCareData(nextCareData);
    setCareData(merged);
    try {
      await AsyncStorage.setItem(getCareCacheKey(authUser.uid), JSON.stringify(merged));
      if (authUser.uid !== DEMO_UID) {
        saveUserCloud(authUser.uid, { careData: merged }).catch((error) => {
          console.error("Cloud save care data error", error);
        });
      }
    } catch (error) {
      console.error("Save care data error", error);
    }
  }

  function isNameSaved(name) {
    return savedNames.some((item) => item.name === name);
  }

  async function toggleDarkMode() {
    try {
      const newDarkMode = !isDarkMode;
      setIsDarkMode(newDarkMode);
      await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify(newDarkMode));
    } catch (e) {
      console.error("Dark mode toggle error", e);
    }
  }

  async function handleDemoStart() {
    demoSessionRef.current = true;
    setLoginError("");
    setAuthUser({ uid: DEMO_UID, isDemo: true });
    try {
      const [cachedProfileRaw, cachedNamesRaw, cachedCareRaw] = await Promise.all([
        AsyncStorage.getItem(getProfileCacheKey(DEMO_UID)),
        AsyncStorage.getItem(getNamesCacheKey(DEMO_UID)),
        AsyncStorage.getItem(getCareCacheKey(DEMO_UID)),
      ]);
      if (cachedNamesRaw) {
        const parsedNames = JSON.parse(cachedNamesRaw);
        if (Array.isArray(parsedNames)) setSavedNames(parsedNames);
      }
      if (cachedCareRaw) {
        const parsedCare = JSON.parse(cachedCareRaw);
        if (parsedCare && typeof parsedCare === "object") setCareData(mergeCareData(parsedCare));
      } else {
        setCareData(getDefaultCareData());
      }
      if (cachedProfileRaw) {
        const cachedProfile = JSON.parse(cachedProfileRaw);
        const cachedVersion = cachedProfile?.onboardingVersion || 0;
        if (cachedVersion >= ONBOARDING_RELEASE_VERSION) {
          const parsedCachedProfile = { ...cachedProfile };
          if (parsedCachedProfile?.lmpDate) {
            const diffMs = new Date() - new Date(parsedCachedProfile.lmpDate);
            parsedCachedProfile.currentWeek = Math.max(
              1,
              Math.min(40, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)) + 1)
            );
          }
          setProfile(parsedCachedProfile);
          setNeedsReOnboarding(false);
        } else {
          setProfile(null);
          setNeedsReOnboarding(true);
        }
      } else {
        setProfile(null);
        setNeedsReOnboarding(true);
      }
    } catch (e) {
      console.error("Demo load error", e);
      setProfile(null);
      setNeedsReOnboarding(true);
    } finally {
      setIsAuthReady(true);
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin(nativeGoogleTokens = null) {
    setLoginError("");
    setIsLoggingIn(true);
    try {
      await signInWithGoogle(nativeGoogleTokens);
    } catch (e) {
      setLoginError(getReadableAuthError(e));
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleSignOut() {
    const wasDemo = authUser?.uid === DEMO_UID;
    demoSessionRef.current = false;
    setIsLoading(true);
    if (wasDemo) {
      setProfile(null);
      setSavedNames([]);
      setCareData(getDefaultCareData());
      setNavigationStack([]);
      setActiveTab("home");
      setNeedsReOnboarding(false);
      setAuthUser(null);
      setIsLoading(false);
      return;
    }
    try {
      await signOutUser();
    } catch (e) {
      console.error("Sign out error", e);
      // On error, manually restore a clean logged-out state
      setProfile(null);
      setSavedNames([]);
      setCareData(getDefaultCareData());
      setNavigationStack([]);
      setActiveTab("home");
      setNeedsReOnboarding(false);
      setAuthUser(null);
      setIsLoading(false);
    }
  }

  function navigate(screen, params = {}) {
    setNavigationStack((prev) => [...prev, { screen, params }]);
  }

  function goBack() {
    setNavigationStack((prev) => prev.slice(0, -1));
  }

  function handleTabPress(tabId) {
    setActiveTab(tabId);
    setNavigationStack([]);
  }

  function renderMainScreen() {
    if (activeTab === "home") {
      return (
        <HomeScreen
          profile={profile}
          careData={careData}
          onNavigate={navigate}
          onGoToTab={handleTabPress}
          colors={currentColors}
          isMobileWeb={isMobileWeb}
          dailyGeetaShlok={getDailyGeetaShlok()}
        />
      );
    }

    if (activeTab === "weeks") {
      return (
        <WeeksScreen
          currentWeek={profile.currentWeek}
          colors={currentColors}
          isMobileWeb={isMobileWeb}
          onSelectWeek={(week) => navigate("weekDetail", { week })}
        />
      );
    }

    if (activeTab === "names") {
      return (
        <NamesScreen
          savedNames={savedNames}
          toggleSaveName={toggleSaveName}
          isNameSaved={isNameSaved}
          babyGender={profile.babyGender}
          colors={currentColors}
        />
      );
    }

    if (activeTab === "care") {
      return (
        <CareHubScreen
          profile={profile}
          careData={careData}
          onSaveCareData={saveCareData}
          onUpdateProfile={saveProfile}
          onNavigate={navigate}
          colors={currentColors}
        />
      );
    }

    return (
      <ProfileScreen
        profile={profile}
        onUpdateProfile={saveProfile}
        savedNames={savedNames}
        colors={currentColors}
        onSignOut={handleSignOut}
      />
    );
  }

  function renderDetailScreen(stackEntry) {
    if (stackEntry?.screen === "weekDetail") {
      return (
        <WeekDetailScreen
          week={stackEntry.params.week}
          initialTab={stackEntry.params.tab || "baby"}
          profile={profile}
          colors={currentColors}
          isDarkMode={isDarkMode}
          isMobileWeb={isMobileWeb}
        />
      );
    }
    if (stackEntry?.screen === "chatbot") {
      return (
        <PregnancyChatScreen
          profile={profile}
          careData={careData}
          onSaveCareData={saveCareData}
          onUnlockPlus={() => saveProfile({ ...profile, plusUnlocked: true })}
          colors={currentColors}
          isMobileWeb={isMobileWeb}
        />
      );
    }
    if (stackEntry?.screen === "healthLog") {
      return (
        <HealthLogScreen
          profile={profile}
          careData={careData}
          onSaveCareData={saveCareData}
          onUnlockPlus={() => saveProfile({ ...profile, plusUnlocked: true })}
          colors={currentColors}
        />
      );
    }
    if (stackEntry?.screen === "ritual") {
      return (
        <RitualScreen
          profile={profile}
          careData={careData}
          onSaveCareData={saveCareData}
          onUnlockPlus={() => saveProfile({ ...profile, plusUnlocked: true })}
          colors={currentColors}
        />
      );
    }
    if (stackEntry?.screen === "family") {
      return (
        <FamilyCareScreen
          profile={profile}
          careData={careData}
          onSaveCareData={saveCareData}
          onUpdateProfile={saveProfile}
          onUnlockPlus={() => saveProfile({ ...profile, plusUnlocked: true })}
          colors={currentColors}
        />
      );
    }
    if (stackEntry?.screen === "postpartum") {
      return (
        <PostpartumTrackScreen
          profile={profile}
          careData={careData}
          onSaveCareData={saveCareData}
          onUpdateProfile={saveProfile}
          colors={currentColors}
        />
      );
    }
    return null;
  }

  if (isLoading || !isAuthReady) {
    return (
      <View style={styles.splashScreen}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <Text style={styles.splashEmoji}>🕉️</Text>
        <Text style={styles.splashTitle}>गर्भसंस्कार</Text>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: SPACING.lg, marginBottom: SPACING.sm }}
        />
        <Text style={styles.splashSubtitle}>लोड होत आहे...</Text>
      </View>
    );
  }

  if (!authUser) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.bg }]}> 
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={currentColors.bg} />
        <LoginErrorBoundary
          key={loginScreenKey}
          colors={currentColors}
          onRetry={() => setLoginScreenKey((prev) => prev + 1)}
        >
          <LoginScreen
            onGoogleSignIn={handleGoogleLogin}
            onDemoStart={handleDemoStart}
            isBusy={isLoggingIn}
            errorText={loginError}
            firebaseReady={firebaseReady}
            colors={currentColors}
          />
        </LoginErrorBoundary>
        <VercelAnalytics />
      </SafeAreaView>
    );
  }

  if (!profile || needsReOnboarding) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        {IS_WEB && !isMobileWeb ? (
          <View style={styles.webOnboardingRoot}>
            <View style={styles.webOnboardingHero}>
              <Text style={styles.webOnboardingIcon}>🕉️</Text>
              <Text style={styles.webOnboardingTitle}>गर्भसंस्कार</Text>
              <Text style={styles.webOnboardingSubtitle}>
                वेबवर विस्तृत डॅशबोर्ड, अॅपमध्ये साधा मोबाइल अनुभव.
              </Text>
              <View style={styles.webOnboardingList}>
                <Text style={styles.webOnboardingListItem}>• आठवड्यानुसार मार्गदर्शन</Text>
                <Text style={styles.webOnboardingListItem}>• नावे, संस्कार, योग, पोषण</Text>
                <Text style={styles.webOnboardingListItem}>• नोंदवही, दैनिक विधी, कुटुंब आणि प्रसूतीनंतर ट्रॅक</Text>
                <Text style={styles.webOnboardingListItem}>• Google साइन-इन आणि क्लाउड डेटा सिंक</Text>
              </View>
            </View>
            <View style={styles.webOnboardingCard}>
              <OnboardingScreen onComplete={saveProfile} isMobileWeb={isMobileWeb} />
            </View>
          </View>
        ) : (
          <OnboardingScreen onComplete={saveProfile} isMobileWeb={isMobileWeb} />
        )}
        <VercelAnalytics />
      </SafeAreaView>
    );
  }

  const currentStack = navigationStack[navigationStack.length - 1];
  const activeTabMeta = NAV_TABS.find((tab) => tab.id === activeTab);

  if (IS_WEB && !isMobileWeb) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.bg }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={currentColors.bg} />
        <View style={[styles.webBackdrop, { backgroundColor: currentColors.bg }]}>
          <View style={[styles.webShell, { backgroundColor: currentColors.bg }]}>
            <View style={[styles.webSidebar, isDarkMode && { backgroundColor: currentColors.primaryDark }]}>
              <View style={styles.webBrandCard}>
                <Text style={styles.webBrandEmoji}>🕉️</Text>
                <Text style={styles.webBrandTitle}>गर्भसंस्कार</Text>
                <Text style={styles.webBrandSubtitle}>Marathi pregnancy companion</Text>
              </View>

              <View style={styles.webWeekCard}>
                <Text style={styles.webWeekValue}>{profile.currentWeek}</Text>
                <Text style={styles.webWeekLabel}>सध्याचा आठवडा</Text>
              </View>

              <View style={styles.webNavList}>
                {NAV_TABS.map((tab) => {
                  const isActive = activeTab === tab.id && !currentStack;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      style={[styles.webNavItem, isActive && styles.webNavItemActive]}
                      onPress={() => handleTabPress(tab.id)}
                    >
                      <Text style={styles.webNavEmoji}>{tab.emoji}</Text>
                      <View style={styles.webNavTextWrap}>
                        <Text style={[styles.webNavLabel, isActive && styles.webNavLabelActive]}>
                          {tab.label}
                        </Text>
                        <Text style={styles.webNavHint}>{tab.hint}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.webSidebarFooter}>
                <Text style={styles.webSidebarName}>{profile.name || "आई"}</Text>
                <Text style={styles.webSidebarNote}>वेबवर डेस्कटॉप डॅशबोर्ड, अॅपमध्ये मोबाइल-फर्स्ट UI.</Text>
                {IS_WEB && (
                  <TouchableOpacity
                    style={styles.darkModeToggle}
                    onPress={toggleDarkMode}
                  >
                    <Text style={styles.darkModeIcon}>{isDarkMode ? "🌞" : "🌙"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[styles.webMainPane, { backgroundColor: currentColors.bg }]}>
              <View style={styles.webTopBar}>
                <View>
                  <Text style={styles.webEyebrow}>
                    {currentStack ? "सविस्तर" : "डॅशबोर्ड"}
                  </Text>
                  <Text style={styles.webPageTitle}>
                    {currentStack ? stackScreenTitle(currentStack) : activeTabMeta?.label}
                  </Text>
                </View>

                {currentStack ? (
                  <TouchableOpacity style={styles.webBackChip} onPress={goBack}>
                    <Text style={styles.webBackChipText}>← मागे जा</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.webTopBadge}>
                    <Text style={styles.webTopBadgeNum}>{savedNames.length}</Text>
                    <Text style={styles.webTopBadgeLabel}>जतन नावे</Text>
                  </View>
                )}
              </View>

              <View style={styles.webContentStage}>
                <View style={styles.webContentSurface}>
                  {currentStack ? renderDetailScreen(currentStack) : renderMainScreen()}
                </View>
              </View>
            </View>
          </View>
        </View>
        <VercelAnalytics />
      </SafeAreaView>
    );
  }

  if (currentStack) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.bg }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={currentColors.bgCard} />
        <View style={[styles.stackHeader, { backgroundColor: currentColors.bgCard, borderBottomColor: currentColors.border }]}> 
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Text style={[styles.backBtnText, { color: currentColors.primary }]}>← मागे</Text>
          </TouchableOpacity>
          <Text style={[styles.stackTitle, { color: currentColors.textPrimary }]}>
            {stackScreenTitle(currentStack)}
          </Text>
          <TouchableOpacity style={styles.mobileDarkToggle} onPress={toggleDarkMode}>
            <Text style={styles.darkModeIcon}>{isDarkMode ? "🌞" : "🌙"}</Text>
          </TouchableOpacity>
        </View>
        {renderDetailScreen(currentStack)}
        <TouchableOpacity
          style={[styles.chatFab, { backgroundColor: currentColors.primary, borderColor: currentColors.primaryDark }]}
          onPress={() => navigate("chatbot")}
          accessibilityRole="button"
          accessibilityLabel="सल्ला चॅट उघडा"
        >
          <Text style={styles.chatFabIcon}>💬</Text>
          <Text style={styles.chatFabText}>चॅट</Text>
        </TouchableOpacity>
        <View style={[styles.bottomNav, { backgroundColor: currentColors.bgCard, borderTopColor: currentColors.border }]}> 
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.navTab, isActive && { backgroundColor: currentColors.bgWarm }]}
                onPress={() => handleTabPress(tab.id)}
              >
                <Text style={styles.navEmoji}>{tab.emoji}</Text>
                <Text style={[styles.navLabel, { color: currentColors.textLight }, isActive && { color: currentColors.primary, fontWeight: "700" }]}>
                  {tab.label}
                </Text>
                {isActive && <View style={[styles.navIndicator, { backgroundColor: currentColors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
        <VercelAnalytics />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.bg }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={currentColors.bgCard} />

      <View style={[styles.topHeader, { backgroundColor: currentColors.bgCard, borderBottomColor: currentColors.border }]}>
        <View>
          <Text style={[styles.appTitle, { color: currentColors.textPrimary }]}>🕉️ गर्भसंस्कार</Text>
          <Text style={[styles.appSubtitle, { color: currentColors.textSecondary }]}>मराठी गर्भावस्था मार्गदर्शक</Text>
        </View>
        <View style={styles.topHeaderActions}>
          <View style={[styles.weekBadge, { backgroundColor: currentColors.primary }]}> 
            <Text style={styles.weekBadgeNum}>{profile.currentWeek}</Text>
            <Text style={styles.weekBadgeLabel}>आठवडा</Text>
          </View>
          <TouchableOpacity style={styles.mobileDarkToggle} onPress={toggleDarkMode}>
            <Text style={styles.darkModeIcon}>{isDarkMode ? "🌞" : "🌙"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>{renderMainScreen()}</View>

      <TouchableOpacity
        style={[styles.chatFab, { backgroundColor: currentColors.primary, borderColor: currentColors.primaryDark }]}
        onPress={() => navigate("chatbot")}
        accessibilityRole="button"
        accessibilityLabel="सल्ला चॅट उघडा"
      >
        <Text style={styles.chatFabIcon}>💬</Text>
        <Text style={styles.chatFabText}>चॅट</Text>
      </TouchableOpacity>

      <View style={[styles.bottomNav, { backgroundColor: currentColors.bgCard, borderTopColor: currentColors.border }]}> 
        {NAV_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.navTab, isActive && { backgroundColor: currentColors.bgWarm }]}
              onPress={() => handleTabPress(tab.id)}
            >
              <Text style={styles.navEmoji}>{tab.emoji}</Text>
              <Text style={[styles.navLabel, { color: currentColors.textLight }, isActive && { color: currentColors.primary, fontWeight: "700" }]}>
                {tab.label}
              </Text>
              {isActive && <View style={[styles.navIndicator, { backgroundColor: currentColors.primary }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
      <VercelAnalytics />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  splashScreen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  splashEmoji: { fontSize: 72, marginBottom: SPACING.md },
  splashTitle: { fontSize: FONTS.h1, fontWeight: "800", color: COLORS.textPrimary },
  splashSubtitle: { fontSize: FONTS.body, color: COLORS.textSecondary, marginTop: SPACING.sm },
  loginFallbackRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
  },
  loginFallbackEmoji: { fontSize: 56, marginBottom: SPACING.sm },
  loginFallbackTitle: { fontSize: FONTS.h2, fontWeight: "800" },
  loginFallbackText: {
    marginTop: SPACING.sm,
    fontSize: FONTS.body,
    textAlign: "center",
    lineHeight: 24,
  },
  loginFallbackBtn: {
    marginTop: SPACING.lg,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  loginFallbackBtnText: {
    color: COLORS.textWhite,
    fontSize: FONTS.body,
    fontWeight: "800",
  },
  loginFallbackError: {
    marginTop: SPACING.md,
    fontSize: FONTS.small,
    textAlign: "center",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  appTitle: { fontSize: FONTS.h3, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: 0.2 },
  appSubtitle: { fontSize: FONTS.tiny, color: COLORS.textSecondary, marginTop: 2 },
  topHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  weekBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    ...SHADOWS.md,
  },
  weekBadgeNum: { fontSize: FONTS.h3, fontWeight: "800", color: COLORS.textWhite },
  weekBadgeLabel: { fontSize: FONTS.tiny, color: "rgba(255,255,255,0.8)" },
  content: { flex: 1 },
  chatFab: {
    position: "absolute",
    right: SPACING.md,
    bottom: Platform.OS === "ios" ? 88 : 82,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    ...SHADOWS.md,
    zIndex: 30,
  },
  chatFabIcon: {
    fontSize: 18,
  },
  chatFabText: {
    color: COLORS.textWhite,
    fontSize: FONTS.small,
    fontWeight: "800",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === "ios" ? SPACING.xs : SPACING.sm,
    paddingTop: SPACING.xs,
    ...SHADOWS.md,
  },
  navTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.sm,
    position: "relative",
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.xxs,
  },
  navTabActive: { backgroundColor: COLORS.bgWarm },
  navEmoji: { fontSize: 22, marginBottom: 2 },
  navLabel: { fontSize: FONTS.tiny, color: COLORS.textLight, fontWeight: "600" },
  navLabelActive: { color: COLORS.primary, fontWeight: "700" },
  navIndicator: {
    position: "absolute",
    top: -SPACING.xs,
    left: "30%",
    right: "30%",
    height: 3,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.sm,
    borderBottomRightRadius: RADIUS.sm,
  },
  stackHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    minHeight: 56,
  },
  backBtn: { 
    paddingVertical: SPACING.md, 
    paddingHorizontal: SPACING.md,
    marginLeft: -SPACING.md,
    minWidth: 50,
  },
  backBtnText: { fontSize: FONTS.body, color: COLORS.primary, fontWeight: "600" },
  stackTitle: { fontSize: FONTS.h4, fontWeight: "700", color: COLORS.textPrimary },
  stackSpacer: { width: 60 },
  mobileDarkToggle: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(127,127,127,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  webOnboardingRoot: {
    flex: 1,
    flexDirection: "row",
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  webOnboardingHero: {
    flex: 0.95,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primaryDark,
    padding: 44,
    justifyContent: "center",
    ...SHADOWS.md,
  },
  webOnboardingIcon: { fontSize: 56, marginBottom: SPACING.md },
  webOnboardingTitle: { fontSize: 34, fontWeight: "800", color: COLORS.textWhite },
  webOnboardingSubtitle: {
    fontSize: 16,
    lineHeight: 28,
    color: "rgba(255,255,255,0.84)",
    marginTop: SPACING.md,
  },
  webOnboardingList: { marginTop: SPACING.xl },
  webOnboardingListItem: {
    fontSize: 15,
    color: COLORS.bgWarm,
    marginBottom: SPACING.md,
  },
  webOnboardingCard: {
    flex: 1.15,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
  },

  webBackdrop: {
    flex: 1,
    padding: SPACING.lg,
    backgroundColor: COLORS.bgMuted,
  },
  webShell: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  webSidebar: {
    width: 250,
    padding: SPACING.lg,
    backgroundColor: COLORS.primaryDark,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.12)",
  },
  webBrandCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  webBrandEmoji: { fontSize: 28, marginBottom: SPACING.xs },
  webBrandTitle: { fontSize: 22, fontWeight: "800", color: COLORS.textWhite },
  webBrandSubtitle: { fontSize: FONTS.small, color: "rgba(255,255,255,0.82)", marginTop: 4 },
  webWeekCard: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.accent,
    padding: SPACING.md,
  },
  webWeekValue: { fontSize: 34, fontWeight: "800", color: COLORS.textWhite },
  webWeekLabel: { fontSize: FONTS.small, color: "rgba(255,255,255,0.84)", marginTop: 4 },
  webNavList: { marginTop: SPACING.lg },
  webNavItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  webNavItemActive: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.28)",
  },
  webNavEmoji: { fontSize: 22, marginRight: SPACING.md },
  webNavTextWrap: { flex: 1 },
  webNavLabel: { fontSize: FONTS.body, fontWeight: "700", color: COLORS.textWhite },
  webNavLabelActive: { color: COLORS.textWhite },
  webNavHint: { fontSize: FONTS.tiny, color: "rgba(255,255,255,0.74)", marginTop: 3 },
  webSidebarFooter: {
    marginTop: "auto",
    paddingTop: SPACING.lg,
  },
  webSidebarName: { fontSize: FONTS.h4, fontWeight: "700", color: COLORS.textWhite },
  webSidebarNote: {
    fontSize: FONTS.small,
    lineHeight: 20,
    color: "rgba(255,255,255,0.76)",
    marginTop: SPACING.xs,
  },

  webMainPane: { flex: 1, backgroundColor: COLORS.bg },
  webTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: SPACING.md,
  },
  webEyebrow: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  webPageTitle: { fontSize: 28, fontWeight: "800", color: COLORS.textPrimary },
  webBackChip: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  webBackChipText: { fontSize: FONTS.small, fontWeight: "700", color: COLORS.primary },
  webTopBadge: {
    minWidth: 92,
    alignItems: "center",
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  webTopBadgeNum: { fontSize: FONTS.h3, fontWeight: "800", color: COLORS.primary },
  webTopBadgeLabel: { fontSize: FONTS.tiny, color: COLORS.textSecondary },
  webContentStage: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  webContentSurface: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 26,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  darkModeToggle: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    alignItems: "center",
  },
  darkModeIcon: { fontSize: 24 },
});
