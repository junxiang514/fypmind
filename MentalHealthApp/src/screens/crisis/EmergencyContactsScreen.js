import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';

import { listEmergencyContacts, saveEmergencyContact, deleteEmergencyContact } from '../../lib/emergencyContacts';

export default function EmergencyContactsScreen() {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const existing = await listEmergencyContacts();
        const first = (existing || [])[0] || null;
        setContact(first);
        setIsEditing(!first);
      } catch (err) {
        Alert.alert('Error', err?.message || 'Failed to load contacts.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChangeField = (field, value) => {
    setContact((prev) => ({ ...(prev || {}), [field]: value }));
  };

  const handleAddContact = () => {
    if (contact) {
      Alert.alert('Limit reached', 'You can only save one emergency contact.');
      return;
    }

    setContact({
      id: null,
      name: '',
      relationship: '',
      phone: '',
    });
    setIsEditing(true);
  };

  const handleDeleteContact = async () => {
    if (!contact) return;

    try {
      if (contact?.id) {
        await deleteEmergencyContact(contact.id);
      }

      setContact(null);
      setIsEditing(false);
      Alert.alert('Deleted', 'Emergency contact has been removed.');
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to delete contact.');
    }
  };

  const handleSaveContact = async () => {
    try {
      setSaving(true);

      if (!contact) {
        Alert.alert('Missing information', 'Please add a contact first.');
        return;
      }

      if (!contact.name?.trim() || !contact.phone?.trim()) {
        Alert.alert('Missing information', 'Contact must have at least a name and phone number.');
        return;
      }

      const saved = await saveEmergencyContact({
        id: contact.id,
        name: contact.name,
        relationship: contact.relationship,
        phone: contact.phone,
        notes: '',
      });

      // Verify persisted state by reloading from database
      const refreshed = await listEmergencyContacts();
      const persisted = (refreshed || []).find((c) => c.id === saved.id) || saved;

      setContact(persisted);
      setIsEditing(false);
      Alert.alert('Saved', 'Your emergency contact has been saved to database.');
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to save contact.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Emergency Contacts</Text>
        <Text style={styles.subtitle}>
          Save one trusted person who can be contacted when you press the SOS button.
        </Text>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {!contact ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyTitle}>No emergency contact yet</Text>
                <Text style={styles.emptySubtitle}>Add one trusted person for quick SOS support.</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
                  <Text style={styles.addButtonText}>Add contact</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.cardTitle}>Emergency Contact Information</Text>

                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.readOnlyInput]}
                  value={contact.name || ''}
                  onChangeText={(text) => handleChangeField('name', text)}
                  placeholder="e.g. Mum, Best Friend"
                  editable={isEditing}
                />

                <Text style={styles.label}>Relationship</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.readOnlyInput]}
                  value={contact.relationship || ''}
                  onChangeText={(text) => handleChangeField('relationship', text)}
                  placeholder="e.g. Mother, Friend, Partner"
                  editable={isEditing}
                />

                <Text style={styles.label}>Phone number *</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.readOnlyInput]}
                  value={contact.phone || ''}
                  onChangeText={(text) => handleChangeField('phone', text)}
                  keyboardType="phone-pad"
                  placeholder="Include country code, e.g. 6012XXXXXXX"
                  editable={isEditing}
                />

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => setIsEditing(true)}
                    disabled={isEditing}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDeleteContact}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton, (!isEditing || saving) && styles.saveButtonDisabled]}
                    onPress={handleSaveContact}
                    disabled={!isEditing || saving}
                  >
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 18,
    lineHeight: 22,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4b5563',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 14,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  readOnlyInput: {
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
  },
  addButton: {
    marginTop: 8,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 22,
    alignItems: 'center',
    alignSelf: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  actionRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#E0E7FF',
  },
  editButtonText: {
    color: '#3730A3',
    fontWeight: '700',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#111827',
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
