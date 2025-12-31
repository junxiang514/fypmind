import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../../assets/MindAppLogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>MIND</Text>
        <Text style={styles.tagline}>
          Mental Health Intelligence for Nurturing and Development
        </Text>
        <Text style={styles.message}>
          A calmer, smarter way to understand and support your mental wellbeing.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.primaryButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
          <Text style={styles.secondaryText}>
            New here? <Text style={styles.secondaryBold}>Create an account</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 10,
  },
  appName: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2d3a4b',
    letterSpacing: 3,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: '#4f6072',
    textAlign: 'center',
    marginHorizontal: 10,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  message: {
    fontSize: 16,
    color: '#5a6d7b',
    textAlign: 'center',
    marginBottom: 26,
    marginHorizontal: 8,
  },
  primaryButton: {
    backgroundColor: '#5e9cff',
    paddingVertical: 16,
    paddingHorizontal: 44,
    borderRadius: 12,
    shadowColor: '#5e9cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  secondaryText: {
    color: '#4f6072',
    fontSize: 15,
  },
  secondaryBold: {
    color: '#5e9cff',
    fontWeight: 'bold',
  },
});
