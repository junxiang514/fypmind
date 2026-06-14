import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator, Image, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '../../lib/supabase';
import { fetchMyProfile, updateMyProfile } from '../../lib/profiles';
import { useFocusEffect } from '@react-navigation/native';

function formatDateForDisplay(value) {
  if (!value) return 'N/A';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// TODO: After deploying web/reset-password.html, replace with your actual hosted URL
const RESET_PASSWORD_REDIRECT = 'https://junxiang514.github.io/fypmind/MentalHealthApp/web/reset-password.html';

export default function ProfileScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarUri, setAvatarUri] = useState(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        navigation.replace('Login');
        return;
      }

      const profile = await fetchMyProfile();
      setUserProfile(profile);
      setAvatarUri(profile?.avatar_url ?? null);
    } catch (error) {
      Alert.alert('Error', error?.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Str = result.assets[0].base64;
      const fileExt = result.assets[0].uri.split('.').pop() || 'jpg';
      const base64DataUrl = `data:image/${fileExt === 'png' ? 'png' : 'jpeg'};base64,${base64Str}`;
      
      setAvatarUri(base64DataUrl);
      try {
        setLoading(true);
        const updated = await updateMyProfile({ avatar_url: base64DataUrl });
        setUserProfile(updated);
        Alert.alert('Success', 'Profile picture updated successfully!');
      } catch (e) {
        Alert.alert('Error', e?.message ?? 'Failed to save photo');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            navigation.replace('Login');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { profile: userProfile });
  };

  const handleChangePassword = async () => {
    try {
      setIsSendingReset(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.email) {
        Alert.alert('Error', userError?.message ?? 'Unable to get your email address.');
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(userData.user.email, {
        redirectTo: RESET_PASSWORD_REDIRECT,
      });

      if (error) {
        Alert.alert('Request failed', error.message);
        return;
      }

      Alert.alert('Reset link sent', 'A password reset link has been sent to your email.');
    } catch (error) {
      Alert.alert('Error', error?.message ?? 'Failed to send password reset link.');
    } finally {
      setIsSendingReset(false);
    }
  };

  const normalizedGender = userProfile?.gender?.trim().toLowerCase();
  const genderIconName =
    normalizedGender === 'male'
      ? 'male'
      : normalizedGender === 'female'
      ? 'female'
      : null;

  const genderIconColor = normalizedGender === 'female' ? '#E91E63' : '#2196F3';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        {/* Profile Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarTouchable} onPress={pickImage}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={50} color="#007AFF" />
              </View>
            )}
            <Text style={styles.avatarEditText}>Tap to change photo</Text>
          </TouchableOpacity>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{userProfile?.full_name || 'User'}</Text>
            {genderIconName ? (
              <Ionicons
                name={genderIconName}
                size={20}
                color={genderIconColor}
                style={styles.genderIcon}
              />
            ) : null}
          </View>
          <Text style={styles.userEmail}>{userProfile?.email || 'email@example.com'}</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {/* ...existing code... */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{userProfile?.full_name || 'N/A'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userProfile?.email || 'N/A'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#666" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{userProfile?.phone || 'N/A'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date of Birth</Text>
                <Text style={styles.infoValue}>{formatDateForDisplay(userProfile?.date_of_birth)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="male-female-outline" size={20} color="#666" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>{userProfile?.gender || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Medical Information removed */}

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.changePasswordButton, isSendingReset && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={isSendingReset}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#fff" />
            <Text style={styles.changePasswordButtonText}>
              {isSendingReset ? 'Sending reset link...' : 'Change Password'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.spacing} />
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
  },
  avatarTouchable: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'cover',
    backgroundColor: '#E8F4FF',
  },
  avatarEditText: {
    color: '#007AFF',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderIcon: {
    marginLeft: 8,
    marginTop: 1,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  changePasswordButton: {
    flexDirection: 'row',
    backgroundColor: '#5856D6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  changePasswordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  spacing: {
    height: 24,
  },
});
