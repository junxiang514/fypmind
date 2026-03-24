import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

import {
  getEducationalContentById,
  getMyEducationalProgress,
  saveMyEducationalFeedback,
  saveMyEducationalProgress,
} from '../../lib/education';

const VIDEO_BY_CATEGORY = {
  anxiety: 'https://www.youtube.com/watch?v=tybOi4hjZFQ',
  stress: 'https://www.youtube.com/watch?v=z6X5oEIg6Ak',
  sleep: 'https://www.youtube.com/watch?v=nm1TxQj9IsQ',
  coping: 'https://www.youtube.com/watch?v=hnpQrMqDoqE',
  wellbeing: 'https://www.youtube.com/watch?v=1vx8iUvfyCY',
  support: 'https://www.youtube.com/watch?v=QHkXvPq2pQE',
};

function inferVideoUrl(category = '', title = '') {
  const text = `${category} ${title}`.toLowerCase();
  const key = Object.keys(VIDEO_BY_CATEGORY).find((k) => text.includes(k));
  return key ? VIDEO_BY_CATEGORY[key] : 'https://www.youtube.com/watch?v=ZToicYcHIOU';
}

function extractYouTubeId(url = '') {
  if (!url) return null;
  const text = String(url).trim();

  const shortMatch = text.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch?.[1]) return shortMatch[1];

  const watchMatch = text.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (watchMatch?.[1]) return watchMatch[1];

  const embedMatch = text.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (embedMatch?.[1]) return embedMatch[1];

  return null;
}

function toPlayableVideo(item) {
  const rawUrl = String(item?.video_url || '').trim();
  const fallback = inferVideoUrl(item?.category, item?.title);
  const sourceUrl = rawUrl || fallback;
  const ytId = extractYouTubeId(sourceUrl);

  if (ytId) {
    return {
      openUrl: `https://www.youtube.com/watch?v=${ytId}`,
      embedUrl: `https://www.youtube.com/embed/${ytId}?playsinline=1&rel=0`,
      isEmbedded: true,
    };
  }

  return {
    openUrl: sourceUrl,
    embedUrl: null,
    isEmbedded: false,
  };
}

function getQuizByCategory(category = '') {
  const text = category.toLowerCase();

  if (text.includes('anxiety')) {
    return [
      {
        question: 'Which is a grounding method for anxiety?',
        options: ['Avoid all feelings', '5-4-3-2-1 senses exercise', 'Skip sleep to stay alert', 'Only drink coffee'],
        answer: 1,
      },
      {
        question: 'A helpful breathing rhythm is:',
        options: ['Inhale 4, hold 4, exhale 4, hold 4', 'Inhale only', 'Hold breath 60 seconds', 'Breathe as fast as possible'],
        answer: 0,
      },
    ];
  }

  if (text.includes('sleep')) {
    return [
      {
        question: 'What supports better sleep hygiene?',
        options: ['Late caffeine', 'Consistent bedtime', 'Bright phone screen in bed', 'Irregular wake time'],
        answer: 1,
      },
      {
        question: 'Before bed, it is better to:',
        options: ['Scroll social media intensely', 'Do light wind-down routine', 'Take long naps', 'Drink energy drinks'],
        answer: 1,
      },
    ];
  }

  return [
    {
      question: 'Which is a healthy coping strategy?',
      options: ['Suppress all emotions', 'Break tasks into small steps', 'Isolate completely', 'Ignore stress signals'],
      answer: 1,
    },
    {
      question: 'When stress is high, a good first step is:',
      options: ['Pause and breathe slowly', 'Rush to finish everything', 'Skip meals', 'Blame yourself'],
      answer: 0,
    },
  ];
}

