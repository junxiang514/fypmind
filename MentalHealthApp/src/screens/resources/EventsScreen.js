import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { listEvents } from '../../lib/events';

function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function EventsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await listEvents({});
      setItems(rows);
    } catch (err) {
      setError(err?.message || 'Failed to load events.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderItem = ({ item }) => {
    const title = item?.title || 'Untitled';
    const location = item?.location;
    const timeLabel = item?.start_at ? formatDateTime(item.start_at) : null;

    return (
      <View style={styles.card}>
        <View style={styles.dateColumn}>
          <View style={styles.datePill}>
            <Ionicons name="calendar" size={16} color="#0f172a" />
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.title}>{title}</Text>
          </View>

          {!!timeLabel && (
            <View style={styles.metaRow}>
              <Ionicons name="time" size={14} color="#64748b" />
              <Text style={styles.metaLocation}>{timeLabel}</Text>
            </View>
          )}

          {!!location && (
            <View style={styles.metaRow}>
              <Ionicons name="location" size={14} color="#64748b" />
              <Text style={styles.metaLocation}>{location}</Text>
            </View>
          )}

          {!!item?.description && (
            <Text style={styles.summary}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
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
              <Text style={styles.headerTitle}>Events & Activities</Text>
              <Text style={styles.headerSubtitle}>Discover upcoming activities that support your wellbeing.</Text>
            </View>

            {!!error && (
              <View style={styles.errorBanner}>
                <Ionicons name="warning" size={16} color="#b91c1c" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!loading && !error && items?.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No events found</Text>
                <Text style={styles.emptyText}>Try a different keyword.</Text>
              </View>
            )}

            
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateColumn: {
    marginRight: 12,
    alignItems: 'center',
  },
  datePill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaLocation: {
    marginLeft: 4,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  summary: {
    marginTop: 6,
    fontSize: 13,
    color: '#475569',
  },
});
