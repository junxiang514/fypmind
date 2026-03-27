import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import {
  listDailyAssessmentCalendar,
  listDailyAssessmentDetailsByDate,
  listRecentDailyAssessmentEntries,
  listDailyAssessmentTrend,
} from '../../lib/dailyAssessments';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const INSIGHT_MODEL = 'gemini-3-flash-preview';

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

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

function calendarToneByMood(mood) {
  if (!Number.isFinite(mood)) return { bg: '#e2e8f0', text: '#64748b', border: '#cbd5e1' };
  if (mood <= 2) return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
  if (mood <= 3) return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
  if (mood <= 4) return { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' };
  return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
}

function buildMonthCells(monthCursor, mapByDate) {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  const leadingBlanks = start.getDay();
  const cells = [];

  for (let i = 0; i < leadingBlanks; i += 1) {
    cells.push({ key: `blank-${i}`, blank: true });
  }

  for (let day = 1; day <= end.getDate(); day += 1) {
    const d = new Date(year, month, day);
    const key = dateKey(d);
    const row = mapByDate.get(key);
    cells.push({
      key,
      day,
      blank: false,
      checkins: Number(row?.checkins || 0),
      mood: Number(row?.mood),
    });
  }

  const trailing = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < trailing; i += 1) {
    cells.push({ key: `trail-${i}`, blank: true });
  }

  return cells;
}

