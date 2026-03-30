import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function StarsPreview({ filled }) {
  return (
    <View style={styles.starsPreviewRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <MaterialCommunityIcons
          key={n}
          name={n <= filled ? 'star' : 'star-outline'}
          size={22}
          color={n <= filled ? styles.starFilled.color : styles.starEmpty.color}
        />
      ))}
    </View>
  );
}

export default function DailyAssessmentHelpModal({ visible, onClose }) {
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (visible) setPageIndex(0);
  }, [visible]);

  const pages = useMemo(() => ([
    {
      key: 'purpose',
      title: 'Purpose',
      body: (
        <>
          <Text style={styles.text}>
            This daily assessment helps you track your mental wellbeing over time.
          </Text>
          <Text style={styles.text}>
            By checking in consistently, you can notice patterns (for example: sleep, stress, anxiety, focus, social connection, self-care)
            and understand what affects your day-to-day wellbeing.
          </Text>
          <Text style={styles.text}>
            Your entries can also help you reflect on progress, and if you choose, make it easier to discuss what you’re experiencing with a
            counsellor or doctor.
          </Text>
        </>
      ),
    },
    {
      key: 'stars',
      title: 'Star Rating',
      body: (
        <>
          <Text style={styles.text}>
            For each question, tap 1–5 stars on the right.
          </Text>
          <View style={styles.legend}>
            <View style={styles.legendRow}>
              <StarsPreview filled={1} />
              <Text style={styles.legendText}>1 — Very low / very difficult</Text>
            </View>
            <View style={styles.legendRow}>
              <StarsPreview filled={2} />
              <Text style={styles.legendText}>2 — Low</Text>
            </View>
            <View style={styles.legendRow}>
              <StarsPreview filled={3} />
              <Text style={styles.legendText}>3 — Neutral / average</Text>
            </View>
            <View style={styles.legendRow}>
              <StarsPreview filled={4} />
              <Text style={styles.legendText}>4 — Good</Text>
            </View>
            <View style={styles.legendRow}>
              <StarsPreview filled={5} />
              <Text style={styles.legendText}>5 — Excellent / best</Text>
            </View>
          </View>
          <Text style={styles.text}>
            Try to answer all questions before saving.
          </Text>
        </>
      ),
    },
    {
      key: 'refresh-save',
      title: 'Customize, Refresh & Save',
      body: (
        <>
          <View style={styles.tipRow}>
            <View style={styles.tipIcon}>
              <MaterialCommunityIcons name="tune-variant" size={18} color="#334155" />
            </View>
            <Text style={[styles.text, styles.tipText]}>
              Tap the Customize button to set how many questions you want per check-in (minimum 3) and pick your preferred categories.
              If you don’t select any categories, you’ll get questions from all categories.
            </Text>
          </View>

          <View style={styles.tipRow}>
            <View style={styles.tipIcon}>
              <MaterialCommunityIcons name="shuffle-variant" size={18} color="#1d4ed8" />
            </View>
            <Text style={[styles.text, styles.tipText]}>
              Tap “Refresh” to get a different set of questions for today. Refreshing will replace the current questions and clear your selected
              stars.
            </Text>
          </View>
          <View style={styles.tipRow}>
            <View style={styles.tipIcon}>
              <MaterialCommunityIcons name="content-save-outline" size={18} color="#0f172a" />
            </View>
            <Text style={[styles.text, styles.tipText]}>
              When you’re done, tap “Check-in Now!” to record today’s check-in.
            </Text>
          </View>
        </>
      ),
    },
  ]), []);

  const safeIndex = Math.max(0, Math.min(pages.length - 1, pageIndex));
  const page = pages[safeIndex];
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === pages.length - 1;

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.badge}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={18} color="#0f172a" />
              </View>
              <Text style={styles.title}>Daily Assessment</Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.pageHeaderRow}>
            <Text style={styles.subTitle}>{page.title}</Text>
            <Text style={styles.pageIndicator}>{safeIndex + 1}/{pages.length}</Text>
          </View>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {page.body}
          </ScrollView>

          <View style={styles.footerRow}>
            {!isFirst && (
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => setPageIndex((i) => Math.max(0, i - 1))}
              >
                <Text style={styles.navBtnText}>Previous</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.navBtnPrimary, isFirst && styles.navBtnPrimaryFull]}
              onPress={() => {
                if (isLast) onClose?.();
                else setPageIndex((i) => Math.min(pages.length - 1, i + 1));
              }}
            >
              <Text style={styles.navBtnPrimaryText}>{isLast ? 'Done' : 'Next'}</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxHeight: '82%',
    overflow: 'hidden',
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
    fontSize: 20,
    fontWeight: '800',
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
  subTitle: {
    marginTop: 0,
    marginBottom: 0,
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  text: {
    color: '#334155',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  legend: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  legendText: {
    flex: 1,
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
  },
  starsPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    width: 110,
  },
  starFilled: {
    color: '#f59e0b',
  },
  starEmpty: {
    color: '#cbd5e1',
  },
  okBtn: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    alignItems: 'center',
  },
  okText: {
    color: '#fff',
    fontWeight: '800',
  },

  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pageIndicator: {
    color: '#64748b',
    fontWeight: '800',
    fontSize: 14,
  },
  bodyScroll: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  bodyScrollContent: {
    paddingBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  navBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    paddingVertical: 12,
    alignItems: 'center',
  },
  navBtnText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 16,
  },
  navBtnPrimary: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    alignItems: 'center',
  },
  navBtnPrimaryFull: {
    flex: 2,
  },
  navBtnPrimaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipText: {
    flex: 1,
  },
  tipIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 2,
  },
});
