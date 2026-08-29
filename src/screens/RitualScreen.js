import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { SectionCard, BulletList } from "../components/UIComponents";
import SessionTimer from "../components/SessionTimer";
import PlusGate from "../components/PlusGate";
import { getDailyRitual, getRitualLibrary } from "../constants/dailyRituals";
import { todayIso, isPlusUnlocked } from "../utils/careData";

export default function RitualScreen({ profile, careData, onSaveCareData, onUnlockPlus, colors = COLORS }) {
  const plus = isPlusUnlocked(profile);
  const today = todayIso();
  const daily = useMemo(() => getDailyRitual(), []);
  const [activeId, setActiveId] = useState(daily.id);
  const library = getRitualLibrary();
  const ritual = library.find((item) => item.id === activeId) || daily;
  const doneToday = (careData?.ritualCompletions || []).includes(today);
  const streak = (careData?.ritualCompletions || []).length;

  function markDone() {
    if (doneToday) return;
    onSaveCareData({
      ...careData,
      ritualCompletions: [today, ...(careData.ritualCompletions || [])].slice(0, 90),
    });
    Alert.alert("संस्कार", "आजचा विधी पूर्ण म्हणून जतन झाला.");
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <SectionCard style={{ backgroundColor: colors.bgWarm }}>
        <Text style={[styles.eyebrow, { color: colors.primaryDark }]}>आजचा गर्भसंस्कार पॅक</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{daily.emoji} {daily.title}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{daily.meaning}</Text>
        <Text style={[styles.tiny, { color: colors.textLight }]}>ऑफलाइन मजकूर • ऑडिओ फाइल्स नंतर जोडल्या जातील</Text>
        <Text style={[styles.tiny, { color: colors.accent }]}>स्ट्रीक: {streak} दिवस {doneToday ? "• आज पूर्ण" : ""}</Text>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{ritual.mantra}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>अर्थ: {ritual.meaning}</Text>
        <Text style={[styles.tiny, { color: colors.gold }]}>सुचवलेला राग: {ritual.ragaHint}</Text>
        <BulletList items={ritual.steps} color={colors.primary} />
        <SessionTimer label={`${ritual.minutes} मिनिटांचा विधी`} minutes={ritual.minutes} colors={colors} />
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: doneToday ? colors.accent : colors.primary }]}
          onPress={markDone}
        >
          <Text style={styles.btnText}>{doneToday ? "आज पूर्ण झाले" : "विधी पूर्ण म्हणून नोंदवा"}</Text>
        </TouchableOpacity>
      </SectionCard>

      <PlusGate
        unlocked={plus}
        colors={colors}
        title="पूर्ण संस्कार ग्रंथालय — Plus"
        body="सात विधी, राग सूचना आणि स्ट्रीक. ऑडिओ रेकॉर्डिंग आल्यावर या प्लेयरमध्ये लागतील."
        onUnlock={onUnlockPlus}
      >
        <SectionCard>
          <Text style={[styles.title, { color: colors.textPrimary }]}>ग्रंथालय</Text>
          <View style={styles.grid}>
            {library.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  { borderColor: activeId === item.id ? colors.primary : colors.borderLight, backgroundColor: colors.bgCard },
                ]}
                onPress={() => setActiveId(item.id)}
              >
                <Text style={styles.emoji}>{item.emoji}</Text>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.tiny, { color: colors.textSecondary }]}>{item.minutes} मि</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>
      </PlusGate>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  eyebrow: { fontSize: FONTS.small, fontWeight: "800", marginBottom: 4 },
  title: { fontSize: FONTS.h4, fontWeight: "800", marginBottom: SPACING.xs },
  body: { fontSize: FONTS.body, lineHeight: 22, marginBottom: SPACING.sm },
  tiny: { fontSize: FONTS.small, marginBottom: SPACING.sm },
  btn: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    ...SHADOWS.sm,
  },
  btnText: { color: COLORS.textWhite, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  card: {
    width: "48%",
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
  },
  emoji: { fontSize: 22, marginBottom: 4 },
  cardTitle: { fontSize: FONTS.small, fontWeight: "800" },
});
