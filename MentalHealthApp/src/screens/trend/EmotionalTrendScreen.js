import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  listDailyAssessmentCalendar,
  listDailyAssessmentDetailsByDate,
  listRecentDailyAssessmentEntries,
  listDailyAssessmentTrend,
} from '../../lib/dailyAssessments';
import TrendCalendarCard, { buildMonthCells } from './components/TrendCalendarCard';
import TrendGraphCard from './components/TrendGraphCard';
import CalanderDetailsPopUp from './components/CalanderDetailsPopUp';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const INSIGHT_MODEL = 'gemini-3-flash-preview';

const INSIGHT_CACHE_PREFIX = 'trend_ai_insight_v1:';
const INSIGHT_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const INSIGHT_MIN_REFRESH_MS = 20 * 60 * 1000; // 20 minutes cooldown
const INSIGHT_META_KEY = 'trend_ai_insight_meta_v1';

const INSIGHT_PROMPT = `You are a mental wellbeing insights assistant.
Given recent daily check-in data, provide:
1) A short trend observation (1 sentence)
2) 2-3 practical, supportive suggestions
3) 1 encouragement line

Rules:
- Keep it non-diagnostic.
- Do not claim medical diagnosis.
- Keep response concise, plain text, around 10-20 words.
- Use a warm, hopeful, strengths-based tone.
- Highlight progress first before mentioning improvement areas.
- Sound positive and motivating, with compassionate energy.
- Avoid scary, harsh, or overly clinical wording.`;

