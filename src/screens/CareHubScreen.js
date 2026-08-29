import React, { useMemo, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from "react-native";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { SectionCard, BulletList, PillBadge } from "../components/UIComponents";
import {
  scheduleReminderNotification,
  cancelReminderNotification,
} from "../services/notifications";

const भावना_पर्याय = ["आनंदी", "शांत", "थकलेली", "चिंताग्रस्त", "उत्साही"];
const लक्षण_पर्याय = ["उलटी/मळमळ", "पाठदुखी", "पाय सूज", "डोकेदुखी", "झोप कमी", "भूक कमी"];

const समज_गैरसमज = [
  { मिथक: "गर्भावस्थेत दोन जणांसाठी खायलाच हवे", सत्य: "गुणवत्तापूर्ण संतुलित आहार महत्त्वाचा; प्रमाण डॉक्टरांच्या सल्ल्याने ठरवा." },
  { मिथक: "हलका व्यायाम टाळावा", सत्य: "डॉक्टरांच्या सल्ल्याने हलका योग/चालणे बहुतेकांना सुरक्षित असते." },
  { मिथक: "फळे थंड असतात म्हणून टाळावीत", सत्य: "बहुतेक फळे पोषणदायक असतात; स्वच्छ धुऊन योग्य प्रमाणात घ्या." },
  { मिथक: "मनःस्थितीचा बाळावर परिणाम होत नाही", सत्य: "आईचे मानसिक स्वास्थ्य महत्त्वाचे आहे; विश्रांती आणि आधार आवश्यक." },
];

const आपत्कालीन_सूची = [
  "तीव्र पोटदुखी किंवा सतत आकडी",
  "जास्त रक्तस्राव",
  "बाळाची हालचाल अचानक कमी होणे",
  "उच्च ताप, जोराची डोकेदुखी, धूसर दिसणे",
  "पाय/चेहरा अचानक खूप सूजणे",
  "श्वास घेण्यास त्रास",
];

function आजचा_दिवस() {
  return new Date().toISOString().slice(0, 10);
}

function आठवडा_टप्पा(week) {
  if (week <= 13) return "पहिली तिमाही";
  if (week <= 27) return "दुसरी तिमाही";
  return "तिसरी तिमाही";
}

function दैनिक_योजना(week, postpartumMode) {
  if (postpartumMode) {
    return [
      "कोमट पाणी + हलका पौष्टिक नाश्ता घ्या",
      "आईसाठी 20 मिनिटे विश्रांती/झोप",
      "बाळाचे फीडिंग वेळा नोंदवा",
      "साथीदाराकडून घरकामात मदत घ्या",
      "आजच्या भावना 2 ओळीत लिहा",
    ];
  }

  const trimester = आठवडा_टप्पा(week);
  const base = [
    `आठवडा ${week}: 10-15 मिनिटे हलके चालणे`,
    "किमान 8-10 ग्लास पाणी प्या",
    "फॉलिक/आयरन/कॅल्शियम डॉक्टरांनी सांगितल्याप्रमाणे घ्या",
    "बाळाशी 5 मिनिटे प्रेमाने बोला",
    "रात्री 7-8 तास झोपेची काळजी घ्या",
  ];

  if (trimester === "पहिली तिमाही") {
    base[0] = `आठवडा ${week}: थकवा असल्यास लहान-लहान विश्रांती घ्या`;
  }
  if (trimester === "दुसरी तिमाही") {
    base[3] = "बाळाच्या हालचालींवर 2 मिनिटे लक्ष द्या";
  }
  if (trimester === "तिसरी तिमाही") {
    base[4] = "प्रसूतीसाठी श्वसन सराव 5 मिनिटे करा";
  }

  return base;
}

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

export default function CareHubScreen({ profile, careData, onSaveCareData, onUpdateProfile, onNavigate, colors = COLORS }) {
  const [selectedMood, setSelectedMood] = useState(भावना_पर्याय[0]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);

  const currentWeek = profile?.currentWeek || 1;
  const postpartumMode = !!profile?.postpartumMode;
  const योजना = useMemo(() => दैनिक_योजना(currentWeek, postpartumMode), [currentWeek, postpartumMode]);
  const partnerTips = useMemo(() => साथीदार_सूचना(currentWeek, postpartumMode), [currentWeek, postpartumMode]);

  const reminders = Array.isArray(careData?.reminders) ? careData.reminders : [];
  const moodLogs = Array.isArray(careData?.moodLogs) ? careData.moodLogs : [];
  const hospitalBag = careData?.hospitalBag || {};
  const notificationMap = careData?.notificationMap || {};

  const आजची_नोंद = moodLogs.find((entry) => entry.date === आजचा_दिवस());

  async function toggleReminder(id) {
    const target = reminders.find((item) => item.id === id);
    if (!target) return;

    const willEnable = !target.enabled;
    const nextReminders = reminders.map((item) => (item.id === id ? { ...item, enabled: willEnable } : item));
    const nextNotificationMap = { ...notificationMap };

    try {
      if (willEnable) {
        const notificationId = await scheduleReminderNotification({ ...target, enabled: true });
        if (notificationId) {
          nextNotificationMap[id] = notificationId;
        }
      } else if (nextNotificationMap[id]) {
        await cancelReminderNotification(nextNotificationMap[id]);
        delete nextNotificationMap[id];
      }

      onSaveCareData({
        ...careData,
        reminders: nextReminders,
        notificationMap: nextNotificationMap,
      });
    } catch (error) {
      Alert.alert("स्मरणपत्र", error?.message || "स्मरणपत्र सुरू करता आले नाही.");
    }
  }

  async function quickAddReminder(title, time) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const reminder = { id, title, time, enabled: true };
    const nextReminders = [...reminders, reminder];
    const nextNotificationMap = { ...notificationMap };

    try {
      const notificationId = await scheduleReminderNotification(reminder);
      if (notificationId) {
        nextNotificationMap[id] = notificationId;
      }

      onSaveCareData({
        ...careData,
        reminders: nextReminders,
        notificationMap: nextNotificationMap,
      });
    } catch (error) {
      Alert.alert("स्मरणपत्र", error?.message || "नवीन स्मरणपत्र जोडता आले नाही.");
      onSaveCareData({
        ...careData,
        reminders: nextReminders,
      });
    }
  }

  function toggleSymptom(symptom) {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms((prev) => prev.filter((item) => item !== symptom));
    } else {
      setSelectedSymptoms((prev) => [...prev, symptom]);
    }
  }

  function saveMoodLog() {
    const entry = {
      date: आजचा_दिवस(),
      mood: selectedMood,
      symptoms: selectedSymptoms,
    };

    const filtered = moodLogs.filter((item) => item.date !== entry.date);
    const nextLogs = [entry, ...filtered].slice(0, 21);
    onSaveCareData({ ...careData, moodLogs: nextLogs });
  }

  function toggleBagItem(key) {
    const nextBag = { ...hospitalBag, [key]: !hospitalBag[key] };
    onSaveCareData({ ...careData, hospitalBag: nextBag });
  }

  function togglePostpartumMode() {
    onUpdateProfile({
      ...profile,
      postpartumMode: !postpartumMode,
    });
  }

  const recentSymptoms = moodLogs.slice(0, 7).flatMap((item) => item.symptoms || []);
  const symptomCount = recentSymptoms.reduce((acc, symptom) => {
    acc[symptom] = (acc[symptom] || 0) + 1;
    return acc;
  }, {});

  const topSymptoms = Object.entries(symptomCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const doctorQuestions = [
    "या आठवड्यात माझ्या बाळाच्या वाढीबद्दल कोणते मुख्य संकेत पाहावेत?",
    "माझ्या आहारात कोणता बदल आवश्यक आहे?",
    "सध्याच्या लक्षणांसाठी कोणती काळजी घ्यावी?",
    "पुढील तपासणी/स्कॅनची योग्य वेळ कोणती?",
    ...(topSymptoms.length ? [`मला वारंवार ${topSymptoms.join(" / ")} होत आहे — यासाठी काय करावे?`] : []),
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>⭐ प्रीमियम सहाय्य</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.bgWarm }]} onPress={() => onNavigate?.("healthLog")}>
            <Text style={[styles.actionText, { color: colors.primaryDark }]}>📒 नोंदवही</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.bgTeal }]} onPress={() => onNavigate?.("ritual")}>
            <Text style={[styles.actionText, { color: colors.accent }]}>🕉️ विधी</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#EEE8FF" }]} onPress={() => onNavigate?.("family")}>
            <Text style={[styles.actionText, { color: colors.primary }]}>🤝 कुटुंब</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.bgWarm }]} onPress={() => onNavigate?.("postpartum")}>
            <Text style={[styles.actionText, { color: colors.primaryDark }]}>👩‍🍼 ०-१२ आठवडे</Text>
          </TouchableOpacity>
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>🧭 आजची वैयक्तिक योजना</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>आठवडा {currentWeek} • {postpartumMode ? "प्रसूतीनंतर मोड" : आठवडा_टप्पा(currentWeek)}</Text>
        <BulletList items={योजना} color={colors.primary} />
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>⏰ स्मार्ट स्मरणपत्रे</Text>
        {reminders.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.row, { borderBottomColor: colors.borderLight }]} onPress={() => toggleReminder(item.id)}>
            <View>
              <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{item.time}</Text>
            </View>
            <PillBadge label={item.enabled ? "सुरू" : "बंद"} color={item.enabled ? colors.bgTeal : colors.bgWarm} textColor={item.enabled ? colors.accent : colors.textSecondary} />
          </TouchableOpacity>
        ))}

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.bgWarm }]} onPress={() => quickAddReminder("औषध वेळ", "सकाळी ९:००")}>
            <Text style={[styles.actionText, { color: colors.primaryDark }]}>+ औषध</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.bgTeal }]} onPress={() => quickAddReminder("पाणी प्या", "दर 2 तासांनी")}>
            <Text style={[styles.actionText, { color: colors.accent }]}>+ पाणी</Text>
          </TouchableOpacity>
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>🩺 डॉक्टर भेट किट</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>पुढील भेटीत विचारण्यासाठी तयार प्रश्न</Text>
        <BulletList items={doctorQuestions} color={colors.accent} />
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>💗 मनःस्थिती आणि लक्षण नोंद</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>आजची भावना निवडा</Text>
        <View style={styles.chipsWrap}>
          {भावना_पर्याय.map((mood) => (
            <TouchableOpacity key={mood} style={[styles.chip, { backgroundColor: selectedMood === mood ? colors.primary : colors.bgWarm }]} onPress={() => setSelectedMood(mood)}>
              <Text style={[styles.chipText, { color: selectedMood === mood ? colors.textWhite : colors.textSecondary }]}>{mood}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>आजची लक्षणे</Text>
        <View style={styles.chipsWrap}>
          {लक्षण_पर्याय.map((symptom) => (
            <TouchableOpacity key={symptom} style={[styles.chip, { backgroundColor: selectedSymptoms.includes(symptom) ? colors.accent : colors.bgTeal }]} onPress={() => toggleSymptom(symptom)}>
              <Text style={[styles.chipText, { color: selectedSymptoms.includes(symptom) ? colors.textWhite : colors.accent }]}>{symptom}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={saveMoodLog}>
          <Text style={styles.primaryBtnText}>आजची नोंद जतन करा</Text>
        </TouchableOpacity>

        {!!आजची_नोंद && (
          <Text style={[styles.note, { color: colors.textSecondary }]}>आजची नोंद: {आजची_नोंद.mood} • {(आजची_नोंद.symptoms || []).join(", ") || "लक्षण नाही"}</Text>
        )}
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>🤝 साथीदार मोड</Text>
        <BulletList items={partnerTips} color={colors.primaryDark} />
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>🚨 आपत्कालीन लाल-ध्वज</Text>
        <BulletList items={आपत्कालीन_सूची} color={colors.error} />
        <Text style={[styles.note, { color: colors.textSecondary }]}>वरीलपैकी कोणतेही लक्षण तीव्र असल्यास त्वरित डॉक्टरांशी संपर्क करा.</Text>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>🧳 हॉस्पिटल बॅग चेकलिस्ट</Text>
        {Object.keys(hospitalBag).map((item) => (
          <TouchableOpacity key={item} style={[styles.row, { borderBottomColor: colors.borderLight }]} onPress={() => toggleBagItem(item)}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{item}</Text>
            <Text style={[styles.rowSub, { color: hospitalBag[item] ? colors.success : colors.textLight }]}>{hospitalBag[item] ? "पूर्ण" : "बाकी"}</Text>
          </TouchableOpacity>
        ))}
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>🧠 समज विरुद्ध गैरसमज</Text>
        {समज_गैरसमज.map((entry) => (
          <View key={entry.मिथक} style={[styles.mythCard, { borderColor: colors.borderLight, backgroundColor: colors.bg }]}>
            <Text style={[styles.myth, { color: colors.primaryDark }]}>समज: {entry.मिथक}</Text>
            <Text style={[styles.fact, { color: colors.textSecondary }]}>सत्य: {entry.सत्य}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard>
        <Text style={[styles.title, { color: colors.textPrimary }]}>👩‍🍼 प्रसूतीनंतर मोड</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>प्रसूतीनंतरचा पहिला ६ आठवडे फोकस मोड</Text>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: postpartumMode ? colors.accent : colors.primary }]} onPress={togglePostpartumMode}>
          <Text style={styles.primaryBtnText}>{postpartumMode ? "प्रसूतीनंतर मोड बंद करा" : "प्रसूतीनंतर मोड सुरू करा"}</Text>
        </TouchableOpacity>
      </SectionCard>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  title: { fontSize: FONTS.h4, fontWeight: "800", marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.small, marginBottom: SPACING.sm, lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  rowTitle: { fontSize: FONTS.body, fontWeight: "700" },
  rowSub: { fontSize: FONTS.small, marginTop: 2, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.sm },
  actionBtn: {
    flex: 1,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    ...SHADOWS.sm,
  },
  actionText: { fontSize: FONTS.small, fontWeight: "800" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs, marginBottom: SPACING.sm },
  chip: { borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  chipText: { fontSize: FONTS.small, fontWeight: "700" },
  primaryBtn: {
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    marginTop: SPACING.xs,
    ...SHADOWS.sm,
  },
  primaryBtnText: { color: COLORS.textWhite, fontSize: FONTS.small, fontWeight: "800" },
  note: { marginTop: SPACING.sm, fontSize: FONTS.small, lineHeight: 20 },
  mythCard: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  myth: { fontSize: FONTS.small, fontWeight: "800", marginBottom: 4 },
  fact: { fontSize: FONTS.small, lineHeight: 20 },
});
