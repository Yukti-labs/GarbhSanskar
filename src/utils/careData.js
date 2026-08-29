export function todayIso(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getDefaultCareData() {
  return {
    reminders: [
      { id: "r1", title: "फॉलिक अॅसिड घ्या", time: "सकाळी ८:००", enabled: true },
      { id: "r2", title: "पाणी प्या", time: "दुपारी १२:००", enabled: true },
      { id: "r3", title: "१० मिनिटे चालणे", time: "सायंकाळी ६:००", enabled: true },
    ],
    moodLogs: [],
    notificationMap: {},
    hospitalBag: {
      "ओळखपत्रे व कागदपत्रे": false,
      "आरामदायी कपडे": false,
      "बाळाचे कपडे": false,
      "स्वच्छता साहित्य": false,
      "डॉक्टरांचे अहवाल": false,
      "मोबाइल चार्जर": false,
    },
    kicks: [],
    weights: [],
    bpLogs: [],
    sugarLogs: [],
    waterLogs: [],
    contractions: [],
    appointments: [],
    feedingLogs: [],
    healingChecks: {},
    chatMessages: [],
    chatUsage: { date: "", count: 0 },
    partnerTasksDone: {},
    ritualCompletions: [],
  };
}

export function mergeCareData(partial) {
  const base = getDefaultCareData();
  if (!partial || typeof partial !== "object") return base;
  return {
    ...base,
    ...partial,
    hospitalBag: { ...base.hospitalBag, ...(partial.hospitalBag || {}) },
    healingChecks: { ...base.healingChecks, ...(partial.healingChecks || {}) },
    partnerTasksDone: { ...base.partnerTasksDone, ...(partial.partnerTasksDone || {}) },
    chatUsage: { ...base.chatUsage, ...(partial.chatUsage || {}) },
  };
}

export function isPlusUnlocked(profile) {
  return !!profile?.plusUnlocked;
}

export const FREE_CHAT_DAILY_LIMIT = 5;

export function getChatUsage(careData) {
  const usage = careData?.chatUsage || { date: "", count: 0 };
  const today = todayIso();
  if (usage.date !== today) return { date: today, count: 0 };
  return usage;
}

export function canSendChat(profile, careData) {
  if (isPlusUnlocked(profile)) return { ok: true, remaining: Infinity };
  const usage = getChatUsage(careData);
  const remaining = Math.max(0, FREE_CHAT_DAILY_LIMIT - usage.count);
  return { ok: remaining > 0, remaining };
}

export function bumpChatUsage(careData) {
  const usage = getChatUsage(careData);
  return { ...usage, count: usage.count + 1 };
}

export const DIET_OPTIONS = [
  { id: "veg", label: "शाकाहारी" },
  { id: "egg", label: "अंडे सहित" },
  { id: "nonveg", label: "मांसाहारी" },
  { id: "jain", label: "जैन" },
];

export const PREGNANCY_TYPES = [
  { id: "singleton", label: "एक बाळ" },
  { id: "twins", label: "जुळी" },
  { id: "ivf", label: "IVF" },
];

export const HEALTH_FLAGS = [
  { id: "gdm", label: "गर्भावस्थेतील मधुमेह (GDM)" },
  { id: "hypertension", label: "उच्च रक्तदाब" },
  { id: "anemia", label: "अॅनिमिया" },
  { id: "thyroid", label: "थायरॉईड" },
];

export function dietLabel(id) {
  return DIET_OPTIONS.find((item) => item.id === id)?.label || "शाकाहारी";
}

export function pregnancyTypeLabel(id) {
  return PREGNANCY_TYPES.find((item) => item.id === id)?.label || "एक बाळ";
}

export function buildWeeklyRecap(profile, careData) {
  const logs = Array.isArray(careData?.moodLogs) ? careData.moodLogs.slice(0, 7) : [];
  const moods = logs.map((item) => item.mood).filter(Boolean);
  const moodSummary = moods.length
    ? `गेल्या ${moods.length} दिवसांत भावना: ${moods.join(", ")}.`
    : "या आठवड्यात मनःस्थितीची नोंद अजून नाही.";

  const symptoms = logs.flatMap((item) => item.symptoms || []);
  const symptomCount = symptoms.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const topSymptoms = Object.entries(symptomCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `${name} (${count})`);

  const today = todayIso();
  const kicksToday = (careData?.kicks || []).filter((item) => item.date === today);
  const kickTotal = kicksToday.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const latestWeight = (careData?.weights || [])[0];
  const waterToday = (careData?.waterLogs || []).find((item) => item.date === today);
  const nextAppt = (careData?.appointments || [])
    .filter((item) => item.date >= today)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];

  const restFlag = moods.filter((mood) => mood === "थकलेली" || mood === "चिंताग्रस्त").length >= 3;

  return {
    week: profile?.currentWeek || 1,
    moodSummary,
    topSymptoms,
    kickTotal,
    latestWeight: latestWeight ? `${latestWeight.kg} किग्रॅ (${latestWeight.date})` : "—",
    waterGlasses: waterToday?.glasses ?? 0,
    nextAppointment: nextAppt ? `${nextAppt.title} • ${nextAppt.date}` : "नोंद नाही",
    restFlag,
    advice: restFlag
      ? "थकवा/चिंता वारंवार दिसते. विश्रांती वाढवा आणि त्रास कायम राहिल्यास डॉक्टरांना विचारा."
      : "नोंदी नियमित ठेवा. कोणतेही तीव्र लक्षण असल्यास डॉक्टरांचा सल्ला घ्या.",
  };
}

