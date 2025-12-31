import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const doctors = [
  { id: '1', name: 'Dr. Sarah Johnson', specialty: 'Psychiatrist', rating: 4.9, location: 'Kuala Lumpur', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: '2', name: 'Dr. Michael Chen', specialty: 'Clinical Psychologist', rating: 4.8, location: 'Petaling Jaya', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: '3', name: 'Dr. Emily Davis', specialty: 'Therapist', rating: 4.7, location: 'Subang Jaya', image: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { id: '4', name: 'Dr. David Wilson', specialty: 'Counselor', rating: 4.6, location: 'Shah Alam', image: 'https://randomuser.me/api/portraits/men/85.jpg' },
];

export default function DoctorRecommendationScreen() {
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');

  const specialties = ['All', 'Psychiatrist', 'Clinical Psychologist'];
  const locations = ['All', 'Kuala Lumpur', 'Petaling Jaya'];

  const renderFilter = () => (
    <View style={styles.filterContainer}>
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Specialty:</Text>
        {specialties.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.filterButton, selectedSpecialty === s && styles.filterButtonActive]}
            onPress={() => setSelectedSpecialty(s)}
          >
            <Text style={[styles.filterButtonText, selectedSpecialty === s && styles.filterButtonTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Location:</Text>
        {locations.map(l => (
          <TouchableOpacity
            key={l}
            style={[styles.filterButton, selectedLocation === l && styles.filterButtonActive]}
            onPress={() => setSelectedLocation(l)}
          >
            <Text style={[styles.filterButtonText, selectedLocation === l && styles.filterButtonTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.doctorImage} />
      <View style={styles.cardContent}>
        <Text style={styles.doctorName}>{item.name}</Text>
        <Text style={styles.specialty}>{item.specialty}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>{item.rating}</Text>
          <Text style={styles.location}>• {item.location}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.bookButton}>
        <Text style={styles.bookButtonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={doctors}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search doctors..."
                value={search}
                onChangeText={setSearch}
              />
            </View>
            
            <View style={styles.header}>
              <Text style={styles.title}>Recommended for You</Text>
              <Text style={styles.subtitle}>Top specialists based on your profile.</Text>
            </View>
            {renderFilter()}
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginRight: 8,
  },
  filterButton: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
    marginRight: 8,
  },
  location: {
    fontSize: 14,
    color: '#888',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
