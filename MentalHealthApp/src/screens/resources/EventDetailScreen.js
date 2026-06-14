import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';

import { getEventById, getMyEventPreference, saveMyEventPreference } from '../../lib/events';

function formatDateOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString([], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTimeShort(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d
    .toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .replace(':00', '')
    .replace(' AM', 'am')
    .replace(' PM', 'pm')
    .replace(' am', 'am')
    .replace(' pm', 'pm');
}

function normalizeMultiline(text) {
  if (!text) return '';
  return String(text).replace(/\\n/g, '\n');
}

export default function EventDetailScreen({ route }) {
  const { id } = route.params || {};

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [savingPref, setSavingPref] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const row = await getEventById(id);
        setItem(row);

        const pref = await getMyEventPreference(id);
        if (pref) {
          setSaved(Boolean(pref.is_saved));
        }
      } catch (err) {
        setError(err?.message || 'Failed to load event.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const onNavigate = () => {
    const link = String(item?.location_link || '').trim();
    if (!link) {
      setError('Missing location link. Please update this event in admin.');
      return;
    }

    Linking.openURL(link).catch(() => {
      setError('Unable to open map location.');
    });
  };

  const updatePreference = async (next) => {
    try {
      setSavingPref(true);
      setError(null);
      const res = await saveMyEventPreference({
        eventId: id,
        isSaved: next.isSaved,
      });
      if (res) {
        setSaved(Boolean(res.is_saved));
      }
    } catch (err) {
      setError(err?.message || 'Unable to save event preference.');
    } finally {
      setSavingPref(false);
    }
  };

  const onToggleSave = () => {
    updatePreference({
      isSaved: !saved,
    });
  };

  const getOrCreateCalendarId = async () => {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const writable = calendars.find((c) => c.allowsModifications);
    if (writable?.id) return writable.id;

    if (Platform.OS === 'android') {
      const source =
        calendars.find((cal) => cal.source && cal.source.name === 'Default')?.source ||
        calendars[0]?.source;

      if (!source) return null;

      return Calendar.createCalendarAsync({
        title: 'MIND',
        color: '#2563eb',
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: source.id,
        source,
        name: 'MIND',
        ownerAccount: 'personal',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });
    }

    return null;
  };

  const onAddToCalendar = async () => {
    const startDate = item?.start_at ? new Date(item.start_at) : null;
    if (!startDate || Number.isNaN(startDate.getTime())) {
      setError('Event start date is required to add to calendar.');
      return;
    }

    const endDate = item?.end_at ? new Date(item.end_at) : null;

    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      setError('Calendar permission is required.');
      return;
    }

    try {
      const calendarId = await getOrCreateCalendarId();
      if (!calendarId) {
        setError('No writable calendar found on this device.');
        return;
      }

      const notes = [
        item?.description,
        item?.detailed_description,
        item?.objective ? `Objective:\n${normalizeMultiline(item.objective)}` : null,
        item?.agenda ? `Agenda:\n${normalizeMultiline(item.agenda)}` : null,
        item?.fee ? `Fee: ${item.fee}` : null,
      ].filter(Boolean).join('\n\n');

      await Calendar.createEventAsync(calendarId, {
        title: item?.title || 'Event',
        startDate,
        endDate: endDate && !Number.isNaN(endDate.getTime()) ? endDate : new Date(startDate.getTime() + 60 * 60 * 1000),
        location: item?.address || item?.location || undefined,
        notes,
      });

      Alert.alert('Added to calendar', 'Event has been added to your device calendar.');
    } catch {
      setError('Unable to add event to calendar.');
    }
  };

  const imageUrls = Array.isArray(item?.image_urls)
    ? item.image_urls.filter((u) => typeof u === 'string' && u.trim())
    : [];

  const dateLabel = item?.start_at ? formatDateOnly(item.start_at) : '';
  const startTime = item?.start_at ? formatTimeShort(item.start_at) : '';
  const endTime = item?.end_at ? formatTimeShort(item.end_at) : '';
  const timeRangeLabel = startTime && endTime ? `${startTime}-${endTime}` : startTime || '';

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
            <View style={styles.titleRow}>
              <Text style={styles.title}>{item?.title || 'Untitled'}</Text>
              <TouchableOpacity
                style={[styles.saveCircleBtn, saved && styles.saveCircleBtnActive]}
                onPress={onToggleSave}
                disabled={savingPref}
              >
                <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? '#fff' : '#1d4ed8'} />
              </TouchableOpacity>
            </View>
            {!!item?.category && <Text style={styles.meta}>{item.category}</Text>}

            {!!imageUrls.length && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.posterRow}>
                {imageUrls.map((url, idx) => (
                  <Image key={`${idx}-${url}`} source={{ uri: url }} style={styles.posterImage} resizeMode="cover" />
                ))}
              </ScrollView>
            )}

            {!!item?.location && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={16} color="#64748b" />
                <Text style={styles.infoText}>{item.location}</Text>
              </View>
            )}

            {!!dateLabel && (
              <View style={styles.infoRow}>
                <Ionicons name="time" size={16} color="#64748b" />
                <Text style={styles.infoText}>Date: {dateLabel}</Text>
              </View>
            )}

            {!!timeRangeLabel && (
              <View style={styles.infoRow}>
                <Ionicons name="hourglass-outline" size={16} color="#64748b" />
                <Text style={styles.infoText}>Time: {timeRangeLabel}</Text>
              </View>
            )}

            {!!item?.address && (
              <View style={styles.infoRow}>
                <Ionicons name="pin" size={16} color="#64748b" />
                <Text style={styles.infoText}>{item.address}</Text>
              </View>
            )}

            {!!item?.fee && (
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={16} color="#64748b" />
                <Text style={styles.infoText}>Fee: {item.fee}</Text>
              </View>
            )}

            {!!item?.description && (
              <>
                <View style={styles.divider} />
                <Text style={styles.body}>{item.description}</Text>
              </>
            )}

            {!!item?.detailed_description && (
              <Text style={styles.bodyDetail}>{item.detailed_description}</Text>
            )}

            {!!item?.objective && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Objective</Text>
                <Text style={styles.bodyDetail}>{normalizeMultiline(item.objective)}</Text>
              </>
            )}

            {!!item?.agenda && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Agenda</Text>
                <Text style={styles.bodyDetail}>{normalizeMultiline(item.agenda)}</Text>
              </>
            )}

            <TouchableOpacity style={styles.calendarButton} onPress={onAddToCalendar}>
              <Ionicons name="calendar-outline" size={16} color="#1d4ed8" />
              <Text style={styles.calendarButtonText}>Save to Calendar</Text>
            </TouchableOpacity>

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
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  saveCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
  },
  saveCircleBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  meta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  posterRow: {
    marginTop: 14,
  },
  posterImage: {
    width: 220,
    height: 130,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#e2e8f0',
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
  bodyDetail: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  sectionTitle: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  calendarButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
    paddingVertical: 11,
  },
  calendarButtonText: {
    marginLeft: 6,
    color: '#1d4ed8',
    fontWeight: '700',
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