function line(label, value) {
  return `${label}: ${value || "—"}`;
}

export function buildObExport(profile, careData) {
  const recap = buildWeeklyRecap(profile, careData);
  const flags = Array.isArray(profile?.healthFlags) ? profile.healthFlags : [];
  const mr = [
    "गर्भसंस्कार — डॉक्टर भेटीसाठी सारांश",
    "ही माहिती आईने नोंदवलेली आहे; वैद्यकीय अहवाल नाही.",
    "",
    line("नाव", profile?.name),
    line("आठवडा", recap.week),
    line("आहार", dietLabel(profile?.diet)),
    line("गर्भधारणा", pregnancyTypeLabel(profile?.pregnancyType)),
    line("शहर", profile?.city),
    line("जोखीम झेंडे", flags.length ? flags.join(", ") : "नाही"),
    line("LMP", profile?.lmpDate ? new Date(profile.lmpDate).toLocaleDateString("mr-IN") : ""),
    line("EDD", profile?.dueDate ? new Date(profile.dueDate).toLocaleDateString("mr-IN") : ""),
    "",
    "— आठवड्याचा आढावा —",
    recap.moodSummary,
    line("मुख्य लक्षणे", recap.topSymptoms.join(", ") || "नाही"),
    line("आजचे किक", recap.kickTotal),
    line("शेवटचे वजन", recap.latestWeight),
    line("आजचे पाणी (ग्लास)", recap.waterGlasses),
    line("पुढील भेट", recap.nextAppointment),
    recap.advice,
    "",
    "— अलीकडील वजन —",
    ...(careData?.weights || []).slice(0, 8).map((item) => `${item.date}: ${item.kg} किग्रॅ`),
    "",
    "— रक्तदाब —",
    ...(careData?.bpLogs || []).slice(0, 8).map((item) => `${item.date}: ${item.systolic}/${item.diastolic}`),
    "",
    "— साखर —",
    ...(careData?.sugarLogs || []).slice(0, 8).map((item) => `${item.date}: ${item.value} (${item.when || "—"})`),
  ];

  const en = [
    "Garbh Sanskar — visit summary (not a medical record)",
    line("Name", profile?.name),
    line("Week", recap.week),
    line("Diet", profile?.diet),
    line("Type", profile?.pregnancyType),
    line("Flags", flags.join(", ") || "none"),
    line("Today kicks", recap.kickTotal),
    line("Latest weight", recap.latestWeight),
    line("Water glasses today", recap.waterGlasses),
    line("Next appointment", recap.nextAppointment),
    recap.advice,
  ];

  return `${mr.join("\n")}\n\n--- English ---\n${en.join("\n")}`;
}
