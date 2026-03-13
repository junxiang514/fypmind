import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { openDirections } from '../../../lib/maps';

export function ProviderCard({ provider }) {
  const name = provider?.name || 'Unknown provider';
  const type = provider?.service_type || 'Service';
  const place = provider?.location || provider?.address || '';
  const rating = provider?.rating;

  const onNavigate = () => {
    openDirections({
      latitude: provider?.latitude,
      longitude: provider?.longitude,
      address: provider?.address || provider?.location || '',
      label: provider?.name || 'Destination',
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Ionicons name="medkit" size={22} color="#007AFF" />
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.providerName}>{name}</Text>
        <Text style={styles.serviceType}>{type}</Text>
        {!!place && (
          <View style={styles.infoRow}>
            <Ionicons name="location" size={14} color="#64748b" />
            <Text style={styles.locationText}>{place}</Text>
          </View>
        )}
        {typeof rating === 'number' && (
          <View style={styles.infoRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.navigateButton} onPress={onNavigate}>
        <Ionicons name="navigate" size={16} color="#fff" />
        <Text style={styles.navigateButtonText}>Navigate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  navigateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
});
