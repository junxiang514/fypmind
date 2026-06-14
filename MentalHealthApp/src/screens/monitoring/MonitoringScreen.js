import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Image, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
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

  const ToolTile = ({ title, description, iconName, colors, onPress, fullWidth = false }) => (
    <TouchableOpacity
      style={[styles.tile, fullWidth && styles.tileFull]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <LinearGradient
        colors={colors}
        style={styles.tileGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.tileTop}>
          <View style={styles.tileIconWrap}>
            <Ionicons name={iconName} size={22} color="#fff" />
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.85)" />
        </View>

        <View style={styles.tileBody}>
          <Text style={styles.tileTitle}>{title}</Text>
          <Text style={styles.tileDescription} numberOfLines={2}>
            {description}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>MIND</Text>
          <View style={styles.dateBadge}>
            <Ionicons name="calendar-outline" size={14} color="#6366F1" />
            <Text style={styles.dateBadgeText}>{todayLabel}</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Profile')}
          style={styles.dashboardHeader}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.headerAvatarImage} />
              ) : (
                <View style={styles.headerAvatarFallback}>
                  <Ionicons name="person" size={26} color="#6366F1" />
                </View>
              )}
            </View>
            <View style={styles.headerTextBlock}>
              <Text style={styles.greeting}>Hi, {displayName}</Text>
              <Text style={styles.subGreeting}>Get a quick view of your mental wellbeing tools.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </View>

        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#6366F1" />
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
              description="Check in with how you're feeling today."
              iconName="sunny"
              colors={['#FF6B4A', '#FF9F43']} // sunset orange gradient
              onPress={() => navigation.navigate('DailyAssessment')}
            />
            <ToolTile
              title="Clinical Self Assessment Tools"
              description="Use standardized tests for deeper insights."
              iconName="clipboard"
              colors={['#6366F1', '#4F46E5']} // deep indigo/purple gradient
              onPress={() => navigation.navigate('ClinicalTools')}
            />
            <ToolTile
              title="AI Chat"
              description="Talk to the AI assistant anytime."
              iconName="chatbubbles"
              colors={['#10B981', '#059669']} // fresh emerald green gradient
              onPress={() => navigation.navigate('AIChat')}
            />
            <ToolTile
              title="Educational Content"
              description="Learn coping strategies and wellness tips."
              iconName="book"
              colors={['#0EA5E9', '#2563EB']} // bright sky blue gradient
              onPress={() => navigation.navigate('EducationalContent')}
            />
            <ToolTile
              title="Events & Activities"
              description="Browse events and activities near you."
              iconName="calendar"
              colors={['#EC4899', '#D946EF']} // electric pink gradient
              fullWidth
              onPress={() => navigation.navigate('Events')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Slate 50 background (cool grey/white)
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A', // Slate 900
    letterSpacing: -0.5,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#EEF2F6',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateBadgeText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#6366F1', // Indigo 500
    fontWeight: '700',
  },
  dashboardHeader: {
    backgroundColor: '#FFFFFF', // Solid plain color
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 20,
    marginBottom: 26,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextBlock: {
    flex: 1,
  },
  headerAvatar: {
    marginRight: 16,
  },
  headerAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    backgroundColor: '#E2E8F0',
  },
  headerAvatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A', // Slate 900
  },
  subGreeting: {
    fontSize: 13,
    color: '#64748B', // Slate 500
    marginTop: 4,
    lineHeight: 18,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#991B1B',
    flex: 1,
  },
  section: {
    marginBottom: 26,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    borderRadius: 18,
    marginBottom: 16,
    minHeight: 130,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    backgroundColor: '#ffffff',
  },
  tileFull: {
    width: '100%',
  },
  tileGradient: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    justifyContent: 'space-between',
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tileBody: {
    marginTop: 16,
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  tileDescription: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 16,
  },
});
