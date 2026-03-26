import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getMyEducationalProgressMap, listEducationalContents } from '../../lib/education';

export default function EducationalContentScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await listEducationalContents({ query });

      const progressMap = await getMyEducationalProgressMap(rows.map((r) => r.id));
      const merged = rows.map((row) => {
        const my = progressMap[String(row.id)];
        return {
          ...row,
          progress_percent: Number(my?.progress_percent || 0),
        };
      });

      setItems(merged);
    } catch (err) {
      setError(err?.message || 'Failed to load educational content.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const renderItem = ({ item }) => {
    const percent = Math.max(0, Math.min(100, Math.round(item?.progress_percent || 0)));
    const progressLabel = percent >= 100 ? 'Completed' : `Progress: ${percent}%`;

    return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EducationalContentDetail', { id: item.id })}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="book" size={20} color="#007AFF" />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.title}>{item?.title || 'Untitled'}</Text>
        {!!item?.category && <Text style={styles.meta}>{item.category}</Text>}
        {!!item?.summary && <Text style={styles.summary} numberOfLines={2}>{item.summary}</Text>}
        <View style={styles.progressWrap}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
          </View>
          <Text style={[styles.progressText, percent >= 100 && styles.progressTextDone]}>{progressLabel}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
    </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Educational Content</Text>
              <Text style={styles.headerSubtitle}>Explore tips and knowledge for mental wellbeing.</Text>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#64748b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by title"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                onSubmitEditing={load}
              />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={load} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="search" size={16} color="#fff" />
                  <Text style={styles.primaryButtonText}>Search</Text>
                </>
              )}
            </TouchableOpacity>

            {!!error && (
              <View style={styles.errorBanner}>
                <Ionicons name="warning" size={16} color="#b91c1c" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!loading && !error && items?.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No content found</Text>
                <Text style={styles.emptyText}>Try a different keyword.</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Results</Text>
          </>
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
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748b',
  },
  sectionTitle: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    marginBottom: 12,
  },
  errorText: {
    marginLeft: 8,
    color: '#7f1d1d',
    fontSize: 13,
    flex: 1,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  emptyText: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  summary: {
    marginTop: 6,
    fontSize: 13,
    color: '#475569',
  },
  progressWrap: {
    marginTop: 8,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  progressText: {
    marginTop: 4,
    fontSize: 11,
    color: '#1d4ed8',
    fontWeight: '700',
  },
  progressTextDone: {
    color: '#15803d',
  },
});
