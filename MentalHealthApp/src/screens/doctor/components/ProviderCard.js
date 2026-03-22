import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { openDirections } from '../../../lib/maps';

export function ProviderCard({ provider }) {
  const [expanded, setExpanded] = useState(false);

  const name = provider?.name || 'Unknown provider';
  const type = provider?.service_type || 'Service';
  const place = provider?.city || provider?.location || '';
  const rating = provider?.rating;
  const imageUrl = provider?.image_url;
  const operatingHours = provider?.operating_hours;
  const statusText = provider?.open_state || '';
  const normalizedStatus = statusText.toLowerCase();
  const isOpen = /\bopen\b/.test(normalizedStatus) || /\bcloses?\b/.test(normalizedStatus);
  const isClosed = /\bclosed\b/.test(normalizedStatus) || /\bopens?\b/.test(normalizedStatus);
  const hasDistance = typeof provider?.distance_km === 'number' && Number.isFinite(provider.distance_km);

  const formatDistance = (km) => {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  const estimateTravelTime = (km) => {
    // Simple estimate using average city driving speed.
    const avgSpeedKmH = 25;
    const minutes = Math.max(1, Math.round((km / avgSpeedKmH) * 60));
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  const onNavigate = () => {
    openDirections({
      latitude: provider?.latitude,
      longitude: provider?.longitude,
      address: provider?.address || provider?.location || '',
      label: provider?.name || 'Destination',
    });
  };

  const onOpenWebsite = async () => {
    const website = provider?.website;
    if (!website) return;
    const target = /^https?:\/\//i.test(website) ? website : `https://${website}`;
    try {
      await Linking.openURL(target);
    } catch {
      // no-op
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.summaryRow} activeOpacity={0.85} onPress={() => setExpanded((prev) => !prev)}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="medkit" size={22} color="#007AFF" />
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.providerName} numberOfLines={1}>{name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.serviceType} numberOfLines={1}>{type}</Text>
            {!!statusText && (isOpen || isClosed) ? (
              <View style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusClosed]}>
                <Text style={[styles.statusText, isOpen ? styles.statusTextOpen : styles.statusTextClosed]} numberOfLines={1}>
                  {isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
            ) : null}
          </View>
          {!!place && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={14} color="#64748b" />
              <Text style={styles.locationText} numberOfLines={1}>{place}</Text>
            </View>
          )}

          {hasDistance && (
            <View style={styles.tripRow}>
              <Ionicons name="car-outline" size={14} color="#2563eb" />
              <Text style={styles.tripText}>~{estimateTravelTime(provider.distance_km)} • {formatDistance(provider.distance_km)}</Text>
            </View>
          )}
        </View>

        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.detailsSection}>
          {typeof rating === 'number' && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rating</Text>
              <Text style={styles.detailValue}>{rating.toFixed(1)} / 5</Text>
            </View>
          )}

          {!!provider?.phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{provider.phone}</Text>
            </View>
          )}

          {!!provider?.address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>{provider.address}</Text>
            </View>
          )}

          {!!operatingHours && (
            <View style={styles.hoursSection}>
              <Text style={styles.detailLabel}>Hours</Text>
              <View style={styles.hoursList}>
                {Object.entries(operatingHours).map(([day, hours]) => (
                  <View key={day} style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                    <Text style={styles.hoursValue}>{String(hours)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!!provider?.website && (
            <TouchableOpacity style={styles.websiteRow} onPress={onOpenWebsite}>
              <Ionicons name="globe-outline" size={14} color="#2563eb" />
              <Text style={styles.websiteText}>Open website</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.navigateButton} onPress={onNavigate}>
          <Ionicons name="navigate" size={16} color="#fff" />
          <Text style={styles.navigateButtonText}>Navigate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: '#E5F4FF',
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
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
    flex: 1,
    marginRight: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusOpen: {
    backgroundColor: '#dcfce7',
  },
  statusClosed: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextOpen: {
    color: '#166534',
  },
  statusTextClosed: {
    color: '#991b1b',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  tripText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  locationText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  detailsSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailLabel: {
    width: 70,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    lineHeight: 18,
  },
  websiteRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  websiteText: {
    marginLeft: 6,
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
  },
  hoursSection: {
    marginTop: 4,
  },
  hoursList: {
    marginTop: 6,
    gap: 4,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursDay: {
    width: 90,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  hoursValue: {
    flex: 1,
    fontSize: 12,
    color: '#111827',
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
