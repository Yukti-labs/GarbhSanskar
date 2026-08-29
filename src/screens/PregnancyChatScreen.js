import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
} from "react-native";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { SectionCard, Chip, LoadingCard } from "../components/UIComponents";
import { PREGNANCY_CHAT_CATEGORIES, getQuestionsForCategory } from "../constants/pregnancyChat";
import { fetchPregnancyChatReply } from "../services/claudeApi";
import {
  canSendChat, bumpChatUsage, buildWeeklyRecap, isPlusUnlocked, FREE_CHAT_DAILY_LIMIT,
} from "../utils/careData";
import PlusGate from "../components/PlusGate";

function buildInitialAssistantMessage(profile) {
  const week = profile?.currentWeek || 1;
  return {
    id: `assistant_welcome_${week}`,
    role: "assistant",
    question: "",
    answer: `नमस्कार 🌸 मी तुमची गर्भावस्था सहाय्यक आहे. तुम्ही ${week}व्या आठवड्यात आहात. खालील तयार प्रश्नांमधून निवडा किंवा स्वतःचा प्रश्न विचारा.`,
    tips: [
      "तुमच्या आठवड्यानुसार मार्गदर्शन दिले जाईल.",
      "आहार, योग, लक्षणे, मनःशांती आणि प्रसूती तयारीबाबत विचारू शकता.",
    ],
    doctorFlags: ["गंभीर त्रास वाटल्यास डॉक्टरांचा सल्ला घ्या."],
    disclaimer: "ही माहिती वैद्यकीय उपचारांचा पर्याय नाही.",
  };
}

