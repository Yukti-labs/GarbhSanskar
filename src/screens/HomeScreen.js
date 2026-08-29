import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform,
} from "react-native";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, TRIMESTER_INFO } from "../constants/theme";
import { SectionCard, PillBadge } from "../components/UIComponents";
import { buildWeeklyRecap } from "../utils/careData";

const WEEK_SIZES = {
  1: { label: "खसखस", emoji: "🌱", color: "#F6E1BC" },
  2: { label: "तीळ", emoji: "🌱", color: "#F4DDC8" },
  3: { label: "मसूर", emoji: "🫘", color: "#E7C3A4" },
  4: { label: "खसखस", emoji: "🫘", color: "#F0D5BA" },
  5: { label: "तीळ", emoji: "🌿", color: "#E3E9C6" },
  6: { label: "मटार", emoji: "🟢", color: "#D9EDC2" },
  7: { label: "ब्लूबेरी", emoji: "🫐", color: "#D8D4F7" },
  8: { label: "रास्पबेरी", emoji: "🍓", color: "#F9D0D8" },
  9: { label: "द्राक्ष", emoji: "🍇", color: "#E1D4F5" },
  10: { label: "स्ट्रॉबेरी", emoji: "🍓", color: "#F9D0D8" },
  11: { label: "अंजीर", emoji: "🫐", color: "#D8D4F7" },
  12: { label: "लिंबू", emoji: "🍋", color: "#F8EDAF" },
  13: { label: "वाटाणे", emoji: "🫛", color: "#D8EDC3" },
  14: { label: "मनुका", emoji: "🍑", color: "#FADCCF" },
  15: { label: "सफरचंद", emoji: "🍎", color: "#F8D0C5" },
  16: { label: "आंबा", emoji: "🥭", color: "#F8D8B0" },
  17: { label: "नाशपाती", emoji: "🍐", color: "#E0EDB8" },
  18: { label: "शिमला मिरची", emoji: "🫑", color: "#D5EBC3" },
  19: { label: "टोमॅटो", emoji: "🍅", color: "#F5C4BC" },
  20: { label: "केळ", emoji: "🍌", color: "#F6E3A0" },
  21: { label: "गाजर", emoji: "🥕", color: "#F7CFAB" },
  22: { label: "पालेभाजी", emoji: "🌿", color: "#D5ECC8" },
  23: { label: "ग्रेपफ्रूट", emoji: "🍊", color: "#F8D4AF" },
  24: { label: "कॉर्न", emoji: "🌽", color: "#F4E29A" },
  25: { label: "फुलकोबी", emoji: "🥦", color: "#D7E8C9" },
  26: { label: "काकडी", emoji: "🥒", color: "#D5EBC3" },
  27: { label: "ब्रोकोली", emoji: "🥦", color: "#D7E8C9" },
  28: { label: "वांगी", emoji: "🍆", color: "#DDD2F1" },
  29: { label: "बटरनट स्क्वॉश", emoji: "🎃", color: "#F2D3AE" },
  30: { label: "मोठी काकडी", emoji: "🥒", color: "#D5EBC3" },
  31: { label: "नारळ", emoji: "🥥", color: "#E8DDC8" },
  32: { label: "जांभूळ", emoji: "🍑", color: "#FADCCF" },
  33: { label: "अननस", emoji: "🍍", color: "#F5D59C" },
  34: { label: "खरबूज", emoji: "🍈", color: "#E3EABF" },
  35: { label: "मोठा खरबूज", emoji: "🍉", color: "#F7D6D0" },
  36: { label: "रोमेन लेट्यूस", emoji: "🥬", color: "#D9EDC2" },
  37: { label: "भोपळा", emoji: "🎃", color: "#F2D3AE" },
  38: { label: "पेरू", emoji: "🍈", color: "#E3EABF" },
  39: { label: "मोठा तरबूज", emoji: "🍉", color: "#F7D6D0" },
  40: { label: "टरबूज", emoji: "🍉", color: "#F7D6D0" },
};

