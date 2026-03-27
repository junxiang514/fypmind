import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  listActiveWellbeingQuestions,
  buildRandomQuestionSet,
  saveDailyAssessmentEntry,
} from '../../lib/dailyAssessments';

export default function DailyAssessmentScreen({ navigation }) {
  const [allQuestions, setAllQuestions] = useState([]);
  const [questionSet, setQuestionSet] = useState([]);
  const [answersByQuestionId, setAnswersByQuestionId] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const unansweredCount = useMemo(
    () => questionSet.filter((q) => !answersByQuestionId[q.id]).length,
    [questionSet, answersByQuestionId]
  );

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError('');
      const rows = await listActiveWellbeingQuestions();
      setAllQuestions(rows);
      setQuestionSet(buildRandomQuestionSet(rows, 6));
      setAnswersByQuestionId({});
    } catch (err) {
      setError(err?.message || 'Failed to load daily questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleSubmit = async () => {
    if (questionSet.length && unansweredCount > 0) {
      Alert.alert('Incomplete', `Please answer all questions. Remaining: ${unansweredCount}`);
      return;
    }

    const values = questionSet
      .map((q) => Number(answersByQuestionId?.[q.id]?.value))
      .filter((x) => Number.isFinite(x));

    const averageValue = values.length
      ? values.reduce((sum, x) => sum + x, 0) / values.length
      : 3;

    const derivedMoodScore = Math.max(1, Math.min(5, Math.round(averageValue)));

    try {
      setSaving(true);
      await saveDailyAssessmentEntry({
        moodScore: derivedMoodScore,
        notes: null,
        questionSet,
        answersByQuestionId,
      });

      Alert.alert('Assessment Saved', 'Thank you for checking in!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Save failed', err?.message || 'Could not save your daily assessment.');
    } finally {
      setSaving(false);
    }
  };

  const chooseAnswer = (questionId, option) => {
    setAnswersByQuestionId((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.dailyHeaderRow}>
          <Text style={styles.label}>Today check-in questions</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={() => setQuestionSet(buildRandomQuestionSet(allQuestions, 6))}>
            <Ionicons name="shuffle" size={14} color="#1d4ed8" />
            <Text style={styles.refreshButtonText}>Randomize</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Loading questions...</Text>
          </View>
        )}

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && questionSet.map((q) => {
          const selected = answersByQuestionId[q.id];
          const options = Array.isArray(q.options) ? q.options : [];

          return (
            <View key={q.id} style={styles.qCard}>
              <Text style={styles.qCategory}>{q.category || 'General'}</Text>
              <Text style={styles.qText}>{q.prompt}</Text>
              <View style={styles.optWrap}>
                {options.map((opt, idx) => {
                  const active = selected?.value === opt.value;
                  return (
                    <TouchableOpacity
                      key={`${q.id}-${idx}`}
                      style={[styles.optBtn, active && styles.optBtnActive]}
                      onPress={() => chooseAnswer(q.id, opt)}
                    >
                      <Text style={[styles.optBtnText, active && styles.optBtnTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={[styles.submitButton, saving && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={saving}>
          <Text style={styles.submitButtonText}>{saving ? 'Saving...' : 'Save Entry'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  dailyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refreshButtonText: {
    marginLeft: 6,
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 8,
    color: '#64748b',
  },
  errorText: {
    color: '#b91c1c',
    marginBottom: 10,
  },
  qCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    padding: 12,
    marginBottom: 10,
  },
  qCategory: {
    fontSize: 11,
    color: '#1d4ed8',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  qText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 8,
  },
  optWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  optBtnActive: {
    borderColor: '#2563eb',
    backgroundColor: '#dbeafe',
  },
  optBtnText: {
    fontSize: 12,
    color: '#334155',
  },
  optBtnTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
});
