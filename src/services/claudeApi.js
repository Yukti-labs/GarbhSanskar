// ─────────────────────────────────────────────────────────────────────────────
// 🔐 CONTENT PROXY CONFIGURATION
// Client sends prompts to a backend endpoint instead of external providers directly.
// Set EXPO_PUBLIC_API_BASE_URL for native/local-dev (example: https://your-app.vercel.app)
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const CONTENT_PROXY_PATH = "/api/content";

function getContentProxyUrl() {
  if (API_BASE_URL) {
    return `${API_BASE_URL}${CONTENT_PROXY_PATH}`;
  }

  if (typeof window !== "undefined" && window?.location?.origin) {
    return `${window.location.origin}${CONTENT_PROXY_PATH}`;
  }

  throw new Error("Content endpoint base URL missing. Set EXPO_PUBLIC_API_BASE_URL.");
}

async function callContent(systemPrompt, userPrompt) {
  const response = await fetch(getContentProxyUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context: systemPrompt, input: userPrompt }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || "Content endpoint error");
  }

  const text = data?.text;
  if (!text) {
    throw new Error("Empty response from content endpoint");
  }

  return text;
}

// ─── Shared Marathi system prompt ─────────────────────────────────────────────
const MARATHI_SYSTEM = `तुम्ही एक अनुभवी मराठी गर्भावस्था सल्लागार आहात.
तुमची उत्तरे नेहमी:
- शुद्ध मराठीत असावीत (देवनागरी लिपीत)
- सांस्कृतिकदृष्ट्या संवेदनशील आणि भारतीय परंपरांना अनुसरून असावीत
- वैद्यकीयदृष्ट्या अचूक असावीत
- आईला उत्साह आणि आनंद देणारी असावीत
- संक्षिप्त आणि स्पष्ट असावीत
IMPORTANT: Respond ONLY with a valid JSON object. No markdown, no backticks, no explanation. Just raw JSON.`;

