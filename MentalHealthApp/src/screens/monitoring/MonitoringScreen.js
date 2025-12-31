import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MonitoringScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, User</Text>
          <Text style={styles.subGreeting}>How are you feeling today?</Text>
        </View>

        <TouchableOpacity 
          style={[styles.card, styles.assessmentCard]} 
          onPress={() => navigation.navigate('DailyAssessment')}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="sunny" size={32} color="#fff" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Daily Self-Assessment</Text>
            <Text style={styles.cardDescription}>Check in with your mood and feelings.</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, styles.toolsCard]} 
          onPress={() => navigation.navigate('ClinicalTools')}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="clipboard" size={32} color="#fff" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Clinical Assessment Tools</Text>
            <Text style={styles.cardDescription}>Standardized tests for deeper insights.</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, styles.chatCard]} 
          onPress={() => navigation.navigate('AIChat')}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="chatbubbles" size={32} color="#fff" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>AI Chat Box</Text>
            <Text style={styles.cardDescription}>Talk to our AI assistant anytime.</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>"Mental health is not a destination, but a process. It's about how you drive, not where you're going."</Text>
        </View>
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
  header: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assessmentCard: {
    backgroundColor: '#FF9500',
  },
  toolsCard: {
    backgroundColor: '#5856D6',
  },
  chatCard: {
    backgroundColor: '#34C759',
  },
  cardIcon: {
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  quoteContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#555',
    lineHeight: 24,
  },
});
