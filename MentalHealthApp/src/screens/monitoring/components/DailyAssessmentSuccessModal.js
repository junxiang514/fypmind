import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DailyAssessmentSuccessModal({ visible, onClose }) {
  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.badge}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#16a34a" />
              </View>
              <Text style={styles.title}>Check-in saved</Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <MaterialCommunityIcons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroWrap}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="check-circle-outline" size={44} color="#16a34a" />
            </View>
            <Text style={styles.bigText}>Great job!</Text>
            <Text style={styles.text}>You’ve completed today’s check-in. Keep up the consistency.</Text>
          </View>

          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Done">
              <Text style={styles.primaryText}>Done</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    maxHeight: '84%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 12,
  },
  heroIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 12,
  },
  bigText: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  text: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  footerRow: {
    marginTop: 6,
  },
  primaryBtn: {
    borderRadius: 12,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
});
