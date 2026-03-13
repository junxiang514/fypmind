import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getEventById } from '../../lib/events';
import { openDirections } from '../../lib/maps';

function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function EventDetailScreen({ route }) {
  const { id } = route.params || {};

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const row = await getEventById(id);
        setItem(row);
      } catch (err) {
        setError(err?.message || 'Failed to load event.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const onNavigate = () => {
    openDirections({
      latitude: item?.latitude,
      longitude: item?.longitude,
      address: item?.address || item?.location || '',
      label: item?.title || 'Destination',
    });
  };

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

            {!!item?.location && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={16} color="#64748b" />
                <Text style={styles.infoText}>{item.location}</Text>
              </View>
            )}

            {!!item?.start_at && (
              <View style={styles.infoRow}>
                <Ionicons name="time" size={16} color="#64748b" />
                <Text style={styles.infoText}>{formatDateTime(item.start_at)}</Text>
              </View>
            )}

            {!!item?.description && (
              <>
                <View style={styles.divider} />
                <Text style={styles.body}>{item.description}</Text>
              </>
            )}

            <TouchableOpacity style={styles.primaryButton} onPress={onNavigate}>
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.primaryButtonText}>Navigate</Text>
            </TouchableOpacity>
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
  infoRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#334155',
    flex: 1,
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
  primaryButton: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
});
