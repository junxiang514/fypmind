import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ClinicalToolsInfoModal({ visible, onClose, onDontRemindAgain, loading = false, showDontRemind = false }) {
  const [dontRemind, setDontRemind] = useState(false);
  const [readAndUnderstood, setReadAndUnderstood] = useState(false);

  const handleClose = async () => {
    if (showDontRemind && readAndUnderstood && dontRemind) {
      await onDontRemindAgain();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.infoModalContent}>
          <View style={styles.infoModalHeader}>
            <Ionicons name="information-circle" size={28} color="#1d4ed8" />
            <Text style={styles.infoModalTitle}>About Clinical Tools</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.infoModalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>🎯 Objective & Purpose</Text>
              <Text style={styles.infoSectionText}>
                Clinical tools provide standardized mental health assessments designed to help you understand your emotional wellbeing. These questionnaires measure various dimensions of mental health through evidence-based frameworks.
              </Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>✓ Official Standards</Text>
              <Text style={styles.infoSectionText}>
                All questionnaires in MIND are designed and validated by official mental health authorities and research institutions. Each tool follows rigorous scientific standards for accuracy and reliability.
              </Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>📋 Important Disclaimer</Text>
              <Text style={styles.infoSectionText}>
                Results are provided for informational and self-reflection purposes only. They are not diagnostic or medical advice. Please consult with a qualified mental health professional for:
              </Text>
              <View style={styles.disclaimerList}>
                <Text style={styles.disclaimerItem}>• Proper diagnosis and interpretation</Text>
                <Text style={styles.disclaimerItem}>• Personalized treatment recommendations</Text>
                <Text style={styles.disclaimerItem}>• Crisis or emergency situations</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>💡 How to Use</Text>
              <Text style={styles.infoSectionText}>
                Answer each question honestly based on your experience. Your results will be saved for reference. Review trends over time and share results with your healthcare provider if needed.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.infoModalFooter}>
            {showDontRemind && (
              <>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setReadAndUnderstood(!readAndUnderstood)}
                >
                  <Ionicons
                    name={readAndUnderstood ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={readAndUnderstood ? '#1d4ed8' : '#9CA3AF'}
                  />
                  <Text style={styles.checkboxText}>I have read and understand all information about clinical tools</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setDontRemind(!dontRemind)}
                >
                  <Ionicons
                    name={dontRemind ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={dontRemind ? '#1d4ed8' : '#9CA3AF'}
                  />
                  <Text style={styles.checkboxText}>Don't remind me again</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={[styles.infoModalCloseButton, showDontRemind && !readAndUnderstood && styles.infoModalCloseButtonDisabled]}
              onPress={handleClose}
              disabled={loading || (showDontRemind && !readAndUnderstood)}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.infoModalCloseButtonText}>Got it</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  infoModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    flexDirection: 'column',
  },
  infoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  infoModalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: 8,
  },
  infoModalBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  infoSection: {
    marginBottom: 18,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  infoSectionText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 23,
  },
  disclaimerList: {
    marginTop: 8,
    marginLeft: 4,
  },
  disclaimerItem: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 23,
    marginBottom: 4,
  },
  infoModalFooter: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  checkboxText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  infoModalCloseButton: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  infoModalCloseButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  infoModalCloseButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
