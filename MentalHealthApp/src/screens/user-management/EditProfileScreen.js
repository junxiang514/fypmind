import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../lib/supabase';
import { fetchMyProfile, updateMyProfile } from '../../lib/profiles';

export default function EditProfileScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          navigation.replace('Login');
          return;
        }

        const profile = route.params?.profile ?? (await fetchMyProfile());
        setName(profile?.full_name || '');
        setEmail(profile?.email || sessionData.session.user.email || '');
        setPhone(profile?.phone || '');
        setDateOfBirth(profile?.date_of_birth || '');
        setGender(profile?.gender || '');
        setAddress(profile?.address || '');
        setMedicalHistory(profile?.medical_history || '');
      } catch (e) {
        Alert.alert('Error', e?.message ?? 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [route.params?.profile]);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return false;
    }
    if (phone.trim() && phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await updateMyProfile({
        full_name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        date_of_birth: dateOfBirth.trim(),
        gender: gender.trim(),
        address: address.trim(),
        medical_history: medicalHistory.trim(),
      });
      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Full Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>
          </View>

          {/* Date of Birth */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                editable={!loading}
              />
            </View>
          </View>

          {/* Gender */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              {['Male', 'Female', 'Other'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.genderOption,
                    gender === option && styles.genderOptionSelected,
                  ]}
                  onPress={() => setGender(option)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      gender === option && styles.genderOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Address */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Enter your address"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>
          </View>

          {/* Medical History */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Medical History</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="medical-outline" size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Enter any relevant medical history"
                value={medicalHistory}
                onChangeText={setMedicalHistory}
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={loading}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 8,
    marginTop: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingVertical: 8,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  spacing: {
    height: 24,
  },
});
