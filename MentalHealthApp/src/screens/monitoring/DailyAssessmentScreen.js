import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DailyAssessmentHelpModal from './components/DailyAssessmentHelpModal';
import DailyAssessmentCustomizeModal from './components/DailyAssessmentCustomizeModal';
import DailyAssessmentSuccessModal from './components/DailyAssessmentSuccessModal';
import {
  listActiveWellbeingQuestions,
  buildRandomQuestionSet,
  saveDailyAssessmentEntry,
  getDailyAssessmentPreferences,
  saveDailyAssessmentPreferences,
} from '../../lib/dailyAssessments';

function clampInt(value, min, max) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

// Mapping of categories to vibrant colors + icons + emojis
const CATEGORY_CONFIG = {
  mood: {
    emoji: '😊',
    icon: 'emoticon-happy-outline',
    color: '#ff6b6b',
    lightBg: '#ffe0e0',
  },
  sleep: {
    emoji: '😴',
    icon: 'moon-waning-crescent',
    color: '#7c3aed',
    lightBg: '#f3e8ff',
  },
  stress: {
    emoji: '😰',
    icon: 'fire',
    color: '#f59e0b',
    lightBg: '#fef3c7',
  },
  anxiety: {
    emoji: '😟',
    icon: 'heart-pulse',
    color: '#ec4899',
    lightBg: '#fce7f3',
  },
  energy: {
    emoji: '⚡',
    icon: 'lightning-bolt',
    color: '#22c55e',
    lightBg: '#f0fdf4',
  },
  productivity: {
    emoji: '🎯',
    icon: 'clipboard-check-outline',
    color: '#0ea5e9',
    lightBg: '#f0f9ff',
  },
  social: {
    emoji: '👥',
    icon: 'account-group-outline',
    color: '#14b8a6',
    lightBg: '#f0fdfa',
  },
  'self-care': {
    emoji: '🧘',
    icon: 'hand-heart-outline',
    color: '#6366f1',
    lightBg: '#eef2ff',
  },
  mindfulness: {
    emoji: '🧠',
    icon: 'brain',
    color: '#d946ef',
    lightBg: '#fdf2f8',
  },
  cognitive: {
    emoji: '🧩',
    icon: 'head-cog-outline',
    color: '#64748b',
    lightBg: '#f1f5f9',
  },
  resilience: {
    emoji: '🛡️',
    icon: 'shield-check-outline',
    color: '#16a34a',
    lightBg: '#dcfce7',
  },
  physical: {
    emoji: '💪',
    icon: 'arm-flex-outline',
    color: '#2563eb',
    lightBg: '#dbeafe',
  },
};