function parseLocalDateKey(dateKey) {
  const [year, month, day] = String(dateKey || '').split('-').map((v) => Number(v));
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLatestContinuousStreakDays(trendRows) {
  const keys = [...new Set((trendRows || []).map((row) => String(row?.date || '')).filter(Boolean))].sort();
  if (!keys.length) return 0;

  const keySet = new Set(keys);
  let cursor = parseLocalDateKey(keys[keys.length - 1]);
  if (!cursor || Number.isNaN(cursor.getTime())) return 0;

  let streak = 0;
  while (cursor) {
    const key = toLocalDateKey(cursor);
    if (!keySet.has(key)) break;
    streak += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }

  return streak;
}

export default function EmotionalTrendScreen() {
  const [trend, setTrend] = useState([]);
  const [calendarRows, setCalendarRows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiInsight, setAiInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);

  const hashString = (input) => {
    let hash = 5381;
    for (let i = 0; i < input.length; i += 1) {
      hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  };

  const buildInsightSignature = (trendRows, entries) => {
    const trendSig = (trendRows || []).map((x) => [String(x?.date || ''), Number(x?.wellbeing || 0).toFixed(2)]);
    const entriesSig = (entries || []).map((x) => [String(x?.id || ''), String(x?.created_at || ''), Number(x?.mood_score || 0)]);
    return hashString(JSON.stringify({ trendSig, entriesSig }));
  };

  const buildInsightInput = (trendRows, entries) => {
    const nextTrendRows = (trendRows || []).slice(-7);
    const nextEntries = (entries || []).slice(0, 5);

    const trendSummary = nextTrendRows
      .map((x) => `${x.date}: checkin_avg=${x.wellbeing ?? '-'}`)
      .join('\n');

    const answerSummary = nextEntries.map((entry) => {
      const pairs = (entry.responses || [])
        .slice(0, 5)
        .map((r) => `${r.prompt}: ${r.label || r.value || '-'}`)
        .join('; ');

      return `${entry.created_at}: mood=${entry.mood_score ?? '-'}, answers=[${pairs}]`;
    }).join('\n');

    return `Recent emotional trend:\n${trendSummary || 'No trend data'}\n\nRecent detailed check-ins:\n${answerSummary || 'No detailed entries'}`;
  };

  const fetchAIInsight = async (trendRows, entries) => {
    if (!GEMINI_API_KEY) {
      return 'AI insight is unavailable because Gemini API key is not configured.';
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${INSIGHT_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const body = {
      system_instruction: {
        parts: [{ text: INSIGHT_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: buildInsightInput(trendRows, entries) }],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        topP: 0.9,
        maxOutputTokens: 160,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const payload = await response.json();
    if (!response.ok || payload?.error) {
      throw new Error(payload?.error?.message || 'Failed to generate AI insight.');
    }

    const parts = payload?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p?.text || '').join('').trim();
    return text || 'Keep tracking your check-ins. More entries will enable better personalized insights.';
  };

  const loadTrendAndInsight = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [trendRows, recentEntries] = await Promise.all([
        listDailyAssessmentTrend(14),
        listRecentDailyAssessmentEntries(14, 12),
      ]);

      setTrend(trendRows);

      if (!trendRows.length && !recentEntries.length) {
        setAiInsight('You are at the beginning of something meaningful — start your daily check-ins and I will turn your progress into uplifting, personalized insights.');
        return;
      }

      const signature = buildInsightSignature(trendRows, recentEntries);
      const cacheKey = `${INSIGHT_CACHE_PREFIX}${signature}`;

      // Global cooldown to prevent repeated Gemini calls on focus.
      try {
        const metaRaw = await AsyncStorage.getItem(INSIGHT_META_KEY);
        if (metaRaw) {
          const meta = JSON.parse(metaRaw);
          const lastAttemptAt = Number(meta?.lastAttemptAt || 0);
          if (lastAttemptAt > 0 && (Date.now() - lastAttemptAt) < INSIGHT_MIN_REFRESH_MS) {
            return;
          }
        }
      } catch {
        // Ignore meta cache errors.
      }

      try {
        const cachedRaw = await AsyncStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          const cachedAt = Number(cached?.at || 0);
          const cachedText = String(cached?.text || '');
          const ttlMs = Number(cached?.ttlMs || INSIGHT_CACHE_TTL_MS);
          const isFresh = cachedAt > 0 && (Date.now() - cachedAt) < ttlMs;

          if (isFresh && cachedText) {
            setAiInsight(cachedText);
            return;
          }
        }
      } catch {
        // Ignore cache errors and continue.
      }

      setInsightLoading(true);
      try {
        try {
          await AsyncStorage.setItem(INSIGHT_META_KEY, JSON.stringify({ lastAttemptAt: Date.now() }));
        } catch {
          // Ignore meta write failures.
        }

        const insight = await fetchAIInsight(trendRows, recentEntries);
        setAiInsight(insight);
        try {
          await AsyncStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), text: insight }));
        } catch {
          // Ignore cache write failures.
        }
      } catch (insightError) {
        const message = String(insightError?.message || '');
        const isHighDemand = /high\s+demand|rate\s*limit|too\s+many\s+requests|429/i.test(message);
        const fallbackText = isHighDemand
          ? 'AI is busy right now (high demand). Please try again later — your progress is still being tracked.'
          : (message || 'You are building a strong self-awareness habit. Keep going — your next few check-ins will unlock even richer, more personalized suggestions.');

        setAiInsight(fallbackText);

        // Cache error/fallback briefly to avoid repeated calls while Gemini is overloaded.
        try {
          await AsyncStorage.setItem(cacheKey, JSON.stringify({
            at: Date.now(),
            text: fallbackText,
            ttlMs: isHighDemand ? INSIGHT_MIN_REFRESH_MS : 60 * 60 * 1000,
          }));
        } catch {
          // Ignore cache write failures.
        }
      } finally {
        setInsightLoading(false);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load trend data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCalendar = useCallback(async () => {
    try {
      setError('');
      setCalendarRows(buildMonthCells(monthCursor, new Map()));
      const calendarData = await listDailyAssessmentCalendar(monthCursor);
      const mapByDate = new Map(calendarData.map((r) => [r.date, r]));
      setCalendarRows(buildMonthCells(monthCursor, mapByDate));
    } catch (err) {
      setError(err?.message || 'Failed to load calendar data.');
    }
  }, [monthCursor]);

  useFocusEffect(
    useCallback(() => {
      loadTrendAndInsight();
      loadCalendar();
    }, [loadTrendAndInsight, loadCalendar])
  );

  const monthTitle = useMemo(
    () => monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    [monthCursor]
  );

  const labels = useMemo(
    () => trend.map((x) => {
      const d = parseLocalDateKey(x.date);
      if (!d || Number.isNaN(d.getTime())) return x.date;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }),
    [trend]
  );

  const overallSeries = useMemo(
    () => trend.map((x) => {
      const questionAverage = Number(x.wellbeing);
      return Number.isFinite(questionAverage) && questionAverage > 0
        ? Number(questionAverage.toFixed(2))
        : 0;
    }),
    [trend]
  );
  const streakDays = useMemo(() => getLatestContinuousStreakDays(trend), [trend]);

  const loadDayDetails = async (dateIso) => {
    try {
      setDetailsLoading(true);
      setSelectedDate(dateIso);
      const rows = await listDailyAssessmentDetailsByDate(dateIso);
      setSelectedEntries(rows);
    } catch (err) {
      setError(err?.message || 'Failed to load selected day details.');
      setSelectedEntries([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setSelectedDate(null);
    setSelectedEntries([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="pulse" size={20} color="#0369a1" />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.title}>Emotional Analysis</Text>
            <Text style={styles.heroSubtitle}>Track mood flow, check-ins, and daily emotional patterns.</Text>
          </View>
        </View>

        <TrendCalendarCard
          monthTitle={monthTitle}
          setMonthCursor={setMonthCursor}
          calendarRows={calendarRows}
          selectedDate={selectedDate}
          onPressDay={loadDayDetails}
          streakDays={streakDays}
        />

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && trend.length === 0 && (
          <Text style={styles.emptyText}>No daily assessment data yet. Submit a check-in first.</Text>
        )}

        <TrendGraphCard
          labels={labels}
          overallSeries={overallSeries}
          loading={loading}
          insightLoading={insightLoading}
          aiInsight={aiInsight}
          hasData={overallSeries.length > 0}
        />
      </ScrollView>

      <CalanderDetailsPopUp
        visible={!!selectedDate}
        selectedDate={selectedDate}
        selectedEntries={selectedEntries}
        detailsLoading={detailsLoading}
        onClose={closeDetailsModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  heroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginRight: 10,
  },
  heroTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 3,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  errorText: {
    marginBottom: 8,
    color: '#b91c1c',
  },
  emptyText: {
    marginBottom: 12,
    color: '#475569',
  },
});
