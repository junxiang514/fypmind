import React, { useEffect, useRef, useState } from 'react';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Image, Animated } from 'react-native';

import { supabase } from '../../lib/supabase';



export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, cardTranslateY]);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        Alert.alert('Login failed', error.message);
        return;
      }

      if (data?.session) {
        navigation.replace('Main');
      } else {
        Alert.alert('Login', 'Signed in, but no session was returned.');
      }
    } catch (e) {
      Alert.alert('Login failed', e?.message ?? 'Unexpected error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/MindAppLogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>MIND</Text>
        <Text style={styles.tagline}>Mental Health Intelligence for Nurturing and Development</Text>
      </View>
      <Text style={styles.welcome}>Welcome Back</Text>
      <Text style={styles.motivation}>
        "Nurture your mind, empower your life."
      </Text>
      <Animated.View
        style={[
          styles.card,
          {
            opacity: cardOpacity,
            transform: [{ translateY: cardTranslateY }],
          },
        ]}
      >
        <Text style={styles.subtitle}>Sign in to continue</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#b0b0b0"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#b0b0b0"
          />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotPasswordButton}>
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={handleLogin} disabled={isSubmitting}>
          <Text style={styles.buttonText}>{isSubmitting ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Register</Text></Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2d3a4b',
    letterSpacing: 2,
    marginBottom: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#4f6072',
    textAlign: 'center',
    marginBottom: 12,
    marginHorizontal: 16,
    fontStyle: 'italic',
  },
  welcome: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2d3a4b',
    textAlign: 'center',
    marginBottom: 2,
    marginTop: 8,
  },
  motivation: {
    fontSize: 16,
    color: '#5a6d7b',
    textAlign: 'center',
    marginBottom: 18,
    fontStyle: 'italic',
    marginHorizontal: 24,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    padding: 28,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#4f6072',
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    color: '#2d3a4b',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#b0b0b0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f7fafd',
    color: '#2d3a4b',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: '#5e9cff',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#5e9cff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 8,
    shadowColor: '#5e9cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  linkText: {
    textAlign: 'center',
    color: '#4f6072',
    fontSize: 15,
  },
  linkBold: {
    color: '#5e9cff',
    fontWeight: 'bold',
  },
});
