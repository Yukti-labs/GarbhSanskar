import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Platform,
} from "react-native";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, TRIMESTER_INFO } from "../constants/theme";
import {
  LoadingCard, SectionCard, BulletList, GradientHeader,
  PillBadge, TabBar, ErrorState,
} from "../components/UIComponents";
import { getPregnancyGamesForWeek } from "../constants/pregnancyGames";
import SessionTimer from "../components/SessionTimer";
import { dietLabel } from "../utils/careData";
import {
  fetchBabyDevelopment, fetchTalkToBaby,
  fetchYoga, fetchNutrition, fetchGarbhSanskar, fetchGarbhKatha, fetchGarbhGeeta,
} from "../services/claudeApi";

const TABS = [
  { id: "baby", emoji: "🍼", label: "वाढ" },
  { id: "talk", emoji: "💬", label: "बोला" },
  { id: "yoga", emoji: "🧘", label: "योग" },
  { id: "nutrition", emoji: "🥗", label: "पोषण" },
  { id: "games", emoji: "🎯", label: "खेळ" },
  { id: "stories", emoji: "📖", label: "कथा" },
  { id: "garbhgeeta", emoji: "📜", label: "गीता" },
  { id: "garbhsanskar", emoji: "🕉️", label: "संस्कार" },
];

