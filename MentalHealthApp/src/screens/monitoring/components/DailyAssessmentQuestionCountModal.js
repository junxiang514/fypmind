import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function clampInt(value, min, max) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export default function DailyAssessmentQuestionCountModal({
  visible,
  initialCount,
  minCount = 3,
  maxCount = 12,
  onClose,
  onApply,
}) {
  const min = useMemo(() => Math.max(1, Number(minCount) || 1), [minCount]);
  const max = useMemo(() => Math.max(min, Number(maxCount) || min), [maxCount, min]);
  const [count, setCount] = useState(clampInt(initialCount ?? min, min, max));

  useEffect(() => {
    if (visible) setCount(clampInt(initialCount ?? min, min, max));
  }, [visible, initialCount, min, max]);

  const decrement = () => setCount((c) => clampInt(c - 1, min, max));
  const increment = () => setCount((c) => clampInt(c + 1, min, max));

  const canDec = count > min;
  const canInc = count < max;

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.badge}>
                <MaterialCommunityIcons name="format-list-numbered" size={18} color="#0f172a" />
              </View>
              <Text style={styles.title}>Question Count</Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.text}>
            Choose how many questions you’d like to answer per check-in.
          </Text>

          <View style={styles.stepperRow}>
            <TouchableOpacity
              onPress={decrement}
              disabled={!canDec}
              style={[styles.stepBtn, !canDec && styles.stepBtnDisabled]}
            >
              <MaterialCommunityIcons name="minus" size={20} color={canDec ? '#0f172a' : '#94a3b8'} />
            </TouchableOpacity>

            <View style={styles.countPill}>
              <Text style={styles.countText}>{count}</Text>
              <Text style={styles.countHint}>questions</Text>
            </View>

            <TouchableOpacity
              onPress={increment}
              disabled={!canInc}
              style={[styles.stepBtn, !canInc && styles.stepBtnDisabled]}
            >
              <MaterialCommunityIcons name="plus" size={20} color={canInc ? '#0f172a' : '#94a3b8'} />
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => onApply?.(count)}
            >
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  text: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  stepBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepBtnDisabled: {
    opacity: 0.7,
  },
  countPill: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 30,
  },
  countHint: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 16,
  },
  applyBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
