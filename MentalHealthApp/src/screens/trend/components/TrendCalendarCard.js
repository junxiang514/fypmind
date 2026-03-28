import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function calendarToneByMood(mood) {
  const level = Math.round(Number(mood));
  if (!Number.isFinite(level)) return { bg: '#e2e8f0', text: '#334155', border: '#94a3b8' };
  if (level <= 1) return { bg: '#fecaca', text: '#7f1d1d', border: '#dc2626' }; // Very Low
  if (level === 2) return { bg: '#fdba74', text: '#7c2d12', border: '#ea580c' }; // Low
  if (level === 3) return { bg: '#fde68a', text: '#78350f', border: '#f59e0b' }; // Neutral
  if (level === 4) return { bg: '#93c5fd', text: '#1e3a8a', border: '#3b82f6' }; // Good
  return { bg: '#86efac', text: '#14532d', border: '#16a34a' }; // Great
}

function moodEmojiByScore(mood) {
  const score = Math.round(Number(mood));
  if (!Number.isFinite(score)) return '';
  if (score <= 1) return '😣';
  if (score === 2) return '😕';
  if (score === 3) return '😌';
  if (score === 4) return '😊';
  return '🤩';
}

export function toLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildMonthCells(monthCursor, mapByDate) {
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
    const key = toLocalDateKey(d);
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

export default function TrendCalendarCard({
  monthTitle,
  setMonthCursor,
  calendarRows,
  selectedDate,
  onPressDay,
  streakDays,
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const animatingRef = useRef(false);

  const animateMonthChange = (delta) => {
    if (animatingRef.current || !delta) return;
    animatingRef.current = true;
    const outOffset = delta > 0 ? -40 : 40;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: outOffset,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
      translateX.setValue(-outOffset);
      fadeAnim.setValue(0.5);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        animatingRef.current = false;
      });
    });
  };

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        const horizontal = Math.abs(gesture.dx) > Math.abs(gesture.dy);
        return horizontal && Math.abs(gesture.dx) > 12;
      },
      onPanResponderMove: (_, gesture) => {
        if (animatingRef.current) return;
        translateX.setValue(Math.max(-40, Math.min(40, gesture.dx)));
      },
      onPanResponderRelease: (_, gesture) => {
        if (animatingRef.current) return;
        const shouldSwipe = Math.abs(gesture.dx) > 45 || Math.abs(gesture.vx) > 0.25;
        if (!shouldSwipe) {
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              speed: 20,
              bounciness: 5,
            }),
            Animated.spring(fadeAnim, {
              toValue: 1,
              useNativeDriver: true,
              speed: 20,
              bounciness: 4,
            }),
          ]).start();
          return;
        }
        const delta = gesture.dx < 0 ? 1 : -1;
        animateMonthChange(delta);
      },
      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            speed: 20,
            bounciness: 5,
          }),
          Animated.spring(fadeAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 4,
          }),
        ]).start();
      },
    }),
    [setMonthCursor, translateX, fadeAnim]
  );

  return (
    <View style={styles.calendarCard}>
      <Text style={styles.sectionTitle}>Monthly Mood Calendar</Text>
      <View style={styles.calendarHeader}>
        <TouchableOpacity
          style={styles.monthNavBtn}
          onPress={() => animateMonthChange(-1)}
        >
          <Ionicons name="chevron-back" size={16} color="#1d4ed8" />
        </TouchableOpacity>

        <Text style={styles.calendarTitle}>{monthTitle}</Text>

        <TouchableOpacity
          style={styles.monthNavBtn}
          onPress={() => animateMonthChange(1)}
        >
          <Ionicons name="chevron-forward" size={16} color="#1d4ed8" />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarHintRow}>
        <Ionicons name={streakDays > 0 ? 'trophy' : 'sparkles'} size={14} color="#0284c7" />
        <Text style={styles.calendarHintText}>
          {streakDays > 0
            ? `Congratulations! You have checked in for ${streakDays} ${streakDays === 1 ? 'day' : 'days'} in a row.`
            : 'Start today and build your check-in streak!'}
        </Text>
      </View>

      <Animated.View
        style={[styles.calendarSurface, { transform: [{ translateX }], opacity: fadeAnim }]}
        {...panResponder.panHandlers}
      >
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
                  onPress={() => onPressDay(cell.key)}
                >
                  <Text style={[styles.dayText, { color: tone.text }]}>{cell.day}</Text>
                  <Text style={styles.emojiText}>{cell.checkins > 0 ? moodEmojiByScore(cell.mood) : ''}</Text>
                  <Text style={[styles.dotText, { color: tone.text }]}>
                    {cell.checkins > 0 ? (cell.checkins > 1 ? `${cell.checkins}x` : '✓') : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </Animated.View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#cbd5e1' }]} />
          <Text style={styles.legendText}>None</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
          <Text style={styles.legendText}>Down 😣</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ea580c' }]} />
          <Text style={styles.legendText}>Sad 😕</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>Calm 😌</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>Happy 😊</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#16a34a' }]} />
          <Text style={styles.legendText}>Excited 🤩</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    shadowColor: '#0369a1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  calendarHintText: {
    marginLeft: 6,
    color: '#0c4a6e',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarSurface: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -2,
  },
  dayCellWrap: {
    width: '14.2857%',
    paddingHorizontal: 2,
    paddingBottom: 5,
  },
  dayCellBlank: {
    height: 48,
  },
  dayCell: {
    height: 48,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 3,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayCellSelected: {
    borderWidth: 3,
    borderColor: '#0369a1',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  dayText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  emojiText: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 16,
    includeFontPadding: false,
  },
  dotText: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 1,
  },
  legendRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#334155',
    marginLeft: 8,
    fontWeight: '600',
  },
});
