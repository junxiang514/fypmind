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
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';

import {
  getEducationalContentById,
  getMyEducationalProgress,
  saveMyEducationalFeedback,
  saveMyEducationalProgress,
} from '../../lib/education';

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
  const sourceUrl = rawUrl;
  if (!sourceUrl) {
    return {
      openUrl: null,
      embedUrl: null,
      youtubeId: null,
      isEmbedded: false,
    };
  }

  const ytId = extractYouTubeId(sourceUrl);

  if (ytId) {
    return {
      openUrl: `https://www.youtube.com/watch?v=${ytId}`,
      embedUrl: null,
      youtubeId: ytId,
      isEmbedded: true,
    };
  }

  return {
    openUrl: sourceUrl,
    embedUrl: null,
    youtubeId: null,
    isEmbedded: false,
  };
}

function normalizeQuiz(payload) {
  const src = Array.isArray(payload) ? payload : [];
  return src
    .map((q) => {
      const question = String(q?.question || '').trim();
      const options = Array.isArray(q?.options)
        ? q.options.map((o) => String(o || '').trim()).filter(Boolean)
        : [];
      const answer = Number.isInteger(q?.answer) ? q.answer : -1;

      if (!question || options.length < 2 || answer < 0 || answer >= options.length) return null;

      return { question, options, answer };
    })
    .filter(Boolean);
}

function normalizeActivities(payload) {
  const src = Array.isArray(payload) ? payload : [];
  return src
    .map((a, idx) => {
      if (typeof a === 'string') {
        const label = a.trim();
        if (!label) return null;
        return { key: `a-${idx + 1}`, label };
      }

      const key = String(a?.key || `a-${idx + 1}`).trim();
      const label = String(a?.label || '').trim();
      if (!label) return null;
      return { key, label };
    })
    .filter(Boolean);
}

export default function EducationalContentDetailScreen({ route }) {
  const { id } = route.params || {};
  const { width } = useWindowDimensions();

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
  const [activityChecks, setActivityChecks] = useState({});

  const quiz = useMemo(() => normalizeQuiz(item?.quiz_payload), [item?.quiz_payload]);
  const activities = useMemo(() => normalizeActivities(item?.activity_payload), [item?.activity_payload]);
  const videoMeta = useMemo(() => toPlayableVideo(item), [item]);
  const playerWidth = Math.max(220, Math.round(width - 68));
  const playerHeight = Math.round((playerWidth * 9) / 16);

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

  useEffect(() => {
    if (!activities.length) {
      setActivityChecks({});
      return;
    }

    setActivityChecks((prev) => {
      const next = {};
      for (const a of activities) {
        next[a.key] = Boolean(prev[a.key]);
      }
      return next;
    });
  }, [activities]);

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
    if (!quiz.length || quizChoice == null) return;

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
              <YoutubePlayer
                width={playerWidth}
                height={playerHeight}
                play={false}
                videoId={videoMeta.youtubeId}
                webViewProps={{
                  allowsFullscreenVideo: true,
                  mediaPlaybackRequiresUserAction: true,
                }}
                initialPlayerParams={{
                  rel: false,
                  modestbranding: true,
                  controls: true,
                }}
              />
            </View>
          ) : !videoMeta?.openUrl ? (
            <Text style={styles.helpText}>No video link available yet for this content.</Text>
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
      const requiredChecks = activities.length;
      return (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Interactive activity checklist</Text>
          {!activities.length ? (
            <Text style={styles.helpText}>No activity configured in database for this content yet.</Text>
          ) : (
            <Text style={styles.helpText}>Complete all activities ({requiredChecks}) to finish this step.</Text>
          )}

          {activities.map(({ key, label }) => (
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
            style={[styles.actionButton, (checksDone < requiredChecks || !requiredChecks) && styles.actionButtonDisabled]}
            onPress={() => checksDone >= requiredChecks && requiredChecks > 0 && markStepDone('activity')}
            disabled={checksDone < requiredChecks || !requiredChecks}
          >
            <Ionicons name="checkmark-done" size={16} color="#fff" />
            <Text style={styles.actionText}>Complete activity</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (current === 'quiz') {
      if (!quiz.length) {
        return (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Quiz session</Text>
            <Text style={styles.helpText}>No quiz configured in database for this content yet.</Text>
          </View>
        );
      }

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
    alignItems: 'center',
    justifyContent: 'center',
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