function normalizeCategoryKey(category) {
  return String(category || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getCategoryConfig(category) {
  const key = normalizeCategoryKey(category);
  // Handle variants like "Self care", "Self-care", "Self_Care"
  const canonical = key === 'self-care' || key === 'selfcare' ? 'self-care' : key;
  return CATEGORY_CONFIG[canonical] || {
    emoji: '✨',
    icon: 'help-circle',
    color: '#6b7280',
    lightBg: '#f3f4f6',
  };
}

function StarRating({ value, onChange, disabled }) {
  const current = Number(value) || 0;
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= current;
        const iconName = filled ? 'star' : 'star-outline';
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${n} out of 5`}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: true }}
            style={({ pressed }) => [
              styles.starBtn,
              pressed && styles.starBtnPressed,
            ]}
          >
            <MaterialCommunityIcons
              name={iconName}
              size={24}
              color={filled ? styles.starFilled.color : styles.starEmpty.color}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function DailyAssessmentScreen({ navigation }) {
  const [allQuestions, setAllQuestions] = useState([]);
  const [questionSet, setQuestionSet] = useState([]);
  const [answersByQuestionId, setAnswersByQuestionId] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [preferredCount, setPreferredCount] = useState(6);
  const [preferredCategories, setPreferredCategories] = useState([]);

  const unansweredCount = useMemo(
    () => questionSet.filter((q) => !answersByQuestionId[q.id]).length,
    [questionSet, answersByQuestionId]
  );

  const questionsByCategory = useMemo(() => {
    const map = new Map();
    questionSet.forEach((q) => {
      const cat = String(q?.category || 'General').trim() || 'General';
      const prev = map.get(cat) || [];
      prev.push(q);
      map.set(cat, prev);
    });
    return Array.from(map.entries());
  }, [questionSet]);

  const loadQuestions = async ({ overrideCount, overrideCategories } = {}) => {
    try {
      setLoading(true);
      setError('');
      const rows = await listActiveWellbeingQuestions();
      setAllQuestions(rows);
      const desired = clampInt(overrideCount ?? preferredCount, 3, Math.min(12, rows.length || 12));
      const desiredCategories = Array.isArray(overrideCategories)
        ? overrideCategories
        : preferredCategories;

      setPreferredCount(desired);
      setPreferredCategories(Array.isArray(desiredCategories) ? desiredCategories : []);

      setQuestionSet(
        buildRandomQuestionSet(rows, desired, {
          preferredCategories: Array.isArray(desiredCategories) && desiredCategories.length
            ? desiredCategories
            : undefined,
        })
      );
      setAnswersByQuestionId({});
    } catch (err) {
      setError(err?.message || 'Failed to load daily questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    (async () => {
      try {
        const prefs = await getDailyAssessmentPreferences();
        const desiredCount = clampInt(prefs?.questionCount ?? 6, 3, 12);
        const desiredCategories = Array.isArray(prefs?.preferredCategories)
          ? prefs.preferredCategories
          : [];

        if (!isActive) return;
        setPreferredCount(desiredCount);
        setPreferredCategories(desiredCategories);
        await loadQuestions({ overrideCount: desiredCount, overrideCategories: desiredCategories });
      } catch (e) {
        if (!isActive) return;
        setPreferredCount(6);
        setPreferredCategories([]);
        await loadQuestions({ overrideCount: 6, overrideCategories: [] });
      }
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const categoryPickerItems = useMemo(() => {
    const seen = new Set();
    const names = [];

    (allQuestions || []).forEach((q) => {
      const name = String(q?.category || '').trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      names.push(name);
    });

    names.sort((a, b) => a.localeCompare(b));

    return names.map((name) => {
      const cfg = getCategoryConfig(name);
      return {
        name,
        icon: cfg.icon,
        color: cfg.color,
        lightBg: cfg.lightBg,
      };
    });
  }, [allQuestions]);

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

      setSuccessOpen(true);
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

  const setStarValue = (question, nextValue) => {
    const options = Array.isArray(question?.options) ? question.options : [];
    const picked = options.find((opt) => Number(opt?.value) === Number(nextValue));
    chooseAnswer(question.id, picked || { label: String(nextValue), value: Number(nextValue) });
  };

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.dailyHeaderRow}>
          <Text style={styles.label}>Today check-in questions</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.helpButton} onPress={() => setHelpOpen(true)}>
              <MaterialCommunityIcons name="help-circle-outline" size={20} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.customizeButton}
              onPress={() => setCustomizeOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Customize daily assessment"
            >
              <MaterialCommunityIcons name="tune-variant" size={18} color="#334155" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                setQuestionSet(
                  buildRandomQuestionSet(allQuestions, preferredCount, {
                    preferredCategories: preferredCategories.length ? preferredCategories : undefined,
                  })
                );
                setAnswersByQuestionId({});
              }}
            >
              <MaterialCommunityIcons name="shuffle-variant" size={16} color="#1d4ed8" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        <DailyAssessmentHelpModal visible={helpOpen} onClose={() => setHelpOpen(false)} />

        <DailyAssessmentSuccessModal
          visible={successOpen}
          onClose={() => {
            setSuccessOpen(false);
            navigation.goBack();
          }}
          onViewInsight={() => {
            setSuccessOpen(false);
            navigation.navigate('Main', { screen: 'Analysis' });
          }}
        />

        <DailyAssessmentCustomizeModal
          visible={customizeOpen}
          initialCount={preferredCount}
          initialCategories={preferredCategories}
          categories={categoryPickerItems}
          minCount={3}
          maxCount={Math.min(12, allQuestions?.length || 12)}
          onClose={() => setCustomizeOpen(false)}
          onApply={async ({ count, categories }) => {
            const nextCount = clampInt(count ?? 6, 3, Math.min(12, allQuestions?.length || 12));
            const nextCategories = Array.isArray(categories) ? categories : [];

            setPreferredCount(nextCount);
            setPreferredCategories(nextCategories);
            setCustomizeOpen(false);

            try {
              await saveDailyAssessmentPreferences({
                questionCount: nextCount,
                preferredCategories: nextCategories,
              });
            } catch (e) {
              // If the preferences table isn't set up yet, keep working locally.
            }

            setQuestionSet(
              buildRandomQuestionSet(allQuestions, nextCount, {
                preferredCategories: nextCategories.length ? nextCategories : undefined,
              })
            );
            setAnswersByQuestionId({});
          }}
        />

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Loading questions...</Text>
          </View>
        )}

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && questionsByCategory.map(([category, questions]) => {
          const config = getCategoryConfig(category);
          return (
            <View key={category} style={styles.sectionWrap}>
              <View style={styles.sectionCard}>
                <View style={[styles.cardHeaderRow, { backgroundColor: config.lightBg }]}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.cardHeaderIcon, { borderColor: 'rgba(15, 23, 42, 0.06)' }]}>
                      <MaterialCommunityIcons name={config.icon} size={20} color={config.color} />
                    </View>
                    <Text style={styles.cardHeaderText}>{category}</Text>
                  </View>
                </View>

                {questions.map((q, idx) => {
                  const selected = answersByQuestionId[q.id];
                  const selectedValue = Number(selected?.value) || 0;
                  const isLast = idx === questions.length - 1;

                  return (
                    <View key={q.id} style={[styles.row, !isLast && styles.rowDivider]}>
                      <View style={styles.rowLeft}>
                        <Text style={styles.promptText}>{q.prompt}</Text>
                      </View>

                      <StarRating
                        value={selectedValue}
                        onChange={(n) => setStarValue(q, n)}
                        disabled={saving}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={[styles.submitButton, saving && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={saving}>
          <Text style={styles.submitButtonText}>{saving ? 'Saving...' : 'Check in now!'}</Text>
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
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 0,
  },
  dailyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  customizeButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  sectionWrap: {
    marginBottom: 14,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.06)',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
  },
  cardHeaderText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
    gap: 10,
  },
  itemIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  promptText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
  },
  starBtnPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
  starFilled: {
    color: '#f59e0b',
  },
  starEmpty: {
    color: '#cbd5e1',
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
