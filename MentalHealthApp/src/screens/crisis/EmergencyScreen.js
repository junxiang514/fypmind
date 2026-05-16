import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

import { fetchEmergencyContact } from '../../lib/emergencyContacts';
import { getForegroundCoords } from '../../lib/location';
import { appAlert } from '../../lib/appAlert';

export default function EmergencyScreen({ navigation }) {
  const isFocused = useIsFocused();
  const [contact, setContact] = useState(null);
  const [loadingContact, setLoadingContact] = useState(false);

  const loadContact = async () => {
    try {
      setLoadingContact(true);
      const existing = await fetchEmergencyContact();
      setContact(existing);
    } catch (err) {
      // Show a soft error but do not block the screen
      console.warn('Failed to load emergency contact', err);
    } finally {
      setLoadingContact(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadContact();
    }
  }, [isFocused]);

  const handleCall = async (number) => {
    const cleaned = (number || '').replace(/[^0-9+]/g, '');
    if (!cleaned) {
      appAlert('Cannot place call', 'Phone number is not valid.', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    const url = `tel:${cleaned}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        appAlert('Cannot place call', 'Calling is not supported on this device.', [{ text: 'OK' }], { variant: 'error' });
        return;
      }
      await Linking.openURL(url);
    } catch (err) {
      appAlert('Cannot place call', 'Something went wrong while trying to start the call.', [{ text: 'OK' }], { variant: 'error' });
    }
  };

  const openWhatsAppToContact = async () => {
    if (!contact?.phone) {
      appAlert('No emergency contact', 'Please set an emergency contact first.', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    const digitsOnly = contact.phone.replace(/[^0-9]/g, '');
    if (!digitsOnly) {
      appAlert('Invalid phone number', 'Please update the emergency contact phone number.', [{ text: 'OK' }], { variant: 'warning' });
      return;
    }

    let coords = null;
    try {
      coords = await getForegroundCoords();
    } catch (err) {
      // Location might be denied; we will still send the SOS without a map link.
      console.warn('Unable to get location for SOS', err);
    }

    const mapUrl = coords
      ? `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`
      : null;

    const lines = [
      '🚨 SOS Alert from MIND application',
      `Hi ${contact.name},I'm in panic and I need some support right now. Please check on me as soon as possible. 🙏`,
      mapUrl ? `📍 My current location: ${mapUrl}` : '📍 I could not share my live location from this device.',
      contact?.name ? `👤 Emergency contact: ${contact.name}${contact.relationship ? ` (${contact.relationship})` : ''}` : undefined,
      '🤍 Thank you for being here for me.',
      '*This is an automated SOS message from MIND application.*',
    ].filter(Boolean);

    const message = encodeURIComponent(lines.join('\n'));
    const waUrl = `whatsapp://send?phone=${digitsOnly}&text=${message}`;
    const waFallback = `https://wa.me/${digitsOnly}?text=${message}`;

    try {
      const supported = await Linking.canOpenURL(waUrl);
      if (supported) {
        await Linking.openURL(waUrl);
      } else {
        await Linking.openURL(waFallback);
      }
    } catch (err) {
      appAlert('Unable to open WhatsApp', 'Please check that WhatsApp is installed and try again.', [{ text: 'OK' }], { variant: 'error' });
    }
  };

  const handleSOS = () => {
    appAlert(
      'Emergency SOS',
      contact?.name
        ? `Send an SOS WhatsApp message to ${contact.name}?`
        : 'Send an SOS WhatsApp message to your emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          style: 'destructive',
          onPress: () => {
            openWhatsAppToContact();
          },
        },
      ],
      { variant: 'warning' }
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

        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => navigation.navigate('EmergencyContacts')}
        >
          <Ionicons name="person" size={18} color="#111827" />
          <Text style={styles.manageButtonText}>Customise emergency contact</Text>
        </TouchableOpacity>

        <View style={styles.contactPreview}>
          <Text style={styles.contactPreviewTitle}>Current emergency contact</Text>
          {loadingContact ? (
            <Text style={styles.contactPreviewText}>Loading...</Text>
          ) : contact ? (
            <>
              <Text style={styles.contactPreviewText}>
                {contact.name} {contact.relationship ? `(${contact.relationship})` : ''}
              </Text>
              <Text style={styles.contactPreviewPhone}>{contact.phone}</Text>
              {!!contact.notes && (
                <Text style={styles.contactPreviewNotes} numberOfLines={2}>
                  {contact.notes}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.contactPreviewText}>No contact set yet. Please add one.</Text>
          )}
        </View>

        <View style={styles.infoContainer}>

          <View style={styles.infoItem}>
            <Ionicons name="call" size={24} color="#333" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Talian Kasih</Text>
              <Text style={styles.infoSubtitle}>24/7 for emotional support</Text>
            </View>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall('15999')}
            >
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="call" size={24} color="#333" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>HEAL</Text>
              <Text style={styles.infoSubtitle}>By Ministry of Health (KKM)</Text>
            </View>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall('15555')}
            >
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="call" size={24} color="#333" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Emergency Services (999)</Text>
              <Text style={styles.infoSubtitle}>MERS Malaysia</Text>
            </View>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall('999')}
            >
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
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  manageButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  contactPreview: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 24,
  },
  contactPreviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 4,
  },
  contactPreviewText: {
    fontSize: 14,
    color: '#111827',
  },
  contactPreviewPhone: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  contactPreviewNotes: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
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
