import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { SectionCard, BulletList } from "../components/UIComponents";
import { getPostpartumWeekPlan, weeksSinceDelivery } from "../constants/postpartumTrack";
import { todayIso } from "../utils/careData";

const HEALING_KEYS = ["जखम स्वच्छ", "पाणी ८ ग्लास", "२० मि विश्रांती", "मदत मागितली"];

export default function PostpartumTrackScreen({ profile, careData, onSaveCareData, onUpdateProfile, colors = COLORS }) {
  const deliveryDate = profile?.deliveryDate || null;
  const week = weeksSinceDelivery(deliveryDate);
  const plan = useMemo(() => getPostpartumWeekPlan(week), [week]);
  const today = todayIso();
  const [feedNote, setFeedNote] = useState("");
  const healing = careData?.healingChecks || {};

  function setDeliveryToday() {
    onUpdateProfile({
      ...profile,
      postpartumMode: true,
      deliveryDate: new Date().toISOString(),
    });
  }

  function addFeed() {
    const note = feedNote.trim() || "फीड";
    onSaveCareData({
      ...careData,
      feedingLogs: [
        { id: `${Date.now()}`, date: today, time: new Date().toLocaleTimeString("mr-IN", { hour: "2-digit", minute: "2-digit" }), note },
        ...(careData.feedingLogs || []),
      ].slice(0, 80),
    });
    setFeedNote("");
  }

  function toggleHeal(key) {
    const dayKey = `${today}:${key}`;
    onSaveCareData({
      ...careData,
      healingChecks: { ...healing, [dayKey]: !healing[dayKey] },
    });
  }

  const feedsToday = (careData?.feedingLogs || []).filter((item) => item.date === today);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>👩‍🍼 प्रसूतीनंतर ०–१२ आठवडे</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {deliveryDate
            ? `प्रसूती: ${new Date(deliveryDate).toLocaleDateString("mr-IN")} • आठवडा ${week}`
            : "प्रसूती तारीख सेट करा. हा ट्रॅक गर्भावस्था टॅबची जागा घेत नाही."}
        </Text>
        {!deliveryDate && (
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={setDeliveryToday}>
            <Text style={styles.btnText}>प्रसूती आज म्हणून सुरू करा</Text>
          </TouchableOpacity>
        )}
      </SectionCard>

      <SectionCard style={{ backgroundColor: colors.bgWarm }}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{plan.title}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>फोकस: {plan.focus}</Text>
        <Text style={[styles.label, { color: colors.primaryDark }]}>आई</Text>
        <BulletList items={plan.mother} color={colors.primary} />
        <Text style={[styles.label, { color: colors.primaryDark }]}>जखम / शरीर</Text>
        <BulletList items={plan.healing} color={colors.accent} />
        <Text style={[styles.label, { color: colors.primaryDark }]}>फीडिंग</Text>
        <BulletList items={plan.feeding} color={colors.gold} />
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>🍼 आजचे फीड</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>आज: {feedsToday.length} नोंदी</Text>
        <TextInput
          value={feedNote}
          onChangeText={setFeedNote}
          placeholder="डावी / उजवी / फॉर्म्युला / टिप"
          placeholderTextColor={colors.textLight}
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight }]}
        />
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={addFeed}>
          <Text style={styles.btnText}>फीड नोंदवा</Text>
        </TouchableOpacity>
        {feedsToday.slice(0, 8).map((item) => (
          <Text key={item.id} style={[styles.tiny, { color: colors.textSecondary }]}>{item.time} • {item.note}</Text>
        ))}
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>✅ आजची आई चेकलिस्ट</Text>
        {HEALING_KEYS.map((key) => {
          const checked = !!healing[`${today}:${key}`];
          return (
            <TouchableOpacity
              key={key}
              style={[styles.row, { borderBottomColor: colors.borderLight }]}
              onPress={() => toggleHeal(key)}
            >
              <Text style={[styles.body, { color: colors.textPrimary, flex: 1 }]}>{key}</Text>
              <Text style={{ color: checked ? colors.success : colors.textLight, fontWeight: "800" }}>{checked ? "पूर्ण" : "बाकी"}</Text>
            </TouchableOpacity>
          );
        })}
      </SectionCard>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  title: { fontSize: FONTS.h4, fontWeight: "800", marginBottom: SPACING.xs },
  body: { fontSize: FONTS.body, lineHeight: 22, marginBottom: SPACING.sm },
  label: { fontSize: FONTS.small, fontWeight: "800", marginTop: SPACING.sm, marginBottom: 4 },
  tiny: { fontSize: FONTS.small, marginTop: 4 },
  btn: {
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    marginTop: SPACING.xs,
    ...SHADOWS.sm,
  },
  btnText: { color: COLORS.textWhite, fontWeight: "800" },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
});
