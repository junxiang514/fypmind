import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';

import { getClinicalToolQuestions, saveClinicalToolResponse } from '../../lib/clinicalTools';

export default function ClinicalToolQuestionnaireScreen({ route, navigation }) {
  const { toolId, toolName } = route.params || {};

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const rows = await getClinicalToolQuestions(toolId);
        setQuestions(rows);
      } catch (err) {
        setError(err?.message || 'Failed to load questionnaire.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [toolId]);

  const current = questions[index];
  const selected = answers[current?.id];

  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round(((index + 1) / questions.length) * 100);
  }, [index, questions.length]);

  const selectAnswer = (option) => {
    if (!current) return;
    setAnswers((prev) => ({
      ...prev,
      [current.id]: {
        label: option.label,
        value: option.value,
      },
    }));
  };

  const onNext = () => {
    if (index < questions.length - 1) {
      setIndex((prev) => prev + 1);
    }
  };

  const onBack = () => {
    if (index > 0) {
      setIndex((prev) => prev - 1);
    }
  };

  const onSubmit = async () => {
    if (!questions.length) return;

    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length) {
      Alert.alert('Incomplete', `Please answer all questions. Remaining: ${unanswered.length}`);
      return;
    }

    const score = questions.reduce((sum, q) => sum + Number(answers[q.id]?.value || 0), 0);

    try {
      setSaving(true);
      await saveClinicalToolResponse({
        toolId,
        answers,
        score,
        totalQuestions: questions.length,
      });

      Alert.alert('Submitted', `Assessment completed. Your score: ${score}`, [
        {
          text: 'Back',
          onPress: () => navigation.goBack(),
        },
        {
          text: 'View History',
          onPress: () => navigation.replace('ClinicalToolHistory'),
        },
      ]);
    } catch (err) {
      setError(err?.message || 'Failed to save result.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.centerRow}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Loading questionnaire...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerRow}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !questions.length ? (
        <View style={styles.centerRow}>
          <Text style={styles.errorText}>No questions found for this tool.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.toolName}>{toolName || 'Assessment'}</Text>

          <View style={styles.progressWrap}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>Question {index + 1} / {questions.length}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.questionText}>{current?.question_text}</Text>

            {(Array.isArray(current?.options) ? current.options : []).map((opt, idx) => {
              const active = selected?.value === opt.value;
              return (
                <TouchableOpacity
                  key={`${idx}-${opt.label}`}
                  style={[styles.optionButton, active && styles.optionButtonActive]}
                  onPress={() => selectAnswer(opt)}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.secondaryButton, index === 0 && styles.disabledButton]}
              disabled={index === 0}
              onPress={onBack}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>

            {index < questions.length - 1 ? (
              <TouchableOpacity
                style={[styles.primaryButton, !selected && styles.disabledButton]}
                disabled={!selected}
                onPress={onNext}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryButton, (!selected || saving) && styles.disabledButton]}
                disabled={!selected || saving}
                onPress={onSubmit}
              >
                <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Submit'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
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
  },
  centerRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 8,
    color: '#64748b',
  },
  errorText: {
    color: '#b91c1c',
    textAlign: 'center',
  },
  toolName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  progressWrap: {
    marginTop: 12,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  progressText: {
    marginTop: 6,
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '700',
  },
  card: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  optionButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  optionButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  optionText: {
    color: '#1f2937',
    fontSize: 14,
  },
  optionTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  row: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    backgroundColor: '#eff6ff',
  },
  secondaryButtonText: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    backgroundColor: '#2563eb',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.45,
  },
});
