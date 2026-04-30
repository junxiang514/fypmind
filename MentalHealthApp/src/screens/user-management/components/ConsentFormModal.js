import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ConsentFormModal({
  visible,
  onClose,
  onConfirm,
  loading = false,
}) {
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtEnd =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - 100; // 100px threshold

    if (isAtEnd) {
      setHasScrolledToEnd(true);
    }
  };

  const handleConfirm = () => {
    if (understood && hasScrolledToEnd) {
      onConfirm();
      setHasScrolledToEnd(false);
      setUnderstood(false);
    }
  };

  const handleClose = () => {
    setHasScrolledToEnd(false);
    setUnderstood(false);
    onClose();
  };

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Consent Form</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#334155" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.contentBox}>
            <Text style={styles.sectionTitle}>Application Terms & Consent</Text>

            <Text style={styles.sectionHeading}>1. About MIND</Text>
            <Text style={styles.sectionText}>
              MIND is a mental health monitoring application designed to help users track their emotional wellbeing, access mental health resources, and connect with healthcare providers. This application is for informational and supportive purposes only.
            </Text>

            <Text style={styles.sectionHeading}>2. Acknowledgment of Use</Text>
            <Text style={styles.sectionText}>
              By using MIND, you acknowledge that:
              {'\n'}• This application is NOT a substitute for professional medical advice, diagnosis, or treatment.
              {'\n'}• Assessment tools provide screening purposes only and should not be relied upon as clinical diagnoses.
              {'\n'}• You should consult a qualified healthcare professional for any health concerns.
            </Text>

            <Text style={styles.sectionHeading}>3. Data Privacy & Security</Text>
            <Text style={styles.sectionText}>
              We take your privacy seriously. Your personal information and assessment data are encrypted and stored securely. We do not share your data with third parties without your consent, except as required by law.
            </Text>

            <Text style={styles.sectionHeading}>4. Location Services & Behavioral Tracking</Text>
            <Text style={styles.sectionText}>
              To provide you with location-based healthcare provider recommendations and relevant local mental health resources, the application may request access to your device location. Your location data is used only within the application and is not shared with third parties without explicit consent.
            </Text>

            <Text style={styles.sectionHeading}>5. User Behavior Analysis & Data Usage</Text>
            <Text style={styles.sectionText}>
              MIND tracks and analyzes your usage patterns, assessment responses, and emotional trends to:
              {'\n'}• Provide personalized mental health recommendations.
              {'\n'}• Identify potential health risks and intervention opportunities.
              {'\n'}• Improve the application's features and user experience.
              {'\n'}• Generate anonymized statistical insights for research purposes.
              {'\n'}
              Your individual data will not be sold. Aggregated, anonymized data may be used for academic research and app improvement, subject to ethical review standards.
            </Text>

            <Text style={styles.sectionHeading}>6. User Responsibilities</Text>
            <Text style={styles.sectionText}>
              You agree to:
              {'\n'}• Provide accurate information during registration and assessments.
              {'\n'}• Use the application responsibly and ethically.
              {'\n'}• Not attempt to breach or misuse the application's security features.
              {'\n'}• Seek professional help in case of mental health emergencies.
            </Text>

            <Text style={styles.sectionHeading}>7. Limitation of Liability</Text>
            <Text style={styles.sectionText}>
              MIND and its developers are not liable for any indirect, incidental, or consequential damages arising from the use or inability to use the application. The application is provided "as-is" without warranties.
            </Text>

            <Text style={styles.sectionHeading}>8. Emergency Support</Text>
            <Text style={styles.sectionText}>
              If you are experiencing a mental health emergency, please:
              {'\n'}• Contact emergency services (911 in the US).
              {'\n'}• Use the Crisis Hotline in your region.
              {'\n'}• Reach out to a trusted healthcare provider or emergency department.
            </Text>

            <Text style={styles.sectionHeading}>9. Consent to Proceed</Text>
            <Text style={styles.sectionText}>
              By checking the box below, you confirm that you have read, understood, and agree to the terms and conditions outlined in this consent form.
            </Text>

            <View style={styles.spacer} />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {!hasScrolledToEnd && (
            <Text style={styles.scrollHint}>
              Please scroll to the bottom to review the complete consent form
            </Text>
          )}

          <View style={styles.checkboxRow}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setUnderstood(!understood)}
              disabled={!hasScrolledToEnd}
            >
              {understood && hasScrolledToEnd && (
                <MaterialCommunityIcons
                  name="checkbox-marked"
                  size={20}
                  color="#2563eb"
                />
              )}
              {!understood && hasScrolledToEnd && (
                <MaterialCommunityIcons
                  name="checkbox-blank-outline"
                  size={20}
                  color="#cbd5e1"
                />
              )}
              {!hasScrolledToEnd && (
                <MaterialCommunityIcons
                  name="checkbox-blank-outline"
                  size={20}
                  color="#e2e8f0"
                />
              )}
            </TouchableOpacity>
            <Text
              style={[
                styles.checkboxLabel,
                !hasScrolledToEnd && styles.checkboxLabelDisabled,
              ]}
            >
              I understand and agree to this consent form
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!understood || !hasScrolledToEnd) &&
                  styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!understood || !hasScrolledToEnd || loading}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? 'Creating Account...' : 'I Agree & Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  contentBox: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 120,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 8,
  },
  spacer: {
    height: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollHint: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    marginTop: 2,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 18,
  },
  checkboxLabelDisabled: {
    color: '#cbd5e1',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#334155',
    fontWeight: '800',
    fontSize: 13,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#cbd5e1',
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
});