export default function PregnancyChatScreen({
  profile,
  careData,
  onSaveCareData,
  onUnlockPlus,
  colors = COLORS,
  isMobileWeb = false,
}) {
  const [selectedCategory, setSelectedCategory] = useState(PREGNANCY_CHAT_CATEGORIES[0].id);
  const restored = Array.isArray(careData?.chatMessages) && careData.chatMessages.length
    ? careData.chatMessages
    : [buildInitialAssistantMessage(profile)];
  const [messages, setMessages] = useState(restored);
  const [customQuestion, setCustomQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollViewRef = useRef(null);
  const currentWeek = profile?.currentWeek || 1;
  const trimester = currentWeek <= 13 ? "पहिली तिमाही" : currentWeek <= 27 ? "दुसरी तिमाही" : "तिसरी तिमाही";
  const recap = useMemo(() => buildWeeklyRecap(profile, careData), [profile, careData]);
  const chatGate = canSendChat(profile, careData);

  async function persistMessages(nextMessages, extra = {}) {
    if (!onSaveCareData) return;
    onSaveCareData({
      ...careData,
      chatMessages: nextMessages.slice(-40),
      ...extra,
    });
  }

  // Auto-scroll to bottom whenever a new message is added or loading starts
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length, isLoading]);

  const presetQuestions = useMemo(
    () => getQuestionsForCategory(selectedCategory, currentWeek),
    [selectedCategory, currentWeek]
  );

  async function askQuestion(question, category = selectedCategory) {
    const trimmed = String(question || "").trim();
    if (!trimmed || isLoading) return;

    const gate = canSendChat(profile, careData);
    if (!gate.ok) {
      const blocked = {
        id: `assistant_limit_${Date.now()}`,
        role: "assistant",
        question: trimmed,
        answer: `आजचे ${FREE_CHAT_DAILY_LIMIT} फ्री प्रश्न संपले. उद्या पुन्हा विचारा किंवा Plus डेमो सुरू करा.`,
        tips: ["नोंदवहीत लक्षणे लिहा", "गंभीर त्रास असल्यास डॉक्टर"],
        doctorFlags: ["तीव्र वेदना, रक्तस्राव, हालचाल कमी"],
        disclaimer: "ही माहिती वैद्यकीय उपचारांचा पर्याय नाही.",
      };
      const next = [...messages, { id: `user_${Date.now()}`, role: "user", question: trimmed, answer: "", tips: [], doctorFlags: [], disclaimer: "" }, blocked];
      setMessages(next);
      persistMessages(next);
      return;
    }

    const history = messages.flatMap((item) => {
      const list = [];
      if (item.question) list.push({ role: "user", text: item.question });
      if (item.answer) list.push({ role: "assistant", text: item.answer });
      return list;
    });

    const userId = `user_${Date.now()}`;
    const nextMessages = [
      ...messages,
      { id: userId, role: "user", question: trimmed, answer: "", tips: [], doctorFlags: [], disclaimer: "" },
    ];
      setMessages(nextMessages);
      setCustomQuestion("");
      setIsLoading(true);

      const usage = bumpChatUsage(careData);

      try {
        const reply = await fetchPregnancyChatReply({
          profile,
          careData,
          question: trimmed,
          category,
          history,
        });

        const withReply = [
          ...nextMessages,
          {
            id: `assistant_${Date.now()}`,
            role: "assistant",
            question: trimmed,
            answer: reply?.answer || "क्षमस्व, सध्या उत्तर देता आले नाही.",
            tips: Array.isArray(reply?.tips) ? reply.tips : [],
            doctorFlags: Array.isArray(reply?.doctorFlags) ? reply.doctorFlags : [],
            disclaimer: reply?.disclaimer || "वैद्यकीय प्रश्नांसाठी डॉक्टरांचा सल्ला घ्या.",
          },
        ];
        setMessages(withReply);
        persistMessages(withReply, { chatUsage: usage });
      } catch {
        const withError = [
          ...nextMessages,
          {
            id: `assistant_error_${Date.now()}`,
            role: "assistant",
            question: trimmed,
            answer: "क्षमस्व, सध्या उत्तर मिळाले नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.",
            tips: ["नेटवर्क तपासा", "थोड्या वेळाने पुन्हा विचारा"],
            doctorFlags: ["गंभीर त्रास असल्यास डॉक्टरांशी त्वरित संपर्क करा"],
            disclaimer: "ही माहिती वैद्यकीय उपचारांचा पर्याय नाही.",
          },
        ];
        setMessages(withError);
        persistMessages(withError, { chatUsage: usage });
      } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={[styles.content, isMobileWeb && styles.mobileContent]}
      showsVerticalScrollIndicator={false}
    >
      <SectionCard style={[styles.heroCard, { backgroundColor: colors.bgWarm }]}> 
        <Text style={[styles.heroEyebrow, { color: colors.primaryDark }]}>💬 सुरक्षित मराठी सहाय्य</Text>
        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>गर्भसंस्कार सल्ला चॅट</Text>
        <Text style={[styles.heroSub, { color: colors.textSecondary }]}>आठवडा {currentWeek} • {trimester}</Text>
        <Text style={[styles.heroNote, { color: colors.textSecondary }]}>
          {recap.moodSummary} {isPlusUnlocked(profile) ? "Plus चॅट अमर्याद." : `आज ${chatGate.remaining} फ्री प्रश्न शिल्लक.`}
        </Text>
        <Text style={[styles.heroNote, { color: recap.restFlag ? colors.error : colors.textSecondary }]}>{recap.advice}</Text>
        {!chatGate.ok && (
          <PlusGate
            unlocked={false}
            colors={colors}
            title="आजची फ्री चॅट संपली"
            body="Plus डेमोने अमर्याद प्रश्न. डोस/निदान अजूनही दिले जाणार नाही."
            onUnlock={onUnlockPlus}
          />
        )}
      </SectionCard>

      <SectionCard>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>विषय निवडा</Text>
        <View style={styles.chipWrap}>
          {PREGNANCY_CHAT_CATEGORIES.map((item) => (
            <Chip
              key={item.id}
              label={`${item.emoji} ${item.label}`}
              active={selectedCategory === item.id}
              onPress={() => setSelectedCategory(item.id)}
              color={colors.primary}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>तयार प्रश्न</Text>
        <View style={styles.presetWrap}>
          {presetQuestions.map((question) => (
            <TouchableOpacity
              key={question}
              style={[styles.presetCard, { backgroundColor: colors.bgMuted, borderColor: colors.borderLight }]}
              onPress={() => askQuestion(question, selectedCategory)}
              disabled={isLoading}
            >
              <Text style={[styles.presetText, { color: colors.textPrimary }]}>{question}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>स्वतःचा प्रश्न विचारा</Text>
        <TextInput
          value={customQuestion}
          onChangeText={setCustomQuestion}
          placeholder="उदा. रात्री झोप नीट लागत नसेल तर काय करावे?"
          placeholderTextColor={colors.textLight}
          multiline
          style={[
            styles.input,
            { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.bg },
          ]}
        />
        <TouchableOpacity
          style={[styles.askBtn, { backgroundColor: colors.primary }, (!customQuestion.trim() || isLoading) && styles.askBtnDisabled]}
          disabled={!customQuestion.trim() || isLoading}
          onPress={() => askQuestion(customQuestion, selectedCategory)}
        >
          <Text style={styles.askBtnText}>{isLoading ? "उत्तर येत आहे..." : "प्रश्न विचारा"}</Text>
        </TouchableOpacity>
      </SectionCard>

      <View style={styles.chatSectionHead}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>संवाद</Text>
      </View>

      {messages.map((message) => (
        <View key={message.id}>
          {message.role === "user" ? (
            <View style={styles.userRow}>
              <View style={[styles.userBubble, { backgroundColor: colors.primary }]}> 
                <Text style={styles.userText}>{message.question}</Text>
              </View>
            </View>
          ) : (
            <SectionCard style={[styles.assistantCard, { backgroundColor: colors.bgCard }]}> 
              <Text style={[styles.assistantBadge, { color: colors.accent }]}>🌸 मराठी सल्ला</Text>
              <Text style={[styles.answerText, { color: colors.textPrimary }]}>{message.answer}</Text>

              {!!message.tips?.length && (
                <View style={styles.blockWrap}>
                  <Text style={[styles.blockTitle, { color: colors.primaryDark }]}>उपयुक्त टिप्स</Text>
                  {message.tips.map((tip, index) => (
                    <Text key={`${message.id}_tip_${index}`} style={[styles.listText, { color: colors.textSecondary }]}>• {tip}</Text>
                  ))}
                </View>
              )}

              {!!message.doctorFlags?.length && (
                <View style={[styles.warningBox, { backgroundColor: colors.bgWarm, borderColor: colors.goldLight }]}> 
                  <Text style={[styles.blockTitle, { color: colors.gold }]}>डॉक्टरांना कधी भेटावे</Text>
                  {message.doctorFlags.map((flag, index) => (
                    <Text key={`${message.id}_flag_${index}`} style={[styles.listText, { color: colors.textSecondary }]}>• {flag}</Text>
                  ))}
                </View>
              )}

              {!!message.disclaimer && (
                <Text style={[styles.disclaimer, { color: colors.textLight }]}>{message.disclaimer}</Text>
              )}
            </SectionCard>
          )}
        </View>
      ))}

      {isLoading && <LoadingCard message="तुमच्या प्रश्नासाठी उत्तर तयार होत आहे..." />}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.md },
  mobileContent: { paddingBottom: 120 },
  heroCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: "rgba(91,75,219,0.10)",
  },
  heroEyebrow: { fontSize: FONTS.small, fontWeight: "800", marginBottom: 6 },
  heroTitle: { fontSize: FONTS.h2, fontWeight: "800" },
  heroSub: { fontSize: FONTS.small, fontWeight: "700", marginTop: SPACING.xs },
  heroNote: { fontSize: FONTS.body, lineHeight: 22, marginTop: SPACING.sm },
  sectionTitle: { fontSize: FONTS.h4, fontWeight: "800", marginBottom: SPACING.sm },
  chipWrap: { flexDirection: "row", flexWrap: "wrap" },
  presetWrap: { gap: SPACING.sm },
  presetCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  presetText: { fontSize: FONTS.body, lineHeight: 22, fontWeight: "600" },
  input: {
    minHeight: 94,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.body,
    textAlignVertical: "top",
  },
  askBtn: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: "center",
    ...SHADOWS.sm,
  },
  askBtnDisabled: { opacity: 0.6 },
  askBtnText: { color: COLORS.textWhite, fontSize: FONTS.body, fontWeight: "800" },
  chatSectionHead: { marginTop: SPACING.xs, marginBottom: SPACING.sm },
  userRow: { alignItems: "flex-end", marginBottom: SPACING.sm },
  userBubble: {
    maxWidth: "88%",
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...SHADOWS.sm,
  },
  userText: { color: COLORS.textWhite, fontSize: FONTS.body, lineHeight: 22, fontWeight: "700" },
  assistantCard: { marginBottom: SPACING.sm },
  assistantBadge: { fontSize: FONTS.small, fontWeight: "800", marginBottom: SPACING.sm },
  answerText: { fontSize: FONTS.body, lineHeight: 24, fontWeight: "600" },
  blockWrap: { marginTop: SPACING.md },
  blockTitle: { fontSize: FONTS.small, fontWeight: "800", marginBottom: SPACING.xs },
  listText: { fontSize: FONTS.body, lineHeight: 22, marginBottom: 4 },
  warningBox: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  disclaimer: { marginTop: SPACING.md, fontSize: FONTS.small, lineHeight: 20, fontWeight: "600" },
});
