import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { listEmergencyContacts, saveEmergencyContact, deleteEmergencyContact } from '../../lib/emergencyContacts';

const PHONE_PREFIX = '+60';

function normalizeDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function toPhoneLocalPart(phone) {
  const digits = normalizeDigits(phone);
  if (!digits) return '';
  if (digits.startsWith('60')) return digits.slice(2);
  if (digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export default function EmergencyContactsScreen() {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [agreements, setAgreements] = useState({
    shareLocationOnSos: false,
    enableLocationServices: false,
    allowLocationPermission: false,
  });

  const allAgreementsChecked =
    agreements.shareLocationOnSos &&
    agreements.enableLocationServices &&
    agreements.allowLocationPermission;

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
      phone: PHONE_PREFIX,
    });
    setAgreements({
      shareLocationOnSos: false,
      enableLocationServices: false,
      allowLocationPermission: false,
    });
    setIsEditing(true);
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setAgreements({
      shareLocationOnSos: false,
      enableLocationServices: false,
      allowLocationPermission: false,
    });
    setContact((prev) => {
      if (!prev) return prev;
      return prev.phone?.trim() ? prev : { ...prev, phone: PHONE_PREFIX };
    });
  };

  const toggleAgreement = (key) => {
    setAgreements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePhoneLocalChange = (value) => {
    const localDigits = normalizeDigits(value);
    setContact((prev) => ({ ...(prev || {}), phone: `${PHONE_PREFIX}${localDigits}` }));
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

      if (!contact.name?.trim() || !contact.phone?.trim() || !contact.relationship?.trim()) {
        Alert.alert('Missing information', 'Contact must have a name, relationship, and phone number.');
        return;
      }

      if (contact.name.trim().length < 2) {
        Alert.alert('Invalid name', 'Name must be at least 2 characters.');
        return;
      }

      const relationshipText = (contact.relationship || '').trim();
      if (relationshipText.length < 2) {
        Alert.alert('Invalid relationship', 'Relationship must be at least 2 characters.');
        return;
      }
      if (relationshipText.length > 40) {
        Alert.alert('Invalid relationship', 'Relationship is too long (max 40 characters).');
        return;
      }

      const localPhone = toPhoneLocalPart(contact.phone);
      if (!localPhone) {
        Alert.alert('Incomplete phone number', 'Please complete the phone number after +60.');
        return;
      }

      if (!/^\d+$/.test(localPhone)) {
        Alert.alert('Invalid phone number', 'Phone number must contain digits only.');
        return;
      }

      if (localPhone.startsWith('0')) {
        Alert.alert('Invalid phone number', 'Do not include leading 0. Example: +60 123456789');
        return;
      }

      if (localPhone.length < 8 || localPhone.length > 11) {
        Alert.alert('Invalid phone number', 'Please enter a valid number after +60 (8 to 11 digits).');
        return;
      }

      if (!allAgreementsChecked) {
        Alert.alert(
          'Please confirm all checklist items',
          'Before saving, please confirm that you understand SOS will share your location and location services/permission must be enabled.'
        );
        return;
      }

      const normalizedPhone = `${PHONE_PREFIX}${localPhone}`;

      const saved = await saveEmergencyContact({
        id: contact.id,
        name: contact.name,
        relationship: contact.relationship,
        phone: normalizedPhone,
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
        <View style={styles.headerCard}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="shield-checkmark" size={20} color="#1d4ed8" />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Emergency Contacts</Text>
            <Text style={styles.subtitle}>
              Save one trusted person who can be contacted when you press the SOS button.
            </Text>
          </View>
        </View>

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
              <View style={styles.formCard}>
                <Text style={styles.cardTitle}>Emergency Contact Information</Text>

                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.readOnlyInput]}
                  value={contact.name || ''}
                  onChangeText={(text) => handleChangeField('name', text)}
                  placeholder="e.g. Ali, MeiLing , Muthu"
                  editable={isEditing}
                />

                <Text style={styles.label}>Relationship *</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.readOnlyInput]}
                  value={contact.relationship || ''}
                  onChangeText={(text) => handleChangeField('relationship', text)}
                  placeholder="e.g. Mother, Friend, Partner"
                  editable={isEditing}
                />

                <Text style={styles.label}>Phone number *</Text>
                <View style={[styles.phoneRow, !isEditing && styles.readOnlyInput]}>
                  <View style={styles.phonePrefixBox}>
                    <Text style={styles.phonePrefixText}>{PHONE_PREFIX}</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    value={toPhoneLocalPart(contact.phone)}
                    onChangeText={handlePhoneLocalChange}
                    keyboardType="number-pad"
                    placeholder="e.g. 123456789"
                    editable={isEditing}
                    maxLength={11}
                  />
                </View>
                <Text style={styles.phoneHint}>Enter number without starting 0. Example: +60 123456789</Text>

                {isEditing && (
                  <View style={styles.checklistCard}>
                    <Text style={styles.checklistTitle}>Before saving, please confirm:</Text>

                    <TouchableOpacity style={styles.checkRow} onPress={() => toggleAgreement('shareLocationOnSos')}>
                      <Ionicons
                        name={agreements.shareLocationOnSos ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={agreements.shareLocationOnSos ? '#2563EB' : '#6B7280'}
                      />
                      <Text style={styles.checkText}>I understand emergency SOS services will share my current location with this contact when triggered.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.checkRow} onPress={() => toggleAgreement('enableLocationServices')}>
                      <Ionicons
                        name={agreements.enableLocationServices ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={agreements.enableLocationServices ? '#2563EB' : '#6B7280'}
                      />
                      <Text style={styles.checkText}>I will keep location services enabled on my device for SOS location sharing.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.checkRow} onPress={() => toggleAgreement('allowLocationPermission')}>
                      <Ionicons
                        name={agreements.allowLocationPermission ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={agreements.allowLocationPermission ? '#2563EB' : '#6B7280'}
                      />
                      <Text style={styles.checkText}>I agree to allow location permission for MIND application.</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.actionRow}>
                  {contact.id && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={handleStartEditing}
                        disabled={isEditing}
                      >
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDeleteContact}>
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton, (!isEditing || saving) && styles.saveButtonDisabled]}
                    onPress={() => {
                      if (isEditing && !allAgreementsChecked) {
                        Alert.alert(
                          '⚠️ Please agree to all items before saving',
                          'Please confirm all three items below before saving:\n\n✓ SOS location sharing\n✓ Location services enabled\n✓ Location permission allowed'
                        );
                        return;
                      }
                      handleSaveContact();
                    }}
                    disabled={!isEditing || saving}
                  >
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
                  </TouchableOpacity>
                </View>
              </View>
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
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingBottom: 28,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
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
    marginTop: 2,
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
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  phonePrefixBox: {
    minWidth: 58,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#EEF2FF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    alignItems: 'center',
  },
  phonePrefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#312E81',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  phoneHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
  checklistCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checklistTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  checkText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
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
