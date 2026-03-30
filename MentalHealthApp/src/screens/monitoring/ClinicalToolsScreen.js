import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listClinicalTools } from '../../lib/clinicalTools';

import { useEffect, useState } from 'react';

export default function ClinicalToolsScreen({ navigation }) {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await listClinicalTools();
      setTools(rows);
    } catch (err) {
      setError(err?.message || 'Failed to load clinical tools.');
      setTools([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleExpand = (toolId) => {
    setExpanded((prev) => ({
      ...prev,
      [toolId]: !prev[toolId],
    }));
  };

  const renderItem = ({ item }) => {
    const isExpanded = !!expanded[item.id];
    const duration = item.duration_minutes ? `${item.duration_minutes} mins` : 'Duration -';
    const itemCount = item.item_count ? `${item.item_count} questions` : 'Questions -';
    const condition = item.target_condition || 'General mental wellbeing';
    const scale = item.scale_note || 'Standard Likert-based scale';
    const administration = item.administration_note || 'Self-administered';
    const interpretation = item.interpretation_guide || 'Review score ranges in context and consult a professional when needed.';

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.toolName}>{item.name || 'Clinical Tool'}</Text>
          <Text style={styles.toolDescription}>{item.description || 'Standardized mental health screening tool.'}</Text>

          <View style={styles.chipsRow}>
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={14} color="#475569" />
              <Text style={styles.metaChipText}>{duration}</Text>
            </View>

            <View style={styles.metaChip}>
              <Ionicons name="list-outline" size={14} color="#475569" />
              <Text style={styles.metaChipText}>{itemCount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => toggleExpand(item.id)}
          >
            <Text style={styles.detailButtonText}>{isExpanded ? 'Hide details' : 'View details'}</Text>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#1d4ed8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('ClinicalToolQuestionnaire', { toolId: item.id, toolName: item.name || 'Clinical Tool' })}
          >
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.detailsPanel}>
            <View style={styles.detailsHeaderRow}>
              <Ionicons name="information-circle-outline" size={16} color="#0f172a" />
              <Text style={styles.detailsTitle}>Tool details</Text>
            </View>

            <Text style={styles.detailsHint}>Quick reference before you start the questionnaire.</Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItemCard}>
                <Text style={styles.detailLabel}>Condition</Text>
                <Text style={styles.detailValue}>{condition}</Text>
              </View>

              <View style={styles.detailItemCard}>
                <Text style={styles.detailLabel}>Questions</Text>
                <Text style={styles.detailValue}>{item.item_count || '-'}</Text>
              </View>

              <View style={styles.detailItemCard}>
                <Text style={styles.detailLabel}>Scale</Text>
                <Text style={styles.detailValue}>{scale}</Text>
              </View>

              <View style={styles.detailItemCard}>
                <Text style={styles.detailLabel}>Administration</Text>
                <Text style={styles.detailValue}>{administration}</Text>
              </View>
            </View>

            <View style={styles.interpretationBox}>
              <Ionicons name="analytics-outline" size={14} color="#1d4ed8" />
              <Text style={styles.interpretationText}>{interpretation}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={tools}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.headerCard}>
              <View style={styles.headerTopRow}>
                <View>
                  <Text style={styles.headerEyebrow}>Assessment Center</Text>
                  <Text style={styles.headerTitle}>Clinical Tools</Text>
                </View>
                <TouchableOpacity
                  style={styles.historyIconButton}
                  onPress={() => navigation.navigate('ClinicalToolHistory')}
                >
                  <Ionicons name="time-outline" size={16} color="#1d4ed8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.headerSubtitle}>Standardized assessments to help you understand your mental health.</Text>

              <View style={styles.headerInfoRow}>
                <View style={styles.headerInfoPill}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#0f766e" />
                  <Text style={styles.headerInfoText}>Evidence-based</Text>
                </View>
                <View style={styles.headerInfoPill}>
                  <Ionicons name="sparkles-outline" size={14} color="#4338ca" />
                  <Text style={styles.headerInfoText}>Quick Results</Text>
                </View>
              </View>

              {!!error && <Text style={styles.errorText}>{error}</Text>}
              {loading && <Text style={styles.loadingText}>Loading...</Text>}
            </View>
          </View>
        }
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={22} color="#64748b" />
            <Text style={styles.emptyTitle}>No clinical tools available</Text>
            <Text style={styles.emptyText}>Please try again later.</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  headerWrap: {
    marginBottom: 16,
  },
  headerCard: {
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  headerInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerInfoText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  historyIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    marginBottom: 10,
  },
  toolName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 6,
  },
  toolDescription: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 10,
    lineHeight: 20,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  detailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  detailButtonText: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 13,
    marginRight: 6,
  },
  startButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  detailsPanel: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  detailsHint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
  },
  detailsGrid: {
    gap: 8,
  },
  detailItemCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '600',
  },
  interpretationBox: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  interpretationText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#1e3a8a',
  },
  errorText: {
    marginTop: 8,
    color: '#b91c1c',
    fontSize: 13,
  },
  loadingText: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 13,
  },
  emptyCard: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyText: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },
});
