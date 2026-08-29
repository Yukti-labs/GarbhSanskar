import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share, Platform, Alert } from "react-native";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { SectionCard, BulletList } from "../components/UIComponents";
import PlusGate from "../components/PlusGate";
import { isPlusUnlocked } from "../utils/careData";

function साथीदार_सूचना(week, postpartumMode) {
  if (postpartumMode) {
    return [
      "आईला सलग 30 मिनिटे विश्रांतीची संधी द्या",
      "फीडिंगनंतर ढेकर काढण्यास मदत करा",
      "डॉक्टर भेटीची नोंद व्यवस्थित ठेवा",
    ];
  }
  if (week <= 13) {
    return [
      "उलटी/मळमळ वाढल्यास हलका आहार तयार करा",
      "औषधांची वेळ सांभाळून आठवण करून द्या",
      "भावनिक आधार द्या आणि तणाव कमी करा",
    ];
  }
  if (week <= 27) {
    return [
      "दररोज 15 मिनिटे चालण्यास सोबत करा",
      "पाणी पिण्याची आठवण द्या",
      "डॉक्टर भेटीसाठी प्रश्न लिहून ठेवा",
    ];
  }
  return [
    "हॉस्पिटल बॅग तपासून तयार ठेवा",
    "आपत्कालीन संपर्क यादी शेअर करा",
    "प्रसूतीपूर्व श्वसन सरावात सोबत करा",
  ];
}

export default function FamilyCareScreen({
  profile,
  careData,
  onSaveCareData,
  onUpdateProfile,
  onUnlockPlus,
  colors = COLORS,
}) {
  const plus = isPlusUnlocked(profile);
  const week = profile?.currentWeek || 1;
  const isPartner = profile?.viewerRole === "partner";
  const tips = useMemo(() => साथीदार_सूचना(week, !!profile?.postpartumMode), [week, profile?.postpartumMode]);
  const bag = careData?.hospitalBag || {};
  const bagLeft = Object.keys(bag).filter((key) => !bag[key]);
  const code = (profile?.familyCode || "GS-FAMILY").toUpperCase();

  function toggleRole() {
    onUpdateProfile({
      ...profile,
      viewerRole: isPartner ? "mother" : "partner",
    });
  }

  function toggleTask(task) {
    const next = { ...(careData.partnerTasksDone || {}) };
    next[task] = !next[task];
    onSaveCareData({ ...careData, partnerTasksDone: next });
  }

  async function shareCard() {
    const text = `गर्भसंस्कार — साथीदाराचे आजचे काम (आठवडा ${week})\n${tips.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nबॅग बाकी: ${bagLeft.join(", ") || "पूर्ण"}\nकुटुंब कोड: ${code}`;
    try {
      if (Platform.OS === "web" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        Alert.alert("शेअर", "WhatsApp साठी मजकूर कॉपी झाला.");
        return;
      }
      await Share.share({ message: text });
    } catch {
      Alert.alert("शेअर", text);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <SectionCard style={{ backgroundColor: isPartner ? colors.bgTeal : colors.bgWarm }}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {isPartner ? "🤝 साथीदार दृश्य" : "👩 आई दृश्य"}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          एकाच खात्यावर भूमिका बदला. वेगळे लॉगिन नंतर कुटुंब कोडने जोडता येईल.
        </Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={toggleRole}>
          <Text style={styles.btnText}>{isPartner ? "आई दृश्यावर या" : "साथीदार म्हणून पहा"}</Text>
        </TouchableOpacity>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>आजची एक जबाबदारी</Text>
        <BulletList items={tips} color={colors.primaryDark} />
        {tips.map((task) => (
          <TouchableOpacity
            key={task}
            style={[styles.row, { borderBottomColor: colors.borderLight }]}
            onPress={() => toggleTask(task)}
          >
            <Text style={[styles.body, { color: colors.textPrimary, flex: 1 }]}>{task}</Text>
            <Text style={{ color: careData?.partnerTasksDone?.[task] ? colors.success : colors.textLight, fontWeight: "800" }}>
              {careData?.partnerTasksDone?.[task] ? "पूर्ण" : "बाकी"}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={shareCard}>
          <Text style={styles.btnText}>WhatsApp कार्ड कॉपी/शेअर</Text>
        </TouchableOpacity>
      </SectionCard>

      <PlusGate
        unlocked={plus}
        colors={colors}
        title="कुटुंब कोड आणि शेअर केलेली बॅग — Plus"
        body="कोड शेअर करा. दुसरे खाते जोडणे Firestore नियम तयार झाल्यावर येईल; आत्ता कोड आणि बॅग स्थिती दिसते."
        onUnlock={onUnlockPlus}
      >
        <SectionCard>
          <Text style={[styles.title, { color: colors.textPrimary }]}>कुटुंब कोड</Text>
          <Text style={[styles.code, { color: colors.primary }]}>{code}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>हॉस्पिटल बॅग बाकी: {bagLeft.join(" • ") || "सर्व पूर्ण"}</Text>
        </SectionCard>
      </PlusGate>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  title: { fontSize: FONTS.h4, fontWeight: "800", marginBottom: SPACING.xs },
  body: { fontSize: FONTS.body, lineHeight: 22, marginBottom: SPACING.sm },
  code: { fontSize: 28, fontWeight: "800", letterSpacing: 1, marginBottom: SPACING.sm },
  btn: {
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    marginTop: SPACING.xs,
    ...SHADOWS.sm,
  },
  btnText: { color: COLORS.textWhite, fontWeight: "800" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
});