// ─── Safe JSON parser ──────────────────────────────────────────────────────────
function safeParseJSON(text) {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ─── Week-specific fallback data ──────────────────────────────────────────────
const WEEK_SPECIFIC_DATA = {
  babyDevelopment: {
    "1-4": { size: "दाणाएवढा (१-३ मिमी)", weight: "< १ मिग्रॅ", emoji: "🌱", milestones: ["भ्रूण विकास तीव्र गतीने", "हृदय धडधडणे शुरू", "मेंदूचा विकास", "डीएनए ने प्रोग्रामिंग सुरू"] },
    "5-8": { size: "१-२ सेंटीमीटर", weight: "१-५ ग्रॅम", emoji: "🫘", milestones: ["हाताचे बोटे दिसू लागली", "चेहऱ्याच्या विशेषता दिसू लागतात", "पेशींचा विकास", "अंग तयार होणे सुरू"] },
    "9-13": { size: "कर्पूरएवढा (७-८ सेंटीमीटर)", weight: "२०-३० ग्रॅम", emoji: "🍒", milestones: ["अंगूठ चुंबन करू शकते", "कान सुनू लागले (हलकी आवाज)", "बेबी लिंग निश्चित", "नख बनणे सुरू"] },
    "14-18": { size: "काजू साइज (१२-१५ सेंटीमीटर)", weight: "१००-१६० ग्रॅम", emoji: "🥒", milestones: ["आई बाळचा हालचाल अनुभव करिन्न लागते", "त्वचा बनणे प्रारंभ", "हाडे कठीण होऊ लागली", "शरीरातील सिस्टीम काम करू लागली"] },
    "19-23": { size: "पूर्ण केळी (१८-२० सेंटीमीटर)", weight: "२५०-४०० ग्रॅम", emoji: "🍌", milestones: ["सुगंध आणि स्वाद शक्ती विकसित", "लोह संग्रह तयार होणे", "त्वचा गुलाबी रंगात आणि मजबूत", "टाळू पूर्णपणे विकसित"] },
    "24-27": { size: "संतरा (२१-२५ सेंटीमीटर)", weight: "४००-७०० ग्रॅम", emoji: "🍆", milestones: ["फुफ्फुस काम करणे सुरू (साचा क्रिया)", "नजर खुली होणे लागते", "हालचाली अधिक सक्रिय", "सर्फॅक्टेंट ग्रंथी काम करणे सुरू"] },
    "28-32": { size: "कोबी (२६-२८ सेंटीमीटर)", weight: "१०००-१७०० ग्रॅम", emoji: "🥬", milestones: ["हाथांची पकड शक्ती विकसित", "नख पूर्ण विकसित", "वजन तेजीने वाढणे", "मेंदूच्या नक्षत्रे तयार होणे"] },
    "33-36": { size: "छोटा कोकम्बर (२९-३० सेंटीमीटर)", weight: "१८००-२४०० ग्रॅम", emoji: "🥒", milestones: ["वजन वेगात वाढणे सुरू", "फुफ्फुसे ९० प्रतीशत विकसित", "हाड काहीशी लवचिक राहते", "बाळ जन्मासाठी स्थिती बदलणे सुरू"] },
    "37-40": { size: "वाटरमेलन (३०-३५ सेंटीमीटर)", weight: "२८००-३५०० ग्रॅम", emoji: "🍉", milestones: ["जन्मासाठी पूर्णपणे उपयुक्त", "सर्व अवयग पूर्णपणे विकसित", "बाळ जन्मचे स्थिती मिळाले", "जन्मासाठी शरीर तयार"] },
  },
  nutrition: {
    "1-4": { keyNutrient: "फोलिक अँसिड", eat: ["पालक", "मोठे अनाज", "संत्र"], avoid: ["कच्चे अंडे", "कच्चा मांस"] },
    "5-8": { keyNutrient: "प्रोटीन", eat: ["दाळ", "दही", "नारळ"], avoid: ["कॅफीन", "तेल-मसालेदार"] },
    "9-13": { keyNutrient: "कॅल्शियम", eat: ["दूध", "लोबिया", "तिल"], avoid: ["अचार", "उरद"] },
    "14-18": { keyNutrient: "लोह", eat: ["मांस", "पालक", "तांदूळ"], avoid: ["चहा", "कॉफी"] },
    "19-23": { keyNutrient: "जस्ता", eat: ["कद्दू बियाणे", "मूंगफळ", "गव्हार"], avoid: ["तीक्ष्ण अन्न", "साठी अन्न"] },
    "24-27": { keyNutrient: "विटामिन डी", eat: ["दुध", "अंडे", "सूर्यप्रकाश"], avoid: ["कच्चा पपई", "कच्चा अन्न"] },
    "28-32": { keyNutrient: "विटामिन सी", eat: ["आँवला", "निंबू", "टोमेटो"], avoid: ["तेल-मसालेदार", "जास्त मीठ"] },
    "33-36": { keyNutrient: "विटामिन बी", eat: ["गहू", "सोयाबीन", "छोळे"], avoid: ["संरक्षित अन्न", "चॉकलेट"] },
    "37-40": { keyNutrient: "संपूर्ण पोषण", eat: ["सर्व प्रकारचे अन्न संतुलित", "दुध उत्पादने", "ताजे फळ-भाजी"], avoid: ["भारी अन्न", "जास्त मीठ-साखर"] },
  },
  yoga: {
    "1-4": { safetyNote: "सौम्य योग केवळ", poses: ["पद्मासन", "शवासन"], pranayama: "सामान्य श्वसन" },
    "5-8": { safetyNote: "आरामदायक आसने", poses: ["वज्रासन", "मार्जरीआसन"], pranayama: "अनुलोम विलोम" },
    "9-13": { safetyNote: "निरापद आसने चालू ठेवा", poses: ["उष्ट्रासन", "सीमासन"], pranayama: "चंद्र भेदी" },
    "14-18": { safetyNote: "पऱ्यंत मजबूतीची सुरुवात", poses: ["कोट्यासन", "त्रिकोणासन"], pranayama: "उज्जायी" },
    "19-23": { safetyNote: "संतुलित योग मनोबल", poses: ["वीरभद्रासन", "बादशहासन"], pranayama: "भस्त्रिका" },
    "24-27": { safetyNote: "हल्की व्यायामे सुरू", poses: ["निर्माण आसने", "हलके कसरत"], pranayama: "नाडी शोधन" },
    "28-32": { safetyNote: "तणाव कमी करणारे आसने", poses: ["तितळीसन", "पशचिमोत्तनासन"], pranayama: "विलोम" },
    "33-36": { safetyNote: "सुलभ मनोरंजक आसने", poses: ["शांत आसने फक्त", "चेहऱ्याची व्यायामे"], pranayama: "योग निद्रा" },
    "37-40": { safetyNote: "प्रसूतीपूर्व तयारी", poses: ["गर्भासन", "हिप स्ट्रेच"], pranayama: "जन्मासाठी श्वसन" },
  },
};

function getWeekRangeKey(week) {
  if (week <= 4) return "1-4";
  if (week <= 8) return "5-8";
  if (week <= 13) return "9-13";
  if (week <= 18) return "14-18";
  if (week <= 23) return "19-23";
  if (week <= 27) return "24-27";
  if (week <= 32) return "28-32";
  if (week <= 36) return "33-36";
  return "37-40";
}

function getWeekSpecificBabyDevelopmentFallback(week) {
  const rangeKey = getWeekRangeKey(week);
  const data = WEEK_SPECIFIC_DATA.babyDevelopment[rangeKey];
  return {
    title: `आठवडा ${week} - बाळाची वाढ`,
    emoji: data.emoji,
    size: data.size,
    weight: data.weight,
    length: `${week} आठवड्यांची लांबी`,
    development: data.milestones,
    milestone: `${week}वा आठवडा: ${data.milestones[0]}`,
  };
}

function getWeekSpecificNutritionFallback(week) {
  const rangeKey = getWeekRangeKey(week);
  const data = WEEK_SPECIFIC_DATA.nutrition[rangeKey];
  const eatList = data.eat.map((food, idx) => ({
    food,
    reason: idx === 0 ? data.keyNutrient : "पोषण प्रदान करते",
    emoji: ["🥬", "🥛", "🍊"][idx % 3],
  }));
  const avoidList = data.avoid.map((food) => ({ food, reason: "पचनासाठी भारी" }));
  return {
    title: `पोषण - आठवडा ${week}`,
    keyNutrient: data.keyNutrient,
    eat: eatList,
    avoid: avoidList,
    recipe: {
      name: `${data.eat[0]} आधारित रेसिपी`,
      ingredients: data.eat,
      method: "सर्व साहित्य एकत्र शिजवा आणि गरम खा",
    },
    hydration: "दिवसातून ८-१० ग्लास पाणी आणि द्रव अन्न घ्या",
  };
}

function getWeekSpecificYogaFallback(week) {
  const rangeKey = getWeekRangeKey(week);
  const data = WEEK_SPECIFIC_DATA.yoga[rangeKey];
  return {
    title: `योग - आठवडा ${week}`,
    safetyNote: data.safetyNote,
    poses: data.poses.map((name) => ({
      name,
      sanskrit: name,
      duration: "५-१० मिनिटे",
      benefit: "शारीरिक आणि मानसिक आरोग्य",
      steps: `${name} करत सवयची सुधारणा करा`,
      emoji: "🧘",
    })),
    pranayama: { name: data.pranayama, benefit: "श्वसन नियंत्रण", duration: "५ मिनिटे" },
  };
}

const FALLBACK_NAMES = [
  { name: "आरव", english: "Aarav", meaning: "शांत आणि ज्ञानी", origin: "संस्कृत", numerology: "3", famous: "", gender: "boy" },
  { name: "विहान", english: "Vihaan", meaning: "पहाट, नवीन सुरुवात", origin: "संस्कृत", numerology: "5", famous: "", gender: "boy" },
  { name: "अद्वैत", english: "Advait", meaning: "एकमेव, अद्वितीय", origin: "संस्कृत", numerology: "1", famous: "", gender: "boy" },
  { name: "ओम", english: "Om", meaning: "पवित्र प्रणव", origin: "संस्कृत", numerology: "6", famous: "", gender: "boy" },
  { name: "कियान", english: "Kiyan", meaning: "कृपा, देवाचे वरदान", origin: "मराठी", numerology: "8", famous: "", gender: "boy" },
  { name: "अर्णव", english: "Arnav", meaning: "समुद्र", origin: "संस्कृत", numerology: "2", famous: "", gender: "boy" },
  { name: "अनिकेत", english: "Aniket", meaning: "जगाला घर मानणारा", origin: "संस्कृत", numerology: "7", famous: "", gender: "boy" },
  { name: "आदित्य", english: "Aditya", meaning: "सूर्य", origin: "संस्कृत", numerology: "1", famous: "", gender: "boy" },
  { name: "ईशान", english: "Ishan", meaning: "भगवान शिव", origin: "संस्कृत", numerology: "9", famous: "", gender: "boy" },
  { name: "उदित", english: "Udit", meaning: "उगवणारा", origin: "संस्कृत", numerology: "4", famous: "", gender: "boy" },
  { name: "कृष", english: "Krish", meaning: "श्रीकृष्ण", origin: "संस्कृत", numerology: "5", famous: "", gender: "boy" },
  { name: "कार्तिक", english: "Kartik", meaning: "देवसेना प्रमुख", origin: "संस्कृत", numerology: "6", famous: "", gender: "boy" },
  { name: "गौरव", english: "Gaurav", meaning: "अभिमान, गौरव", origin: "संस्कृत", numerology: "3", famous: "", gender: "boy" },
  { name: "चैतन्य", english: "Chaitanya", meaning: "चेतना, ऊर्जा", origin: "संस्कृत", numerology: "8", famous: "", gender: "boy" },
  { name: "जियान", english: "Jiyan", meaning: "जीवनाशी संबंधित", origin: "मराठी", numerology: "2", famous: "", gender: "boy" },
  { name: "तन्मय", english: "Tanmay", meaning: "पूर्णपणे मग्न", origin: "संस्कृत", numerology: "7", famous: "", gender: "boy" },
  { name: "दक्ष", english: "Daksh", meaning: "कुशल, सक्षम", origin: "संस्कृत", numerology: "4", famous: "", gender: "boy" },
  { name: "नक्ष", english: "Naksh", meaning: "चंद्र, वैशिष्ट्यपूर्ण", origin: "संस्कृत", numerology: "6", famous: "", gender: "boy" },
  { name: "पार्थ", english: "Parth", meaning: "अर्जुन", origin: "संस्कृत", numerology: "9", famous: "", gender: "boy" },
  { name: "बोधि", english: "Bodhi", meaning: "ज्ञानप्राप्ती", origin: "संस्कृत", numerology: "1", famous: "", gender: "boy" },
  { name: "मिहिर", english: "Mihir", meaning: "सूर्य", origin: "संस्कृत", numerology: "3", famous: "", gender: "boy" },
  { name: "रुद्र", english: "Rudra", meaning: "शिवाचे रूप", origin: "संस्कृत", numerology: "5", famous: "", gender: "boy" },
  { name: "समर्थ", english: "Samarth", meaning: "सक्षम", origin: "मराठी", numerology: "8", famous: "", gender: "boy" },
  { name: "हर्ष", english: "Harsh", meaning: "आनंद", origin: "संस्कृत", numerology: "2", famous: "", gender: "boy" },
  { name: "आर्या", english: "Aarya", meaning: "श्रेष्ठ, सन्माननीय", origin: "संस्कृत", numerology: "2", famous: "", gender: "girl" },
  { name: "अन्वी", english: "Anvi", meaning: "देवीचे रूप", origin: "संस्कृत", numerology: "7", famous: "", gender: "girl" },
  { name: "सई", english: "Sai", meaning: "दैवी आशीर्वाद", origin: "मराठी", numerology: "9", famous: "", gender: "girl" },
  { name: "ईशानी", english: "Ishani", meaning: "देवी पार्वती", origin: "संस्कृत", numerology: "4", famous: "", gender: "girl" },
  { name: "मायरा", english: "Myra", meaning: "प्रिय, अद्भुत", origin: "मराठी", numerology: "6", famous: "", gender: "girl" },
  { name: "आन्वी", english: "Aanvi", meaning: "देवी लक्ष्मीचे रूप", origin: "संस्कृत", numerology: "1", famous: "", gender: "girl" },
  { name: "आद्या", english: "Aadya", meaning: "पहिली, आदिशक्ती", origin: "संस्कृत", numerology: "3", famous: "", gender: "girl" },
  { name: "इरा", english: "Ira", meaning: "पृथ्वी, ज्ञान", origin: "संस्कृत", numerology: "5", famous: "", gender: "girl" },
  { name: "उर्वी", english: "Urvi", meaning: "धरती", origin: "संस्कृत", numerology: "6", famous: "", gender: "girl" },
  { name: "काव्या", english: "Kavya", meaning: "कविता, सुंदर अभिव्यक्ती", origin: "संस्कृत", numerology: "2", famous: "", gender: "girl" },
  { name: "गौरी", english: "Gauri", meaning: "पार्वती", origin: "संस्कृत", numerology: "8", famous: "", gender: "girl" },
  { name: "चिन्मयी", english: "Chinmayi", meaning: "चैतन्याने भरलेली", origin: "संस्कृत", numerology: "4", famous: "", gender: "girl" },
  { name: "जान्हवी", english: "Janhavi", meaning: "गंगा नदी", origin: "संस्कृत", numerology: "7", famous: "", gender: "girl" },
  { name: "तनिश्का", english: "Tanishka", meaning: "सुंदर, रत्न", origin: "संस्कृत", numerology: "9", famous: "", gender: "girl" },
  { name: "दिया", english: "Diya", meaning: "दिवा, प्रकाश", origin: "मराठी", numerology: "1", famous: "", gender: "girl" },
  { name: "नायरा", english: "Naira", meaning: "तेजस्वी, उजळ", origin: "मराठी", numerology: "5", famous: "", gender: "girl" },
  { name: "पर्णा", english: "Parna", meaning: "पानासारखी कोमल", origin: "संस्कृत", numerology: "6", famous: "", gender: "girl" },
  { name: "भाविका", english: "Bhavika", meaning: "भावपूर्ण", origin: "संस्कृत", numerology: "8", famous: "", gender: "girl" },
  { name: "मृण्मयी", english: "Mrinmayi", meaning: "मातीसारखी कोमल", origin: "संस्कृत", numerology: "2", famous: "", gender: "girl" },
  { name: "रिया", english: "Riya", meaning: "गायिका, माधुर्य", origin: "संस्कृत", numerology: "4", famous: "", gender: "girl" },
  { name: "सान्वी", english: "Saanvi", meaning: "लक्ष्मी", origin: "संस्कृत", numerology: "7", famous: "", gender: "girl" },
  { name: "हिया", english: "Hiya", meaning: "हृदय", origin: "मराठी", numerology: "3", famous: "", gender: "girl" },
  { name: "साक्षी", english: "Sakshi", meaning: "साक्ष देणारी", origin: "संस्कृत", numerology: "5", famous: "", gender: "unisex" },
  { name: "तेजस", english: "Tejas", meaning: "प्रकाश, तेज", origin: "संस्कृत", numerology: "1", famous: "", gender: "unisex" },
  { name: "श्रेय", english: "Shrey", meaning: "श्रेष्ठता, कल्याण", origin: "संस्कृत", numerology: "3", famous: "", gender: "unisex" },
  { name: "दीप", english: "Deep", meaning: "दिवा, प्रकाश", origin: "मराठी", numerology: "2", famous: "", gender: "unisex" },
  { name: "तन्वी", english: "Tanvi", meaning: "नाजूक, सुंदर", origin: "संस्कृत", numerology: "8", famous: "", gender: "girl" },
  { name: "आर्या", english: "Arya", meaning: "श्रेष्ठ", origin: "संस्कृत", numerology: "2", famous: "", gender: "unisex" },
  { name: "किरण", english: "Kiran", meaning: "प्रकाशकिरण", origin: "मराठी", numerology: "4", famous: "", gender: "unisex" },
  { name: "मोक्ष", english: "Moksh", meaning: "मुक्ती", origin: "संस्कृत", numerology: "7", famous: "", gender: "unisex" },
  { name: "नील", english: "Neel", meaning: "निळे आकाश", origin: "संस्कृत", numerology: "5", famous: "", gender: "unisex" },
  { name: "रिषी", english: "Rishi", meaning: "ऋषी, ज्ञानी", origin: "संस्कृत", numerology: "6", famous: "", gender: "unisex" },
  { name: "सुमेध", english: "Sumedh", meaning: "चांगली बुद्धी", origin: "संस्कृत", numerology: "9", famous: "", gender: "unisex" },
];

const NAKSHATRA_LETTER_MAP = {
  "अश्विनी": ["च", "ल"],
  "भरणी": ["ल"],
  "कृत्तिका": ["अ", "इ", "उ", "ए"],
  "रोहिणी": ["ओ", "व"],
  "मृगशीर्ष": ["व", "क"],
  "आर्द्रा": ["क", "घ", "च"],
  "पुनर्वसू": ["क", "ह"],
  "पुष्य": ["ह", "द"],
  "आश्लेषा": ["द"],
  "मघा": ["म"],
  "पूर्वा फाल्गुनी": ["म", "त"],
  "उत्तरा फाल्गुनी": ["त", "प"],
  "हस्त": ["प", "श", "न", "थ"],
  "चित्रा": ["प", "र"],
  "स्वाती": ["र", "त"],
  "विशाखा": ["त"],
  "अनुराधा": ["न"],
  "ज्येष्ठा": ["न", "य"],
  "मूळ": ["य", "ब"],
  "पूर्वाषाढा": ["ब", "ध", "भ"],
  "उत्तराषाढा": ["ब", "ज"],
  "श्रवण": ["ज", "ख"],
  "धनिष्ठा": ["ग"],
  "शतभिषा": ["ग", "स"],
  "पूर्वाभाद्रपदा": ["स", "द"],
  "उत्तराभाद्रपदा": ["द", "थ", "झ"],
  "रेवती": ["द", "च"],
};

function hashString(value) {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededShuffle(items, seedInput) {
  const seed = hashString(seedInput);
  const list = [...items];
  let state = seed || 1;
  function nextRandom() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  }

  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRandom() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function uniqueNames(items) {
  const seen = new Set();
  return (items || []).filter((item) => {
    const key = String(item?.name || "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchesGender(item, gender) {
  if (!gender || gender === "all" || gender === "both") return true;
  return item.gender === gender || item.gender === "unisex";
}

function matchesOrigin(item, origin) {
  if (!origin || origin === "दोन्ही") return true;
  return item.origin === origin;
}

function matchesLetter(item, letters) {
  if (!letters?.length) return true;
  return letters.some((letter) => item.name?.startsWith(letter));
}

function getPreferredLetters({ letter, nakshatra }) {
  if (letter) return [letter];
  return NAKSHATRA_LETTER_MAP[nakshatra] || [];
}

function buildSyntheticNames({ letters = [], gender, origin, min = 12, seed }) {
  const preferredOrigins = origin === "दोन्ही" || !origin ? ["संस्कृत", "मराठी"] : [origin];
  const allowedGenders = gender === "both" || gender === "all" || !gender ? ["boy", "girl", "unisex"] : [gender, "unisex"];
  const suffixes = {
    boy: ["ान", "ेश", "ित", "य", "व", "िर", "ेत", "िल"],
    girl: ["ा", "िका", "िनी", "या", "ी", "िता", "ंवी", "ाश्री"],
    unisex: ["िन", "ल", "ष", "या", "ेश", "दीप"],
  };
  const meanings = [
    "शुभ आणि तेजस्वी", "आनंद व समृद्धी देणारे", "शांत आणि प्रेमळ", "सौभाग्याचे प्रतीक",
    "प्रकाश आणि सकारात्मकता देणारे", "ज्ञान, करुणा आणि सौंदर्य यांचे प्रतीक",
  ];

  const synthetic = [];
  const baseLetters = letters.length ? letters : ["अ", "क", "म", "स", "र", "न"];
  const genderPool = seededShuffle(allowedGenders, `${seed}_genders`);

  baseLetters.forEach((baseLetter, letterIndex) => {
    genderPool.forEach((genderType, genderIndex) => {
      suffixes[genderType].forEach((suffix, suffixIndex) => {
        const generatedName = `${baseLetter}${suffix}`;
        synthetic.push({
          name: generatedName,
          english: generatedName,
          meaning: meanings[(letterIndex + genderIndex + suffixIndex) % meanings.length],
          origin: preferredOrigins[(letterIndex + suffixIndex) % preferredOrigins.length],
          numerology: String(((letterIndex + genderIndex + suffixIndex) % 9) + 1),
          famous: "",
          gender: genderType,
        });
      });
    });
  });

  return uniqueNames(seededShuffle(synthetic, `${seed}_synthetic`)).slice(0, min * 2);
}

function sanitizeNameResults(result, { gender, origin, letter, nakshatra, rashi, min, strictByLetter = false }) {
  const preferredLetters = getPreferredLetters({ letter, nakshatra });
  const seed = `${rashi || ""}|${nakshatra || ""}|${letter || ""}|${gender || ""}|${origin || ""}`;

  const aiNames = Array.isArray(result?.names) ? result.names : [];
  const normalizedAi = uniqueNames(aiNames)
    .filter((item) => matchesGender(item, gender))
    .filter((item) => matchesOrigin(item, origin));

  const matchingAi = normalizedAi.filter((item) => matchesLetter(item, preferredLetters));
  const nonMatchingAi = normalizedAi.filter((item) => !matchesLetter(item, preferredLetters));

  const fallbackNames = getFallbackNames({ gender, origin, letter, nakshatra, rashi, min, strictByLetter });
  const combined = uniqueNames(strictByLetter && preferredLetters.length
    ? [
      ...seededShuffle(matchingAi, `${seed}_match`),
      ...fallbackNames,
    ]
    : [
      ...seededShuffle(matchingAi, `${seed}_match`),
      ...fallbackNames,
      ...seededShuffle(nonMatchingAi, `${seed}_rest`),
    ]);

  const finalNames = strictByLetter && preferredLetters.length
    ? combined.filter((item) => matchesLetter(item, preferredLetters))
    : combined;

  return { names: finalNames.slice(0, min) };
}

function getFallbackNames({ gender, letter, origin, nakshatra, rashi, min = 12, strictByLetter = false }) {
  const normalizedGender = gender === "both" ? "all" : gender;
  const normalizedOrigin = origin === "दोन्ही" ? null : origin;
  const preferredLetters = getPreferredLetters({ letter, nakshatra });
  const seed = `${rashi || ""}|${nakshatra || ""}|${letter || ""}|${normalizedGender || ""}|${normalizedOrigin || ""}`;

  let filtered = [...FALLBACK_NAMES];

  if (normalizedGender && normalizedGender !== "all") {
    filtered = filtered.filter((item) => item.gender === normalizedGender || item.gender === "unisex");
  }

  if (normalizedOrigin) {
    filtered = filtered.filter((item) => item.origin === normalizedOrigin);
  }

  if (preferredLetters.length) {
    const byLetter = filtered.filter((item) => matchesLetter(item, preferredLetters));
    const remaining = filtered.filter((item) => !matchesLetter(item, preferredLetters));
    filtered = strictByLetter
      ? [...seededShuffle(byLetter, `${seed}_by_letter`)]
      : [...seededShuffle(byLetter, `${seed}_by_letter`), ...seededShuffle(remaining, `${seed}_remaining`)];
  } else {
    filtered = seededShuffle(filtered, `${seed}_all`);
  }

  filtered = uniqueNames(filtered);

  if (filtered.length < min) {
    const extra = buildSyntheticNames({
      letters: preferredLetters,
      gender: normalizedGender,
      origin: normalizedOrigin || "दोन्ही",
      min,
      seed,
    }).filter((item) => !filtered.some((existing) => existing.name === item.name));
    filtered = [...filtered, ...extra];
  }

  return filtered.slice(0, min);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Baby Development
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchBabyDevelopment(week) {
  const fallback = getWeekSpecificBabyDevelopmentFallback(week);

  const prompt = `गर्भावस्थेच्या ${week}व्या आठवड्यात बाळाची वाढ कशी होते?
Return ONLY this JSON:
{
  "title": "आठवडा ${week} - बाळाची वाढ",
  "emoji": "👶",
  "size": "कोणत्या फळासारखा आकार (उदा: मटारएवढा)",
  "weight": "अंदाजे वजन",
  "length": "अंदाजे लांबी",
  "development": ["वाढीचा मुद्दा १", "वाढीचा मुद्दा २", "वाढीचा मुद्दा ३"],
  "milestone": "या आठवड्याचा सर्वात महत्त्वाचा टप्पा"
}`;

  try {
    const text = await callContent(MARATHI_SYSTEM, prompt);
    return safeParseJSON(text) || fallback;
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Talk to Baby
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchTalkToBaby(week) {
  const fallback = {
    title: "बाळाशी बोला",
    message: "माझ्या प्रिय बाळा, तू माझ्या उदरात सुरक्षित आहेस. तुझी वाट पाहत आहे.",
    affirmation: "तुम्ही एक अद्भुत आई आहात!",
    activity: "बाळाशी हळुवारपणे बोला",
  };

  const prompt = `गर्भावस्थेच्या ${week}व्या आठवड्यात आई बाळाशी काय बोलू शकते?
Return ONLY this JSON:
{
  "title": "बाळाशी बोला - आठवडा ${week}",
  "message": "बाळाला उद्देशून मराठीत उबदार पत्र/संदेश (८०-१०० शब्द)",
  "affirmation": "आईसाठी एक सकारात्मक वाक्य",
  "activity": "आज करण्यासारखी एक छोटी गोष्ट"
}`;

  try {
    const text = await callContent(MARATHI_SYSTEM, prompt);
    return safeParseJSON(text) || fallback;
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Yoga
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchYoga(week) {
  const fallback = getWeekSpecificYogaFallback(week);

  const trimester = week <= 13 ? "पहिली" : week <= 27 ? "दुसरी" : "तिसरी";
  const prompt = `गर्भावस्थेच्या ${week}व्या आठवड्यात (${trimester} तिमाही) कोणते योगासने सुरक्षित आहेत?
Return ONLY this JSON:
{
  "title": "योग - आठवडा ${week}",
  "safetyNote": "महत्त्वाची सुरक्षा सूचना",
  "poses": [
    {
      "name": "आसनाचे मराठी नाव",
      "sanskrit": "Sanskrit name",
      "duration": "वेळ",
      "benefit": "फायदा",
      "steps": "कसे करावे (१-२ वाक्ये)",
      "emoji": "🧘"
    }
  ],
  "pranayama": {
    "name": "प्राणायामाचे नाव",
    "benefit": "फायदा",
    "duration": "वेळ"
  }
}`;

  try {
    const text = await callContent(MARATHI_SYSTEM, prompt);
    return safeParseJSON(text) || fallback;
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Nutrition
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchNutrition(week) {
  const fallback = getWeekSpecificNutritionFallback(week);

  const prompt = `गर्भावस्थेच्या ${week}व्या आठवड्यात आईने काय खावे?
Return ONLY this JSON:
{
  "title": "पोषण - आठवडा ${week}",
  "keyNutrient": "या आठवड्यातील सर्वात महत्त्वाचे पोषण तत्त्व",
  "eat": [
    { "food": "अन्नपदार्थ", "reason": "का खावे", "emoji": "🥗" }
  ],
  "avoid": [
    { "food": "टाळण्यासारखे अन्न", "reason": "का टाळावे" }
  ],
  "recipe": {
    "name": "सोपी मराठी रेसिपी",
    "ingredients": ["साहित्य १", "साहित्य २"],
    "method": "कृती (२ वाक्ये)"
  },
  "hydration": "पाणी व द्रव सेवनाच्या टिप्स"
}`;

  try {
    const text = await callContent(MARATHI_SYSTEM, prompt);
    return safeParseJSON(text) || fallback;
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Garbh Sanskar
// ─────────────────────────────────────────────────────────────────────────────
const SHLOKA_POOL = [
  { text: "ॐ सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः", meaning: "सर्वजण सुखी व निरोगी राहोत.", source: "उपनिषद" },
  { text: "ॐ असतो मा सद्गमय तमसो मा ज्योतिर्गमय", meaning: "असत्यातून सत्याकडे, अंधारातून प्रकाशाकडे ने.", source: "बृहदारण्यक उपनिषद" },
  { text: "त्वमेव माता च पिता त्वमेव", meaning: "परमेश्वरच माझी माता-पिता आहेत.", source: "प्रार्थना" },
  { text: "गुरुर्ब्रह्मा गुरुर्विष्णुः गुरुर्देवो महेश्वरः", meaning: "गुरु हेच ब्रह्मा-विष्णु-महेश आहेत.", source: "गुरु स्तोत्र" },
  { text: "कराग्रे वसते लक्ष्मीः करमध्ये सरस्वती", meaning: "हाताच्या अग्रभागी लक्ष्मी आणि मध्यभागी सरस्वतीचा वास आहे.", source: "प्रातःस्मरण" },
  { text: "शुभं करोति कल्याणं आरोग्यं धनसंपदा", meaning: "ही प्रार्थना कल्याण, आरोग्य आणि समृद्धी देते.", source: "दीप प्रार्थना" },
  { text: "वक्रतुंड महाकाय सूर्यकोटि समप्रभ", meaning: "विघ्नांचा नाश करणाऱ्या गणेशाला वंदन.", source: "गणेश स्तोत्र" },
];

const MUSIC_POOL = [
  { raga: "राग यमन", benefit: "मन प्रसन्न आणि स्थिर होते", time: "संध्याकाळी ६-७" },
  { raga: "राग भूप", benefit: "चिंता कमी होऊन शांतता मिळते", time: "सकाळी ७-८" },
  { raga: "राग बिलावल", benefit: "भावनिक संतुलन सुधारते", time: "सकाळी ८-९" },
  { raga: "मृदू बासरी धून", benefit: "हृदयगती शांत ठेवण्यास मदत", time: "रात्री झोपण्यापूर्वी" },
  { raga: "संत अभंग गायन", benefit: "सकारात्मकता व श्रद्धा वाढते", time: "संध्याकाळी प्रार्थना वेळी" },
  { raga: "वीणा ध्यान संगीत", benefit: "एकाग्रता आणि अंतर्मन शांतता", time: "दुपारी १-२" },
  { raga: "ओंकार जप ध्वनी", benefit: "श्वसन-लय संतुलित राहते", time: "सकाळी ध्यानावेळी" },
];

const STORY_POOL = [
  {
    title: "सावित्रीची निष्ठा",
    summary: "सावित्रीच्या धैर्य, संयम आणि श्रद्धेमुळे संकटावर मात झाली.",
    fullStory: "सावित्रीने आपल्या पतीसाठी प्रचंड संकटातही धैर्य सोडले नाही. यमराजांसमोर शांत, तर्कशुद्ध आणि विनम्र संवाद करत तिने आपल्या निष्ठेची ताकद दाखवली. तिच्या श्रद्धा, बुद्धिमत्ता आणि संयमामुळे तिला अखेरीस पतीचे आयुष्य परत मिळाले. या कथेतून आईला समजते की शांत मन, श्रद्धा आणि योग्य शब्दांची ताकद किती मोठी असते. गर्भावस्थेतही भीतीऐवजी विश्वास ठेवून, प्रत्येक दिवस संयमाने जगणे हेच खरी शक्ती आहे.",
    moral: "श्रद्धा, संयम आणि धैर्य यातून आशा निर्माण होते.",
  },
  {
    title: "जिजाऊंचे संस्कार",
    summary: "जिजाऊंनी शिवबांमध्ये नीती, धैर्य आणि जनसेवेची बीजे रोवली.",
    fullStory: "जिजाऊ दररोज लहान शिवबांना रामायण-महाभारताच्या कथा सांगत. त्या फक्त युद्धकथा सांगत नसत, तर प्रत्येक प्रसंगातून न्याय, करुणा आणि जबाबदारी शिकवत. अन्यायाविरुद्ध उभे राहणे, दुर्बलांना आधार देणे आणि समाजासाठी कार्य करणे—हे संस्कार लहानपणापासूनच शिवबांच्या मनात रुजले. जिजाऊंच्या सातत्यपूर्ण संस्कारामुळेच पुढे शिवाजी महाराज लोकनायक झाले. आईची विचारशैली आणि शब्द हे बाळाच्या भविष्यासाठी फार मोठे भांडवल असते, हा या कथेचा गाभा आहे.",
    moral: "आईचे मूल्याधिष्ठित संस्कार आयुष्याचा मार्ग घडवतात.",
  },
  {
    title: "संत जनाबाईची भक्ती",
    summary: "प्रत्येक कामात विठ्ठल स्मरण करून जनाबाईंनी आनंदाचा मार्ग निवडला.",
    fullStory: "संत जनाबाई रोजची घरची कामे करताना विठ्ठलाचे नामस्मरण करत. साधी दिनचर्या असली तरी तिच्या मनातील भक्तीमुळे प्रत्येक क्षण पवित्र होत असे. तिने दाखवून दिले की आनंद बाहेर शोधायचा नसतो, तो आपल्या वृत्तीमध्ये असतो. गर्भावस्थेतही लहान-सहान कामे प्रेमाने आणि जपून करताना देवस्मरण व सकारात्मक शब्द वापरले तर मन हलके राहते. जनाबाईंची कथा आपल्याला सांगते की नियमित प्रार्थना आणि कृतज्ञता हेच शांत मनाचे दोन मजबूत आधार आहेत.",
    moral: "नामस्मरणाने साध्या दिवसालाही अर्थ मिळतो.",
  },
  {
    title: "संत तुकारामांचा संदेश",
    summary: "तुकारामांनी संकटातही आशावाद, प्रेम आणि समता यांचा मार्ग ठेवला.",
    fullStory: "जीवनात अनेक संकटे असूनही संत तुकारामांनी अंतःकरणातील विश्वास कधी सोडला नाही. त्यांनी अभंगातून लोकांना प्रेम, समता आणि सहकार्याचा संदेश दिला. कठीण काळात शांत मनाने योग्य कृती करणे आणि देवावर विश्वास ठेवणे हे त्यांचे तत्त्व होते. गर्भवती आईसाठी हा संदेश महत्त्वाचा आहे—तणाव येत असला तरी श्वसन, प्रार्थना आणि परिवाराचा आधार घेत पुढे चालत राहायचे. बाळासाठीही ही सकारात्मक ऊर्जाच पहिला संस्कार ठरते.",
    moral: "आशा आणि समतेचा मार्ग मनाला स्थैर्य देतो.",
  },
  {
    title: "अहिल्याबाई होळकरांची करुणा",
    summary: "शासनात कठोरता आणि मनात करुणा यांचा सुंदर समतोल त्यांनी राखला.",
    fullStory: "अहिल्याबाई होळकरांनी प्रजेच्या कल्याणासाठी निर्णय घेताना करुणा आणि न्याय यांचा समतोल ठेवला. त्या संकटात घाबरल्या नाहीत; उलट शांतपणे परिस्थिती समजून योग्य पाऊल उचलले. त्यांचे व्यक्तिमत्त्व आईला शिकवते की भावनिक संवेदनशीलता आणि निर्णयक्षमता दोन्ही एकत्र शक्य आहेत. गर्भावस्थेत कुटुंब, आरोग्य आणि विश्रांती यांचा समतोल साधताना ही वृत्ती खूप उपयोगी पडते. बाळासाठी प्रेमळ, स्थिर आणि सजग वातावरण निर्माण करणे हेच या कथेतील प्रमुख बोध आहे.",
    moral: "करुणा आणि शहाणपणाचा समतोल आयुष्य समृद्ध करतो.",
  },
  {
    title: "समर्थ रामदासांचा आत्मविश्वास",
    summary: "स्वअनुशासन आणि सकारात्मक संकल्प यांमधून शक्ती मिळते.",
    fullStory: "समर्थ रामदासांनी शरीर-मन दोन्ही तंदुरुस्त ठेवण्यावर भर दिला. नियमित साधना, वेळेचे नियोजन आणि सकारात्मक संकल्प यामुळे कोणतीही अडचण पार करता येते, हा त्यांचा संदेश होता. गर्भवती आईसाठीही हा दृष्टिकोन महत्त्वाचा आहे—दररोज छोटे आरोग्यदायी नियम पाळल्यास मन स्थिर राहते. वेळेवर आहार, हलकी हालचाल, पुरेशी झोप आणि मन:शांती यांची जोड बाळाच्या विकासाला लाभदायक ठरते. छोट्या सातत्यपूर्ण सवयींचे मोठे परिणाम होतात, हे या कथेतून स्पष्ट होते.",
    moral: "नियमितता आणि संकल्प यातून आत्मविश्वास वाढतो.",
  },
  {
    title: "राम-सीतेचे धैर्य",
    summary: "आव्हानांमध्येही परस्पर आदर आणि विश्वास ठेवणे हीच खरी शक्ती.",
    fullStory: "रामायणातील अनेक प्रसंगांत राम आणि सीता यांनी संकटांमध्येही संयम आणि परस्पर विश्वास जपला. नात्यातील आदर, संवाद आणि धैर्य यामुळे कठीण परिस्थितीतही दिशा सापडते. गर्भावस्थेत जोडप्याने एकमेकांचे ऐकून घेणे, वेळ देणे आणि भावनिक आधार देणे महत्त्वाचे असते. लहान कृती—प्रेमाने बोलणे, विश्रांतीची काळजी घेणे, आणि सकारात्मक वातावरण ठेवणे—हे बाळाच्या मानसिक आरोग्यास पोषक ठरते. ही कथा कुटुंबातील एकोप्याची ताकद दाखवते.",
    moral: "विश्वास आणि संवाद कुटुंबाला मजबूत करतात.",
  },
];

const BHAKTIGEET_POOL = [
  {
    title: "पांडुरंगाच्या नामात रंगू या",
    suggestion: "विठ्ठल अभंग शैलीतील मृदू भजन, संध्याकाळी 10 मिनिटे.",
    lyrics: [
      "विठ्ठल विठ्ठल म्हणत जाऊ, मनामध्ये उजेड पेरू",
      "आईच्या श्वासात प्रेम भरू, बाळासाठी मंगल करू",
      "नाम तुझे गोड पांडुरंगा, चिंता सारी दूर होवो",
      "कृपेच्या छायेत माझे लेकरू, स्वस्थ-निरोगी वाढत राहो",
    ],
  },
  {
    title: "गणराया मंगलमूर्ती",
    suggestion: "गणेश स्तुतीचे शांत धून रूप, सकाळी प्रार्थनेवेळी.",
    lyrics: [
      "गणराया मंगलमूर्ती, काढ दारीचे सर्व विघ्न",
      "आई-बाळावर ठेव कृपा, सुखशांतीचा होवो यज्ञ",
      "ओंकाराची लय हृदयी, आशेचे दीप पेटती",
      "तुझ्या नावाने दिवस उजळे, आनंदाची फुले फुलती",
    ],
  },
  {
    title: "देवा तुझे किती सुंदर",
    suggestion: "सौम्य भक्तिगीत, रात्री झोपण्यापूर्वी मंद आवाजात.",
    lyrics: [
      "देवा तुझे किती सुंदर, आकाश-धरती गीत गाती",
      "माझ्या बाळाच्या प्रत्येक धडधडीला, तुझीच कृपा साथ द्याती",
      "शांत श्वासात तुझे स्मरण, मन माझे नित स्वच्छ होवो",
      "आईपणाच्या या प्रवासाला, तुझा आशीर्वाद लाभो",
    ],
  },
  {
    title: "श्रीराम जय राम जप",
    suggestion: "मंत्रजप धाटणीतील हळू गती ट्रॅक, ध्यानानंतर 8-10 मिनिटे.",
    lyrics: [
      "श्रीराम जय राम जय जय राम",
      "श्वासामध्ये तुझेच नाम",
      "मनी नांदो शांत धाम",
      "आई-बाळ राहो सुखधाम",
    ],
  },
  {
    title: "जय देवी दुर्गे",
    suggestion: "मातृशक्तीला समर्पित हलके स्तोत्र-भजन, सकाळी.",
    lyrics: [
      "जय देवी दुर्गे, करुणामयी अंबे",
      "आईच्या मनाला दे धैर्य नवं",
      "बाळाच्या भवितव्यास तुझा कवच राहो",
      "घराघरात प्रेमाचा सुगंध नांदो",
    ],
  },
  {
    title: "दत्त दिगंबर",
    suggestion: "दत्त भजनाची मंद लय, दुपारच्या विश्रांतीत.",
    lyrics: [
      "दत्त दिगंबर दैवत माझे",
      "शांत करावे मन हे आजे",
      "आई-बाळी सुखाचा वर्षाव",
      "तुझ्या स्मरणे होवो भावभाव",
    ],
  },
  {
    title: "हरी मुखे म्हणा",
    suggestion: "संत साहित्य प्रेरित सामूहिक/कौटुंबिक नामस्मरण, संध्याकाळी.",
    lyrics: [
      "हरी मुखे म्हणा, हरी मुखे म्हणा",
      "पुण्याची गणना कोण करी",
      "प्रेम, करुणा, शांतता नांदो",
      "आई-बाळी मंगल फुले फरी",
    ],
  },
];

const DETAILS_POOL = [
  "प्रत्येक श्वससह बाळाला आपल्या प्रेमाचा संदेश पाठवा - तो सर्वकाही समजतो.",
  "आईचे मूड आणि भावनांचा सरळ परिणाम बाळाच्या विकासावर होतो - खुश राहा!",
  "गर्भस्थ बाळा माता-पितांचे आवाज, संगीत आणि ताळी ऐकू शकतो - सकारात्मक बोला.",
  "पोषक आहार, पुरेशी झोप, व्यायाम यांचा समन्वय सुरक्षित गर्भावस्था सुनिश्चित करतो.",
  "तुमच्या शरीरात होण्या-या बदल हे प्रकृतीचे चमत्कार आहेत - त्यांचा आनंद घ्या.",
  "कुटुंबजनांच्या प्रेमाचा अनुभव घेणे बरेच मूल्यवान आहे.",
  "आय़ोडीन युक्त अन्नपदार्थ बाळाच्या मेंदूच्या विकासासाठी अपरिहार्य आहेत.",
  "रक्ताभिसरण आणि ऑक्सिजन सुचारू ठेवण्यासाठी हलके व्यायाम रोज करा.",
  "आईचे तणाव कमी करणे म्हणजे बाळाचे तणाव कमी करणे.",
  "प्रत्येक आठवड्याचा उत्सव साजरा करा - बाळ पुढे जातोय!",
  "संगीत बाळाच्या श्रवणशक्तीचा विकास करण्यास मदत करतो.",
  "स्त्रीरोग तज्ञाचे नियमित दर्शन आणि तपासण्यांचे महत्त्व कमी करू नका.",
  "अतिरिक्त कॅलोरीज घेणे - तुमचे शरीर दोघांसाठी अन्न तयार करत आहे.",
  "व्यक्तिगत स्वच्छता गर्भावस्थेच्या अनेक समस्या दूर करते.",
  "आईच्या स्पर्श आणि प्रेम हे बाळाच्या जीवनाचे पहिले पाठ आहेत.",
  "कॅल्शियम, लोह आणि प्रोटीन यांचा संतुलन महत्त्वपूर्ण आहे.",
  "भावनिक संतुलन सुरक्षित गर्भावस्थेचे सोने आहे.",
  "नकारात्मक विचारांपासून दूर राहा - विचारांचा ऊर्जा बाळापर्यंत पोहोचतो.",
  "गर्भावस्थेतील प्रत्येक क्षण अनमोल आहे - याची कदर करा.",
  "मातृत्व सर्वश्रेष्ठ योग आहे - शरीर, मन आणि आत्मा एकसाठी काम करतात.",
  "बाळाशी दैनिक संवाद करा - प्रेमाचे शब्द कधीही थक येणारे नाहीत.",
  "हलकी हालचाल आणि श्वसन तंत्र तणाव दोन्ही कमी करतात.",
  "गर्भसंस्कारात शब्द, संगीत, विचार आणि आहार यांचा परिणाम होतो.",
  "दररोज ठरलेल्या वेळी ध्यान केल्यास मानसिक स्थैर्य वाढते.",
  "रात्रीची झोप हे गर्भसंस्काराचे महत्त्वाचे भाग आहेत.",
  "प्रार्थना आणि कृतज्ञता तणाव कमी करण्यास मदत करतात.",
  "आहारातील सात्त्विकता शरीर-मन संतुलन ठेवते.",
  "निसर्गसंपर्क आणि सूर्यप्रकाश आईची ऊर्जा वाढवतात.",
];

const COUPLE_ACTIVITY_POOL = [
  "दोघांनी 15 मिनिटे चालत आजची कृतज्ञता एकमेकांना सांगा.",
  "बाळाला उद्देशून 5 प्रेमळ वाक्ये दोघांनी आलटून-पालटून बोला.",
  "एकत्र बसून पुढील 3 दिवसांची आरोग्य योजना लिहा.",
  "एकमेकांच्या भावना न अडवता 10 मिनिटे फक्त ऐकण्याचा वेळ ठेवा.",
  "जोडीने बाळासाठी छोटा आशिर्वाद-पत्र लिहा.",
  "संध्याकाळी 10 मिनिटे हसरे संवाद आणि हलका खेळ करा.",
  "एकत्र प्रार्थना करून दिवसाचा शेवट करा.",
  "घरातील एक छोटा कोपरा ‘शांत वेळ’साठी सजवा.",
  "एकत्र श्वसन 20 चक्र करा आणि नंतर पाणी प्या.",
];

const READING_POOL = [
  "रामरक्षा स्तोत्रातील निवडक ओळी अर्थासह वाचा.",
  "ज्ञानेश्वरीतील शांततेवरील एक परिच्छेद वाचा.",
  "संत तुकारामांचा एक अभंग अर्थासह वाचा.",
  "शिवचरित्रातील प्रेरणादायी छोटा प्रसंग वाचा.",
  "भगवद्गीतेतील समत्वाचा एक श्लोक वाचा.",
  "संत जनाबाईंच्या भक्तीविषयी छोटा लेख वाचा.",
  "मराठी मातृत्व-विषयक प्रेरणादायी लेख 10 मिनिटे वाचा.",
  "प्रार्थना संग्रहातून 1 प्रार्थना वाचा आणि अर्थ समजून घ्या.",
  "बालसंस्कारावर आधारित मराठी कथा परिवारासोबत वाचा.",
];

const ROUTINE_MUSIC_POOL = [
  "राग भूपवर आधारित बासरी ट्रॅक 12 मिनिटे ऐका.",
  "ओंकार जपाचा मृदू ध्वनी 10 मिनिटे ऐका.",
  "विठ्ठल अभंगाचे मंद गती रूप ऐका.",
  "वीणा/सितार ध्यान संगीत 15 मिनिटे ऐका.",
  "गायत्री मंत्राचा सौम्य जप 11 मिनिटे ऐका.",
  "राग यमनची शांत लय संध्याकाळी ऐका.",
  "लोरी-शैलीतील वाद्यसंगीत झोपण्यापूर्वी ऐका.",
  "तंबोरा ड्रोन + बासरी संयोजन 10 मिनिटे ऐका.",
  "मृदू तबला-फ्लूट फ्यूजन ध्यानाने ऐका.",
];

const HABIT_POOL = [
  "सकाळचे पहिले 30 मिनिटे मोबाइल-मुक्त ठेवा.",
  "जेवताना स्क्रीन न वापरता mindful eating करा.",
  "रात्री झोपण्याच्या 1 तास आधी स्क्रीन बंद करा.",
  "दिवसात 3 वेळा 5 दीर्घ श्वास घेण्याची सवय लावा.",
  "वेळेवर पाणी पिण्यासाठी छोटा रिमाइंडर सेट करा.",
  "हलका संध्याकाळी फेरफटका दररोज ठरवा.",
  "कॅफिनचे प्रमाण कमी करून कोमट पाणी वाढवा.",
  "रात्री उशिराचे खाणे टाळा.",
  "दररोज 5 मिनिटे कृतज्ञता जर्नल लिहा.",
];

const YOGA_POOL = [
  "मार्जारी-व्याघ्र हलका प्रकार + बद्धकोणासन + श्वसन (18 मिनिटे).",
  "ताडासन सपोर्टसह + शशांकासन सौम्य + शवासन (20 मिनिटे).",
  "खांदा-मान स्ट्रेच + अनुलोम-विलोम + विश्रांती (15 मिनिटे).",
  "खुर्ची-सपोर्ट योग स्ट्रेच + डायफ्रॅग्मॅटिक ब्रिदिंग (16 मिनिटे).",
  "हलका वॉक + पेल्विक रिलॅक्स मूव्हमेंट + दीर्घ श्वसन (20 मिनिटे).",
  "बाजूने स्ट्रेच + मांडी-नितंब हलकी हालचाल + शवासन (18 मिनिटे).",
  "श्वसन लयाभ्यास 4-6 पॅटर्न + भ्रामरी (डॉक्टर सल्ल्यानुसार).",
  "सौम्य पूर्ण-शरीर स्ट्रेच + ध्यान बसणे (20 मिनिटे).",
  "दिवसभरातील कडकपणा कमी करणारी 3 मायक्रो-योग ब्रेक्स.",
];

const DIET_POOL = [
  "भिजवलेले बदाम, खजूर आणि तुपाची हलकी खिचडी.",
  "पालक डाळ, ज्वारी/नाचणी भाकरी आणि ताक.",
  "डाळिंब, उकडलेले हरभरे आणि भाज्यांचे सूप.",
  "मेथी-पालक थालीपीठ, दही आणि फळ.",
  "बीट-गाजर सूप, मूग डाळ आणि तूप-फुलका.",
  "नारळपाणी, मटकी उसळ आणि तांदूळ भात.",
  "तीळ-गूळ लाडू (मर्यादित), हिरवी भाजी आणि डाळ.",
  "रागी पेज, भोपळ्याच्या बिया आणि पपई/हंगामी फळ.",
  "घरी बनवलेली सात्त्विक थाळी: डाळ, भाजी, भात, तूप.",
];

const MEDITATION_POOL = [
  "10 मिनिटे दीर्घ श्वसन करत बाळाशी प्रेमळ संवाद करा.",
  "बॉडी-स्कॅन ध्यान: पायापासून शिरोभागापर्यंत शांत लक्ष द्या.",
  "हृदय-कृतज्ञता ध्यान: प्रत्येक श्वासासोबत ‘धन्यवाद’ म्हणा.",
  "मंत्र-श्वसन: मनात ‘ॐ’ जपत 12 मिनिटे ध्यान करा.",
  "Guided visualization: आई-बाळ निरोगी असल्याची प्रतिमा डोळ्यांसमोर आणा.",
  "4-6 श्वसन तंत्र 20 चक्र आणि शांत बसणे.",
  "नाडीशुद्धी श्वसनानंतर 8 मिनिटे मौन ध्यान करा.",
  "मऊ संगीतासोबत श्वासावर लक्ष केंद्रित करा.",
  "संकल्प ध्यान: पुढील दिवसासाठी एक सकारात्मक संकल्प घ्या.",
];

const MAIN_ACTIVITY_POOL = [
  "आज जोडीने 11 वेळा ‘ॐ’ उच्चार करा आणि नंतर बाळाशी बोला.",
  "आज संध्याकाळी एक अभंग शांतपणे म्हणत 5 मिनिटे ध्यान करा.",
  "आज कुटुंबासोबत 10 मिनिटे सकारात्मक संभाषणाचा वेळ ठेवा.",
  "आज आईने स्वतःसाठी 20 मिनिटे विश्रांती आणि श्वसनासाठी राखून ठेवा.",
  "आज बाळासाठी प्रेमपत्र लिहा आणि मोठ्याने वाचा.",
  "आज हलका फेरफटका + प्रार्थना + कृतज्ञता नोट असा क्रम ठेवा.",
  "आज झोपण्यापूर्वी मंत्रजप 108 वेळा मनात करा.",
  "आज आई-वडिलांनी एकत्रित आरोग्य संकल्प लिहा.",
  "आज ‘शांत श्वास, शांत विचार’ सराव 12 मिनिटे करा.",
];

function getDaySeed(week, date = new Date()) {
  const d = new Date(date);
  const yearStart = new Date(d.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((d - yearStart) / (1000 * 60 * 60 * 24));
  return (dayOfYear * 13) + (week * 7);
}

function pickFromPool(pool, seed, offset = 0) {
  if (!pool?.length) return null;
  const idx = Math.abs(seed + offset) % pool.length;
  return pool[idx];
}

export function getDailyShloka(date = new Date()) {
  const dayKey = new Date(date).toISOString().slice(0, 10);
  const seed = hashString(dayKey);
  return pickFromPool(SHLOKA_POOL, seed, 11);
}

export function getDailyGeetaShlok(date = new Date()) {
  const dayKey = new Date(date).toISOString().slice(0, 10);
  const seed = hashString(dayKey);
  return pickFromPool(GARBH_GEETA_POOL, seed, 41);
}

function getSeededUniqueItems(pool, seed, count, startOffset = 0) {
  if (!pool?.length || count <= 0) return [];
  const seen = new Set();
  const result = [];
  let offset = startOffset;

  while (result.length < count && seen.size < pool.length) {
    const idx = Math.abs(seed + offset) % pool.length;
    if (!seen.has(idx)) {
      seen.add(idx);
      result.push(pool[idx]);
    }
    offset += 1;
  }

  return result;
}

function buildDailyRoutine(seed) {
  return {
    coupleActivity: pickFromPool(COUPLE_ACTIVITY_POOL, seed, 1),
    reading: pickFromPool(READING_POOL, seed, 2),
    musicSuggestion: pickFromPool(ROUTINE_MUSIC_POOL, seed, 3),
    habitImprovement: pickFromPool(HABIT_POOL, seed, 4),
    plannerYoga: pickFromPool(YOGA_POOL, seed, 5),
    fertilityBoosterDiet: pickFromPool(DIET_POOL, seed, 6),
    guidedMeditation: pickFromPool(MEDITATION_POOL, seed, 7),
  };
}

export async function fetchGarbhSanskar(week) {
  const today = new Date();
  const todayLabel = today.toLocaleDateString("mr-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const seed = getDaySeed(week, today);
  const dailyShloka = pickFromPool(SHLOKA_POOL, seed, 11);
  const dailyMusic = pickFromPool(MUSIC_POOL, seed, 13);
  const dailyStory = pickFromPool(STORY_POOL, seed, 17);
  const dailyBhaktiGeet = pickFromPool(BHAKTIGEET_POOL, seed, 19);
  const dailyDetails = getSeededUniqueItems(DETAILS_POOL, seed, 3, 21);
  const dailyRoutine = buildDailyRoutine(seed);
  const dailyMainActivity = pickFromPool(MAIN_ACTIVITY_POOL, seed, 25);

  const fallback = {
    title: "गर्भसंस्कार",
    dayLabel: todayLabel,
    shloka: dailyShloka,
    music: dailyMusic,
    story: dailyStory,
    bhaktiGeet: dailyBhaktiGeet,
    details: dailyDetails,
    dailyRoutine,
    meditation: "शांतपणे डोळे मिटा. बाळाची कल्पना करा. प्रेमाने श्वास घ्या.",
    activity: dailyMainActivity,
    sourceNote: "पारंपरिक भारतीय गर्भसंस्कार तत्त्वे आणि समग्र आरोग्य दृष्टिकोनातून प्रेरित मार्गदर्शन.",
  };

  const prompt = `आज ${todayLabel} आहे. गर्भावस्थेच्या ${week}व्या आठवड्यासाठी आजच्या दिवसानुसार बदलणारी गर्भसंस्कार माहिती द्या.
मार्गदर्शन पारंपरिक भारतीय गर्भसंस्कार तत्त्वे आणि समग्र पद्धती (उदा. डॉ. बाळाजी तांबे यांच्या शैलीतील सर्वांगीण दृष्टिकोन) यांच्याशी सुसंगत असावे.
आजचा seed ${seed} वापरून आजचा मजकूर कालपेक्षा वेगळा आणि उद्यापेक्षा वेगळा ठेवा.
Return ONLY this JSON:
{
  "title": "गर्भसंस्कार - आठवडा ${week}",
  "dayLabel": "आजचा दिवस (उदा: सोमवार, २५ मार्च)",
  "shloka": {
    "text": "संस्कृत श्लोक",
    "meaning": "मराठी अर्थ",
    "source": "स्रोत (उदा: ऋग्वेद)"
  },
  "music": {
    "raga": "राग किंवा संगीत प्रकार",
    "benefit": "फायदा",
    "time": "कधी ऐकावे"
  },
  "story": {
    "title": "कथेचे शीर्षक",
    "summary": "कथेचा छोटा सारांश (१-२ वाक्ये)",
    "fullStory": "पूर्ण कथा (किमान 120-180 शब्द, सलग आणि अर्थपूर्ण)",
    "moral": "बोध"
  },
  "bhaktiGeet": {
    "title": "आजचे मराठी भक्तिगीत शीर्षक",
    "suggestion": "गायन/ऐकण्याची सुचवणी (वेळ + पद्धत)",
    "lyrics": ["ओळ 1", "ओळ 2", "ओळ 3", "ओळ 4"]
  },
  "details": [
    "गर्भसंस्काराची सविस्तर मार्गदर्शक टिप १",
    "गर्भसंस्काराची सविस्तर मार्गदर्शक टिप २",
    "गर्भसंस्काराची सविस्तर मार्गदर्शक टिप ३"
  ],
  "dailyRoutine": {
    "coupleActivity": "आजचा जोडी उपक्रम",
    "reading": "आजचे वाचन",
    "musicSuggestion": "आजचे संगीत सुचवणी",
    "habitImprovement": "आजची सवय सुधारणा",
    "plannerYoga": "आजचे योग नियोजन",
    "fertilityBoosterDiet": "आजचा पौष्टिक आहार",
    "guidedMeditation": "आजचे मार्गदर्शित ध्यान"
  },
  "meditation": "ध्यान/विचार (२-३ वाक्ये)",
  "activity": "आजचा गर्भसंस्कार उपक्रम (भक्तिगीत/ध्यान/जोडी उपक्रमाचा विशिष्ट daily task)",
  "sourceNote": "मार्गदर्शनाची प्रेरणा एक वाक्यात"
}`;

  try {
    const text = await callContent(MARATHI_SYSTEM, prompt);
    const parsed = safeParseJSON(text);
    if (!parsed) return fallback;

    return {
      ...fallback,
      ...parsed,
      shloka: { ...fallback.shloka, ...(parsed.shloka || {}) },
      music: { ...fallback.music, ...(parsed.music || {}) },
      story: { ...fallback.story, ...(parsed.story || {}) },
      bhaktiGeet: {
        ...fallback.bhaktiGeet,
        ...(parsed.bhaktiGeet || {}),
        lyrics: Array.isArray(parsed?.bhaktiGeet?.lyrics) && parsed.bhaktiGeet.lyrics.length
          ? parsed.bhaktiGeet.lyrics
          : fallback.bhaktiGeet.lyrics,
      },
      details: Array.isArray(parsed.details) && parsed.details.length ? parsed.details : fallback.details,
      dailyRoutine: { ...fallback.dailyRoutine, ...(parsed.dailyRoutine || {}) },
      dayLabel: parsed.dayLabel || fallback.dayLabel,
      sourceNote: parsed.sourceNote || fallback.sourceNote,
    };
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Baby Names — Rashi / Nakshatra based
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchBabyNames(rashi, nakshatra, gender) {
  const genderText = gender === "boy" ? "मुलगा" : gender === "girl" ? "मुलगी" : "मुलगा आणि मुलगी दोन्ही";
  const preferredLetters = getPreferredLetters({ nakshatra }).join(", ");
  const prompt = `${rashi} राशी आणि ${nakshatra} नक्षत्रासाठी ${genderText}साठी मराठी/संस्कृत नावे सुचवा.
शक्य असल्यास ${preferredLetters || "योग्य पारंपरिक अक्षरां"}पासून सुरू होणारी नावे द्या.
प्रत्येक विनंतीसाठी वेगळी, अर्थपूर्ण आणि पुनरावृत्ती नसलेली नावे द्या.
Return ONLY this JSON with at least 12 names:
{
  "names": [
    {
      "name": "नाव देवनागरीत",
      "english": "English spelling",
      "meaning": "संपूर्ण मराठी अर्थ",
      "origin": "संस्कृत किंवा मराठी",
      "numerology": "अंक (1-9)",
      "famous": "या नावाची प्रसिद्ध व्यक्ती (नसल्यास रिकामे ठेवा)",
      "gender": "boy किंवा girl किंवा unisex"
    }
  ]
}`;

  try {
    const text = await callContent(MARATHI_SYSTEM, prompt);
    const parsed = safeParseJSON(text);
    return sanitizeNameResults(parsed, { gender, nakshatra, rashi, min: 12 });
  } catch {
    return { names: getFallbackNames({ gender, nakshatra, rashi, min: 12 }) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Baby Names — Browse by alphabet letter
// ─────────────────────────────────────────────────────────────────────────────
export async function browseBabyNames(letter, gender, origin) {
  const genderText = gender === "boy" ? "मुलगा" : gender === "girl" ? "मुलगी" : "मुलगा आणि मुलगी दोन्ही";
  const prompt = `'${letter}' अक्षराने सुरू होणारी ${genderText}साठी ${origin} नावे सुचवा.
दिलेल्या अक्षराशी स्पष्ट जुळणारीच नावे द्या. तीच-तीच सामान्य नावे परत करू नका.
Return ONLY this JSON with at least 15 names:
{
  "names": [
    {
      "name": "नाव देवनागरीत",
      "english": "English spelling",
      "meaning": "संपूर्ण मराठी अर्थ",
      "origin": "संस्कृत किंवा मराठी",
      "numerology": "अंक (1-9)",
      "famous": "प्रसिद्ध व्यक्ती (नसल्यास रिकामे ठेवा)",
      "gender": "boy किंवा girl किंवा unisex"
    }
  ]
}`;

  try {
    const text = await callContent(MARATHI_SYSTEM, prompt);
    const parsed = safeParseJSON(text);
    return sanitizeNameResults(parsed, { letter, gender, origin, min: 15, strictByLetter: true });
  } catch {
    return { names: getFallbackNames({ letter, gender, origin, min: 15, strictByLetter: true }) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Garbh Katha (Traditional pregnancy stories)
// ─────────────────────────────────────────────────────────────────────────────
const GARBH_KATHA_POOL = [
  {
    id: "abhimanyu",
    title: "अभिमन्यू गर्भकथा",
    era: "महाभारत",
    summary: "गर्भात असतानाच अभिमन्यूने चक्रव्यूह भेदण्याची विद्या ऐकली, असे पारंपरिक कथन आहे.",
    fullStory: "महाभारतातील पारंपरिक कथेनुसार, अर्जुनाने सुभद्रेला चक्रव्यूह भेदण्याची रचना सांगत असताना गर्भातील अभिमन्यू ते एकाग्रतेने ऐकत होता. कथा सांगते की तो प्रवेश करण्याची पद्धत समजला, परंतु कथन अर्धवट राहिल्याने बाहेर येण्याची पद्धत पूर्ण ऐकू आली नाही. पुढे युद्धभूमीवर अभिमन्यूने विलक्षण धैर्य दाखवले आणि कठीण परिस्थितीतही पराक्रम, निष्ठा आणि कर्तव्य निभावले. या कथेतून गर्भसंस्काराचा भावार्थ असा घेतला जातो की आई जे ऐकते, बोलते आणि अनुभवते त्याचे सूक्ष्म तरंग गर्भापर्यंत पोहोचतात. म्हणून गर्भावस्थेत शांत कथन, सकारात्मक शब्द, आणि आत्मविश्वास देणारे संवाद हे बाळाच्या भावविश्वाला आधार देतात.",
    moral: "गर्भातील बाळ आईचे शब्द, भावना आणि वातावरण यांचा सूक्ष्म प्रभाव घेत असते.",
    practice: "आज 7 मिनिटे शांत बसून बाळाशी प्रेमाने बोला: ‘तू धैर्यवान, शहाणा आणि शांत आहेस.’",
  },
  {
    id: "krishna",
    title: "श्रीकृष्ण जन्मपूर्व कथा",
    era: "भागवत",
    summary: "मातेच्या मनातील श्रद्धा, प्रार्थना आणि विश्वास यांनी कठीण परिस्थितीतही आशेचा दीप जिवंत ठेवला.",
    fullStory: "भागवत परंपरेत श्रीकृष्णाच्या जन्मकथेत संकट, भीती आणि अनिश्चितता असतानाही माता-पित्यांनी श्रद्धा आणि धैर्य टिकवले, असा संदेश मिळतो. देवकीच्या अंतर्मनातील प्रार्थना, कंसाच्या भीतीतही आशेचा धागा न सोडणे, आणि जीवनरक्षणासाठी घेतलेले शांत व विचारपूर्वक निर्णय — हे या कथेतले प्रमुख संस्कार आहेत. या कथेला गर्भसंस्काराच्या दृष्टीने पाहिल्यास, आईच्या मनातील विश्वास आणि स्थैर्य बाळासाठी सुरक्षित भावनिक वातावरण निर्माण करतात. ताणतणावाच्या क्षणीही श्वासावर लक्ष देणे, देवस्मरण, आणि प्रेमळ संवाद यामुळे मन संतुलित राहते. श्रीकृष्णकथा आपल्याला शिकवते की अंधारातही आशेचा प्रकाश ठेवला तर पुढील प्रवास अधिक दृढतेने करता येतो.",
    moral: "आईचे अंतर्मन स्थिर असेल तर बाळासाठी सुरक्षित भावनिक पाया तयार होतो.",
    practice: "रात्री 5 मिनिटे दीर्घ श्वसन करून ‘ॐ नमो भगवते वासुदेवाय’चा मृदू जप करा.",
  },
  {
    id: "rama",
    title: "रामकथा – आदर्श मूल्यांचा संस्कार",
    era: "रामायण",
    summary: "रामकथा सत्य, संयम, कर्तव्य आणि आदर्श आचरण यांचे बळ देते.",
    fullStory: "रामायणातील रामकथा ही केवळ इतिहासकथा नसून मूल्यसंस्काराची शाळा आहे. श्रीरामांच्या जीवनात सत्यनिष्ठा, कर्तव्यपालन, नम्रता, मोठ्यांचा आदर आणि वचनपूर्ती या गुणांचे सातत्य दिसते. कठीण प्रसंग आले तरी उतावळेपणा न करता संयमाने योग्य निर्णय घेणे — हा या कथेतला मध्यवर्ती संदेश आहे. गर्भसंस्काराच्या संदर्भात या कथेतून आईला सकारात्मक जीवनमूल्ये रोजच्या दिनचर्येत आणण्याची प्रेरणा मिळते. घरी शांत भाषा, परस्पर आदर, नियमीत प्रार्थना आणि कृतज्ञता यामुळे घरचे वातावरण उबदार व स्थिर होते. असे वातावरण बाळाच्या मानसिक, भावनिक आणि सांस्कृतिक विकासासाठी पोषक मानले जाते.",
    moral: "गर्भसंस्कारात मूल्याधारित कथा मनाला दिशा देतात आणि सकारात्मक विचार वाढवतात.",
    practice: "आज ‘सत्य, संयम, करुणा’ ही 3 मूल्ये लिहा आणि बाळाला मोठ्याने वाचा.",
  },
  {
    id: "sita",
    title: "सीता माता – धैर्य आणि शांत सामर्थ्य",
    era: "रामायण",
    summary: "सीता मातेची कथा कठीण प्रसंगातही अंतरीची शांतता, स्वाभिमान आणि श्रद्धा टिकवण्याची प्रेरणा देते.",
    fullStory: "सीता मातेचे चरित्र धैर्य, पवित्रता, स्वाभिमान आणि अंतरिक शांततेचे प्रतीक मानले जाते. आव्हानात्मक परिस्थितीतही त्यांनी संतुलित मन, श्रद्धा आणि आत्मविश्वास कायम ठेवला. ही कथा सांगते की खरी शक्ती केवळ बाह्य सामर्थ्यात नसून मनाच्या स्थैर्यात असते. गर्भवती आईसाठी हा संदेश अत्यंत महत्त्वाचा आहे: भावनिक चढ-उतारांच्या काळात स्वतःशी प्रेमळ वागणे, शांत श्वसन करणे, आणि अंतर्मनाला आधार देणारे विचार निवडणे. सीता मातेच्या कथेतून शिकवण अशी मिळते की मृदुता आणि ठामपणा एकत्र राहू शकतात. आईचे हे संतुलित व्यक्तिमत्त्व बाळासाठी सुरक्षित आणि विश्वासार्ह भावविश्व तयार करते.",
    moral: "आईचे भावनिक संतुलन बाळासाठी स्थैर्याचे वातावरण तयार करते.",
    practice: "आज 10 मिनिटे ‘कृतज्ञता ध्यान’ करा आणि स्वतःबद्दल 3 सकारात्मक वाक्ये म्हणा.",
  },
  {
    id: "hanuman",
    title: "हनुमानकथा – बल, बुद्धी आणि भक्ती",
    era: "रामायण",
    summary: "हनुमानाच्या कथेत निडरता, सेवाभाव आणि एकाग्रता यांचे सुंदर उदाहरण दिसते.",
    fullStory: "हनुमानजींच्या कथेत शरीरबलाइतकेच मनोबल, नम्रता आणि भक्तिभाव यांना महत्त्व दिले जाते. त्यांनी प्रत्येक कार्य ‘सेवा’ म्हणून केले — अहंकाराशिवाय, पण पूर्ण एकाग्रतेने. संकटकाळात घाबरून न जाता ध्येयावर लक्ष ठेवणे, योग्य मार्गदर्शन स्वीकारणे, आणि सातत्य राखणे हे गुण त्यांच्या चरित्रातून स्पष्ट होतात. गर्भसंस्काराच्या दृष्टीने या कथेतून आईला ‘शांत शक्ती’चा संदेश मिळतो: नियमित श्वसन, सौम्य हालचाल, प्रार्थना, आणि सकारात्मक आत्मसंवाद. दिवसातल्या छोट्या सवयी — जसे दीर्घ श्वास, सौम्य मंत्रजप, आणि प्रेमळ बोलणे — मनाला स्थिर करतात. स्थिर मनातूनच बाळासाठी सुरक्षित ऊर्जा आणि सांत्वनाचा प्रवाह निर्माण होतो.",
    moral: "शांत श्वास, मजबूत मन आणि सेवाभाव गर्भसंस्काराचा महत्त्वाचा भाग ठरू शकतो.",
    practice: "सकाळी 11 दीर्घ श्वास घेऊन ‘हनुमान चालिसेतील’ 2 ओळी शांतपणे ऐका/वाचा.",
  },
  {
    id: "luv-kush",
    title: "लव-कुश गर्भकथा",
    era: "रामायण उत्तरकांड परंपरा",
    summary: "लव-कुशांच्या कथेत शिक्षण, संगीत, शौर्य आणि विनम्रता यांचे संतुलन दिसते.",
    fullStory: "लव-कुशांच्या परंपरागत कथांमध्ये संस्कारयुक्त शिक्षण, संगीत, स्मरणशक्ती, आणि शौर्य यांचा सुंदर संगम दिसतो. संतुलित मार्गदर्शन, नियमित अभ्यास, गुरुजनांचा सन्मान आणि नम्र वाणी यामुळे त्यांच्या व्यक्तिमत्त्वात तेज आणि स्थैर्य निर्माण झाले, असे वर्णन आढळते. या कथेला गर्भसंस्काराच्या संदर्भात पाहिले तर आईने गर्भावस्थेत ऐकलेले संगीत, वाचलेल्या कथा, आणि घरातील संवाद यांचा एकत्रित परिणाम महत्त्वाचा मानला जातो. म्हणूनच सातत्यपूर्ण चांगले वाचन, मृदू संगीत, आणि प्रेमळ संभाषण या तीन गोष्टी गर्भसंस्कारात उपयुक्त ठरतात. लव-कुशकथा सांगते की ज्ञान आणि विनम्रता यांचे संतुलनच खऱ्या संस्कारांची ओळख आहे.",
    moral: "गर्भावस्थेत ज्ञान, संगीत आणि सुसंवाद यांचा सातत्याने सराव लाभदायक ठरतो.",
    practice: "आज 8 मिनिटे मुलांसाठी उपयुक्त संस्कारकथा किंवा स्तोत्र मृदू स्वरात वाचा.",
  },
];

export async function fetchGarbhKatha(week) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const todayLabel = today.toLocaleDateString("mr-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const seed = hashString(todayKey);
  const currentStory = pickFromPool(GARBH_KATHA_POOL, seed, 31);
  const stories = getSeededUniqueItems(GARBH_KATHA_POOL, seed, 6, 37);

  return {
    title: "गर्भकथा",
    subtitle: "Story of the Day",
    dayLabel: todayLabel,
    source: "सांस्कृतिक कथा परंपरा (प्रेरणादायी संदर्भ)",
    referenceUrl: "https://www.youtube.com/watch?v=YP86rdFNET0",
    currentStory,
    stories,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Garbh Geeta (Bhagavad Gita inspired detailed guidance)
// ─────────────────────────────────────────────────────────────────────────────
const GARBH_GEETA_POOL = [
  {
    id: "2-47",
    chapter: "अध्याय २",
    verse: "श्लोक ४७",
    sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
    transliteration: "karmaṇy-evādhikāras te mā phaleṣu kadācana",
    meaningMarathi: "तुझा अधिकार कर्म करण्यावर आहे; फळावर नाही. म्हणून निराश न होता कर्तव्य करत राहावे.",
    pregnancyInsight: "गर्भावस्थेत रोजच्या छोट्या सवयी — योग्य आहार, विश्रांती, शांत श्वसन — यांवर लक्ष केंद्रित करा; त्वरित परिणामाची चिंता कमी करा.",
    dailyPractice: "आज 10 मिनिटे ‘मी माझे योग्य कर्म प्रेमाने करते’ हा संकल्प जपा.",
  },
  {
    id: "2-14",
    chapter: "अध्याय २",
    verse: "श्लोक १४",
    sanskrit: "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः। आगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥",
    transliteration: "mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ",
    meaningMarathi: "उष्ण-शीत, सुख-दुःख हे येतात-जातात; ते अनित्य आहेत. धैर्याने सहन करावे.",
    pregnancyInsight: "मूड बदल, थकवा, शारीरिक अस्वस्थता हे टप्प्याटप्प्याने बदलतात. ही अवस्था कायमची नाही हे लक्षात ठेवणे मानसिक स्थैर्य वाढवते.",
    dailyPractice: "श्वास घेताना ‘शांत’, सोडताना ‘स्थिर’ असा 5 मिनिटांचा सराव करा.",
  },
  {
    id: "6-5",
    chapter: "अध्याय ६",
    verse: "श्लोक ५",
    sanskrit: "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्। आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥",
    transliteration: "uddhared ātmanātmānaṁ nātmānam avasādayet",
    meaningMarathi: "स्वतःच्या मनाला उन्नत करावे; स्वतःला खचू देऊ नये. मनच मित्रही असते आणि शत्रूही.",
    pregnancyInsight: "स्वतःशी कसे बोलता याचा थेट परिणाम भावनिक आरोग्यावर होतो. प्रेमळ self-talk गर्भकाल अधिक संतुलित ठेवतो.",
    dailyPractice: "आरशासमोर 3 सकारात्मक वाक्ये म्हणा: ‘मी सक्षम आहे, मी सुरक्षित आहे, माझे बाळ सुरक्षित आहे.’",
  },
  {
    id: "12-13",
    chapter: "अध्याय १२",
    verse: "श्लोक १३",
    sanskrit: "अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च। निर्ममो निरहङ्कारः समदुःखसुखः क्षमी॥",
    transliteration: "adveṣṭā sarva-bhūtānāṁ maitraḥ karuṇa eva ca",
    meaningMarathi: "जो सर्वांशी मैत्री, करुणा, नम्रता आणि क्षमा ठेवतो तो प्रिय होतो.",
    pregnancyInsight: "घरातील शांत, करुणामय संवाद आईचा ताण कमी करतो आणि बाळासाठी भावनिक सुरक्षितता निर्माण करतो.",
    dailyPractice: "आज किमान एका व्यक्तीशी जाणूनबुजून सौम्य आणि कृतज्ञतेने बोला.",
  },
  {
    id: "17-14",
    chapter: "अध्याय १७",
    verse: "श्लोक १४",
    sanskrit: "देवद्विजगुरुप्राज्ञपूजनं शौचमार्जवम्। ब्रह्मचर्यमहिंसा च शारीरं तप उच्यते॥",
    transliteration: "deva-dvija-guru-prājña-pūjanaṁ śaucam ārjavam",
    meaningMarathi: "शुचिता, साधेपणा, अहिंसा आणि आदरयुक्त आचरण हे शरीरसंबंधी तप मानले जाते.",
    pregnancyInsight: "दिनचर्येत स्वच्छता, सौम्य हालचाल, संयमित आहार आणि शांत वाणी ठेवल्यास शरीर-मन दोन्ही संतुलित राहतात.",
    dailyPractice: "आज ‘सात्त्विक दिवस’ पाळा: स्वच्छ आहार, पुरेसे पाणी, आणि हलकी चाल.",
  },
  {
    id: "18-66",
    chapter: "अध्याय १८",
    verse: "श्लोक ६६",
    sanskrit: "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज। अहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥",
    transliteration: "sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja",
    meaningMarathi: "भीती सोडून श्रद्धेने समर्पण केल्यास मनाला आधार आणि निश्चिंतता मिळते.",
    pregnancyInsight: "गर्भावस्थेत सर्व गोष्टी नियंत्रित ठेवण्याचा ताण कमी करून विश्वास, प्रार्थना आणि स्वीकार यांवर भर दिल्यास मानसिक आराम मिळतो.",
    dailyPractice: "झोपण्यापूर्वी 5 मिनिटे प्रार्थना करा आणि दिवसातील 3 कृतज्ञता नोंदी लिहा.",
  },
];

const GARBH_GEETA_REF_TRANSLATED = [
  {
    title: "आत्मा, जन्म आणि कर्म यांचा विचार",
    detail: "हिंदी गर्भ-गीता संदर्भातील मुख्य भाव असा दिसतो की जीवन केवळ शरीरापुरते मर्यादित नाही; कर्मांचे परिणाम मन, कुटुंब आणि पुढील पिढीवरही उमटतात. गर्भावस्थेत आईचे विचार, वाणी आणि आचरण हे संस्काराचे माध्यम बनतात. म्हणून भीतीपेक्षा जागरूकता, दोषारोपापेक्षा आत्मपरीक्षण, आणि अस्थिरतेपेक्षा शांत कर्तव्य या दिशेने चालणे उपयुक्त ठरते.",
  },
  {
    title: "मातेचे संस्कार म्हणजे पहिली शाळा",
    detail: "संदर्भातील ‘माता ही संस्कारदात्री’ या विचाराचा अर्थ असा की गर्भकाल हा बाळाच्या भावविश्वाची बीजे पेरण्याचा काळ आहे. आईचा बोलण्याचा सूर, घरातील वातावरण, प्रार्थना, वाचन, संगीत आणि प्रेमळ स्पर्श — या सर्वांचा एकत्रित प्रभाव पडतो. म्हणून घरी शुद्ध भाषा, सौम्य संवाद आणि सद्भाव यांना जाणीवपूर्वक महत्त्व द्यावे.",
  },
  {
    title: "स्त्री-सन्मान आणि कुटुंबधर्म",
    detail: "हिंदी मजकुरात स्त्रियांच्या सन्मानावर मोठा भर आहे. मराठी मांडणीचा संदेश असा: गर्भवती स्त्रीचा आदर, भावनिक आधार, आणि निर्णयांमध्ये तिचा सन्मान हा कुटुंबाचा धर्म आहे. जिथे सन्मान, सहानुभूती आणि सहकार्य असते तिथे तणाव कमी होतो आणि बाळासाठी निरोगी वातावरण निर्माण होते.",
  },
  {
    title: "वृद्धांचा आदर आणि सेवा",
    detail: "संदर्भात वृद्धसेवेचे महत्त्व वारंवार येते. याचा व्यवहार्य अर्थ: ज्येष्ठांच्या अनुभवाचा मान, त्यांच्याशी संयमी वागणूक, आणि सेवाभाव हे घरातील संस्कृती मजबूत करतात. गर्भावस्थेत आईसाठीही हे वातावरण भावनिक स्थैर्य देते, कारण कुटुंबातील परस्पर आदर बाळासाठी सकारात्मक सामाजिक मूल्ये घडवतो.",
  },
  {
    title: "अतिथी सत्कार आणि सामाजिक सौजन्य",
    detail: "‘अभ्यागताचा आदर’ हा भारतीय नीतिविचार आहे. मराठी संदर्भात हे असे मांडता येईल: नम्रता, अतिथी-सत्कार, आणि परस्पर आदर या सवयी बाळाला अप्रत्यक्षरीत्या समाजशीलता शिकवतात. घरात सकारात्मकता वाढते आणि ‘आपलेपणा’ची संस्कृती निर्माण होते.",
  },
  {
    title: "कुटुंबसंवादाची दैनंदिन परंपरा",
    detail: "हिंदी मजकुरातील एक उपयोगी सूत्र म्हणजे कुटुंबीयांनी एकत्र बसून दिवसाचे अनुभव शेअर करणे. रोज 10-15 मिनिटे फोन-विरहित संवाद ठेवा. प्रत्येकाने दिवसातील एक चांगली गोष्ट आणि एक शिकलेला धडा बोलावा. गर्भवती आईला यामुळे भावनिक आधार मिळतो आणि घरात सौहार्द वाढते.",
  },
  {
    title: "ईर्ष्या-द्वेष कमी करून मनशुद्धी",
    detail: "संदर्भात मत्सर, क्रोध, वैमनस्य यांमुळे मन अशांत होते असे सांगितले आहे. गर्भावस्थेत तुलना, भीती आणि अति-चिंता कमी करून कृतज्ञता, संयम आणि करुणा यांचा सराव करणे महत्त्वाचे आहे. मन शांत राहिल्यास आई-बाळ दोघांच्याही भावनिक आरोग्यास आधार मिळतो.",
  },
  {
    title: "ध्यान, भक्ति आणि अंतर्मनाची स्थिरता",
    detail: "संपूर्ण संदर्भातील मुख्य धागा म्हणजे भक्ती आणि शांत चिंतनातून अंतःकरण निर्मळ करणे. मराठी मार्गदर्शनासाठी याचा अर्थ: रोज थोडे प्रार्थनावाचन, दीर्घ श्वसन, आणि सकारात्मक संकल्प. हे सराव वैद्यकीय उपचारांचा पर्याय नाहीत, पण मानसिक स्थैर्य वाढवणारे पूरक साधन ठरतात.",
  },
];

export async function fetchGarbhGeeta(week) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const todayLabel = today.toLocaleDateString("mr-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const seed = hashString(`${todayKey}_${week}`);
  const todayVerse = pickFromPool(GARBH_GEETA_POOL, seed, 41);
  const verses = getSeededUniqueItems(GARBH_GEETA_POOL, seed, 6, 43);

  return {
    title: "गर्भगीता",
    dayLabel: todayLabel,
    subtitle: "गीता-प्रेरित दैनंदिन मार्गदर्शन",
    referenceUrl: "http://motivationalstoriesinhindi.in/2022/11/sampuran-garbh-geeta-pdf.html",
    translatedSourceNote: "दिलेल्या हिंदी PDF संदर्भातील आशयाचे मराठी अर्थानुवाद येथे दिले आहेत.",
    note: "ही आध्यात्मिक प्रेरणा आहे; वैद्यकीय निर्णयांसाठी डॉक्टरांचा सल्ला घ्या.",
    todayVerse,
    verses,
    translatedInsights: GARBH_GEETA_REF_TRANSLATED,
  };
}

export async function fetchPregnancyChatReply({ profile, careData, question, category = "general", history = [] }) {
  const week = profile?.currentWeek || 1;
  const motherName = profile?.name || "आई";
  const trimester = week <= 13 ? "पहिली तिमाही" : week <= 27 ? "दुसरी तिमाही" : "तिसरी तिमाही";
  const diet = profile?.diet || "veg";
  const flags = Array.isArray(profile?.healthFlags) ? profile.healthFlags.join(", ") : "नाही";
  const ptype = profile?.pregnancyType || "singleton";
  const recapMoods = (careData?.moodLogs || []).slice(0, 5).map((item) => item.mood).join(", ");
  const historyText = history
    .slice(-6)
    .map((item) => `${item.role === "user" ? "प्रश्न" : "उत्तर"}: ${item.text}`)
    .join("\n");

  const fallback = {
    answer: `प्रिय ${motherName}, तुमच्या ${week}व्या आठवड्यात हा प्रश्न महत्त्वाचा आहे. संतुलित आहार, पुरेशी विश्रांती, पाणी, हलकी हालचाल आणि डॉक्टरांनी दिलेल्या सूचनांचे पालन करा. त्रास वाढल्यास डॉक्टरांचा सल्ला घ्या.`,
    tips: [
      "आज पुरेसे पाणी प्या आणि हलका पौष्टिक आहार घ्या.",
      "शरीरात बदल जाणवले तर त्यांची छोटी नोंद ठेवा.",
      "अस्वस्थता वाढली तर डॉक्टरांशी संपर्क साधा.",
    ],
    doctorFlags: [
      "जास्त रक्तस्राव",
      "तीव्र पोटदुखी किंवा सतत आकडी",
      "श्वास घेण्यास त्रास किंवा बाळाची हालचाल कमी जाणवणे",
    ],
    disclaimer: "ही माहिती मार्गदर्शनासाठी आहे; वैद्यकीय निर्णयांसाठी डॉक्टरांचा सल्ला घ्या.",
  };

  const systemPrompt = `तुम्ही गर्भावस्था मार्गदर्शनासाठी मराठी सहाय्यक आहात.
नियम:
- फक्त मराठीत उत्तर द्या.
- प्रश्न गर्भावस्था, प्रसूती तयारी, पोषण, योग, मानसिक आरोग्य, सुरक्षितता यापुरते ठेवा.
- वैद्यकीय निदान करू नका. औषधाचा डोस, इंजेक्शन, किंवा उपचार योजना देऊ नका.
- स्कॅन/रिपोर्ट अर्थ लावू नका; फक्त सामान्य समज आणि डॉक्टरकडे नेण्याची विनंती.
- गंभीर किंवा रेड-फ्लॅग लक्षणांसाठी डॉक्टर/रुग्णालयाचा सल्ला द्या.
- आहार सुचवताना आईच्या आहार प्रकाराचा (शाकाहारी/जैन इ.) आदर करा.
- उत्तर आश्वासक, संक्षिप्त, आणि कृतीयोग्य असावे.
- कोणतीही AI, model, provider, API यांचा उल्लेख करू नका.
IMPORTANT: Respond ONLY with valid JSON.`;

  const prompt = `आईचे नाव: ${motherName}
सध्याचा आठवडा: ${week}
तिमाही: ${trimester}
आहार: ${diet}
गर्भधारणा प्रकार: ${ptype}
जोखीम झेंडे: ${flags || "नाही"}
शहर: ${profile?.city || "नाही"}
अलीकडील भावना: ${recapMoods || "नाही"}
विषय: ${category}

चालू प्रश्न: ${question}

अलीकडील संवाद:
${historyText || "नाही"}

Return ONLY this JSON:
{
  "answer": "मुख्य उत्तर (80-140 शब्द, उबदार आणि स्पष्ट)",
  "tips": ["उपयुक्त टिप 1", "उपयुक्त टिप 2", "उपयुक्त टिप 3"],
  "doctorFlags": ["डॉक्टरांना कधी भेटावे 1", "डॉक्टरांना कधी भेटावे 2", "डॉक्टरांना कधी भेटावे 3"],
  "disclaimer": "लहान वैद्यकीय सूचना"
}`;

  try {
    const text = await callContent(systemPrompt, prompt);
    return safeParseJSON(text) || fallback;
  } catch {
    return fallback;
  }
}
