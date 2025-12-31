import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);

      if (error) {
        Alert.alert('Request failed', error.message);
        return;
      }

      Alert.alert('Email sent', 'Check your email for a password reset link.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Request failed', e?.message ?? 'Unexpected error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot your password?</Text>
      <Text style={styles.subtitle}>Enter your email and we’ll send a reset link.</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={handleSendReset} disabled={isSubmitting}>
        <Text style={styles.buttonText}>{isSubmitting ? 'Sending...' : 'Send reset link'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2d3a4b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#5a6d7b',
    marginBottom: 22,
  },
  label: {
    fontSize: 14,
    color: '#2d3a4b',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#5e9cff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    textAlign: 'center',
    color: '#5e9cff',
    fontSize: 14,
    fontWeight: '600',
  },
});
