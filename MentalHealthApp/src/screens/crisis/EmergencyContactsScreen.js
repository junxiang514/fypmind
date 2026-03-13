import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';

import { listEmergencyContacts, saveEmergencyContact, deleteEmergencyContact } from '../../lib/emergencyContacts';

export default function EmergencyContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const existing = await listEmergencyContacts();
        setContacts(existing || []);
      } catch (err) {
        Alert.alert('Error', err?.message || 'Failed to load contacts.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChangeField = (index, field, value) => {
    setContacts((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddContact = () => {
    if (contacts.length >= 3) {
      Alert.alert('Limit reached', 'You can only save up to 3 emergency contacts.');
      return;
    }
    setContacts((prev) => [
      ...prev,
      {
        id: null,
        name: '',
        relationship: '',
        phone: '',
        notes: '',
      },
    ]);
  };

  const handleDeleteContact = async (index) => {
    const contact = contacts[index];

    if (contact?.id) {
      try {
        await deleteEmergencyContact(contact.id);
      } catch (err) {
        Alert.alert('Error', err?.message || 'Failed to delete contact.');
        return;
      }
    }

    setContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);

      // Basic validation: all non-empty contacts must have name and phone
      for (const c of contacts) {
        const hasAny = (c.name || c.relationship || c.phone || c.notes)?.toString().trim().length > 0;
        if (!hasAny) continue;
        if (!c.name?.trim() || !c.phone?.trim()) {
          Alert.alert('Missing information', 'Each contact must have at least a name and phone number.');
          setSaving(false);
          return;
        }
      }

      const savedContacts = [];

      for (const c of contacts) {
        const hasAny = (c.name || c.relationship || c.phone || c.notes)?.toString().trim().length > 0;
        if (!hasAny) continue;

        const saved = await saveEmergencyContact({
          id: c.id,
          name: c.name,
          relationship: c.relationship,
          phone: c.phone,
          notes: c.notes,
        });
        savedContacts.push(saved);
      }

      setContacts(savedContacts);
      Alert.alert('Saved', 'Your emergency contacts have been updated.');
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to save contacts.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Emergency Contacts</Text>
        <Text style={styles.subtitle}>
          You can save up to 3 trusted people who may be contacted when you press the SOS button.
        </Text>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {contacts.map((contact, index) => (
              <View key={contact.id || index} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>Contact {index + 1}</Text>
                  <TouchableOpacity onPress={() => handleDeleteContact(index)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={contact.name}
                  onChangeText={(text) => handleChangeField(index, 'name', text)}
                  placeholder="e.g. Mum, Best Friend"
                />

                <Text style={styles.label}>Relationship</Text>
                <TextInput
                  style={styles.input}
                  value={contact.relationship}
                  onChangeText={(text) => handleChangeField(index, 'relationship', text)}
                  placeholder="e.g. Mother, Friend, Partner"
                />

                <Text style={styles.label}>Phone number *</Text>
                <TextInput
                  style={styles.input}
                  value={contact.phone}
                  onChangeText={(text) => handleChangeField(index, 'phone', text)}
                  keyboardType="phone-pad"
                  placeholder="Include country code, e.g. 6012XXXXXXX"
                />

                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  value={contact.notes}
                  onChangeText={(text) => handleChangeField(index, 'notes', text)}
                  placeholder="Any important medical info or instructions."
                  multiline
                />
              </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
              <Text style={styles.addButtonText}>Add another contact</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveAll} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save contacts</Text>
              )}
            </TouchableOpacity>
          </>
        )}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  deleteText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    marginTop: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