export default function WeekDetailScreen({ week, initialTab = "baby", profile, colors = COLORS, isDarkMode = false, isMobileWeb = false }) {
  const isWeb = Platform.OS === "web" && !isMobileWeb;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const todayKey = new Date().toISOString().slice(0, 10);

  const trimester = week <= 13 ? 1 : week <= 27 ? 2 : 3;
  const tri = TRIMESTER_INFO[trimester];

  function getCacheKey(tabId) {
    return (tabId === "garbhsanskar" || tabId === "stories" || tabId === "games") ? `${tabId}_${week}_${todayKey}` : `${tabId}_${week}`;
  }

  async function loadTab(tabId) {
    const cacheKey = getCacheKey(tabId);
    if (data[cacheKey]) return;
    setLoading((p) => ({ ...p, [tabId]: true }));
    setErrors((p) => ({ ...p, [tabId]: null }));
    try {
      let result;
      if (tabId === "baby") result = await fetchBabyDevelopment(week);
      else if (tabId === "talk") result = await fetchTalkToBaby(week);
      else if (tabId === "yoga") result = await fetchYoga(week);
      else if (tabId === "nutrition") result = await fetchNutrition(week);
      else if (tabId === "games") result = getPregnancyGamesForWeek(week);
      else if (tabId === "stories") result = await fetchGarbhKatha(week);
      else if (tabId === "garbhgeeta") result = await fetchGarbhGeeta(week);
      else if (tabId === "garbhsanskar") result = await fetchGarbhSanskar(week);
      setData((p) => ({ ...p, [cacheKey]: result }));
    } catch (e) {
      setErrors((p) => ({ ...p, [tabId]: e.message }));
    } finally {
      setLoading((p) => ({ ...p, [tabId]: false }));
    }
  }

  useEffect(() => { loadTab(activeTab); }, [activeTab, week]);

  const tabData = data[getCacheKey(activeTab)];
  const isLoading = loading[activeTab];
  const hasError = errors[activeTab];

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  function renderScrollableContent() {
    return (
      <ScrollView
        style={[styles.scroll, isWeb && styles.webScroll]}
        contentContainerStyle={isWeb && styles.webScrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={!!isLoading}
            onRefresh={() => {
              setData((p) => { const np = { ...p }; delete np[getCacheKey(activeTab)]; return np; });
              loadTab(activeTab);
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading && <LoadingCard message="माहिती तयार करत आहे..." />}
        {hasError && !isLoading && (
          <ErrorState
            message={hasError}
            onRetry={() => {
              setData((p) => { const np = { ...p }; delete np[getCacheKey(activeTab)]; return np; });
              loadTab(activeTab);
            }}
          />
        )}
        {!isLoading && !hasError && tabData && (
          <>
            {activeTab === "baby" && <BabyTab data={tabData} tri={tri} colors={colors} />}
            {activeTab === "talk" && <TalkTab data={tabData} tri={tri} colors={colors} isDarkMode={isDarkMode} />}
            {activeTab === "yoga" && <YogaTab data={tabData} tri={tri} colors={colors} isDarkMode={isDarkMode} />}
            {activeTab === "nutrition" && <NutritionTab data={tabData} tri={tri} colors={colors} isDarkMode={isDarkMode} diet={profile?.diet} />}
            {activeTab === "games" && <GamesTab data={tabData} tri={tri} colors={colors} isDarkMode={isDarkMode} />}
            {activeTab === "stories" && <StoriesTab data={tabData} tri={tri} colors={colors} isDarkMode={isDarkMode} />}
            {activeTab === "garbhgeeta" && <GarbhGeetaTab data={tabData} tri={tri} colors={colors} isDarkMode={isDarkMode} />}
            {activeTab === "garbhsanskar" && <GarbhSanskarTab data={tabData} tri={tri} colors={colors} isDarkMode={isDarkMode} />}
          </>
        )}
        <View style={{ height: isWeb ? 24 : 100 }} />
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}> 
      <View style={[styles.weekHeader, { backgroundColor: tri.color }, isWeb && styles.weekHeaderWeb]}>
        <View>
          <Text style={[styles.weekNum, { color: tri.dark }]}>{week}वा आठवडा</Text>
          {isWeb && <Text style={[styles.weekSubtext, { color: tri.dark }]}>या आठवड्याची सविस्तर माहिती</Text>}
        </View>
        <PillBadge label={tri.label} color="rgba(255,255,255,0.6)" textColor={tri.dark} />
      </View>

      {isWeb ? (
        <View style={styles.webBody}>
          <ScrollView
            style={styles.webTabRail}
            contentContainerStyle={styles.webTabRailContent}
            showsVerticalScrollIndicator={false}
          >
            {TABS.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.webTabRailItem, selected && styles.webTabRailItemActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Text style={styles.webTabRailEmoji}>{tab.emoji}</Text>
                  <Text style={[styles.webTabRailLabel, selected && styles.webTabRailLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={[styles.webContentPane, { backgroundColor: colors.bg, borderColor: colors.borderLight }]}>{renderScrollableContent()}</View>
        </View>
      ) : (
        <>
          <TabBar tabs={TABS} activeTab={activeTab} onTabPress={setActiveTab} compact={true} />
          {renderScrollableContent()}
        </>
      )}
    </View>
  );
}

// ─── Baby Development Tab ────────────────────────────────────────────
function BabyTab({ data, tri, colors }) {
  return (
    <View style={styles.tabContent}>
      <GradientHeader emoji={data.emoji || "👶"} title={data.title} subtitle={data.milestone} color={tri.color} />
      <View style={styles.statsRow}>
        <StatCard label="आकार" value={data.size} emoji="📏" color={tri.color} />
        <StatCard label="वजन" value={data.weight} emoji="⚖️" color={tri.color} />
        <StatCard label="लांबी" value={data.length} emoji="📐" color={tri.color} />
      </View>
      <SectionCard>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🌱 या आठवड्यात वाढ</Text>
        <BulletList items={data.development} color={tri.dark} />
      </SectionCard>
      <SectionCard style={{ backgroundColor: tri.color }}>
        <Text style={[styles.cardTitle, { color: tri.dark }]}>⭐ विशेष टप्पा</Text>
        <Text style={[styles.milestoneText, { color: tri.dark }]}>{data.milestone}</Text>
      </SectionCard>
    </View>
  );
}

// ─── Talk to Baby Tab ─────────────────────────────────────────────────
function TalkTab({ data, tri, colors, isDarkMode }) {
  const darkSectionStyle = isDarkMode ? { backgroundColor: "#000000", borderColor: "#000000" } : null;
  const darkTextColor = isDarkMode ? "#FFFFFF" : colors.textPrimary;
  return (
    <View style={styles.tabContent}>
      <GradientHeader emoji="💌" title={data.title} color={tri.dark} />
      <SectionCard style={[styles.letterCard, darkSectionStyle]}>
        <Text style={[styles.letterLabel, { color: darkTextColor }]}>बाळाला पत्र</Text>
        <Text style={[styles.letterText, { color: darkTextColor }]}>{data.message}</Text>
      </SectionCard>
      <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: COLORS.bgWarm }}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>🌸 आईसाठी सकारात्मक विचार</Text>
        <Text style={[styles.affirmationText, { color: darkTextColor }]}>{data.affirmation}</Text>
      </SectionCard>
      <SectionCard style={darkSectionStyle}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>🎯 आजचा उपक्रम</Text>
        <View style={[styles.activityBox, isDarkMode && { backgroundColor: "#000000", borderWidth: 1, borderColor: "#FFFFFF" }]}> 
          <Text style={[styles.activityText, { color: darkTextColor }]}>{data.activity}</Text>
        </View>
      </SectionCard>
    </View>
  );
}

// ─── Yoga Tab ─────────────────────────────────────────────────────────
function YogaTab({ data, tri, colors, isDarkMode }) {
  const darkSectionStyle = isDarkMode ? { backgroundColor: "#000000", borderColor: "#000000" } : null;
  const darkTextColor = isDarkMode ? "#FFFFFF" : colors.textPrimary;
  return (
    <View style={styles.tabContent}>
      <GradientHeader emoji="🧘" title={data.title} color="#9C27B0" />
      <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: "#FFF3E0" }}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>⚠️ सुरक्षा सूचना</Text>
        <Text style={[styles.safetyText, { color: darkTextColor }]}>{data.safetyNote}</Text>
      </SectionCard>
      {data.poses?.map((pose, i) => (
        <SectionCard key={i} style={darkSectionStyle}>
          <View style={styles.poseHeader}>
            <Text style={styles.poseEmoji}>{pose.emoji}</Text>
            <View style={styles.poseTitles}>
              <Text style={[styles.poseName, { color: darkTextColor }]}>{pose.name}</Text>
              <Text style={[styles.poseSanskrit, { color: isDarkMode ? "#FFFFFF" : colors.textLight }]}>{pose.sanskrit}</Text>
            </View>
            <PillBadge label={pose.duration} color="#F3E5F5" textColor="#9C27B0" />
          </View>
          <Text style={[styles.poseBenefit, { color: darkTextColor }]}>✅ {pose.benefit}</Text>
          <Text style={[styles.poseSteps, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{pose.steps}</Text>
          <SessionTimer label={pose.name} durationText={pose.duration} colors={colors} />
        </SectionCard>
      ))}
      {data.pranayama && (
        <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: "#F3E5F5" }}>
          <Text style={[styles.cardTitle, { color: darkTextColor }]}>🌬️ प्राणायाम</Text>
          <Text style={[styles.poseName, { color: darkTextColor }]}>{data.pranayama.name}</Text>
          <Text style={[styles.poseBenefit, { color: darkTextColor }]}>{data.pranayama.benefit}</Text>
          <PillBadge label={data.pranayama.duration} color="white" textColor="#9C27B0" />
        </SectionCard>
      )}
    </View>
  );
}

// ─── Nutrition Tab ────────────────────────────────────────────────────
function NutritionTab({ data, tri, colors, isDarkMode, diet }) {
  const darkSectionStyle = isDarkMode ? { backgroundColor: "#000000", borderColor: "#000000" } : null;
  const darkTextColor = isDarkMode ? "#FFFFFF" : colors.textPrimary;
  return (
    <View style={styles.tabContent}>
      <GradientHeader emoji="🥗" title={data.title} color="#388E3C" />
      <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: "#E8F5E9" }}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>⭐ या आठवड्याचे मुख्य पोषण</Text>
        <Text style={[styles.nutrientText, { color: darkTextColor }]}>{data.keyNutrient}</Text>
        {!!diet && (
          <Text style={[styles.safetyText, { color: darkTextColor }]}>तुमचा आहार: {dietLabel(diet)}. रेसिपी याला जुळवा; मांसाहारी सूचना शाकाहारींसाठी वगळा.</Text>
        )}
      </SectionCard>

      <SectionCard style={darkSectionStyle}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>✅ खावे असे पदार्थ</Text>
        {data.eat?.map((item, i) => (
          <View key={i} style={styles.foodRow}>
            <Text style={styles.foodEmoji}>{item.emoji}</Text>
            <View style={styles.foodInfo}>
              <Text style={[styles.foodName, { color: darkTextColor }]}>{item.food}</Text>
              <Text style={[styles.foodReason, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{item.reason}</Text>
            </View>
          </View>
        ))}
      </SectionCard>

      <SectionCard style={isDarkMode ? darkSectionStyle : { borderColor: COLORS.error, borderWidth: 1.5 }}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>🚫 टाळावे असे पदार्थ</Text>
        {data.avoid?.map((item, i) => (
          <View key={i} style={styles.avoidRow}>
            <Text style={[styles.avoidName, { color: darkTextColor }]}>❌ {item.food}</Text>
            <Text style={[styles.avoidReason, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{item.reason}</Text>
          </View>
        ))}
      </SectionCard>

      {data.recipe && (
        <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: COLORS.bgWarm }}>
          <Text style={[styles.cardTitle, { color: darkTextColor }]}>👩‍🍳 आजची रेसिपी: {data.recipe.name}</Text>
          <Text style={[styles.recipeSection, { color: darkTextColor }]}>साहित्य:</Text>
          <BulletList items={data.recipe.ingredients} color={COLORS.primaryDark} />
          <Text style={[styles.recipeSection, { color: darkTextColor }]}>कृती:</Text>
          <Text style={[styles.recipeMethod, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{data.recipe.method}</Text>
        </SectionCard>
      )}

      <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: COLORS.bgTeal }}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>💧 पाणी आणि द्रव</Text>
        <Text style={[styles.hydrationText, { color: darkTextColor }]}>{data.hydration}</Text>
      </SectionCard>
    </View>
  );
}

function GamesTab({ data, tri, colors, isDarkMode }) {
  const darkSectionStyle = isDarkMode ? { backgroundColor: "#000000", borderColor: "#000000" } : null;
  const darkTextColor = isDarkMode ? "#FFFFFF" : colors.textPrimary;
  return (
    <View style={styles.tabContent}>
      <GradientHeader
        emoji="🎯"
        title={data.title}
        subtitle={data.focus}
        color="#3F6FB5"
      />

      <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: "#EEF4FF" }}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>🗓️ या महिन्याचा फोकस</Text>
        <Text style={[styles.gamesFocusText, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{data.focus}</Text>
      </SectionCard>

      {data.games?.map((game, index) => (
        <SectionCard key={index} style={[styles.gameCard, darkSectionStyle]}>
          <View style={styles.gameHeader}>
            <View style={styles.gameHeaderMain}>
              <Text style={styles.gameEmoji}>{game.emoji}</Text>
              <View style={styles.gameTitleWrap}>
                <Text style={[styles.gameTitle, { color: darkTextColor }]}>{game.name}</Text>
                <Text style={[styles.gameBenefit, { color: isDarkMode ? "#FFFFFF" : "#3F6FB5" }]}>{game.benefit}</Text>
              </View>
            </View>
            <PillBadge label={game.duration} color="#EEF4FF" textColor="#3F6FB5" />
          </View>
          <Text style={[styles.gameHowTo, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{game.howToPlay}</Text>
          <SessionTimer label={game.name} durationText={game.duration} colors={colors} />
        </SectionCard>
      ))}

      <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: COLORS.bgWarm }}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>🌼 या खेळांचे फायदे</Text>
        <BulletList items={data.benefits} color={COLORS.primaryDark} />
      </SectionCard>

      <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: "#FFF6EC" }}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>⚠️ काळजी</Text>
        <Text style={[styles.gamesSafetyText, { color: darkTextColor }]}>{data.safetyNote}</Text>
      </SectionCard>
    </View>
  );
}

