import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TrendInsightCard({ insightLoading, aiInsight, hasData }) {
  return (
    <View style={styles.insightContainer}>
      <View style={styles.insightHeader}>
        <View style={styles.iconBadge}>
          <Ionicons name="sparkles" size={16} color="#0284c7" />
        </View>
        <Text style={styles.insightTitle}>AI Insight</Text>
      </View>
      {insightLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#0284c7" />
          <Text style={styles.loadingText}>Generating personalized insight...</Text>
        </View>
      ) : (
        <Text style={styles.insightText}>
          {aiInsight || (hasData
            ? 'You are doing great by tracking your wellbeing consistently. Keep this momentum — your insights will become even more powerful and personalized over time.'
            : 'You are one check-in away from your first personalized insight — let’s begin and build your momentum.')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  insightContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  insightTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginLeft: 8,
  },
  insightText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 23,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  loadingText: {
    marginLeft: 8,
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '600',
  },
});
