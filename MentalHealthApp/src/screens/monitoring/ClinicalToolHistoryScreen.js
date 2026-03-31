import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { getQuestionMetaByToolIds, listMyClinicalToolResponses } from '../../lib/clinicalTools';

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDaysAgo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfGiven = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((startOfToday - startOfGiven) / dayMs);

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

function getAverageScore(item) {
  const score = Number(item?.score);
  const totalQuestions = Number(item?.total_questions);
  if (!Number.isFinite(score) || !Number.isFinite(totalQuestions) || totalQuestions <= 0) return null;
  return score / totalQuestions;
}

function getRangeMeta(item) {
  const code = String(item?.clinical_tools?.code || '').toUpperCase();
  const score = Number(item?.score);
  const avg = getAverageScore(item);

  if (!Number.isFinite(score) || !Number.isFinite(avg)) {
    return { label: 'Range unavailable', tone: 'neutral' };
  }

  if (code === 'PHQ9') {
    if (avg <= 0.55) return { label: 'Minimal depression', tone: 'good' };
    if (avg <= 1.10) return { label: 'Mild depression', tone: 'mild' };
    if (avg <= 1.65) return { label: 'Moderate depression', tone: 'moderate' };
    if (avg <= 2.20) return { label: 'Moderately severe depression', tone: 'severe' };
    return { label: 'Severe depression', tone: 'extreme' };
  }

  if (code === 'GAD7') {
    if (avg <= 0.70) return { label: 'Minimal anxiety', tone: 'good' };
    if (avg <= 1.40) return { label: 'Mild anxiety', tone: 'mild' };
    if (avg <= 2.10) return { label: 'Moderate anxiety', tone: 'moderate' };
    return { label: 'Severe anxiety', tone: 'extreme' };
  }

  if (code === 'PHQ15') {
    if (avg <= 0.30) return { label: 'Minimal somatic symptoms', tone: 'good' };
    if (avg <= 0.65) return { label: 'Low somatic symptoms', tone: 'mild' };
    if (avg <= 1.00) return { label: 'Medium somatic symptoms', tone: 'moderate' };
    return { label: 'High somatic symptoms', tone: 'severe' };
  }

  if (code === 'DASS21') {
    if (avg <= 0.75) return { label: 'Normal to mild overall', tone: 'good' };
    if (avg <= 1.50) return { label: 'Moderate overall', tone: 'moderate' };
    if (avg <= 2.25) return { label: 'Severe overall', tone: 'severe' };
    return { label: 'Extremely severe overall', tone: 'extreme' };
  }

  if (code === 'WHO5') {
    if (avg <= 1.40) return { label: 'Very low wellbeing', tone: 'extreme' };
    if (avg <= 2.60) return { label: 'Low wellbeing', tone: 'severe' };
    if (avg <= 3.80) return { label: 'Moderate wellbeing', tone: 'moderate' };
    return { label: 'Good wellbeing', tone: 'good' };
  }

  if (code === 'PSS10') {
    if (avg <= 1.30) return { label: 'Low stress', tone: 'good' };
    if (avg <= 2.60) return { label: 'Moderate stress', tone: 'moderate' };
    return { label: 'High stress', tone: 'severe' };
  }

  if (code === 'ISI') {
    if (avg <= 1.00) return { label: 'No clinically significant insomnia', tone: 'good' };
    if (avg <= 2.00) return { label: 'Subthreshold insomnia', tone: 'mild' };
    if (avg <= 3.00) return { label: 'Moderate clinical insomnia', tone: 'severe' };
    return { label: 'Severe clinical insomnia', tone: 'extreme' };
  }

  if (code === 'CBI') {
    if (avg < 25) return { label: 'Low burnout', tone: 'good' };
    if (avg < 50) return { label: 'Mild burnout', tone: 'mild' };
    if (avg < 75) return { label: 'Moderate burnout', tone: 'moderate' };
    return { label: 'High burnout', tone: 'extreme' };
  }

  if (code === 'WHODAS12') {
    if (avg <= 0.33) return { label: 'No disability', tone: 'good' };
    if (avg <= 1.17) return { label: 'Mild disability', tone: 'mild' };
    if (avg <= 2.00) return { label: 'Moderate disability', tone: 'moderate' };
    if (avg <= 3.00) return { label: 'Severe disability', tone: 'severe' };
    return { label: 'Extreme disability', tone: 'extreme' };
  }

  return { label: 'Range unavailable', tone: 'neutral' };
}

function formatMark(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  if (Math.abs(num - Math.round(num)) < 0.000001) return String(Math.round(num));
  return num.toFixed(digits);
}

function toFiniteNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function getRangeToneStyle(tone) {
  if (tone === 'good') return { bg: '#ecfdf5', border: '#86efac', text: '#166534' };
  if (tone === 'mild') return { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' };
  if (tone === 'moderate') return { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' };
  if (tone === 'severe') return { bg: '#fff7ed', border: '#fdba74', text: '#9a3412' };
  if (tone === 'extreme') return { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' };
  return { bg: '#f1f5f9', border: '#cbd5e1', text: '#334155' };
}

function getConditionTopic(code) {
  if (code === 'PHQ9') return 'depression disorder';
  if (code === 'GAD7') return 'anxiety disorder';
  if (code === 'PHQ15') return 'somatic symptom disorder';
  if (code === 'DASS21') return 'emotional distress';
  if (code === 'WHO5') return 'reduced wellbeing';
  if (code === 'PSS10') return 'high stress';
  if (code === 'ISI') return 'insomnia disorder';
  if (code === 'CBI') return 'burnout';
  if (code === 'WHODAS12') return 'functional impairment';
  return 'mental health concerns';
}

function buildInterpretationAdvice(code, tone) {
  const topic = getConditionTopic(code);

  if (code === 'WHO5') {
    if (tone === 'good') return 'Your score suggests good wellbeing. Keep maintaining your healthy routine.';
    if (tone === 'mild') return 'Your score suggests slight wellbeing decline. Monitor your mood and self-care this week.';
    if (tone === 'moderate') return 'Your score suggests moderate wellbeing concerns. Consider support from a counselor.';
    return 'Your score suggests significant wellbeing concerns. Please consult a mental health professional.';
  }

  if (tone === 'good') return `Your score suggests low likelihood of ${topic}.`;
  if (tone === 'mild') return `Your score suggests mild ${topic} signs. Monitor and retake soon.`;
  if (tone === 'moderate') return `Your score suggests moderate ${topic} signs. Consider discussing with a professional.`;
  return `Your score suggests high chance of ${topic}. Please consult a professional for further evaluation.`;
}

function getChancePercentage(code, percentageOfFullMarks) {
  if (!Number.isFinite(percentageOfFullMarks)) return null;
  const isProtectiveScale = code === 'WHO5';
  const chance = isProtectiveScale ? 100 - percentageOfFullMarks : percentageOfFullMarks;
  return Math.max(0, Math.min(100, chance));
}

export default function ClinicalToolHistoryScreen({ navigation }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [questionTextMap, setQuestionTextMap] = useState({});
  const [toolStatsMap, setToolStatsMap] = useState({});
  const [questionMaxMap, setQuestionMaxMap] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listMyClinicalToolResponses();
      setRows(data);

      const toolIds = Array.from(new Set((data || []).map((row) => row?.tool_id).filter(Boolean)));
      const meta = await getQuestionMetaByToolIds(toolIds);
      setQuestionTextMap(meta?.questionTextMap || {});
      setToolStatsMap(meta?.toolStatsMap || {});
      setQuestionMaxMap(meta?.questionMaxMap || {});
    } catch (err) {
      setError(err?.message || 'Failed to load report history.');
      setRows([]);
      setQuestionTextMap({});
      setToolStatsMap({});
      setQuestionMaxMap({});
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const toggleExpand = (responseId) => {
    setExpanded((prev) => ({
      ...prev,
      [responseId]: !prev[responseId],
    }));
  };

  const getAnswerEntries = (rawAnswers) => {
    if (!rawAnswers) return [];

    let parsed = rawAnswers;
    if (typeof rawAnswers === 'string') {
      try {
        parsed = JSON.parse(rawAnswers);
      } catch (_) {
        return [];
      }
    }

    if (Array.isArray(parsed)) {
      return parsed
        .map((answer, idx) => {
          const label = answer?.label ?? answer?.text ?? String(answer ?? '');
          const value = toFiniteNumber(answer?.value ?? answer);
          const questionLabel = `Q${idx + 1}`;
          return { questionLabel, label, value, maxValue: null };
        })
        .filter((entry) => entry.label && entry.label !== '[object Object]');
    }

    if (typeof parsed === 'object') {
      return Object.keys(parsed)
        .map((key, idx) => {
          const answer = parsed[key];
          const label = answer?.label ?? answer?.text ?? String(answer ?? '');
          const value = toFiniteNumber(answer?.value ?? answer);
          const maxValue = toFiniteNumber(questionMaxMap[String(key)]);
          const questionLabel = questionTextMap[String(key)] || `Q${idx + 1}`;
          return { questionLabel, label, value, maxValue };
        })
        .filter((entry) => entry.label && entry.label !== '[object Object]');
    }

    return [];
  };

  const renderItem = ({ item }) => {
    const tool = item?.clinical_tools || {};
    const code = String(tool?.code || '').toUpperCase();
    const title = tool?.name || tool?.code || 'Assessment';
    const averageScore = getAverageScore(item);
    const createdAt = formatDateTime(item.created_at);
    const daysAgo = formatDaysAgo(item.created_at);
    const isExpanded = !!expanded[item.id];
    const answerEntries = getAnswerEntries(item.answers);
    const fullMarks = Number(toolStatsMap[item.tool_id]?.fullMarks);
    const hasFullMarks = Number.isFinite(fullMarks) && fullMarks > 0;
    const totalScore = Number(item?.score);
    const percentageOfFullMarks = Number.isFinite(totalScore) && hasFullMarks
      ? (totalScore / fullMarks) * 100
      : null;
    const chancePercentage = getChancePercentage(code, percentageOfFullMarks);
    const conditionTopic = getConditionTopic(code);
    const range = getRangeMeta(item);
    const rangeToneStyle = getRangeToneStyle(range.tone);
    const interpretationAdvice = buildInterpretationAdvice(code, range.tone);
    const shouldShowProviderButton = range.tone === 'severe' || range.tone === 'extreme';

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.toolName}>{title}</Text>
          <View style={styles.dateWrap}>
            <Text style={styles.dateText}>{createdAt}</Text>
            {!!daysAgo && <Text style={styles.dateAgoText}>{daysAgo}</Text>}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.badge}>
            <Ionicons name="analytics-outline" size={14} color="#1d4ed8" />
            <Text style={styles.badgeText}>Total Marks: {formatMark(totalScore)}{hasFullMarks ? ` / ${formatMark(fullMarks)}` : ''}</Text>
          </View>

          <View style={styles.badge}>
            <Ionicons name="calculator-outline" size={14} color="#0f766e" />
            <Text style={styles.badgeText}>Average Score per Question: {formatMark(averageScore)}</Text>
          </View>
        </View>

        <View
          style={[
            styles.rangeWrap,
            {
              backgroundColor: rangeToneStyle.bg,
              borderColor: rangeToneStyle.border,
              borderLeftColor: rangeToneStyle.text,
            },
          ]}
        >
          <View style={styles.rangeHeaderRow}>
            <View style={styles.rangeTitleRow}>
              <Ionicons name="information-circle-outline" size={15} color={rangeToneStyle.text} />
              <Text style={[styles.rangeTitle, { color: rangeToneStyle.text }]}>Interpretation</Text>
            </View>

            {shouldShowProviderButton && (
              <TouchableOpacity
                style={styles.providerButton}
                onPress={() => {
                  navigation.navigate('Main', { screen: 'Doctors' });
                }}
              >
                <Ionicons name="medkit-outline" size={14} color="#ffffff" />
                <Text style={styles.providerButtonText}>Find A Health Care Providers</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.rangeText, { color: rangeToneStyle.text }]}>{range.label}</Text>
          <Text style={[styles.rangeChanceText, { color: rangeToneStyle.text }]}>
            {Number.isFinite(chancePercentage)
              ? `~${chancePercentage.toFixed(1)}% chance of getting ${conditionTopic}`
              : 'Chance unavailable'}
          </Text>
          <Text style={[styles.rangeAdviceText, { color: rangeToneStyle.text }]}>{interpretationAdvice}</Text>
        </View>

        <TouchableOpacity style={styles.expandBtn} onPress={() => toggleExpand(item.id)}>
          <Text style={styles.expandBtnText}>{isExpanded ? 'Hide answers' : 'View answers'}</Text>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#1d4ed8" />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.answersPanel}>
            <Text style={styles.answersTitle}>Your answers</Text>

            {!answerEntries.length ? (
              <Text style={styles.answersEmpty}>No answer details available for this submission.</Text>
            ) : (
              answerEntries.map((entry) => (
                <View key={`${item.id}-${entry.questionLabel}`} style={styles.answerRow}>
                  <Text style={styles.answerQuestion}>{entry.questionLabel}</Text>
                  <Text style={styles.answerValue}>{entry.label}</Text>
                  <Text style={styles.answerMarks}>
                    Marks: {formatMark(entry.value)}
                    {Number.isFinite(entry.maxValue)
                      ? ` / ${formatMark(entry.maxValue)} (${formatMark((entry.value / entry.maxValue) * 100, 1)}%)`
                      : ''}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.title}>Historical Report</Text>
              <TouchableOpacity style={styles.refreshBtn} onPress={load}>
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>Track your previous assessment submissions.</Text>

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.loadingText}>Loading history...</Text>
              </View>
            )}

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            {!loading && !error && rows.length === 0 && (
              <Text style={styles.emptyText}>No assessment submissions yet.</Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  subtitle: {
    marginTop: 6,
    color: '#64748b',
  },
  loadingRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: '#64748b',
  },
  errorText: {
    marginTop: 10,
    color: '#b91c1c',
  },
  emptyText: {
    marginTop: 10,
    color: '#475569',
  },
  card: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  toolName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    paddingRight: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  dateWrap: {
    alignItems: 'flex-end',
  },
  dateAgoText: {
    marginTop: 2,
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
  },
  row: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badgeText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#1f2937',
  },
  rangeWrap: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingHorizontal: 10,
    paddingVertical: 9,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  rangeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  rangeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rangeTitle: {
    fontWeight: '800',
    fontSize: 12,
  },
  rangeText: {
    fontWeight: '700',
    fontSize: 12,
  },
  rangeChanceText: {
    marginTop: 3,
    fontWeight: '700',
    fontSize: 12,
  },
  rangeAdviceText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  providerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1d4ed8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  providerButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  expandBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  expandBtnText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '700',
  },
  answersPanel: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  answersTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  answersEmpty: {
    fontSize: 12,
    color: '#64748b',
  },
  answerRow: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 9,
  },
  answerQuestion: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 3,
  },
  answerValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '600',
  },
  answerMarks: {
    marginTop: 4,
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  refreshBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    color: '#fff',
    fontWeight: '700',
  },
});
