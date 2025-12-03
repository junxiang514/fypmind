import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DailyAssessmentScreen({ navigation }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [notes, setNotes] = useState('');

  const moods = [
    { id: 1, icon: 'happy', label: 'Great', color: '#4CD964' },
    { id: 2, icon: 'thumbs-up', label: 'Good', color: '#34AADC' },
    { id: 3, icon: 'remove', label: 'Okay', color: '#FFCC00' },
    { id: 4, icon: 'sad', label: 'Bad', color: '#FF9500' },
    { id: 5, icon: 'thunderstorm', label: 'Terrible', color: '#FF3B30' },
  ];

  const handleSubmit = () => {
    if (!selectedMood) {
      Alert.alert('Please select a mood');
      return;
    }
    Alert.alert('Assessment Saved', 'Thank you for checking in!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.question}>How are you feeling right now?</Text>
        
        <View style={styles.moodContainer}>
          {moods.map((mood) => (
            <TouchableOpacity 
              key={mood.id} 
              style={[
                styles.moodButton, 
                selectedMood === mood.id && { backgroundColor: mood.color, borderColor: mood.color }
              ]}
              onPress={() => setSelectedMood(mood.id)}
            >
              <Ionicons 
                name={mood.icon} 
                size={32} 
                color={selectedMood === mood.id ? '#fff' : mood.color} 
              />
              <Text style={[
                styles.moodLabel,
                selectedMood === mood.id && { color: '#fff' }
              ]}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Any thoughts or notes?</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          placeholder="Write down your thoughts..."
          value={notes}
          onChangeText={setNotes}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Save Entry</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
  },
  question: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  moodButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    width: 60,
  },
  moodLabel: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 120,
    marginBottom: 30,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
