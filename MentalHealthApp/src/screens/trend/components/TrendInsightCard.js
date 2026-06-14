import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';

export default function TrendInsightCard({ insightLoading, aiInsight, hasData }) {
  return (
    <View style={styles.insightContainer}>
      <View style={styles.insightHeader}>
        <Image
          source={require('../../../../assets/LumiAvatar.png')}
          style={styles.avatarImage}
        />
        <View style={styles.headerTextContainer}>
          <Text style={styles.botName}>Lumi</Text>
          <Text style={styles.insightTitle}>Personalized Insight</Text>
        </View>
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
      <Text style={styles.disclaimerText}>
        This is an AI-generated message. Please seek professional help if needed.
      </Text>
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
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#F1F5F9',
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  botName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
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
  disclaimerText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'left',
  },
});
