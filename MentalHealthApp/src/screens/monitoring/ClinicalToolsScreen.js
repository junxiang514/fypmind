import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { listClinicalTools } from '../../lib/clinicalTools';
import { getClinicalToolsReminderPreference, setClinicalToolsReminderPreference } from '../../lib/clinicalToolsPreferences';
import ClinicalToolsInfoModal from './components/ClinicalToolsInfoModal';

const TOOL_SOURCE_BY_CODE = {
  PHQ9: 'Kroenke K, Spitzer RL, Williams JBW. The PHQ-9 (J Gen Intern Med, 2001).',
  GAD7: 'Spitzer RL, Kroenke K, Williams JBW, Löwe B. The GAD-7 (Arch Intern Med, 2006).',
  PHQ15: 'Kroenke K, Spitzer RL, Williams JBW. The PHQ-15 (J Psychosom Res, 2002).',
  DASS21: 'Lovibond SH, Lovibond PF. Manual for the DASS (Psychology Foundation, 1995).',
  WHO5: 'World Health Organization. WHO-5 Well-Being Index.',
  PSS10: 'Cohen S, Kamarck T, Mermelstein R. Perceived Stress Scale (1983).',
  ISI: 'Bastien CH, Vallières A, Morin CM. Insomnia Severity Index (Sleep Med, 2001).',
  CBI: 'Kristensen TS, Borritz M, Villadsen E, Christensen KB. Copenhagen Burnout Inventory (2005).',
  WHODAS12: 'World Health Organization. WHODAS 2.0 - 12 item version.',
};

export default function ClinicalToolsScreen({ navigation }) {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  const [showDontRemindCheckbox, setShowDontRemindCheckbox] = useState(false);

  const loadReminderPreference = async () => {
    try {
      const hideReminder = await getClinicalToolsReminderPreference();
      if (!hideReminder) {
        setShowDontRemindCheckbox(true);
        setInfoModalVisible(true);
      }
    } catch (err) {
      console.warn('Failed to load reminder preference', err);
      setShowDontRemindCheckbox(true);
      setInfoModalVisible(true);
    }
  };

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

  useFocusEffect(
    React.useCallback(() => {
      loadReminderPreference();
    }, [])
  );

  const toggleExpand = (toolId) => {
    setExpanded((prev) => ({
      ...prev,
      [toolId]: !prev[toolId],
    }));
  };

  const handleDontRemindAgain = async () => {
    try {
      setSavingPreference(true);
      await setClinicalToolsReminderPreference(true);
    } catch (err) {
      console.warn('Failed to save preference', err);
    } finally {
      setSavingPreference(false);
    }
  };

  const renderItem = ({ item }) => {
    const isExpanded = !!expanded[item.id];
    const duration = item.duration_minutes ? `${item.duration_minutes} mins` : 'Duration -';
    const itemCount = item.item_count ? `${item.item_count} questions` : 'Questions -';
    const focusArea = item.target_condition || 'General mental wellbeing';
    const detailsIntro = item.details_intro || 'Standardized assessment to help you understand your mental health.';
    const interpretation = item.interpretation_guide || 'Review score ranges in context and consult a professional when needed.';
    const source = item.source || TOOL_SOURCE_BY_CODE[item.code] || 'Source reference not available.';

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

            <View style={styles.detailsIntroBox}>
              <Ionicons name="bulb-outline" size={14} color="#1d4ed8" />
              <View style={styles.detailsInfoContent}>
                <Text style={styles.detailsInfoTitle}>Introduction</Text>
                <Text style={styles.detailsIntroText}>{detailsIntro}</Text>
              </View>
            </View>

            <View style={styles.detailsIntroBox}>
              <Ionicons name="compass-outline" size={14} color="#1d4ed8" />
              <View style={styles.detailsInfoContent}>
                <Text style={styles.detailsInfoTitle}>Focus Area</Text>
                <Text style={styles.detailsIntroText}>{focusArea}</Text>
              </View>
            </View>

            <View style={styles.interpretationBox}>
              <Ionicons name="analytics-outline" size={14} color="#1d4ed8" />
              <Text style={styles.interpretationText}>{interpretation}</Text>
            </View>

            <View style={styles.sourceBox}>
              <Ionicons name="library-outline" size={14} color="#7c3aed" />
              <View style={styles.detailsInfoContent}>
                <Text style={styles.sourceTitle}>Source</Text>
                <Text style={styles.sourceText}>{source}</Text>
              </View>
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
                <View style={styles.headerIconsRow}>
                  <TouchableOpacity
                    style={styles.historyIconButton}
                    onPress={() => {
                      setShowDontRemindCheckbox(false);
                      setInfoModalVisible(true);
                    }}
                  >
                    <Ionicons name="information-circle-outline" size={16} color="#1d4ed8" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.historyIconButton}
                    onPress={() => navigation.navigate('ClinicalToolHistory')}
                  >
                    <Ionicons name="time-outline" size={16} color="#1d4ed8" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.headerSubtitle}>Standardized assessments to help you understand your mental health. All data is processed in compliance with the PDPA.</Text>

              <View style={styles.headerInfoRow}>
                <View style={styles.headerInfoPill}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#0f766e" />
                  <Text style={styles.headerInfoText}>Evidence-based</Text>
                </View>
                <View style={styles.headerInfoPill}>
                  <Ionicons name="sparkles-outline" size={14} color="#4338ca" />
                  <Text style={styles.headerInfoText}>Quick Results</Text>
                </View>
                <View style={styles.headerInfoPill}>
                  <Ionicons name="lock-closed-outline" size={14} color="#0284c7" />
                  <Text style={styles.headerInfoText}>PDPA Compliant</Text>
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

      <ClinicalToolsInfoModal
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
        onDontRemindAgain={handleDontRemindAgain}
        loading={savingPreference}
        showDontRemind={showDontRemindCheckbox}
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
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  detailsIntroBox: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailsInfoContent: {
    flex: 1,
  },
  detailsInfoTitle: {
    fontSize: 11,
    color: '#1e3a8a',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  detailsIntroText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
    fontWeight: '500',
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
  sourceBox: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  sourceTitle: {
    fontSize: 11,
    color: '#5b21b6',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  sourceText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6d28d9',
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