const QUICK_CARDS = [
  { id: "baby", emoji: "🍼", label: "बाळाची वाढ", color: "#FFE6DE", border: "#D85F3A", text: "#A63F22", iconBg: "#FFD3C6" },
  { id: "talk", emoji: "💬", label: "बाळाशी बोला", color: "#DDF8F3", border: "#169D8C", text: "#0D6F63", iconBg: "#C5F1E9" },
  { id: "chatbot", emoji: "🤰", label: "सल्ला चॅट", color: "#EEE8FF", border: "#5B4BDB", text: "#4334B3", iconBg: "#DDD2FF" },
  { id: "healthLog", emoji: "📒", label: "आरोग्य नोंद", color: "#E8FFF4", border: "#1B8A5A", text: "#0F6A43", iconBg: "#CFF5E3" },
  { id: "ritual", emoji: "🔔", label: "दैनिक विधी", color: "#FFF6D8", border: "#C48912", text: "#8A5B08", iconBg: "#FFE9A8" },
  { id: "yoga", emoji: "🧘", label: "योग", color: "#F1E9FF", border: "#7B4FD6", text: "#6037B7", iconBg: "#E1D4FF" },
  { id: "nutrition", emoji: "🥗", label: "पोषण", color: "#E4F7E8", border: "#2C9A57", text: "#1E7841", iconBg: "#CFEFD8" },
  { id: "garbhsanskar", emoji: "🕉️", label: "गर्भसंस्कार", color: "#FFF2D8", border: "#D1952A", text: "#A66D08", iconBg: "#FFE6B0" },
  { id: "games", emoji: "🎯", label: "खेळ", color: "#E5EEFF", border: "#3F6FD8", text: "#2D56B8", iconBg: "#D1DEFF" },
  { id: "family", emoji: "🤝", label: "कुटुंब", color: "#FFEFE8", border: "#C45C32", text: "#9A3D1C", iconBg: "#FFD8C8" },
  { id: "stories", emoji: "📖", label: "गर्भकथा", color: "#FFF1E4", border: "#BE7A2B", text: "#8F5716", iconBg: "#FFE0BF" },
  { id: "names", emoji: "👶", label: "नाव सुचवणी", color: "#FFE6F1", border: "#D9488C", text: "#B93373", iconBg: "#FFD1E7" },
];

