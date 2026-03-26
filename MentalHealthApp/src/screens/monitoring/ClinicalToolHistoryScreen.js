import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { listMyClinicalToolResponses } from '../../lib/clinicalTools';

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
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

function getRangeToneStyle(tone) {
  if (tone === 'good') return { bg: '#ecfdf5', border: '#86efac', text: '#166534' };
  if (tone === 'mild') return { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' };
  if (tone === 'moderate') return { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' };
  if (tone === 'severe') return { bg: '#fff7ed', border: '#fdba74', text: '#9a3412' };
  if (tone === 'extreme') return { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' };
  return { bg: '#f1f5f9', border: '#cbd5e1', text: '#334155' };
}

export default function ClinicalToolHistoryScreen() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listMyClinicalToolResponses();
      setRows(data);
    } catch (err) {
      setError(err?.message || 'Failed to load report history.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const summary = useMemo(() => {
    if (!rows.length) return { total: 0, avg: null };
    const averageScores = rows
      .map((r) => getAverageScore(r))
      .filter((v) => Number.isFinite(v));

    const avg = averageScores.length
      ? (averageScores.reduce((sum, v) => sum + v, 0) / averageScores.length).toFixed(2)
      : null;

    return {
      total: rows.length,
      avg,
    };
  }, [rows]);

  const renderItem = ({ item }) => {
    const tool = item?.clinical_tools || {};
    const title = tool?.name || tool?.code || 'Assessment';
    const averageScore = getAverageScore(item);
    const range = getRangeMeta(item);
    const rangeToneStyle = getRangeToneStyle(range.tone);

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.toolName}>{title}</Text>
          <Text style={styles.dateText}>{formatDateTime(item.created_at)}</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.badge}>
            <Ionicons name="analytics-outline" size={14} color="#1d4ed8" />
            <Text style={styles.badgeText}>Total: {item.score ?? '-'}</Text>
          </View>

          <View style={styles.badge}>
            <Ionicons name="calculator-outline" size={14} color="#0f766e" />
            <Text style={styles.badgeText}>Avg: {Number.isFinite(averageScore) ? averageScore.toFixed(2) : '-'}</Text>
          </View>

          <View style={styles.badge}>
            <Ionicons name="list-outline" size={14} color="#334155" />
            <Text style={styles.badgeText}>Questions: {item.total_questions ?? '-'}</Text>
          </View>
        </View>

        <View style={[styles.rangeWrap, { backgroundColor: rangeToneStyle.bg, borderColor: rangeToneStyle.border }]}>
          <Ionicons name="information-circle-outline" size={15} color={rangeToneStyle.text} />
          <Text style={[styles.rangeText, { color: rangeToneStyle.text }]}>Range: {range.label}</Text>
        </View>
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
            <Text style={styles.title}>Historical Report</Text>
            <Text style={styles.subtitle}>Track your previous assessment submissions.</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total attempts</Text>
                <Text style={styles.summaryValue}>{summary.total}</Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Avg score / question</Text>
                <Text style={styles.summaryValue}>{summary.avg ?? '-'}</Text>
              </View>
            </View>

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
        ListFooterComponent={
          <TouchableOpacity style={styles.refreshBtn} onPress={load}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 6,
    color: '#64748b',
  },
  summaryRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  rangeText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 12,
  },
  refreshBtn: {
    marginTop: 18,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  refreshText: {
    color: '#fff',
    fontWeight: '700',
  },
});
