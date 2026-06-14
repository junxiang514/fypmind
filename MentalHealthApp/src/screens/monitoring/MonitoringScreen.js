import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Image, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMyProfile } from '../../lib/profiles';

export default function MonitoringScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMyProfile();
      setProfile(data);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const avatarUri = useMemo(() => {
    const uri = profile?.avatar_url;
    if (!uri) return null;
    if (uri.startsWith('data:')) return uri;
    const stamp = profile?.updated_at ? encodeURIComponent(profile.updated_at) : Date.now();
    const separator = uri.includes('?') ? '&' : '?';
    return `${uri}${separator}t=${stamp}`;
  }, [profile?.avatar_url, profile?.updated_at]);

  const displayName = profile?.full_name || 'User';
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const ToolTile = ({ title, description, iconName, style, onPress, fullWidth = false }) => (
    <TouchableOpacity
      style={[styles.tile, style, fullWidth && styles.tileFull]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.tileTop}>
        <View style={styles.tileIconWrap}>
          <Ionicons name={iconName} size={22} color="#fff" />
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.9)" />
      </View>

      <View style={styles.tileBody}>
        <Text style={styles.tileTitle}>{title}</Text>
        <Text style={styles.tileDescription} numberOfLines={2}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>MIND</Text>
          <View style={styles.dateBadge}>
            <Ionicons name="calendar-outline" size={14} color="#1d4ed8" />
            <Text style={styles.dateBadgeText}>{todayLabel}</Text>
          </View>
        </View>

        <View style={styles.dashboardHeader}>
          <View style={styles.headerGlow} />
          <View style={styles.headerAvatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.headerAvatarImage} />
            ) : (
              <View style={styles.headerAvatarFallback}>
                <Ionicons name="person" size={26} color="#2563EB" />
              </View>
            )}
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={styles.greeting}>Hi, {displayName}</Text>
            <Text style={styles.subGreeting}>Get a quick view of your mental wellbeing tools.</Text>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Loading your data...</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={18} color="#c53030" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your tools</Text>

          <View style={styles.toolsGrid}>
            <ToolTile
              title="Daily Self Check-in"
              description="Check in with how you''re feeling today."
              iconName="sunny"
              style={styles.homeAssessmentCard}
              onPress={() => navigation.navigate('DailyAssessment')}
            />
            <ToolTile
              title="Clinical Self Assessment Tools"
              description="Use standardized tests for deeper insights."
              iconName="clipboard"
              style={styles.homeClinicalCard}
              onPress={() => navigation.navigate('ClinicalTools')}
            />
            <ToolTile
              title="AI Chat"
              description="Talk to the AI assistant anytime."
              iconName="chatbubbles"
              style={styles.homeChatCard}
              onPress={() => navigation.navigate('AIChat')}
            />
            <ToolTile
              title="Educational Content"
              description="Learn coping strategies and wellness tips."
              iconName="book"
              style={styles.homeEducationCard}
              onPress={() => navigation.navigate('EducationalContent')}
            />
            <ToolTile
              title="Events & Activities"
              description="Browse events and activities near you."
              iconName="calendar"
              style={styles.homeEventsCard}
              fullWidth
              onPress={() => navigation.navigate('Events')}
            />
          </View>
        </View>

        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>
            "Mental health is not a destination, but a process. It's about how you drive, not where you're going."
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
  },
  dateBadgeText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '700',
  },
  dashboardHeader: {
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerGlow: {
    position: 'absolute',
    right: -20,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#dbeafe',
  },
  headerTextBlock: {
    flex: 1,
  },
  headerAvatar: {
    marginRight: 12,
  },
  headerAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#dbeafe',
  },
  headerAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  subGreeting: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  headerChipsRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  headerChipText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FED7D7',
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#742A2A',
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 3,
  },
  tileFull: {
    width: '100%',
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  tileIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tileBody: {
    marginTop: 14,
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  tileDescription: {
    marginTop: 6,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.92)',
    lineHeight: 17,
  },
  homeAssessmentCard: {
    backgroundColor: '#F97316', // warm orange
  },
  homeClinicalCard: {
    backgroundColor: '#6366F1', // indigo
  },
  homeChatCard: {
    backgroundColor: '#22C55E', // green
  },
  homeEducationCard: {
    backgroundColor: '#0EA5E9', // sky blue
  },
  homeEventsCard: {
    backgroundColor: '#EC4899', // pink
  },
  quoteContainer: {
    marginTop: 4,
    padding: 18,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#555',
    lineHeight: 22,
  },
});