export default function HomeScreen({ profile, careData, onNavigate, onGoToTab, colors = COLORS, isMobileWeb = false, dailyGeetaShlok = null }) {
  const isWeb = Platform.OS === "web" && !isMobileWeb;
  const currentWeek = profile?.currentWeek || 1;
  const sizeInfo = WEEK_SIZES[currentWeek] || { label: "वाटाणे", emoji: "🌿", color: colors.bgWarm };
  const trimester = currentWeek <= 13 ? 1 : currentWeek <= 27 ? 2 : 3;
  const tri = TRIMESTER_INFO[trimester];
  const daysLeft = profile?.dueDate
    ? Math.max(0, Math.ceil((new Date(profile.dueDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;
  const recap = buildWeeklyRecap(profile, careData);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, isWeb && styles.webScrollContent]}
    >
      <View style={[styles.mainWrap, isWeb && styles.mainWrapWeb]}>
        <View style={styles.leftCol}>
          <View style={[styles.heroCard, { backgroundColor: tri.color }]}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTextWrap}>
                <Text style={[styles.helloText, { color: colors.textSecondary }]}>नमस्कार, {profile?.name || "आई"} 🌸</Text>
                <Text style={[styles.weekText, { color: colors.textPrimary }]}>{currentWeek}वा आठवडा</Text>
                <PillBadge label={tri.label} color="rgba(255,255,255,0.55)" textColor={tri.dark} />
              </View>
              <View style={styles.heroEmojiWrap}>
                <Text style={styles.heroEmoji}>{tri.emoji}</Text>
              </View>
            </View>

            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(currentWeek / 40) * 100}%`, backgroundColor: tri.dark }]} />
              </View>
              <Text style={[styles.progressLabel, { color: colors.textPrimary }]}>{currentWeek}/40</Text>
            </View>

            <View style={styles.miniStatsRow}>
              <View style={styles.miniStatCard}>
                <Text style={[styles.miniStatValue, { color: colors.textPrimary }]}>{sizeInfo.emoji}</Text>
                <Text style={[styles.miniStatText, { color: colors.textSecondary }]}>{sizeInfo.label}</Text>
              </View>
              <View style={styles.miniStatCard}>
                <Text style={[styles.miniStatValue, { color: colors.textPrimary }]}>{daysLeft ?? "—"}</Text>
                <Text style={[styles.miniStatText, { color: colors.textSecondary }]}>दिवस शिल्लक</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeadRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>या आठवड्याचे मार्गदर्शन</Text>
            <TouchableOpacity onPress={() => onNavigate("weekDetail", { week: currentWeek, tab: "baby" })}>
              <Text style={[styles.sectionAction, { color: colors.primary }]}>सविस्तर पहा</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.quickGrid, isWeb && styles.quickGridWeb]}>
            {QUICK_CARDS.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[styles.quickCard, { backgroundColor: card.color, borderColor: card.border }]}
                onPress={() => {
                  if (card.id === "names") {
                    onGoToTab?.("names");
                    return;
                  }
                  if (card.id === "chatbot" || card.id === "healthLog" || card.id === "ritual" || card.id === "family") {
                    onNavigate(card.id);
                    return;
                  }
                  onNavigate("weekDetail", { week: currentWeek, tab: card.id });
                }}
              >
                <View style={[styles.quickCardEmojiWrap, { backgroundColor: card.iconBg || "rgba(255,255,255,0.5)" }]}>
                  <Text style={styles.quickCardEmoji}>{card.emoji}</Text>
                </View>
                <Text style={[styles.quickCardLabel, { color: card.text || card.border }]}>{card.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.rightCol}>
          <SectionCard style={styles.trimesterCard}>
            <View style={styles.sectionHeadRowNoAction}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>या आठवड्याचा आढावा</Text>
            </View>
            <Text style={[styles.recapText, { color: colors.textSecondary }]}>{recap.moodSummary}</Text>
            <Text style={[styles.recapText, { color: recap.restFlag ? colors.error : colors.textSecondary }]}>{recap.advice}</Text>
            <TouchableOpacity onPress={() => onNavigate("healthLog")}>
              <Text style={[styles.sectionAction, { color: colors.primary }]}>नोंदवही उघडा →</Text>
            </TouchableOpacity>
          </SectionCard>

          <SectionCard style={styles.trimesterCard}>
            <View style={styles.sectionHeadRowNoAction}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>तिमाही टाइमलाइन</Text>
            </View>
            {[1, 2, 3].map((t) => {
              const info = TRIMESTER_INFO[t];
              const isActive = t === trimester;
              const startWeek = t === 1 ? 1 : t === 2 ? 14 : 28;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.trimesterRow, isActive && { backgroundColor: info.color, borderColor: info.dark }]}
                  onPress={() => onNavigate("weekDetail", { week: startWeek })}
                >
                  <Text style={styles.trimesterEmoji}>{info.emoji}</Text>
                  <View style={styles.trimesterMeta}>
                    <Text style={[styles.trimesterLabel, { color: colors.textPrimary }, isActive && { color: info.dark }]}>{info.label}</Text>
                    <Text style={[styles.trimesterWeeks, { color: colors.textSecondary }, isActive && { color: info.dark }]}>आठवडे {info.weeks}</Text>
                  </View>
                  <Text style={[styles.trimesterArrow, { color: colors.textLight }]}>→</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.timelineBtn} onPress={() => onNavigate("weeks")}>
              <Text style={styles.timelineBtnText}>संपूर्ण 40 आठवडे पहा</Text>
            </TouchableOpacity>
          </SectionCard>

          <SectionCard style={styles.quoteCard}>
            <Text style={[styles.quoteSymbol, { color: colors.primary }]}>❝</Text>
            <Text style={[styles.quoteText, { color: colors.textSecondary }]}>
              आईपण ही यात्रा फक्त बाळाची वाढ नाही, तर आईच्या आत्मविश्वासाची आणि प्रेमाची देखील वाढ आहे.
            </Text>
            <Text style={[styles.quoteAuthor, { color: colors.primaryDark }]}>— गर्भसंस्कार प्रेरणा</Text>
          </SectionCard>

          {!!dailyGeetaShlok && (
            <SectionCard style={[styles.shlokaDayCard, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}> 
              <Text style={[styles.shlokaDayTitle, { color: colors.primaryDark }]}>🕉️ गीता श्लोक ऑफ द डे</Text>
              <Text style={[styles.shlokaDayText, { color: colors.textPrimary }]}>{dailyGeetaShlok.sanskrit}</Text>
              <Text style={[styles.shlokaDayMeaning, { color: colors.textSecondary }]}>अर्थ: {dailyGeetaShlok.meaningMarathi}</Text>
              <Text style={[styles.shlokaDaySource, { color: colors.textLight }]}>{dailyGeetaShlok.chapter} • {dailyGeetaShlok.verse}</Text>
            </SectionCard>
          )}
        </View>
      </View>

      <View style={{ height: isWeb ? 24 : 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  webScrollContent: { paddingHorizontal: SPACING.lg, maxWidth: 1200, width: "100%", alignSelf: "center" },
  mainWrap: { gap: SPACING.md },
  mainWrapWeb: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.lg },
  leftCol: { flex: 1.5 },
  rightCol: { flex: 1 },

  heroCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    ...SHADOWS.md,
  },
  heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.md },
  heroTextWrap: { flex: 1, paddingRight: SPACING.sm },
  helloText: { fontSize: FONTS.small, color: COLORS.textSecondary, marginBottom: 4, fontWeight: "600" },
  weekText: { fontSize: FONTS.h1, color: COLORS.textPrimary, fontWeight: "800", marginBottom: SPACING.xs },
  heroEmojiWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.48)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmoji: { fontSize: 36 },

  progressWrap: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.md },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255,255,255,0.52)",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: RADIUS.full },
  progressLabel: { fontSize: FONTS.small, color: COLORS.textPrimary, fontWeight: "700" },

  miniStatsRow: { flexDirection: "row", gap: SPACING.sm },
  miniStatCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.56)",
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
    alignItems: "center",
  },
  miniStatValue: { fontSize: FONTS.h3, fontWeight: "800", color: COLORS.textPrimary },
  miniStatText: { marginTop: 2, fontSize: FONTS.tiny, color: COLORS.textSecondary, fontWeight: "700" },

  sectionHeadRow: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeadRowNoAction: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: FONTS.h4, fontWeight: "800", color: COLORS.textPrimary },
  sectionAction: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: "700" },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  quickGridWeb: {
    gap: SPACING.md,
  },
  quickCard: {
    width: "31.5%",
    minHeight: 102,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.sm,
    justifyContent: "space-between",
    ...SHADOWS.sm,
  },
  quickCardEmojiWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickCardEmoji: { fontSize: 24 },
  quickCardLabel: { fontSize: FONTS.small, lineHeight: 18, fontWeight: "700" },

  recapText: { fontSize: FONTS.small, lineHeight: 20, marginBottom: SPACING.sm },
  trimesterCard: { marginTop: SPACING.xs },
  trimesterRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  trimesterEmoji: { fontSize: 24, marginRight: SPACING.sm },
  trimesterMeta: { flex: 1 },
  trimesterLabel: { fontSize: FONTS.body, fontWeight: "700", color: COLORS.textPrimary },
  trimesterWeeks: { fontSize: FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  trimesterArrow: { fontSize: FONTS.body, color: COLORS.textLight, fontWeight: "700" },
  timelineBtn: {
    marginTop: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    ...SHADOWS.sm,
  },
  timelineBtnText: { color: COLORS.textWhite, fontSize: FONTS.small, fontWeight: "800" },

  quoteCard: {
    backgroundColor: COLORS.bgWarm,
    borderColor: COLORS.border,
  },
  quoteSymbol: { fontSize: 28, color: COLORS.primary, fontWeight: "800", marginBottom: SPACING.xs },
  quoteText: { fontSize: FONTS.body, lineHeight: 24, color: COLORS.textSecondary },
  quoteAuthor: { marginTop: SPACING.sm, fontSize: FONTS.small, color: COLORS.primaryDark, fontWeight: "700" },
  shlokaDayCard: {
    marginTop: SPACING.sm,
    borderWidth: 1,
  },
  shlokaDayTitle: { fontSize: FONTS.h4, fontWeight: "800", marginBottom: SPACING.xs },
  shlokaDayText: { fontSize: FONTS.body, lineHeight: 24, fontWeight: "700", marginBottom: SPACING.xs },
  shlokaDayMeaning: { fontSize: FONTS.small, lineHeight: 22, marginBottom: 6 },
  shlokaDaySource: { fontSize: FONTS.tiny, fontWeight: "700" },
});