export default function EmotionalTrendScreen() {
  const screenWidth = Dimensions.get('window').width;
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
  const [insightModalVisible, setInsightModalVisible] = useState(false);

  const buildInsightInput = (trendRows, entries) => {
    const trendSummary = trendRows.map((x) => `${x.date}: mood=${x.mood ?? '-'}, checkin_avg=${x.wellbeing ?? '-'}`).join('\n');

    const answerSummary = (entries || []).map((entry) => {
      const pairs = (entry.responses || [])
        .slice(0, 8)
        .map((r) => `${r.category || 'General'}|${r.prompt}: ${r.label || r.value || '-'}`)
        .join('; ');

      return `${entry.created_at}: mood=${entry.mood_score ?? '-'}, avg=${entry.average_score ?? '-'}, answers=[${pairs}]`;
    }).join('\n');

    return `Recent trend (last 14 days):\n${trendSummary || 'No trend data'}\n\nRecent detailed check-ins:\n${answerSummary || 'No detailed entries'}`;
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
        maxOutputTokens: 280,
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

  useEffect(() => {
    const loadTrendAndInsight = async () => {
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

        setInsightLoading(true);
        try {
          const insight = await fetchAIInsight(trendRows, recentEntries);
          setAiInsight(insight);
        } catch (insightError) {
          setAiInsight(
            insightError?.message ||
            'You are building a strong self-awareness habit. Keep going — your next few check-ins will unlock even richer, more personalized suggestions.'
          );
        } finally {
          setInsightLoading(false);
        }
      } catch (err) {
        setError(err?.message || 'Failed to load trend data.');
      } finally {
        setLoading(false);
      }
    };

    loadTrendAndInsight();
  }, []);

  useEffect(() => {
    const loadCalendar = async () => {
      try {
        setLoading(true);
        setError('');
        const calendarData = await listDailyAssessmentCalendar(monthCursor);

        const mapByDate = new Map(calendarData.map((r) => [r.date, r]));
        setCalendarRows(buildMonthCells(monthCursor, mapByDate));
      } catch (err) {
        setError(err?.message || 'Failed to load trend data.');
      } finally {
        setLoading(false);
      }
    };

    loadCalendar();
  }, [monthCursor]);

  const monthTitle = useMemo(
    () => monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    [monthCursor]
  );

  const labels = useMemo(
    () => trend.map((x) => {
      const d = new Date(x.date);
      return Number.isNaN(d.getTime()) ? x.date : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }),
    [trend]
  );

  const moodSeries = useMemo(() => trend.map((x) => Number(x.mood ?? 0)), [trend]);
  const wellbeingSeries = useMemo(() => trend.map((x) => Number(x.wellbeing ?? 0)), [trend]);

  const data = {
    labels: labels.length ? labels : ['No data'],
    datasets: [
      {
        data: moodSeries.length ? moodSeries : [0],
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: wellbeingSeries.length ? wellbeingSeries : [0],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['Mood', 'Check-in Avg'],
  };

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

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
        <Text style={styles.title}>Weekly Emotional Trend</Text>
        <Text style={styles.subtitle}>Track your check-ins and tap any date to view answered questions.</Text>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            >
              <Ionicons name="chevron-back" size={16} color="#1d4ed8" />
            </TouchableOpacity>

            <Text style={styles.calendarTitle}>{monthTitle}</Text>

            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            >
              <Ionicons name="chevron-forward" size={16} color="#1d4ed8" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekHeaderRow}>
            {WEEKDAYS.map((wd) => (
              <Text key={wd} style={styles.weekdayText}>{wd}</Text>
            ))}
          </View>

          <View style={styles.monthGrid}>
            {calendarRows.map((cell) => {
              if (cell.blank) {
                return (
                  <View key={cell.key} style={styles.dayCellWrap}>
                    <View style={styles.dayCellBlank} />
                  </View>
                );
              }
              const tone = cell.checkins > 0 ? calendarToneByMood(cell.mood) : calendarToneByMood(NaN);
              const isSelected = selectedDate === cell.key;
              return (
                <View key={cell.key} style={styles.dayCellWrap}>
                  <TouchableOpacity
                    style={[
                      styles.dayCell,
                      { backgroundColor: tone.bg, borderColor: tone.border },
                      isSelected && styles.dayCellSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => loadDayDetails(cell.key)}
                  >
                    <Text style={[styles.dayText, { color: tone.text }]}>{cell.day}</Text>
                    <Text style={[styles.dotText, { color: tone.text }]}>
                      {cell.checkins > 0 ? (cell.checkins > 1 ? `${cell.checkins}x` : '✓') : ''}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#e2e8f0' }]} />
              <Text style={styles.legendText}>No check-in</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#fee2e2' }]} />
              <Text style={styles.legendText}>Low mood</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#fef3c7' }]} />
              <Text style={styles.legendText}>Neutral</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#dcfce7' }]} />
              <Text style={styles.legendText}>Good mood</Text>
            </View>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Loading trend...</Text>
          </View>
        )}

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && trend.length === 0 && (
          <Text style={styles.emptyText}>No daily assessment data yet. Submit a check-in first.</Text>
        )}

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>14-day mood trajectory</Text>
          <LineChart
            data={data}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {moodSeries.length ? (moodSeries.reduce((sum, v) => sum + v, 0) / moodSeries.length).toFixed(2) : '-'}
            </Text>
            <Text style={styles.statLabel}>Avg Mood</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {moodSeries.length >= 2
                ? `${(((moodSeries[moodSeries.length - 1] - moodSeries[0]) / Math.max(1, moodSeries[0])) * 100).toFixed(0)}%`
                : '-'}
            </Text>
            <Text style={styles.statLabel}>Improvement</Text>
          </View>
        </View>

        <View style={styles.insightContainer}>
          <Text style={styles.insightTitle}>AI Insight</Text>
          {insightLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#0284c7" />
              <Text style={styles.loadingText}>Generating personalized insight...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.insightText}>
                {aiInsight || (moodSeries.length
                  ? 'You are doing great by tracking your wellbeing consistently. Keep this momentum — your insights will become even more powerful and personalized over time.'
                  : 'You are one check-in away from your first personalized insight — let’s begin and build your momentum.')}
              </Text>
              <TouchableOpacity style={styles.readMoreBtn} onPress={() => setInsightModalVisible(true)}>
                <Text style={styles.readMoreText}>View full insight</Text>
                <Ionicons name="open-outline" size={14} color="#0369a1" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedDate}
        transparent
        animationType="fade"
        onRequestClose={closeDetailsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.detailsTitle}>
                Answers on {selectedDate ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString() : ''}
              </Text>
              <TouchableOpacity style={styles.closeBtn} onPress={closeDetailsModal}>
                <Ionicons name="close" size={16} color="#334155" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              {detailsLoading && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>Loading answers...</Text>
                </View>
              )}

              {!detailsLoading && selectedEntries.length === 0 && (
                <Text style={styles.emptyText}>No check-ins found for this date.</Text>
              )}

              {!detailsLoading && selectedEntries.map((entry, entryIndex) => (
                <View key={entry.id} style={styles.entryBox}>
                  <Text style={styles.entryTitle}>
                    Check-in #{selectedEntries.length - entryIndex} • {new Date(entry.created_at).toLocaleTimeString()}
                  </Text>

                  {(entry.responses || []).map((answer, i) => (
                    <View key={`${entry.id}-${i}`} style={styles.answerRow}>
                      <Text style={styles.answerPrompt}>{answer.prompt}</Text>
                      <Text style={styles.answerValue}>{answer.label || answer.value || '-'}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={insightModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInsightModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.detailsTitle}>Full AI Insight</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setInsightModalVisible(false)}>
                <Ionicons name="close" size={16} color="#334155" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.fullInsightText}>
                {aiInsight || 'No insight generated yet. Complete a few daily check-ins to unlock personalized guidance.'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef3fb',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekdayText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -2,
  },
  dayCellWrap: {
    width: '14.2857%',
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  dayCellBlank: {
    height: 44,
  },
  dayCell: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    padding: 4,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  dayText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  dotText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  legendRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    maxHeight: '78%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 12,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  entryBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    backgroundColor: '#f8fafc',
  },
  entryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
    marginBottom: 6,
  },
  answerRow: {
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 5,
  },
  answerPrompt: {
    fontSize: 12,
    color: '#334155',
  },
  answerValue: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#64748b',
  },
  errorText: {
    marginBottom: 8,
    color: '#b91c1c',
  },
  emptyText: {
    marginBottom: 12,
    color: '#475569',
  },
  chartContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 10,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  chartTitle: {
    width: '100%',
    fontSize: 13,
    color: '#1e3a8a',
    fontWeight: '700',
    marginLeft: 8,
    marginBottom: 2,
  },
  chart: {
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  insightContainer: {
    backgroundColor: '#e0f2fe',
    padding: 20,
    borderRadius: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  readMoreBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
    backgroundColor: '#f0f9ff',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  readMoreText: {
    marginRight: 6,
    color: '#0369a1',
    fontWeight: '700',
    fontSize: 12,
  },
  fullInsightText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 23,
  },
});
