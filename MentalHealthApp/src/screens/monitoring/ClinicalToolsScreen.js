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

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.toolName}>{item.name || item.code}</Text>
          <Text style={styles.toolDescription}>{item.description}</Text>
          <View style={styles.durationContainer}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.durationText}>{item.duration_minutes || '-'} mins</Text>
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
            onPress={() => navigation.navigate('ClinicalToolQuestionnaire', { toolId: item.id, toolName: item.name || item.code })}
          >
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.detailsPanel}>
            <Text style={styles.detailsTitle}>Tool details</Text>
            <Text style={styles.detailsLine}>Condition: {item.target_condition || '-'}</Text>
            <Text style={styles.detailsLine}>Questions: {item.item_count || '-'}</Text>
            <Text style={styles.detailsLine}>Scale: {item.scale_note || '-'}</Text>
            <Text style={styles.detailsLine}>Administration: {item.administration_note || '-'}</Text>
            <Text style={styles.detailsLine}>Interpretation: {item.interpretation_guide || '-'}</Text>
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
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <Text style={styles.headerTitle}>Clinical Tools</Text>
              <TouchableOpacity
                style={styles.historyIconButton}
                onPress={() => navigation.navigate('ClinicalToolHistory')}
              >
                <Ionicons name="time-outline" size={16} color="#1d4ed8" />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerSubtitle}>Standardized assessments to help you understand your mental health.</Text>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            {loading && <Text style={styles.loadingText}>Loading...</Text>}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  historyIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    marginBottom: 10,
  },
  toolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
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
    paddingVertical: 10,
    borderRadius: 8,
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
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailsPanel: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  detailsLine: {
    fontSize: 12,
    color: '#334155',
    marginBottom: 4,
    lineHeight: 18,
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
});