export default function EducationalContentDetailScreen({ route }) {
  const { id } = route.params || {};

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState({});
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizChoice, setQuizChoice] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [journal, setJournal] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [activityChecks, setActivityChecks] = useState({
    breathe: false,
    hydrate: false,
    stretch: false,
    support: false,
  });

  const quiz = useMemo(() => getQuizByCategory(item?.category || ''), [item?.category]);
  const videoMeta = useMemo(() => toPlayableVideo(item), [item]);

  const steps = useMemo(() => ([
    { key: 'learn', title: 'Learn', icon: 'book-outline' },
    { key: 'video', title: 'Watch', icon: 'play-circle-outline' },
    { key: 'activity', title: 'Activity', icon: 'flash-outline' },
    { key: 'quiz', title: 'Quiz', icon: 'help-circle-outline' },
    { key: 'reflect', title: 'Reflect', icon: 'create-outline' },
  ]), []);

  const progress = useMemo(() => {
    const count = Object.values(completed).filter(Boolean).length;
    return Math.min(1, count / steps.length);
  }, [completed, steps.length]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const row = await getEducationalContentById(id);
        setItem(row);

        const myProgress = await getMyEducationalProgress(id);
        if (myProgress?.completed_steps && typeof myProgress.completed_steps === 'object') {
          setCompleted(myProgress.completed_steps);
        }
        if (myProgress?.last_step) {
          const idx = steps.findIndex((s) => s.key === myProgress.last_step);
          if (idx >= 0) setActiveStep(idx);
        }
        if (Number.isFinite(myProgress?.quiz_score)) {
          setQuizScore(myProgress.quiz_score);
        }
        if (myProgress?.quiz_completed) {
          setQuizDone(true);
        }
      } catch (err) {
        setError(err?.message || 'Failed to load content.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, steps]);

  const persistProgress = async (nextCompleted, { lastStep = null, nextQuizScore = quizScore, nextQuizDone = quizDone } = {}) => {
    const percent = Math.round((Object.values(nextCompleted).filter(Boolean).length / steps.length) * 100);
    await saveMyEducationalProgress({
      contentId: id,
      completedSteps: nextCompleted,
      progressPercent: percent,
      lastStep,
      quizScore: nextQuizScore,
      quizCompleted: nextQuizDone,
    });
  };

  const markStepDone = async (key) => {
    const nextCompleted = { ...completed, [key]: true };
    setCompleted(nextCompleted);
    try {
      await persistProgress(nextCompleted, { lastStep: key });
    } catch (err) {
      setError(err?.message || 'Unable to save progress.');
    }
  };

  const openVideo = async () => {
    const url = videoMeta?.openUrl;
    if (!url) {
      setError('No video link available for this content.');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      setError('Unable to open video link.');
    }
  };

  const submitQuizChoice = () => {
    if (quizChoice == null) return;

    const isCorrect = quiz[quizIndex]?.answer === quizChoice;
    const nextScore = isCorrect ? quizScore + 1 : quizScore;
    setQuizScore(nextScore);

    if (quizIndex >= quiz.length - 1) {
      setQuizDone(true);
      const nextCompleted = { ...completed, quiz: true };
      setCompleted(nextCompleted);
      saveMyEducationalProgress({
        contentId: id,
        completedSteps: nextCompleted,
        progressPercent: Math.round((Object.values(nextCompleted).filter(Boolean).length / steps.length) * 100),
        lastStep: 'quiz',
        quizScore: nextScore,
        quizCompleted: true,
      }).catch((err) => setError(err?.message || 'Unable to save quiz progress.'));
      return;
    }

    setQuizIndex((prev) => prev + 1);
    setQuizChoice(null);
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setQuizChoice(null);
    setQuizScore(0);
    setQuizDone(false);
  };

  const saveFeedback = async () => {
    if (!journal.trim() && !feedbackRating) {
      setError('Please provide a short feedback or rating.');
      return;
    }

    try {
      await saveMyEducationalFeedback({
        contentId: id,
        rating: feedbackRating || null,
        feedbackText: journal,
      });
      await markStepDone('reflect');
    } catch (err) {
      setError(err?.message || 'Unable to save feedback.');
    }
  };

  const renderStepContent = () => {
    const current = steps[activeStep]?.key;

    if (current === 'learn') {
      return (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Read and understand</Text>
          {!!item?.summary && <Text style={styles.summary}>{item.summary}</Text>}
          <View style={styles.divider} />
          <Text style={styles.body}>{item?.body || 'No content.'}</Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => markStepDone('learn')}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.actionText}>Mark as completed</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (current === 'video') {
      return (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Watch short guided video</Text>
          <Text style={styles.helpText}>A short video can help you apply the concept faster.</Text>

          {videoMeta?.isEmbedded ? (
            <View style={styles.videoFrame}>
              <WebView
                source={{ uri: videoMeta.embedUrl }}
                style={styles.videoWebView}
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
              />
            </View>
          ) : (
            <Text style={styles.helpText}>Embedded player supports YouTube links. Use external open for other links.</Text>
          )}

          <View style={styles.videoActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={openVideo}>
              <Text style={styles.secondaryText}>Open externally</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => markStepDone('video')}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.actionText}>Mark watched</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (current === 'activity') {
      const checksDone = Object.values(activityChecks).filter(Boolean).length;
      return (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Interactive activity checklist</Text>
          <Text style={styles.helpText}>Complete at least 3 activities.</Text>

          {[
            ['breathe', 'Do 2 minutes slow breathing'],
            ['hydrate', 'Drink a glass of water'],
            ['stretch', 'Stretch body for 3 minutes'],
            ['support', 'Message/call someone you trust'],
          ].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={styles.checkRow}
              onPress={() => setActivityChecks((prev) => ({ ...prev, [key]: !prev[key] }))}
            >
              <Ionicons
                name={activityChecks[key] ? 'checkbox' : 'square-outline'}
                size={22}
                color={activityChecks[key] ? '#2563eb' : '#94a3b8'}
              />
              <Text style={styles.checkText}>{label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.actionButton, checksDone < 3 && styles.actionButtonDisabled]}
            onPress={() => checksDone >= 3 && markStepDone('activity')}
            disabled={checksDone < 3}
          >
            <Ionicons name="checkmark-done" size={16} color="#fff" />
            <Text style={styles.actionText}>Complete activity</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (current === 'quiz') {
      if (quizDone) {
        return (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Quiz completed</Text>
            <Text style={styles.scoreText}>Score: {quizScore} / {quiz.length}</Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetQuiz}>
              <Text style={styles.secondaryText}>Retry quiz</Text>
            </TouchableOpacity>
          </View>
        );
      }

      const q = quiz[quizIndex];
      return (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quiz session</Text>
          <Text style={styles.helpText}>Question {quizIndex + 1} of {quiz.length}</Text>
          <Text style={styles.questionText}>{q.question}</Text>

          {q.options.map((opt, idx) => (
            <TouchableOpacity
              key={`${idx}-${opt}`}
              style={[styles.optionButton, quizChoice === idx && styles.optionButtonActive]}
              onPress={() => setQuizChoice(idx)}
            >
              <Text style={[styles.optionText, quizChoice === idx && styles.optionTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.actionButton, quizChoice == null && styles.actionButtonDisabled]}
            disabled={quizChoice == null}
            onPress={submitQuizChoice}
          >
            <Text style={styles.actionText}>{quizIndex === quiz.length - 1 ? 'Finish quiz' : 'Next question'}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Reflection journal</Text>
        <Text style={styles.helpText}>Write one takeaway and one action for today.</Text>

        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setFeedbackRating(n)}>
              <Ionicons
                name={n <= feedbackRating ? 'star' : 'star-outline'}
                size={22}
                color={n <= feedbackRating ? '#f59e0b' : '#94a3b8'}
                style={styles.ratingStar}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.journalInput}
          multiline
          placeholder="Example: I noticed my stress rises at night. Today I will do 5 minutes of breathing before sleep."
          value={journal}
          onChangeText={setJournal}
        />
        <TouchableOpacity
          style={[styles.actionButton, !journal.trim() && styles.actionButtonDisabled]}
          disabled={!journal.trim() && !feedbackRating}
          onPress={saveFeedback}
        >
          <Text style={styles.actionText}>Save feedback</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            <Text style={styles.title}>{item?.title || 'Untitled'}</Text>
            {!!item?.category && <Text style={styles.meta}>{item.category}</Text>}

            <View style={styles.progressWrap}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={styles.progressText}>Progress: {Math.round(progress * 100)}%</Text>
            </View>

            <View style={styles.stepRow}>
              {steps.map((step, idx) => {
                const done = !!completed[step.key];
                const active = idx === activeStep;
                return (
                  <TouchableOpacity
                    key={step.key}
                    style={[styles.stepChip, active && styles.stepChipActive, done && styles.stepChipDone]}
                    onPress={() => setActiveStep(idx)}
                  >
                    <Ionicons
                      name={done ? 'checkmark-circle' : step.icon}
                      size={14}
                      color={active || done ? '#fff' : '#1d4ed8'}
                    />
                    <Text style={[styles.stepChipText, (active || done) && styles.stepChipTextActive]}>{step.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {renderStepContent()}

            <View style={styles.navRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, activeStep === 0 && styles.secondaryButtonDisabled]}
                disabled={activeStep === 0}
                onPress={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              >
                <Text style={styles.secondaryText}>Previous</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, activeStep === steps.length - 1 && styles.secondaryButtonDisabled]}
                disabled={activeStep === steps.length - 1}
                onPress={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
              >
                <Text style={styles.secondaryText}>Next</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#475569',
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  meta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  summary: {
    marginTop: 12,
    fontSize: 14,
    color: '#334155',
  },
  helpText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  progressWrap: {
    marginTop: 16,
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
    fontWeight: '700',
    color: '#1d4ed8',
  },
  stepRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  stepChipDone: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  stepChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  stepChipTextActive: {
    color: '#fff',
  },
  sectionCard: {
    backgroundColor: '#fff',
    marginTop: 14,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  videoFrame: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
    backgroundColor: '#000',
    height: 210,
  },
  videoWebView: {
    flex: 1,
  },
  videoActions: {
    marginTop: 10,
    gap: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#0f172a',
  },
  actionButton: {
    marginTop: 14,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  checkRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  questionText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  optionButton: {
    marginTop: 10,
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
    fontSize: 13,
    color: '#1f2937',
  },
  optionTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  scoreText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: '#15803d',
  },
  journalInput: {
    marginTop: 10,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  ratingRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    marginRight: 6,
  },
  navRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  secondaryButtonDisabled: {
    opacity: 0.45,
  },
  secondaryText: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 13,
  },
});
