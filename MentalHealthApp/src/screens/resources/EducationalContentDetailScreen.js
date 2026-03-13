import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';

import { getEducationalContentById } from '../../lib/education';

export default function EducationalContentDetailScreen({ route }) {
  const { id } = route.params || {};

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const row = await getEducationalContentById(id);
        setItem(row);
      } catch (err) {
        setError(err?.message || 'Failed to load content.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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
            {!!item?.summary && <Text style={styles.summary}>{item.summary}</Text>}
            <View style={styles.divider} />
            <Text style={styles.body}>{item?.body || 'No content.'}</Text>
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
});
