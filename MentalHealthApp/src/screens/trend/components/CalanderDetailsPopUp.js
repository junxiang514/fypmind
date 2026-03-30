import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function moodLabelFromScore(score) {
  const n = Math.round(Number(score));
  if (!Number.isFinite(n)) return 'Unknown';
  if (n <= 1) return 'Very Low';
  if (n === 2) return 'Low';
  if (n === 3) return 'Neutral';
  if (n === 4) return 'Good';
  return 'Great';
}

function moodEmojiFromScore(score) {
  const n = Math.round(Number(score));
  if (!Number.isFinite(n)) return '😶';
  if (n <= 1) return '😣';
  if (n === 2) return '😕';
  if (n === 3) return '😌';
  if (n === 4) return '😊';
  return '🤩';
}

function formatAverageOutOfFive(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '- / 5.00';
  return `${n.toFixed(2)} / 5.00`;
}

export default function CalanderDetailsPopUp({
  visible,
  selectedDate,
  selectedEntries,
  detailsLoading,
  onClose,
}) {
  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.detailsHeaderTextWrap}>
              <Text style={styles.detailsTitle}>Historical Check-in Answers</Text>
              <Text style={styles.detailsSubtitle}>
                {selectedDate
                  ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                  : ''}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
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
                <View style={styles.entryTopRow}>
                  <Text style={styles.entryTitle}>Check-in #{selectedEntries.length - entryIndex}</Text>
                  <Text style={styles.entryTimeChip}>
                    {new Date(entry.created_at).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <View style={styles.entryMetaRow}>
                  <View style={styles.metaPill}>
                    <Ionicons name="sparkles-outline" size={12} color="#1d4ed8" />
                    <Text style={styles.metaPillText}>Mood Level: {moodLabelFromScore(entry.mood_score)} {moodEmojiFromScore(entry.mood_score)}</Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Ionicons name="bar-chart-outline" size={12} color="#1d4ed8" />
                    <Text style={styles.metaPillText}>Average Score: {formatAverageOutOfFive(entry.average_score)}</Text>
                  </View>
                </View>

                {(entry.responses || []).map((answer, i) => (
                  <View key={`${entry.id}-${i}`} style={styles.answerRow}>
                    <Text style={styles.answerPrompt}>{answer.prompt}</Text>
                    <View style={styles.answerValueBadge}>
                      <Text style={styles.answerValue}>{answer.label || answer.value || '-'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    maxHeight: '78%',
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  modalHeader: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsHeaderTextWrap: {
    flex: 1,
    paddingRight: 10,
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
    padding: 14,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  detailsSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#334155',
    fontWeight: '700',
  },
  entryBox: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    backgroundColor: '#f8fbff',
  },
  entryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  entryTimeChip: {
    fontSize: 11,
    color: '#334155',
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
    fontWeight: '700',
  },
  entryMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaPillText: {
    fontSize: 11,
    color: '#1e3a8a',
    fontWeight: '700',
  },
  answerRow: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 7,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  answerPrompt: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
    lineHeight: 17,
  },
  answerValueBadge: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  answerValue: {
    fontSize: 11,
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
  emptyText: {
    marginBottom: 12,
    color: '#475569',
  },
});
