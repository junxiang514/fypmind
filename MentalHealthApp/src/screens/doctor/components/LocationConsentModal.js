import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LocationConsentModal({
  visible,
  dontShowAgain,
  onToggleDontShowAgain,
  onAllow,
  onNotNow,
  onClose,
}) {
  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onClose || onNotNow}>
      <Pressable style={styles.overlay} onPress={onClose || onNotNow}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.headerRow}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="location" size={18} color="#1d4ed8" />
            </View>
            <Text style={styles.title}>Allow location access</Text>
          </View>

          <Text style={styles.bodyText}>
            We use your location only to find nearby healthcare providers.
          </Text>

          <TouchableOpacity style={styles.checkRow} onPress={onToggleDontShowAgain}>
            <Ionicons
              name={dontShowAgain ? 'checkbox' : 'square-outline'}
              size={20}
              color={dontShowAgain ? '#2563eb' : '#64748b'}
            />
            <Text style={styles.checkText}>Allow automatically next time (don’t show again)</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onNotNow}>
              <Text style={styles.secondaryBtnText}>Not now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={onAllow}>
              <Text style={styles.primaryBtnText}>Allow</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#334155',
    marginBottom: 14,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 6,
  },
  checkText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    backgroundColor: '#f8fafc',
  },
  secondaryBtnText: {
    color: '#334155',
    fontWeight: '800',
    fontSize: 14,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    backgroundColor: '#2563eb',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});
