import React, { useMemo, useState } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Share, Platform,
} from "react-native";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { SectionCard, PillBadge } from "../components/UIComponents";
import PlusGate from "../components/PlusGate";
import {
  todayIso, buildObExport, buildWeeklyRecap, isPlusUnlocked,
} from "../utils/careData";

function numberOrEmpty(value) {
  if (value === "" || value == null) return "";
  return String(value);
}

export default function HealthLogScreen({ profile, careData, onSaveCareData, onUnlockPlus, colors = COLORS }) {
  const plus = isPlusUnlocked(profile);
  const today = todayIso();

  const [kickCount, setKickCount] = useState(0);
  const [kickRunning, setKickRunning] = useState(false);
  const [weight, setWeight] = useState("");
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [sugar, setSugar] = useState("");
  const [sugarWhen, setSugarWhen] = useState("उपवास");
  const [apptTitle, setApptTitle] = useState("");
  const [apptDate, setApptDate] = useState(today);
  const [contractionStart, setContractionStart] = useState(null);
  const [, setTick] = useState(0);

  const recap = useMemo(() => buildWeeklyRecap(profile, careData), [profile, careData]);
  const waterToday = (careData?.waterLogs || []).find((item) => item.date === today)?.glasses || 0;
  const kicksToday = (careData?.kicks || []).filter((item) => item.date === today);
  const kickTotal = kicksToday.reduce((sum, item) => sum + Number(item.count || 0), 0);

  React.useEffect(() => {
    if (!contractionStart) return undefined;
    const id = setInterval(() => setTick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [contractionStart]);

  function persist(patch) {
    onSaveCareData({ ...careData, ...patch });
  }

  function saveKickSession() {
    if (kickCount <= 0) {
      Alert.alert("किक", "आधी मोजणी सुरू करा.");
      return;
    }
    persist({
      kicks: [{ id: `${Date.now()}`, date: today, count: kickCount, at: new Date().toISOString() }, ...(careData.kicks || [])].slice(0, 60),
    });
    setKickCount(0);
    setKickRunning(false);
  }

  function saveWeight() {
    const kg = Number(weight);
    if (!kg) {
      Alert.alert("वजन", "किग्रॅ मध्ये संख्या लिहा.");
      return;
    }
    persist({
      weights: [{ date: today, kg }, ...(careData.weights || []).filter((item) => item.date !== today)].slice(0, 40),
    });
    setWeight("");
  }

  function saveBp() {
    const systolic = Number(sys);
    const diastolic = Number(dia);
    if (!systolic || !diastolic) {
      Alert.alert("रक्तदाब", "दोन्ही संख्या लिहा.");
      return;
    }
    persist({
      bpLogs: [{ date: today, systolic, diastolic }, ...(careData.bpLogs || [])].slice(0, 40),
    });
    setSys("");
    setDia("");
  }

  function saveSugar() {
    const value = Number(sugar);
    if (!value) {
      Alert.alert("साखर", "संख्या लिहा.");
      return;
    }
    persist({
      sugarLogs: [{ date: today, value, when: sugarWhen }, ...(careData.sugarLogs || [])].slice(0, 40),
    });
    setSugar("");
  }

  function setWater(glasses) {
    const next = Math.max(0, glasses);
    const others = (careData.waterLogs || []).filter((item) => item.date !== today);
    persist({ waterLogs: [{ date: today, glasses: next }, ...others].slice(0, 40) });
  }

  function addAppointment() {
    if (!apptTitle.trim()) {
      Alert.alert("भेट", "भेटीचे नाव लिहा.");
      return;
    }
    persist({
      appointments: [
        { id: `${Date.now()}`, title: apptTitle.trim(), date: apptDate },
        ...(careData.appointments || []),
      ].slice(0, 30),
    });
    setApptTitle("");
  }

  function stopContraction() {
    if (!contractionStart) return;
    const endedAt = Date.now();
    const durationSec = Math.max(1, Math.round((endedAt - contractionStart) / 1000));
    const last = (careData.contractions || [])[0];
    const intervalSec = last?.endedAt ? Math.round((endedAt - new Date(last.endedAt).getTime()) / 1000) : null;
    persist({
      contractions: [
        {
          id: `${endedAt}`,
          date: today,
          durationSec,
          intervalSec,
          startedAt: new Date(contractionStart).toISOString(),
          endedAt: new Date(endedAt).toISOString(),
        },
        ...(careData.contractions || []),
      ].slice(0, 80),
    });
    setContractionStart(null);
  }

  async function exportReport() {
    const text = buildObExport(profile, careData);
    try {
      if (Platform.OS === "web" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        Alert.alert("अहवाल", "डॉक्टर अहवाल कॉपी झाला.");
        return;
      }
      await Share.share({ message: text, title: "गर्भसंस्कार डॉक्टर अहवाल" });
    } catch {
      Alert.alert("अहवाल", text.slice(0, 400));
    }
  }

  const liveSeconds = contractionStart ? Math.max(0, Math.floor((Date.now() - contractionStart) / 1000)) : 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>📒 आरोग्य नोंदवही</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          किक, वजन, पाणी, भेटी — डॉक्टर भेटीसाठी मराठी+इंग्रजी सारांश.
        </Text>
        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: colors.bgWarm }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{kickTotal}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>आजचे किक</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.bgTeal }]}>
            <Text style={[styles.statNum, { color: colors.accent }]}>{waterToday}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ग्लास पाणी</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.bgMuted }]}>
            <Text style={[styles.statNum, { color: colors.textPrimary }]}>{recap.latestWeight === "—" ? "—" : recap.latestWeight.split(" ")[0]}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>वजन</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>🌸 आठवड्याचा आढावा</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{recap.moodSummary}</Text>
        {!!recap.topSymptoms.length && (
          <Text style={[styles.body, { color: colors.textSecondary }]}>लक्षणे: {recap.topSymptoms.join(" • ")}</Text>
        )}
        <Text style={[styles.body, { color: recap.restFlag ? colors.error : colors.textSecondary }]}>{recap.advice}</Text>
        <Text style={[styles.tiny, { color: colors.textLight }]}>पुढील भेट: {recap.nextAppointment}</Text>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>👣 किक काउंटर</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>एका तासात बाळाच्या हालचाली मोजा. कमी वाटल्यास डॉक्टर.</Text>
        <Text style={[styles.big, { color: colors.primary }]}>{kickRunning || kickCount ? kickCount : 0}</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => {
              setKickRunning(true);
              setKickCount((n) => n + 1);
            }}
          >
            <Text style={styles.btnText}>किक +१</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={saveKickSession}>
            <Text style={styles.btnText}>सत्र जतन</Text>
          </TouchableOpacity>
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>💧 आजचे पाणी</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.bgTeal }]} onPress={() => setWater(waterToday - 1)}>
            <Text style={[styles.darkBtn, { color: colors.accent }]}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.big, { color: colors.textPrimary }]}>{waterToday}</Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={() => setWater(waterToday + 1)}>
            <Text style={styles.btnText}>+ ग्लास</Text>
          </TouchableOpacity>
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>⚖️ वजन</Text>
        <TextInput
          value={numberOrEmpty(weight)}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="किग्रॅ"
          placeholderTextColor={colors.textLight}
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.bg }]}
        />
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={saveWeight}>
          <Text style={styles.btnText}>वजन जतन करा</Text>
        </TouchableOpacity>
        {(careData.weights || []).slice(0, 5).map((item) => (
          <Text key={item.date} style={[styles.tiny, { color: colors.textSecondary }]}>{item.date}: {item.kg} किग्रॅ</Text>
        ))}
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>🩺 रक्तदाब / साखर</Text>
        <View style={styles.row}>
          <TextInput
            value={sys}
            onChangeText={setSys}
            keyboardType="number-pad"
            placeholder="SYS"
            placeholderTextColor={colors.textLight}
            style={[styles.input, styles.flex, { color: colors.textPrimary, borderColor: colors.borderLight }]}
          />
          <TextInput
            value={dia}
            onChangeText={setDia}
            keyboardType="number-pad"
            placeholder="DIA"
            placeholderTextColor={colors.textLight}
            style={[styles.input, styles.flex, { color: colors.textPrimary, borderColor: colors.borderLight }]}
          />
        </View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={saveBp}>
          <Text style={styles.btnText}>BP जतन</Text>
        </TouchableOpacity>
        <TextInput
          value={sugar}
          onChangeText={setSugar}
          keyboardType="decimal-pad"
          placeholder="रक्त साखर"
          placeholderTextColor={colors.textLight}
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight }]}
        />
        <View style={styles.chipRow}>
          {["उपवास", "जेवणानंतर", "यादृच्छिक"].map((when) => (
            <TouchableOpacity key={when} onPress={() => setSugarWhen(when)}>
              <PillBadge label={when} color={sugarWhen === when ? colors.primary : colors.bgWarm} textColor={sugarWhen === when ? colors.textWhite : colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={saveSugar}>
          <Text style={styles.btnText}>साखर जतन</Text>
        </TouchableOpacity>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>📅 डॉक्टर भेटी</Text>
        <TextInput
          value={apptTitle}
          onChangeText={setApptTitle}
          placeholder="उदा. аномаली स्कॅन"
          placeholderTextColor={colors.textLight}
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight }]}
        />
        <TextInput
          value={apptDate}
          onChangeText={setApptDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textLight}
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight }]}
        />
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={addAppointment}>
          <Text style={styles.btnText}>भेट जोडा</Text>
        </TouchableOpacity>
        {(careData.appointments || []).slice(0, 6).map((item) => (
          <View key={item.id} style={[styles.listRow, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.body, { color: colors.textPrimary }]}>{item.title}</Text>
            <Text style={[styles.tiny, { color: colors.textSecondary }]}>{item.date}</Text>
          </View>
        ))}
      </SectionCard>

      <PlusGate
        unlocked={plus}
        colors={colors}
        title="आकडी टाइमर आणि डॉक्टर अहवाल — Plus"
        body="तिसरी तिमाहीसाठी आकडी मोजणी आणि मराठी+इंग्रजी PDF-स्टाइल सारांश Plus मध्ये."
        onUnlock={onUnlockPlus}
      >
        <SectionCard>
          <Text style={[styles.title, { color: colors.textPrimary }]}>⏱️ आकडी टाइमर</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>सुरू/थांबा दाबा. कालावधी आणि अंतर जतन होते.</Text>
          <Text style={[styles.big, { color: colors.primary }]}>
            {contractionStart ? `${Math.floor(liveSeconds / 60)}:${String(liveSeconds % 60).padStart(2, "0")}` : "०:००"}
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: contractionStart ? colors.error : colors.primary }]}
            onPress={() => (contractionStart ? stopContraction() : setContractionStart(Date.now()))}
          >
            <Text style={styles.btnText}>{contractionStart ? "आकडी संपली" : "आकडी सुरू"}</Text>
          </TouchableOpacity>
          {(careData.contractions || []).slice(0, 5).map((item) => (
            <Text key={item.id} style={[styles.tiny, { color: colors.textSecondary }]}>
              {item.durationSec} सेकंद
              {item.intervalSec != null ? ` • अंतर ${item.intervalSec} से` : ""}
            </Text>
          ))}
        </SectionCard>

        <SectionCard>
          <Text style={[styles.title, { color: colors.textPrimary }]}>📄 डॉक्टर अहवाल</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>नोंदी कॉपी/शेअर करा. हे वैद्यकीय प्रमाणपत्र नाही.</Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primaryDark }]} onPress={exportReport}>
            <Text style={styles.btnText}>मराठी + English कॉपी/शेअर</Text>
          </TouchableOpacity>
        </SectionCard>
      </PlusGate>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  title: { fontSize: FONTS.h4, fontWeight: "800", marginBottom: 4 },
  sub: { fontSize: FONTS.small, lineHeight: 20, marginBottom: SPACING.sm },
  body: { fontSize: FONTS.body, lineHeight: 22, marginBottom: 6 },
  tiny: { fontSize: FONTS.small, marginTop: 4 },
  big: { fontSize: 36, fontWeight: "800", textAlign: "center", marginVertical: SPACING.sm },
  stats: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.sm },
  stat: { flex: 1, borderRadius: RADIUS.lg, padding: SPACING.sm, alignItems: "center" },
  statNum: { fontSize: FONTS.h3, fontWeight: "800" },
  statLabel: { fontSize: FONTS.tiny, fontWeight: "700", marginTop: 2 },
  row: { flexDirection: "row", gap: SPACING.sm, alignItems: "center", justifyContent: "center" },
  btn: {
    flex: 1,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    marginTop: SPACING.xs,
    ...SHADOWS.sm,
  },
  btnText: { color: COLORS.textWhite, fontWeight: "800", fontSize: FONTS.small },
  darkBtn: { fontWeight: "800", fontSize: FONTS.h3 },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    fontSize: FONTS.body,
  },
  flex: { flex: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs, marginBottom: SPACING.sm },
  listRow: { paddingVertical: SPACING.sm, borderBottomWidth: 1 },
});
