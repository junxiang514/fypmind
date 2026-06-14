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

            <Text style={styles.sectionHeading}>3. Personal Data Collection & Notice (PDPA Compliance)</Text>
            <Text style={styles.sectionText}>
              In accordance with the Personal Data Protection Act (PDPA), we notify you that MIND collects and processes your personal data. This personal data includes:
              {'\n'}• Identity Information: Full name, email address, phone number, date of birth, gender, and profile photo.
              {'\n'}• Daily Check-in & Self-Assessment Data: Mood scores, journal notes, wellness indicators, daily assessment responses, and clinical self-assessment questionnaires (e.g. PHQ-9, GAD-7, and clinical test scales).
              {'\n'}• Clinical & Emotional Data: Historical test reports, user progress metrics, and records of interaction with the AI assistant (Lumi).
              {'\n'}• Technical & Location Data: App usage logs, device specifications, and device location coordinates (when authorized).
            </Text>

            <Text style={styles.sectionHeading}>4. Purposes of Data Processing & Disclosure</Text>
            <Text style={styles.sectionText}>
              Your personal data is collected and processed solely for the following purposes:
              {'\n'}• To process daily assessment scores and check-in responses to calculate your wellbeing indexes.
              {'\n'}• To build detailed mental health logs, emotional trend charts, and progress summaries.
              {'\n'}• To deliver personalized mental health insights, summaries, and self-care recommendations.
              {'\n'}• To facilitate matching and recommendations for nearby healthcare providers based on location.
              {'\n'}• To provide supportive counseling and answers via the AI chatbot (Lumi).
              {'\n'}• To maintain and improve application performance and security.
              {'\n'}
              We do not sell your personal data. We do not disclose your personal data to third parties without your explicit consent, except under legal obligations, court orders, or when critical to protect your safety or life in an emergency crisis.
              {'\n\n'}
              <Text style={{ fontWeight: '800', color: '#0f172a' }}>Daily Assessment & Check-In Instructions:</Text>
              {'\n'}To ensure accuracy of the processed emotional trend data, please follow these instructions when checking in:
              {'\n'}• Rate each prompt from 1 to 5 stars based on your daily experience (1: Very low/difficult, 5: Excellent/best).
              {'\n'}• Complete all questions in your active daily check-in set before tapping "Check in now!".
              {'\n'}• Use the customize or refresh tools at the top of the assessment screen to adjust tracking categories (e.g. sleep, stress, energy) or get a new set of questions.
            </Text>

            <Text style={styles.sectionHeading}>5. Data Access, Correction & Consent Withdrawal</Text>
            <Text style={styles.sectionText}>
              Under the PDPA, you retain full rights over your personal data, including:
              {'\n'}• Right of Access: You have the right to request a copy of the personal data we store about you.
              {'\n'}• Right to Correction: You can request updates or corrections to any inaccurate or incomplete personal data via your profile or by contacting us.
              {'\n'}• Right of Withdrawal: You may withdraw your consent to data processing at any time. Note that withdrawing consent may limit our ability to provide certain personalized features (such as AI Chat or Provider recommendations).
              {'\n'}
              To exercise these rights, make inquiries, or register data protection complaints, you can contact our designated Data Protection Officer (DPO).
            </Text>

            <Text style={styles.sectionHeading}>5a. Data Security & Retention</Text>
            <Text style={styles.sectionText}>
              We employ strict technical and organizational measures to safeguard your personal data against loss, misuse, or unauthorized access. Your data is encrypted in transit and at rest. We only retain your personal data for as long as your user account remains active, or as required by clinical safety policies and relevant legal data retention laws.
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
