import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet,
} from "react-native";
import AppDatePicker from "../components/AppDatePicker";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, TRIMESTER_INFO } from "../constants/theme";
import { SectionCard, InfoRow } from "../components/UIComponents";
import { DIET_OPTIONS, PREGNANCY_TYPES, HEALTH_FLAGS, dietLabel, pregnancyTypeLabel, isPlusUnlocked } from "../utils/careData";

export default function ProfileScreen({ profile, onUpdateProfile, savedNames, colors = COLORS, onSignOut }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const currentWeek = profile?.currentWeek || 1;
  const trimester = currentWeek <= 13 ? 1 : currentWeek <= 27 ? 2 : 3;
  const tri = TRIMESTER_INFO[trimester];

  function calcDueDate(lmp) {
    const due = new Date(lmp);
    due.setDate(due.getDate() + 280);
    return due;
  }

  function handleDateChange(date) {
    setShowDatePicker(false);
    if (date) {
      const diffMs = new Date() - date;
      const newWeek = Math.max(1, Math.min(40, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)) + 1));
      const dueDate = calcDueDate(date);
      onUpdateProfile({
        ...profile,
        lmpDate: date.toISOString(),
        dueDate: dueDate.toISOString(),
        currentWeek: newWeek,
      });
    }
  }

  const daysLeft = profile?.dueDate
    ? Math.max(0, Math.ceil((new Date(profile.dueDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : "—";

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={[styles.profileHeader, { backgroundColor: tri.color }]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>👩‍🍼</Text>
        </View>
        <Text style={styles.profileName}>{profile?.name || "आई"}</Text>
        <Text style={[styles.profileWeek, { color: tri.dark }]}>
          {currentWeek}वा आठवडा • {tri.label}
        </Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: tri.color }]}>
          <Text style={[styles.statNum, { color: tri.dark }]}>{currentWeek}</Text>
          <Text style={[styles.statLabel, { color: tri.dark }]}>आठवडा</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.bgTeal }]}> 
          <Text style={[styles.statNum, { color: colors.accent }]}>{daysLeft}</Text>
          <Text style={[styles.statLabel, { color: colors.accent }]}>दिवस शिल्लक</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.bgWarm }]}> 
          <Text style={[styles.statNum, { color: colors.primary }]}>{savedNames?.length || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.primary }]}>जतन केलेली नावे</Text>
        </View>
      </View>

      {/* Pregnancy Info */}
      <SectionCard style={styles.infoCard}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📋 गर्भावस्था माहिती</Text>
        <InfoRow
          icon="📅"
          label="शेवटच्या पाळीची तारीख (LMP)"
          value={profile?.lmpDate
            ? new Date(profile.lmpDate).toLocaleDateString("mr-IN", { day: "numeric", month: "long", year: "numeric" })
            : "—"}
        />
        <InfoRow
          icon="🎯"
          label="अपेक्षित प्रसूती तारीख"
          value={profile?.dueDate
            ? new Date(profile.dueDate).toLocaleDateString("mr-IN", { day: "numeric", month: "long", year: "numeric" })
            : "—"}
        />
        <InfoRow
          icon="👶"
          label="बाळाचे लिंग"
          value={profile?.babyGender === "boy" ? "मुलगा 👦" : profile?.babyGender === "girl" ? "मुलगी 👧" : "अज्ञात 🤫"}
        />
        <InfoRow icon="🥗" label="आहार" value={dietLabel(profile?.diet)} />
        <InfoRow icon="👶" label="गर्भधारणा" value={pregnancyTypeLabel(profile?.pregnancyType)} />
        <InfoRow icon="📍" label="शहर" value={profile?.city || "—"} />
        <InfoRow
          icon="🚩"
          label="जोखीम नोंद"
          value={(profile?.healthFlags || []).length
            ? HEALTH_FLAGS.filter((item) => (profile.healthFlags || []).includes(item.id)).map((item) => item.label).join(", ")
            : "नाही"}
        />
        <TouchableOpacity
          style={[styles.updateBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.updateBtnText}>📅 तारीख अद्यतनित करा</Text>
        </TouchableOpacity>
      </SectionCard>

      {showDatePicker && (
        <AppDatePicker
          open={showDatePicker}
          date={profile?.lmpDate ? new Date(profile.lmpDate) : new Date()}
          maximumDate={new Date()}
          onConfirm={handleDateChange}
          onCancel={() => setShowDatePicker(false)}
        />
      )}

      <SectionCard style={styles.infoCard}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🥗 आहार आणि जोखीम</Text>
        <Text style={[styles.appInfo, { color: colors.textSecondary }]}>चॅट आणि पोषण या निवडी वापरते. डोस किंवा निदान कधीच बदलत नाही.</Text>
        <View style={styles.chipRow}>
          {DIET_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.miniChip, { backgroundColor: profile?.diet === item.id ? colors.primary : colors.bgWarm }]}
              onPress={() => onUpdateProfile({ ...profile, diet: item.id })}
            >
              <Text style={[styles.miniChipText, { color: profile?.diet === item.id ? colors.textWhite : colors.textSecondary }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.chipRow}>
          {PREGNANCY_TYPES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.miniChip, { backgroundColor: profile?.pregnancyType === item.id ? colors.accent : colors.bgTeal }]}
              onPress={() => onUpdateProfile({ ...profile, pregnancyType: item.id })}
            >
              <Text style={[styles.miniChipText, { color: profile?.pregnancyType === item.id ? colors.textWhite : colors.accent }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.chipRow}>
          {HEALTH_FLAGS.map((item) => {
            const on = (profile?.healthFlags || []).includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.miniChip, { backgroundColor: on ? colors.gold : colors.bgMuted }]}
                onPress={() => {
                  const current = profile?.healthFlags || [];
                  const next = on ? current.filter((id) => id !== item.id) : [...current, item.id];
                  onUpdateProfile({ ...profile, healthFlags: next });
                }}
              >
                <Text style={[styles.miniChipText, { color: on ? colors.textWhite : colors.textSecondary }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard style={styles.infoCard}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>✦ गर्भसंस्कार Plus</Text>
        <Text style={[styles.appInfo, { color: colors.textSecondary }]}>
          {isPlusUnlocked(profile)
            ? "Plus डेमो सुरू आहे: आकडी टाइमर, डॉक्टर अहवाल, संस्कार ग्रंथालय, कुटुंब कोड, अमर्याद चॅट."
            : "फ्री: नोंदवही, ५ चॅट/दिवस, आजचा विधी. Plus मध्ये पूर्ण ग्रंथालय आणि अहवाल."}
        </Text>
        {!isPlusUnlocked(profile) && (
          <TouchableOpacity
            style={[styles.updateBtn, { backgroundColor: colors.primary }]}
            onPress={() => onUpdateProfile({ ...profile, plusUnlocked: true })}
          >
            <Text style={styles.updateBtnText}>Plus डेमो अनलॉक</Text>
          </TouchableOpacity>
        )}
      </SectionCard>

      {/* Trimester Guide */}
      <SectionCard style={styles.infoCard}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📖 तिमाही माहिती</Text>
        {[1, 2, 3].map((t) => {
          const info = TRIMESTER_INFO[t];
          const isActive = trimester === t;
          return (
            <View key={t} style={[styles.trimRow, isActive && { backgroundColor: info.color, borderRadius: RADIUS.md }]}>
              <Text style={styles.trimEmoji}>{info.emoji}</Text>
              <View style={styles.trimInfo}>
                <Text style={[styles.trimName, { color: isActive ? info.dark : colors.textPrimary }]}>
                  {info.label} {isActive ? "(सध्याची)" : ""}
                </Text>
                <Text style={[styles.trimWeeks, { color: isActive ? info.dark : colors.textSecondary }]}>
                  आठवडे {info.weeks}
                </Text>
              </View>
            </View>
          );
        })}
      </SectionCard>

      {/* App Info */}
      <SectionCard style={styles.infoCard}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>ℹ️ अॅपबद्दल</Text>
        <Text style={[styles.appInfo, { color: colors.textSecondary }]}>
          हा अॅप AI तंत्रज्ञानाचा वापर करून तुम्हाला गर्भावस्थेत मराठीतून मार्गदर्शन करतो. 
          सर्व माहिती केवळ मार्गदर्शनासाठी आहे. वैद्यकीय निर्णयांसाठी नेहमी डॉक्टरांचा सल्ला घ्या.
        </Text>
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            ⚕️ वैद्यकीय अस्वीकरण: हा अॅप वैद्यकीय सल्ल्याचा पर्याय नाही.
          </Text>
        </View>

        {!!onSignOut && (
          <TouchableOpacity
            style={[styles.signOutBtn, { borderColor: colors.borderLight, backgroundColor: colors.bgCard }]}
            onPress={onSignOut}
          >
            <Text style={[styles.signOutBtnText, { color: colors.textPrimary }]}>Google मधून Sign Out</Text>
          </TouchableOpacity>
        )}
      </SectionCard>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  profileHeader: {
    alignItems: "center",
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    marginBottom: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    ...SHADOWS.md,
  },
  avatarCircle: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center", justifyContent: "center",
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  avatarEmoji: { fontSize: 48 },
  profileName: { fontSize: FONTS.h2, fontWeight: "800", color: COLORS.textPrimary, marginBottom: SPACING.xs },
  profileWeek: { fontSize: FONTS.body, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statBox: {
    flex: 1, alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    ...SHADOWS.sm,
  },
  statNum: { fontSize: FONTS.h2, fontWeight: "800" },
  statLabel: { fontSize: FONTS.tiny, marginTop: 4, textAlign: "center", fontWeight: "700" },
  infoCard: { marginHorizontal: SPACING.md, marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.h4, fontWeight: "800", color: COLORS.textPrimary, marginBottom: SPACING.md },
  updateBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.md, borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  updateBtnText: { color: COLORS.textWhite, fontWeight: "800", fontSize: FONTS.body },
  trimRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  trimEmoji: { fontSize: 28, marginRight: SPACING.md },
  trimInfo: { flex: 1 },
  trimName: { fontSize: FONTS.body, fontWeight: "700" },
  trimWeeks: { fontSize: FONTS.small },
  appInfo: { fontSize: FONTS.body, color: COLORS.textSecondary, lineHeight: 24, marginBottom: SPACING.md },
  disclaimerBox: {
    backgroundColor: "#FFF3E0",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(230, 81, 0, 0.2)",
  },
  disclaimerText: { fontSize: FONTS.small, color: "#E65100", lineHeight: 21, fontWeight: "600" },
  signOutBtn: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    alignItems: "center",
  },
  signOutBtnText: {
    fontSize: FONTS.small,
    fontWeight: "800",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  miniChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  miniChipText: { fontSize: FONTS.small, fontWeight: "700" },
});
