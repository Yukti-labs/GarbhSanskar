export const POSTPARTUM_WEEKS = [
  {
    week: 0,
    title: "आठवडा ० — घर येणे",
    focus: "रक्तस्राव, झोप, फीडिंग आणि मदत",
    healing: ["पेरिनियम/सी-सेक्शन जखमेची स्वच्छता", "खूप रक्तस्राव किंवा ताप असल्यास डॉक्टर"],
    feeding: ["बाळाला मागणीनुसार फीड", "छातीत दूध येण्यापूर्वी कोलोस्ट्रम महत्त्वाचे"],
    mother: ["पाणी, दाल-भात, गूळ-दूध", "एकटा राहू नका"],
  },
  {
    week: 1,
    title: "आठवडा १ — लय शोधणे",
    focus: "फीडिंग वेळा आणि आईची विश्रांती",
    healing: ["जखम रोज तपासा", "मूत्र किंवा शौकास त्रास असल्यास सांगा"],
    feeding: ["प्रत्येक फीडची वेळ नोंदवा", "सक्शन दुखत असल्यास स्थिती बदला"],
    mother: ["दिवसा २० मिनिटे झोप", "भावना चढ-उतार सामान्य; विचार गडद राहिल्यास मदत घ्या"],
  },
  {
    week: 2,
    title: "आठवडा २ — शरीर सावरणे",
    focus: "लोह, पाणी, आणि चालणे",
    healing: ["हलके घरच्या आत चालणे", "भारी वजन उचलू नका"],
    feeding: ["ओले डायपर संख्या पाहा", "कावीळ संशयित असल्यास बालरोगतज्ज्ञ"],
    mother: ["लोहयुक्त आहार", "साथीदार रात्री एक फीड सांभाळो"],
  },
  {
    week: 3,
    title: "आठवडा ३ — मन",
    focus: "ब्लूज विरुद्ध नैराश्य ओळखा",
    healing: ["सी-सेक्शन टाके तपासणी", "पोटदुखी वाढली तर थांबा"],
    feeding: ["पुरेसे दूध? बाळाचे वजन डॉक्टरकडे"],
    mother: ["२ ओळीत भावना लिहा", "एकटी असल्यास फोनवर बोलणे"],
  },
  {
    week: 4,
    title: "आठवडा ४ — पहिला महिना",
    focus: "नियमित बाल तपासणी",
    healing: ["रक्तस्राव कमी होणे अपेक्षित", "गाठ/दुर्गंधी = डॉक्टर"],
    feeding: ["विकास टप्पे विचारून घ्या"],
    mother: ["कुटुंबाची मदत यादी लिहा"],
  },
  {
    week: 6,
    title: "आठवडा ६ — तपासणी",
    focus: "६ आठवड्यांची OB भेट",
    healing: ["गर्भाशय, जखम, कुटुंब नियोजन चर्चा"],
    feeding: ["पूरक आहार अद्याप नाही (६ महिने)"],
    mother: ["व्यायाम फक्त डॉक्टरांनी सांगितले तर"],
  },
  {
    week: 8,
    title: "आठवडा ८ — लय मजबूत",
    focus: "झोपेचे छोटे ब्लॉक्स",
    healing: ["पाठदुखीसाठी उशी आणि स्थिती"],
    feeding: ["रात्री फीड सामायिक करा"],
    mother: ["१० मिनिटे बाहेर हवा"],
  },
  {
    week: 12,
    title: "आठवडा १२ — पुढचा अध्याय",
    focus: "आईचे आरोग्य आणि बाळाचे टीके",
    healing: ["मासिक पाळी परत येऊ शकते; गर्भनिरोधक विचारा"],
    feeding: ["अजून केवळ दूध/फॉर्म्युला"],
    mother: ["नैराश्य लक्षणे कायम असल्यास तज्ज्ञ"],
  },
];

export function getPostpartumWeekPlan(weekNumber) {
  const week = Math.max(0, Math.min(12, Number(weekNumber) || 0));
  const exact = POSTPARTUM_WEEKS.find((item) => item.week === week);
  if (exact) return exact;
  const earlier = [...POSTPARTUM_WEEKS].reverse().find((item) => item.week <= week);
  return earlier || POSTPARTUM_WEEKS[0];
}

export function weeksSinceDelivery(deliveryDate) {
  if (!deliveryDate) return 0;
  const diff = Date.now() - new Date(deliveryDate).getTime();
  return Math.max(0, Math.min(12, Math.floor(diff / (1000 * 60 * 60 * 24 * 7))));
}
