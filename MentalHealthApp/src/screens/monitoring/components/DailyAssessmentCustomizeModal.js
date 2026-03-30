import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function clampInt(value, min, max) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export default function DailyAssessmentCustomizeModal({
  visible,
  initialCount,
  initialCategories,
  categories,
  minCount = 3,
  maxCount = 12,
  onClose,
  onApply,
}) {
  const min = useMemo(() => Math.max(3, Number(minCount) || 3), [minCount]);
  const max = useMemo(() => Math.max(min, Number(maxCount) || min), [maxCount, min]);

  const allCategoryNames = useMemo(
    () => (categories || []).map((x) => String(x?.name || '')).filter(Boolean),
    [categories]
  );

  const computeSelected = (initial, allNames) => {
    const init = Array.isArray(initial) && initial.length ? initial : allNames;
    return new Set((init || []).map((x) => String(x)));
  };

  const [count, setCount] = useState(clampInt(initialCount ?? min, min, max));
  const [selected, setSelected] = useState(() => computeSelected(initialCategories, allCategoryNames));

  useEffect(() => {
    if (!visible) return;
    setCount(clampInt(initialCount ?? min, min, max));
    setSelected(computeSelected(initialCategories, allCategoryNames));
  }, [visible, initialCount, initialCategories, min, max, allCategoryNames]);

  const canDec = count > min;
  const canInc = count < max;

  const toggleCategory = (categoryName) => {
    const key = String(categoryName);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const canToggleAll = allCategoryNames.length > 0;
  const isAllSelected = canToggleAll && selected.size === allCategoryNames.length;
  const isNoneSelected = !selected.size;
  const isPartialSelected = canToggleAll && !isAllSelected && !isNoneSelected;

  const toggleAll = () => {
    setSelected((prev) => {
      const allSelected = allCategoryNames.length > 0 && prev.size === allCategoryNames.length;
      return allSelected ? new Set() : new Set(allCategoryNames);
    });
  };

  const selectedList = useMemo(() => Array.from(selected.values()), [selected]);
  const appliedCategories = useMemo(() => {
    // Persist "no preference" when none/all are selected.
    // This keeps behavior consistent ("all categories") and future-proofs when new categories are added.
    if (isAllSelected) return [];
    return selectedList;
  }, [isAllSelected, selectedList]);

  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.badge}>
                <MaterialCommunityIcons name="tune-variant" size={18} color="#0f172a" />
              </View>
              <Text style={styles.title}>Customize</Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Questions per check-in</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              onPress={() => setCount((c) => clampInt(c - 1, min, max))}
              disabled={!canDec}
              style={[styles.stepBtn, !canDec && styles.stepBtnDisabled]}
            >
              <MaterialCommunityIcons name="minus" size={20} color={canDec ? '#0f172a' : '#94a3b8'} />
            </TouchableOpacity>

            <View style={styles.countPill}>
              <Text style={styles.countText}>{count}</Text>
              <Text style={styles.countHint}>questions</Text>
            </View>

            <TouchableOpacity
              onPress={() => setCount((c) => clampInt(c + 1, min, max))}
              disabled={!canInc}
              style={[styles.stepBtn, !canInc && styles.stepBtnDisabled]}
            >
              <MaterialCommunityIcons name="plus" size={20} color={canInc ? '#0f172a' : '#94a3b8'} />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Preferred categories</Text>
            <TouchableOpacity
              onPress={toggleAll}
              disabled={!canToggleAll}
              accessibilityRole="button"
              accessibilityLabel={isAllSelected ? 'Deselect all categories' : 'Select all categories'}
              style={[styles.selectAllBtn, !canToggleAll && styles.selectAllBtnDisabled]}
            >
              <MaterialCommunityIcons
                name={
                  isAllSelected
                    ? 'check-all'
                    : isPartialSelected
                      ? 'minus-box'
                      : 'checkbox-blank-outline'
                }
                size={16}
                color={canToggleAll ? '#0f172a' : '#94a3b8'}
              />
              <Text style={[styles.selectAllText, !canToggleAll && styles.selectAllTextDisabled]}>
                {isAllSelected ? 'Deselect all' : 'Select all'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>Choose at least 3 categories (or keep all selected).</Text>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {(categories || []).map((item) => {
              const name = String(item?.name || '');
              const isOn = selected.has(name);

              return (
                <TouchableOpacity key={name} style={styles.row} onPress={() => toggleCategory(name)}>
                  <View style={[styles.rowIcon, { backgroundColor: item.lightBg || '#f1f5f9', borderColor: item.lightBg || '#f1f5f9' }]}>
                    <MaterialCommunityIcons name={item.icon || 'help-circle'} size={18} color={item.color || '#64748b'} />
                  </View>
                  <Text style={styles.rowText}>{name}</Text>

                  <View style={[styles.checkWrap, isOn && styles.checkWrapOn]}>
                    {isOn ? (
                      <MaterialCommunityIcons name="check" size={16} color="#fff" />
                    ) : (
                      <MaterialCommunityIcons name="checkbox-blank-outline" size={18} color="#cbd5e1" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                const minSelected = 3;
                if (selected.size < minSelected) {
                  Alert.alert(
                    'Select more categories',
                    `Please choose at least ${minSelected} categories.`,
                    [{ text: 'OK' }]
                  );
                  return;
                }

                onApply?.({ count, categories: appliedCategories });
              }}
            >
              <Text style={styles.applyText}>Apply</Text>
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
    fontSize: 18,
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectAllBtnDisabled: {
    opacity: 0.55,
  },
  selectAllText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 12,
  },
  selectAllTextDisabled: {
    color: '#64748b',
  },
  hintText: {
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  stepBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepBtnDisabled: {
    opacity: 0.7,
  },
  countPill: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 30,
  },
  countHint: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
  },
  list: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginBottom: 14,
  },
  listContent: {
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  checkWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkWrapOn: {
    backgroundColor: '#007AFF',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 16,
  },
  applyBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
});
