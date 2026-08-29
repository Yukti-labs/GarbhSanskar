import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Platform,
} from "react-native";
import AppDatePicker from "../components/AppDatePicker";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { DIET_OPTIONS, PREGNANCY_TYPES, HEALTH_FLAGS } from "../utils/careData";

export default function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [lmpDate, setLmpDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [diet, setDiet] = useState("veg");
  const [pregnancyType, setPregnancyType] = useState("singleton");
  const [healthFlags, setHealthFlags] = useState([]);
  const [viewerRole, setViewerRole] = useState("mother");
  const [city, setCity] = useState("");

  function calcDueDate(lmp) {
    const due = new Date(lmp);
    due.setDate(due.getDate() + 280);
    return due;
  }

  function calcCurrentWeek(lmp) {
    const diffMs = new Date() - lmp;
    return Math.max(1, Math.min(40, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)) + 1));
  }

  function handleFinish() {
    if (!name.trim()) {
      Alert.alert("नाव आवश्यक आहे", "कृपया तुमचे नाव प्रविष्ट करा.");
      return;
    }
    const dueDate = calcDueDate(lmpDate);
    const currentWeek = calcCurrentWeek(lmpDate);
    onComplete({
      name,
      lmpDate: lmpDate.toISOString(),
      dueDate: dueDate.toISOString(),
      currentWeek,
      babyGender: "unknown",
      diet,
      pregnancyType,
      healthFlags,
      viewerRole,
      city: city.trim(),
      plusUnlocked: false,
    });
  }

  const isWeb = Platform.OS === "web";
  const dueDate = useMemo(() => calcDueDate(lmpDate), [lmpDate]);
  const currentWeek = useMemo(() => calcCurrentWeek(lmpDate), [lmpDate]);

  const stepMeta = [
    { emoji: "✨", title: "स्वागत", subtitle: "तुमचा मातृत्व प्रवास इथेपासून" },
    { emoji: "👩", title: "प्रोफाइल", subtitle: "तुमचे नाव नोंदवा" },
    { emoji: "📅", title: "टाइमलाइन", subtitle: "LMP आणि अपेक्षित तारीख" },
    { emoji: "🩺", title: "काळजी", subtitle: "आहार आणि जोखीम (पर्यायी)" },
  ];

  const steps = [
    {
      emoji: "🤱",
      title: "गर्भसंस्कार अॅपमध्ये स्वागत",
      subtitle: "दर आठवड्याला योग्य मार्गदर्शन, योग्य वेळी",
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.welcomeTextLarge}>
            तुमच्यासाठी दररोज काळजी, बाळासाठी दररोज प्रेम.
          </Text>
          <Text style={styles.welcomeText}>
            साप्ताहिक प्रगती, पोषण, योग, गर्भसंस्कार कथा, दैनिक गीता श्लोक, गर्भ गीता संदर्भ आणि नाव सुचवणी — सर्व डिव्हाइसमध्ये क्लाउड डेटा साठवणीने सुरक्षित.
          </Text>

          <View style={styles.featureGrid}>
            {[
              ["🍼", "बाळाची वाढ", COLORS.bgWarm],
              ["🥗", "पोषण मार्गदर्शन", COLORS.bgTeal],
              ["🧘", "योग दिनक्रम", "#F3E5F5"],
              ["🕉️", "गर्भसंस्कार", "#FFF3E0"],
              ["💬", "दैनंदिन संवाद", "#E8F0FF"],
              ["👶", "नाव सुचवणी", "#FCE4EC"],
              ["📖", "गीता श्लोक", "#FFE4E1"],
              ["📚", "गर्भ गीता संदर्भ", "#E0FFFF"],
              ["☁️", "क्लाउड डेटा सिंक", "#F0E68C"],
              ["🔐", "Google साइन-इन", "#E6F3FF"],
            ].map(([emoji, label, color]) => (
              <View key={label} style={[styles.featureCard, { backgroundColor: color }]}>
                <Text style={styles.featureEmoji}>{emoji}</Text>
                <Text style={styles.featureLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      ),
    },
    {
      emoji: "👩",
      title: "तुमची ओळख",
      subtitle: "आम्ही तुम्हाला कसे संबोधू?",
      content: (
        <View style={styles.stepContent}>
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>पूर्ण नाव</Text>
            <TextInput
              style={styles.input}
              placeholder="तुमचे नाव लिहा..."
              placeholderTextColor={COLORS.textLight}
              value={name}
              onChangeText={setName}
            />
            <Text style={styles.inputHint}>उदा. सुप्रिया, मीरा, अनिता</Text>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipText}>नाव वैयक्तिक संदेश आणि स्मरणपत्र अधिक जिवंत बनवते.</Text>
          </View>
        </View>
      ),
    },
    {
      emoji: "📅",
      title: "गर्भधारणेची तारीख",
      subtitle: "शेवटच्या पाळीच्या तारखेनुसार आठवडा मोजूया",
      content: (
        <View style={styles.stepContent}>
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>LMP (शेवटच्या पाळीची पहिली तारीख)</Text>
            <TouchableOpacity
              style={styles.datePicker}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerEmoji}>📆</Text>
              <Text style={styles.datePickerText}>
                {lmpDate.toLocaleDateString("mr-IN", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <AppDatePicker
                open={showDatePicker}
                date={lmpDate}
                maximumDate={new Date()}
                onConfirm={(date) => {
                  setShowDatePicker(false);
                  setLmpDate(date);
                }}
                onCancel={() => setShowDatePicker(false)}
              />
            )}
          </View>

          <View style={styles.timelineRow}>
            <View style={[styles.infoTile, { backgroundColor: COLORS.bgTeal }]}> 
              <Text style={styles.infoTileLabel}>अपेक्षित तारीख</Text>
              <Text style={styles.infoTileValue}>
                {dueDate.toLocaleDateString("mr-IN", {
                  day: "numeric", month: "short", year: "numeric"
                })}
              </Text>
            </View>
            <View style={[styles.infoTile, { backgroundColor: COLORS.bgWarm }]}> 
              <Text style={styles.infoTileLabel}>सध्याचा आठवडा</Text>
              <Text style={styles.infoTileValue}>{currentWeek}वा</Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      emoji: "🩺",
      title: "वैयक्तिक काळजी",
      subtitle: "AI आणि पोषण या माहितीनुसार अधिक सुरक्षित राहील. रिकामे ठेवता येते.",
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.inputLabel}>मी कोण आहे?</Text>
          <View style={styles.chipRow}>
            {[
              { id: "mother", label: "आई" },
              { id: "partner", label: "साथीदार" },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.choiceChip, viewerRole === item.id && styles.choiceChipOn]}
                onPress={() => setViewerRole(item.id)}
              >
                <Text style={[styles.choiceChipText, viewerRole === item.id && styles.choiceChipTextOn]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.inputLabel}>आहार</Text>
          <View style={styles.chipRow}>
            {DIET_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.choiceChip, diet === item.id && styles.choiceChipOn]}
                onPress={() => setDiet(item.id)}
              >
                <Text style={[styles.choiceChipText, diet === item.id && styles.choiceChipTextOn]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.inputLabel}>गर्भधारणा</Text>
          <View style={styles.chipRow}>
            {PREGNANCY_TYPES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.choiceChip, pregnancyType === item.id && styles.choiceChipOn]}
                onPress={() => setPregnancyType(item.id)}
              >
                <Text style={[styles.choiceChipText, pregnancyType === item.id && styles.choiceChipTextOn]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.inputLabel}>डॉक्टरांनी सांगितलेले (पर्यायी)</Text>
          <View style={styles.chipRow}>
            {HEALTH_FLAGS.map((item) => {
              const on = healthFlags.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.choiceChip, on && styles.choiceChipOn]}
                  onPress={() => setHealthFlags((prev) => (on ? prev.filter((id) => id !== item.id) : [...prev, item.id]))}
                >
                  <Text style={[styles.choiceChipText, on && styles.choiceChipTextOn]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>शहर (पर्यायी)</Text>
            <TextInput
              style={styles.input}
              placeholder="उदा. पुणे"
              placeholderTextColor={COLORS.textLight}
              value={city}
              onChangeText={setCity}
            />
          </View>
        </View>
      ),
    },
  ];

  const current = steps[step];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, isWeb && styles.webScroll]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.cardWrap, isWeb && styles.cardWrapWeb]}>
          <View style={styles.heroCard}>
            <View style={styles.stepMetaRow}>
              {stepMeta.map((meta, i) => (
                <View key={meta.title} style={styles.stepMetaItem}>
                  <View style={[styles.stepBubble, i <= step && styles.stepBubbleActive]}>
                    <Text style={styles.stepBubbleEmoji}>{meta.emoji}</Text>
                  </View>
                  <Text style={[styles.stepMetaTitle, i <= step && styles.stepMetaTitleActive]}>{meta.title}</Text>
                </View>
              ))}
            </View>

            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${((step + 1) / steps.length) * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{step + 1}/{steps.length}</Text>
            </View>

            <View style={styles.header}>
              <View style={styles.headerEmojiWrap}>
                <Text style={styles.headerEmoji}>{current.emoji}</Text>
              </View>
              <Text style={styles.headerTitle}>{current.title}</Text>
              <Text style={styles.headerSubtitle}>{current.subtitle}</Text>
            </View>
          </View>

          <View style={styles.contentCard}>{current.content}</View>
        </View>
      </ScrollView>

      <View style={[styles.navRow, isWeb && styles.navRowWeb]}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
            <Text style={styles.backBtnText}>← मागे</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, step === 0 && styles.nextBtnFull]}
          onPress={() => {
            if (step < steps.length - 1) setStep(step + 1);
            else handleFinish();
          }}
        >
          <Text style={styles.nextBtnText}>
            {step === steps.length - 1 ? "अॅप सुरू करा ✨" : "पुढील टप्पा →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollView: { flex: 1 },
  scroll: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: 140,
  },
  webScroll: {
    maxWidth: 980,
    width: "100%",
    alignSelf: "center",
  },
  cardWrap: {
    gap: SPACING.md,
  },
  cardWrapWeb: {
    maxWidth: 840,
    alignSelf: "center",
    width: "100%",
  },
  heroCard: {
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    ...SHADOWS.md,
  },

  stepMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  stepMetaItem: { flex: 1, alignItems: "center" },
  stepBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 6,
  },
  stepBubbleActive: {
    backgroundColor: COLORS.bgWarm,
    borderColor: COLORS.primary,
  },
  stepBubbleEmoji: { fontSize: 16 },
  stepMetaTitle: {
    fontSize: FONTS.tiny,
    color: COLORS.textLight,
    fontWeight: "700",
  },
  stepMetaTitleActive: {
    color: COLORS.primary,
  },

  progressWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: RADIUS.full,
    overflow: "hidden",
    backgroundColor: COLORS.borderLight,
  },
  progressFill: {
    height: "100%",
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: FONTS.small,
    color: COLORS.primary,
    fontWeight: "800",
  },

  header: { alignItems: "center" },
  headerEmojiWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.bgWarm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  headerEmoji: { fontSize: 36 },
  headerTitle: {
    fontSize: FONTS.h2,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  contentCard: {
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  stepContent: { gap: SPACING.lg },
  welcomeTextLarge: {
    fontSize: FONTS.h3,
    lineHeight: 30,
    color: COLORS.textPrimary,
    textAlign: "center",
    fontWeight: "800",
  },
  welcomeText: {
    fontSize: FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
    textAlign: "center",
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  featureCard: {
    width: "48.5%",
    minHeight: 90,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  featureEmoji: { fontSize: 24 },
  featureLabel: {
    fontSize: FONTS.small,
    color: COLORS.textPrimary,
    fontWeight: "700",
    lineHeight: 18,
  },

  inputCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  inputLabel: { fontSize: FONTS.small, color: COLORS.textSecondary, fontWeight: "700", marginBottom: 4 },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.h4,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputHint: { fontSize: FONTS.small, color: COLORS.textLight },

  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: SPACING.lg,
    marginVertical: SPACING.md,
  },
  datePickerEmoji: { fontSize: 28 },
  datePickerText: { fontSize: FONTS.h3, color: COLORS.textPrimary, fontWeight: "800" },
  timelineRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  infoTile: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  infoTileLabel: { fontSize: FONTS.small, color: COLORS.textSecondary, marginBottom: 8, fontWeight: "700" },
  infoTileValue: { fontSize: FONTS.h3, color: COLORS.textPrimary, fontWeight: "800" },

  tipCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bg,
    padding: SPACING.md,
    flexDirection: "row",
    gap: SPACING.sm,
  },
  tipEmoji: { fontSize: 20 },
  tipText: { flex: 1, fontSize: FONTS.small, lineHeight: 20, color: COLORS.textSecondary },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs, marginBottom: SPACING.md },
  choiceChip: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  choiceChipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  choiceChipText: { fontSize: FONTS.small, fontWeight: "700", color: COLORS.textSecondary },
  choiceChipTextOn: { color: COLORS.textWhite },

  navRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: 28,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  navRowWeb: {
    paddingHorizontal: SPACING.lg,
  },
  backBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary,
    minHeight: 52,
    backgroundColor: COLORS.bg,
  },
  backBtnText: { fontSize: FONTS.body, color: COLORS.primary, fontWeight: "800" },
  nextBtn: {
    flex: 1.6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    minHeight: 52,
    ...SHADOWS.md,
  },
  nextBtnFull: { flex: 1 },
  nextBtnText: { fontSize: FONTS.body, color: COLORS.textWhite, fontWeight: "800" },
});