function StoriesTab({ data, tri, colors, isDarkMode }) {
  const darkSectionStyle = isDarkMode ? { backgroundColor: "#000000", borderColor: "#000000" } : null;
  const darkTextColor = isDarkMode ? "#FFFFFF" : colors.textPrimary;
  const currentStory = data?.currentStory;

  return (
    <View style={styles.tabContent}>
      <GradientHeader emoji="📖" title={data?.title || "गर्भकथा"} subtitle="पारंपरिक प्रेरणादायी कथा" color="#7A4F2A" />

      {currentStory && (
        <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: "#FFF4E8" }}>
          <Text style={[styles.cardTitle, { color: darkTextColor }]}>⭐ Story of the Day</Text>
          <Text style={[styles.storyDayText, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{data?.dayLabel || "आजचा दिवस"}</Text>
          <Text style={[styles.storyName, { color: darkTextColor }]}>{currentStory.title}</Text>
          <Text style={[styles.storyEra, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{currentStory.era}</Text>
          <Text style={[styles.storyParagraph, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{currentStory.fullStory || currentStory.summary}</Text>

          <View style={[styles.storyMoralBox, isDarkMode && { backgroundColor: "#000000", borderColor: "#FFFFFF" }]}>
            <Text style={[styles.storyMoralLabel, { color: darkTextColor }]}>बोध:</Text>
            <Text style={[styles.storyMoralText, { color: darkTextColor }]}>{currentStory.moral}</Text>
          </View>

          <Text style={[styles.storyPractice, { color: darkTextColor }]}>🧘 आजचा संस्कार उपक्रम: {currentStory.practice}</Text>
        </SectionCard>
      )}

      <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: "#EEF4FF" }}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>🔗 संदर्भ</Text>
        <Text style={[styles.storyRefText, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>विषय प्रेरणा: {data?.referenceUrl}</Text>
      </SectionCard>
    </View>
  );
}

function GarbhGeetaTab({ data, tri, colors, isDarkMode }) {
  const darkSectionStyle = isDarkMode ? { backgroundColor: "#000000", borderColor: "#000000" } : null;
  const darkTextColor = isDarkMode ? "#FFFFFF" : colors.textPrimary;
  const todayVerse = data?.todayVerse;

  return (
    <View style={styles.tabContent}>
      <GradientHeader emoji="📜" title={data?.title || "गर्भगीता"} subtitle={data?.subtitle || "गीता-प्रेरित मार्गदर्शन"} color="#355C9C" />

      {todayVerse && (
        <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: "#EEF4FF" }}>
          <Text style={[styles.cardTitle, { color: darkTextColor }]}>🌞 आजचा गीता श्लोक</Text>
          <Text style={[styles.storyDayText, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{data?.dayLabel || "आजचा दिवस"}</Text>
          <Text style={[styles.geetaMeta, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{todayVerse.chapter} • {todayVerse.verse}</Text>
          <Text style={[styles.geetaSanskrit, { color: darkTextColor }]}>{todayVerse.sanskrit}</Text>
          <Text style={[styles.geetaTranslit, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{todayVerse.transliteration}</Text>
          <Text style={[styles.geetaHeading, { color: darkTextColor }]}>अर्थ</Text>
          <Text style={[styles.geetaBody, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{todayVerse.meaningMarathi}</Text>
          <Text style={[styles.geetaHeading, { color: darkTextColor }]}>गर्भावस्थेतील अर्थपूर्ण उपयोग</Text>
          <Text style={[styles.geetaBody, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{todayVerse.pregnancyInsight}</Text>
          <Text style={[styles.geetaPractice, { color: darkTextColor }]}>आजचा सराव: {todayVerse.dailyPractice}</Text>
        </SectionCard>
      )}

      {!!data?.translatedInsights?.length && (
        <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: "#F5F8FF" }}>
          <Text style={[styles.cardTitle, { color: darkTextColor }]}>📝 PDF मधील आशयाचे मराठी रूपांतर (सविस्तर)</Text>
          <Text style={[styles.storyRefText, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>
            {data?.translatedSourceNote}
          </Text>
          {data.translatedInsights.map((insight, index) => (
            <View key={`${insight.title}_${index}`} style={[styles.geetaItem, isDarkMode && { borderBottomColor: "#333" }]}>
              <Text style={[styles.geetaHeading, { color: darkTextColor }]}>{insight.title}</Text>
              <Text style={[styles.geetaBody, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{insight.detail}</Text>
            </View>
          ))}
          <Text style={[styles.storyRefText, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>संदर्भ: {data?.referenceUrl}</Text>
        </SectionCard>
      )}

      <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: "#FFF6EC" }}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>⚠️ टीप</Text>
        <Text style={[styles.storyRefText, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{data?.note}</Text>
      </SectionCard>
    </View>
  );
}

// ─── Garbh Sanskar Tab ───────────────────────────────────────────────
function GarbhSanskarTab({ data, tri, colors, isDarkMode }) {
  const routineItems = [
    { icon: "🤝", title: "जोडी उपक्रम", value: data.dailyRoutine?.coupleActivity, tint: isDarkMode ? "#000000" : "#FFE9E2" },
    { icon: "📚", title: "आजचे वाचन", value: data.dailyRoutine?.reading, tint: isDarkMode ? "#000000" : "#EEF2FF" },
    { icon: "🎵", title: "संगीत सुचवणी", value: data.dailyRoutine?.musicSuggestion, tint: isDarkMode ? "#000000" : "#E5FAF7" },
    { icon: "🧠", title: "सवय सुधारणा", value: data.dailyRoutine?.habitImprovement, tint: isDarkMode ? "#000000" : "#F6ECFF" },
    { icon: "🧘", title: "योग नियोजन", value: data.dailyRoutine?.plannerYoga, tint: isDarkMode ? "#000000" : "#EAF7EA" },
    { icon: "🥗", title: "पौष्टिक आहार", value: data.dailyRoutine?.fertilityBoosterDiet, tint: isDarkMode ? "#000000" : "#FFF5E1" },
    { icon: "🌼", title: "मार्गदर्शित ध्यान", value: data.dailyRoutine?.guidedMeditation, tint: isDarkMode ? "#000000" : "#E9F3FF" },
  ];
  const darkSectionStyle = isDarkMode ? { backgroundColor: "#000000", borderColor: "#000000" } : null;
  const darkTextColor = isDarkMode ? "#FFFFFF" : colors.textPrimary;

  return (
    <View style={styles.tabContent}>
      <GradientHeader emoji="🕉️" title={data.title} color={colors.primaryDark} />

      <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: "#F5F1FF" }}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>🗓️ आजचा गर्भसंस्कार दिवस</Text>
        <Text style={[styles.dayLabelText, { color: darkTextColor }]}>{data.dayLabel || "आजचा दिनक्रम"}</Text>
        <Text style={[styles.sourceNoteText, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{data.sourceNote}</Text>
      </SectionCard>

      {/* Shloka */}
      <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: "#FFF8E1" }}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>📿 आजचा श्लोक</Text>
        <Text style={[styles.shlokaText, { color: darkTextColor }]}>{data.shloka?.text}</Text>
        <View style={styles.divider} />
        <Text style={[styles.shlokaMeaning, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>अर्थ: {data.shloka?.meaning}</Text>
        <PillBadge label={`📖 ${data.shloka?.source}`} color="rgba(212,168,67,0.2)" textColor={COLORS.gold} />
      </SectionCard>

      {/* Music */}
      <SectionCard style={darkSectionStyle}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>🎵 संगीत सुचवणी</Text>
        <View style={styles.musicCard}>
          <Text style={styles.musicNote}>🎼</Text>
          <View style={styles.musicInfo}>
            <Text style={[styles.musicRaga, { color: darkTextColor }]}>{data.music?.raga}</Text>
            <Text style={[styles.musicBenefit, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{data.music?.benefit}</Text>
            <PillBadge label={`⏰ ${data.music?.time}`} color={COLORS.bgWarm} textColor={COLORS.primaryDark} />
          </View>
        </View>
      </SectionCard>

      {/* Story */}
      <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: COLORS.bgWarm }}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>📖 आजची कथा: {data.story?.title}</Text>
        <Text style={[styles.storyText, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{data.story?.fullStory || data.story?.summary}</Text>
        <View style={[styles.moralBox, isDarkMode && { backgroundColor: "#000000", borderColor: "#FFFFFF" }]}>
          <Text style={[styles.moralLabel, isDarkMode && { color: "#FFFFFF" }]}>बोध:</Text>
          <Text style={[styles.moralText, isDarkMode && { color: "#FFFFFF" }]}>{data.story?.moral}</Text>
        </View>
      </SectionCard>

      <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: "#FFF2F7" }}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>🎤 आजचे मराठी भक्तिगीत</Text>
        <Text style={[styles.bhaktiTitle, { color: darkTextColor }]}>{data.bhaktiGeet?.title}</Text>
        <Text style={[styles.bhaktiSuggestion, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{data.bhaktiGeet?.suggestion}</Text>
        {!!data.bhaktiGeet?.lyrics?.length && (
          <View style={[styles.lyricsBox, isDarkMode && { backgroundColor: "#000000", borderColor: "#FFFFFF" }]}>
            {data.bhaktiGeet.lyrics.map((line, index) => (
              <Text key={index} style={[styles.lyricsLine, { color: darkTextColor }]}>♪ {line}</Text>
            ))}
          </View>
        )}
      </SectionCard>

      {!!data.details?.length && (
        <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: "#FFF6EC" }}>
          <Text style={[styles.cardTitle, { color: darkTextColor }]}>🪔 गर्भसंस्कार अधिक सविस्तर</Text>
          <BulletList items={data.details} color={COLORS.gold} />
        </SectionCard>
      )}

      <SectionCard style={darkSectionStyle}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>📋 आजचे ७ दैनंदिन उपक्रम</Text>
        <View style={styles.routineGrid}>
          {routineItems.map((item) => (
            <View key={item.title} style={[styles.routineCard, { backgroundColor: item.tint, borderColor: isDarkMode ? "#FFFFFF" : COLORS.borderLight }]}> 
              <Text style={styles.routineIcon}>{item.icon}</Text>
              <Text style={[styles.routineTitle, { color: darkTextColor }]}>{item.title}</Text>
              <Text style={[styles.routineValue, { color: isDarkMode ? "#FFFFFF" : colors.textSecondary }]}>{item.value || "आजचा सल्ला लोड होत आहे..."}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      {/* Meditation */}
      <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: COLORS.bgTeal }}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>🧘 ध्यान</Text>
        <Text style={[styles.meditationText, { color: darkTextColor }]}>{data.meditation}</Text>
      </SectionCard>

      {/* Activity */}
      <SectionCard style={isDarkMode ? darkSectionStyle : { backgroundColor: "#E8F5E9" }}>
        <Text style={[styles.cardTitle, { color: darkTextColor }]}>🌸 आजचा गर्भसंस्कार उपक्रम (Daily)</Text>
        <Text style={[styles.activityText, { color: darkTextColor }]}>{data.activity}</Text>
      </SectionCard>
    </View>
  );
}

function StatCard({ label, value, emoji, color }) {
  return (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  weekHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  weekHeaderWeb: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  weekNum: { fontSize: FONTS.h2, fontWeight: "800", letterSpacing: 0.2, color: COLORS.textPrimary },
  weekSubtext: { fontSize: FONTS.small, marginTop: 4, fontWeight: "600", color: COLORS.textPrimary },
  scroll: { flex: 1 },
  webScroll: { flex: 1 },
  webScrollContent: { paddingBottom: SPACING.lg, paddingTop: SPACING.xs },
  webBody: {
    flex: 1,
    flexDirection: "row",
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  webTabRail: {
    width: 100,
    maxWidth: 100,
    flexShrink: 0,
    flexGrow: 0,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  webTabRailContent: {
    padding: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  webTabRailItem: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: "transparent",
  },
  webTabRailItemActive: {
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  webTabRailEmoji: { fontSize: 20, marginBottom: 6 },
  webTabRailLabel: {
    fontSize: FONTS.body,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  webTabRailLabelActive: { color: COLORS.primary },
  webContentPane: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  tabContent: { padding: SPACING.lg },
  statsRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    ...SHADOWS.sm,
  },
  statEmoji: { fontSize: 24, marginBottom: 6 },
  statLabel: { fontSize: FONTS.tiny, color: COLORS.textSecondary, marginBottom: 2 },
  statValue: { fontSize: FONTS.small, fontWeight: "800", color: COLORS.textPrimary, textAlign: "center" },
  cardTitle: { fontSize: FONTS.h4, fontWeight: "800", color: COLORS.textPrimary, marginBottom: SPACING.sm },
  milestoneText: { fontSize: FONTS.body, lineHeight: 22, fontStyle: "italic" },
  letterCard: { borderLeftWidth: 4, borderLeftColor: COLORS.accent },
  letterLabel: { fontSize: FONTS.small, color: COLORS.accent, fontWeight: "600", marginBottom: SPACING.sm },
  letterText: { fontSize: FONTS.body, lineHeight: 27, color: COLORS.textPrimary },
  affirmationText: { fontSize: FONTS.h4, lineHeight: 28, color: COLORS.primaryDark, fontStyle: "italic", textAlign: "center" },
  activityBox: { backgroundColor: COLORS.bgTeal, borderRadius: RADIUS.md, padding: SPACING.md },
  activityText: { fontSize: FONTS.body, color: COLORS.accent, lineHeight: 22 },
  safetyText: { fontSize: FONTS.body, color: "#E65100", lineHeight: 22 },
  poseHeader: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.sm },
  poseEmoji: { fontSize: 32, marginRight: SPACING.md },
  poseTitles: { flex: 1 },
  poseName: { fontSize: FONTS.body, fontWeight: "700", color: COLORS.textPrimary },
  poseSanskrit: { fontSize: FONTS.small, color: COLORS.textLight, fontStyle: "italic" },
  poseBenefit: { fontSize: FONTS.small, color: "#4CAF50", marginBottom: SPACING.xs, fontWeight: "600" },
  poseSteps: { fontSize: FONTS.small, color: COLORS.textSecondary, lineHeight: 20 },
  nutrientText: { fontSize: FONTS.h4, fontWeight: "700", color: "#388E3C", textAlign: "center" },
  gamesFocusText: { fontSize: FONTS.body, color: "#315A95", lineHeight: 22 },
  storyDayText: { fontSize: FONTS.small, marginBottom: SPACING.xs, fontWeight: "700" },
  storyName: { fontSize: FONTS.h4, fontWeight: "800", marginBottom: 4 },
  storyEra: { fontSize: FONTS.small, fontWeight: "600", marginBottom: SPACING.sm },
  storyParagraph: { fontSize: FONTS.body, lineHeight: 22, marginBottom: SPACING.sm },
  storyMoralBox: {
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: "rgba(122,79,42,0.2)",
    backgroundColor: "rgba(122,79,42,0.08)",
    marginBottom: SPACING.sm,
  },
  storyMoralLabel: { fontSize: FONTS.small, fontWeight: "800", marginBottom: 4 },
  storyMoralText: { fontSize: FONTS.body, lineHeight: 21 },
  storyPractice: { fontSize: FONTS.small, lineHeight: 21, fontWeight: "700" },
  storyListItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingVertical: SPACING.sm,
  },
  storyListTitle: { fontSize: FONTS.body, fontWeight: "700", marginBottom: 4 },
  storyListSummary: { fontSize: FONTS.small, lineHeight: 20 },
  storyListMoral: { fontSize: FONTS.small, lineHeight: 20, marginTop: 6, fontWeight: "700" },
  storyListPractice: { fontSize: FONTS.small, lineHeight: 20, marginTop: 4 },
  storyRefText: { fontSize: FONTS.small, lineHeight: 21 },
  geetaItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingVertical: SPACING.sm,
  },
  geetaMeta: { fontSize: FONTS.small, fontWeight: "700", marginBottom: 6 },
  geetaSanskrit: { fontSize: FONTS.body, lineHeight: 24, fontWeight: "700", marginBottom: 6 },
  geetaTranslit: { fontSize: FONTS.tiny, lineHeight: 18, marginBottom: 8 },
  geetaHeading: { fontSize: FONTS.small, fontWeight: "800", marginTop: 4, marginBottom: 4 },
  geetaBody: { fontSize: FONTS.small, lineHeight: 21, marginBottom: 6 },
  geetaPractice: { fontSize: FONTS.small, lineHeight: 21, fontWeight: "700", marginTop: 2 },
  gameCard: { borderColor: "#DDE8FB" },
  gameHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  gameHeaderMain: { flexDirection: "row", flex: 1, paddingRight: SPACING.sm },
  gameEmoji: { fontSize: 28, marginRight: SPACING.md },
  gameTitleWrap: { flex: 1 },
  gameTitle: { fontSize: FONTS.body, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 4 },
  gameBenefit: { fontSize: FONTS.small, color: "#3F6FB5", lineHeight: 20 },
  gameHowTo: { fontSize: FONTS.body, color: COLORS.textSecondary, lineHeight: 22 },
  gamesSafetyText: { fontSize: FONTS.body, color: "#A85B16", lineHeight: 22 },
  foodRow: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  foodEmoji: { fontSize: 28, marginRight: SPACING.md },
  foodInfo: { flex: 1 },
  foodName: { fontSize: FONTS.body, fontWeight: "700", color: COLORS.textPrimary },
  foodReason: { fontSize: FONTS.small, color: COLORS.textSecondary },
  avoidRow: { marginBottom: SPACING.sm },
  avoidName: { fontSize: FONTS.body, fontWeight: "600", color: COLORS.error },
  avoidReason: { fontSize: FONTS.small, color: COLORS.textSecondary, marginLeft: SPACING.lg },
  recipeSection: { fontSize: FONTS.small, fontWeight: "700", color: COLORS.primaryDark, marginTop: SPACING.sm, marginBottom: 4 },
  recipeMethod: { fontSize: FONTS.body, color: COLORS.textSecondary, lineHeight: 22 },
  hydrationText: { fontSize: FONTS.body, color: COLORS.accent, lineHeight: 22 },
  dayLabelText: {
    fontSize: FONTS.h4,
    color: COLORS.primaryDark,
    fontWeight: "800",
    marginBottom: SPACING.xs,
  },
  sourceNoteText: { fontSize: FONTS.small, color: COLORS.textSecondary, lineHeight: 20 },
  shlokaText: { fontSize: FONTS.h4, lineHeight: 28, color: COLORS.primaryDark, textAlign: "center", fontWeight: "600", marginBottom: SPACING.sm },
  divider: { height: 1, backgroundColor: COLORS.gold, opacity: 0.3, marginVertical: SPACING.sm },
  shlokaMeaning: { fontSize: FONTS.body, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.sm },
  musicCard: { flexDirection: "row", alignItems: "center" },
  musicNote: { fontSize: 48, marginRight: SPACING.md },
  musicInfo: { flex: 1 },
  musicRaga: { fontSize: FONTS.h4, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 4 },
  musicBenefit: { fontSize: FONTS.body, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  storyText: { fontSize: FONTS.body, color: COLORS.textSecondary, lineHeight: 25, marginBottom: SPACING.sm },
  bhaktiTitle: { fontSize: FONTS.h4, color: COLORS.primaryDark, fontWeight: "800", marginBottom: 4 },
  bhaktiSuggestion: { fontSize: FONTS.small, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.sm },
  lyricsBox: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  lyricsLine: { fontSize: FONTS.small, color: COLORS.textPrimary, lineHeight: 21, marginBottom: 3 },
  moralBox: {
    backgroundColor: "rgba(194,113,79,0.1)",
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(194,113,79,0.18)",
  },
  moralLabel: { fontWeight: "700", color: COLORS.primary, marginRight: SPACING.xs },
  moralText: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.body },
  routineGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  routineCard: {
    width: "48.8%",
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minHeight: 150,
  },
  routineIcon: { fontSize: 24, marginBottom: 6 },
  routineTitle: { fontSize: FONTS.small, color: COLORS.textPrimary, fontWeight: "800", marginBottom: 6 },
  routineValue: { fontSize: FONTS.small, color: COLORS.textSecondary, lineHeight: 20 },
  meditationText: { fontSize: FONTS.body, color: COLORS.accent, lineHeight: 24, fontStyle: "italic" },
});
