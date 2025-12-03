import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EmergencyScreen() {
  const handleSOS = () => {
    Alert.alert(
      "Emergency SOS",
      "Are you sure you want to call emergency services?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call 999", onPress: () => console.log("Calling 999...") }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Emergency Crisis</Text>
        <Text style={styles.subtitle}>If you are in immediate danger, please press the button below.</Text>

        <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
          <View style={styles.sosInnerCircle}>
            <Text style={styles.sosText}>SOS</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="call" size={24} color="#333" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Befrienders KL</Text>
              <Text style={styles.infoSubtitle}>03-7627 2929 (24/7)</Text>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="call" size={24} color="#333" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Talian Kasih</Text>
              <Text style={styles.infoSubtitle}>15999 (24/7)</Text>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  sosInnerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  sosText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoContainer: {
    width: '100%',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 16,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  callButton: {
    backgroundColor: '#34C759',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  callButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
