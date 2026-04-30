import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

import { supabase } from '../../lib/supabase';
import { appAlert } from '../../lib/appAlert';
import ConsentFormModal from './components/ConsentFormModal';

// Password strength calculation
const calculatePasswordStrength = (pwd) => {
  let strength = 0;
  const criteria = {
    hasUpperCase: /[A-Z]/.test(pwd),
    hasLowerCase: /[a-z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    isLongEnough: pwd.length >= 8,
  };

  if (criteria.hasUpperCase) strength += 1;
  if (criteria.hasLowerCase) strength += 1;
  if (criteria.hasNumber) strength += 1;
  if (criteria.hasSymbol) strength += 1;
  if (criteria.isLongEnough) strength += 1;

  const strengthLevel = {
    0: { level: 'Very Weak', color: '#ef4444', percentage: 0 },
    1: { level: 'Weak', color: '#f97316', percentage: 20 },
    2: { level: 'Fair', color: '#eab308', percentage: 40 },
    3: { level: 'Good', color: '#84cc16', percentage: 60 },
    4: { level: 'Strong', color: '#22c55e', percentage: 80 },
    5: { level: 'Very Strong', color: '#16a34a', percentage: 100 },
  };

  return { ...criteria, strength, ...strengthLevel[strength] };
};

// Requirement item component for password criteria
function RequirementItem({ text, met }) {
  return (
    <View style={styles.requirementItem}>
      <Text style={[styles.requirementCheckmark, { color: met ? '#22c55e' : '#cbd5e1' }]}>
        {met ? '✓' : '○'}
      </Text>
      <Text style={[styles.requirementText, { color: met ? '#22c55e' : '#94a3b8' }]}>
        {text}
      </Text>
    </View>
  );
}

export default function RegistrationScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentModalVisible, setConsentModalVisible] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(null);

  const passwordStrength = calculatePasswordStrength(password);

  // Email validation in real-time
  const validateEmail = async (emailValue) => {
    const trimmedEmail = emailValue.trim();
    setEmail(emailValue);

    if (!trimmedEmail) {
      setEmailError('');
      setEmailExists(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError('Invalid email format');
      setEmailExists(false);
      return;
    }

    // Check if email exists in Supabase
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (data) {
        setEmailError('Email already registered');
        setEmailExists(true);
      } else {
        setEmailError('');
        setEmailExists(false);
      }
    } catch (error) {
      console.log('Email check completed');
    }
  };

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // Full name validation
    if (!trimmedName) {
      appAlert('Missing name', 'Please enter your full name', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    if (trimmedName.length < 2) {
      appAlert('Invalid name', 'Full name must be at least 2 characters', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    if (trimmedName.length > 50) {
      appAlert('Invalid name', 'Full name must not exceed 50 characters', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    // Email validation
    if (!trimmedEmail) {
      appAlert('Missing email', 'Please enter your email address', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      appAlert('Invalid email', 'Please enter a valid email address', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    // Check if email already exists
    if (emailExists) {
      appAlert('Email already registered', 'This email is already associated with an account. Please use a different email or login.',
        [
          { text: 'Login', onPress: () => navigation.navigate('Login') },
          { text: 'Cancel', onPress: () => {} }
        ],
        { variant: 'warning' }
      );
      return;
    }

    // Gender validation
    if (!gender) {
      appAlert('Missing gender', 'Please select your gender', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    // Password validation
    if (!password) {
      appAlert('Missing password', 'Please create a password', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    if (password.length < 6) {
      appAlert('Weak password', 'Password must be at least 6 characters', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    if (password.length > 128) {
      appAlert('Invalid password', 'Password must not exceed 128 characters', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    // Check password strength requirements
    if (!passwordStrength.hasUpperCase) {
      appAlert('Weak password', 'Password must contain at least one uppercase letter (A-Z)', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    if (!passwordStrength.hasLowerCase) {
      appAlert('Weak password', 'Password must contain at least one lowercase letter (a-z)', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    if (!passwordStrength.hasNumber) {
      appAlert('Weak password', 'Password must contain at least one number (0-9)', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    if (!passwordStrength.hasSymbol) {
      appAlert('Weak password', 'Password must contain at least one symbol (!@#$%^&*)', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    // Confirm password validation
    if (!confirmPassword) {
      appAlert('Missing confirmation', 'Please confirm your password', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    if (password !== confirmPassword) {
      appAlert('Password mismatch', 'Passwords do not match. Please try again.', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    // Store the pending registration data and show the consent modal
    setPendingRegistration({ name: trimmedName, email: trimmedEmail, gender, password });
    setConsentModalVisible(true);
  };

  const handleConsentConfirm = async () => {
    if (!pendingRegistration) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase.auth.signUp({
        email: pendingRegistration.email,
        password: pendingRegistration.password,
        options: {
          data: { 
            full_name: pendingRegistration.name,
            gender: pendingRegistration.gender,
          },
        },
      });

      if (error) {
        appAlert('Sign up failed', error.message, [{ text: 'OK' }], { variant: 'error' });
        setIsSubmitting(false);
        return;
      }

      // Save additional profile data including gender
      if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: pendingRegistration.name,
            gender: pendingRegistration.gender,
            updated_at: new Date(),
          });

        if (profileError) {
          console.warn('Profile creation warning:', profileError);
        }
      }

      // If email confirmation is enabled, session can be null.
      if (data?.session) {
        appAlert('Success', 'Account created and signed in!', [{ text: 'OK', onPress: () => navigation.replace('Main') }], { variant: 'success' });
      } else {
        appAlert(
          'Success',
          'Account created. Please check your email to confirm your account.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
          { variant: 'success' }
        );
      }
      setConsentModalVisible(false);
      setPendingRegistration(null);
      setName('');
      setEmail('');
      setGender('');
      setPassword('');
      setConfirmPassword('');
    } catch (e) {
      appAlert('Sign up failed', e?.message ?? 'Unexpected error', [{ text: 'OK' }], { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[
              styles.input,
              email && (emailError ? styles.inputError : styles.inputSuccess),
            ]}
            placeholder="Enter your email"
            value={email}
            onChangeText={validateEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError && (
            <Text style={styles.errorText}>
              {emailError === 'Email already registered' ? '⚠ ' : '✕ '}
              {emailError}
            </Text>
          )}
          {email && !emailError && (
            <Text style={styles.successText}>✓ Valid email format</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderContainer}>
            {['Male', 'Female'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.genderButton,
                  gender === g && styles.genderButtonSelected,
                ]}
                onPress={() => setGender(g)}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === g && styles.genderButtonTextSelected,
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          {password && (
            <>
              <View style={styles.strengthContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${passwordStrength.percentage}%`,
                        backgroundColor: passwordStrength.color 
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.level}
                </Text>
              </View>

              <View style={styles.requirementsContainer}>
                <RequirementItem 
                  text="At least one uppercase letter (A-Z)"
                  met={passwordStrength.hasUpperCase}
                />
                <RequirementItem 
                  text="At least one lowercase letter (a-z)"
                  met={passwordStrength.hasLowerCase}
                />
                <RequirementItem 
                  text="At least one number (0-9)"
                  met={passwordStrength.hasNumber}
                />
                <RequirementItem 
                  text="At least one symbol (!@#$%^&*)"
                  met={passwordStrength.hasSymbol}
                />
                <RequirementItem 
                  text="At least 6 characters long"
                  met={password.length >= 6}
                />
              </View>
            </>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={handleRegister} disabled={isSubmitting}>
          <Text style={styles.buttonText}>{isSubmitting ? 'Creating...' : 'Register'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
        </TouchableOpacity>
      </ScrollView>

      <ConsentFormModal
        visible={consentModalVisible}
        onClose={() => {
          setConsentModalVisible(false);
          setPendingRegistration(null);
        }}
        onConfirm={handleConsentConfirm}
        loading={isSubmitting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 48,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#333',
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
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
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
    color: '#666',
    fontSize: 14,
  },
  linkBold: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  strengthContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  requirementsContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementCheckmark: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    width: 20,
  },
  requirementText: {
    fontSize: 12,
    flex: 1,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  genderButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  genderButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inputSuccess: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    fontWeight: '500',
  },
  successText: {
    fontSize: 12,
    color: '#22c55e',
    marginTop: 4,
    fontWeight: '500',
  },
});
