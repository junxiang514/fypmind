import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SERVICE_TYPES = ['Psychiatrist', 'Therapist', 'Clinic', 'Counselor', 'Wellness Center'];
const DISTANCE_OPTIONS = [
  { label: 'Any distance', value: Infinity },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '20 km', value: 20 },
  { label: '50 km', value: 50 },
];

const BLUE_PRIMARY = '#007AFF';
const BLUE_LIGHT = '#E8F4FF';
const BLUE_DARK = '#0051D5';

export function FilterPanel({ filters, onFiltersChange, onClose, visible }) {
  const handleToggleServiceType = (type) => {
    const updated = filters.serviceTypes.includes(type)
      ? filters.serviceTypes.filter((t) => t !== type)
      : [...filters.serviceTypes, type];
    onFiltersChange({ ...filters, serviceTypes: updated });
  };

  const handleToggleOpenNow = () => {
    onFiltersChange({ ...filters, openNow: !filters.openNow });
  };

  const handleSetMaxDistance = (distance) => {
    onFiltersChange({ ...filters, maxDistance: distance });
  };

  const handleSetMinRating = (rating) => {
    onFiltersChange({ ...filters, minRating: rating });
  };

  const activeFiltersCount = [
    filters.serviceTypes.length > 0 ? 1 : 0,
    filters.openNow ? 1 : 0,
    filters.maxDistance !== Infinity ? 1 : 0,
    filters.minRating > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const content = (
    <View style={styles.content}>
      {/* Service Type Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Service Type</Text>
        <View style={styles.tagContainer}>
          {SERVICE_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.tag,
                filters.serviceTypes.includes(type) && styles.tagActive,
              ]}
              onPress={() => handleToggleServiceType(type)}
            >
              <Text
                style={[
                  styles.tagText,
                  filters.serviceTypes.includes(type) && styles.tagTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Distance Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Max Distance</Text>
        <View style={styles.optionContainer}>
          {DISTANCE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                filters.maxDistance === option.value && styles.optionActive,
              ]}
              onPress={() => handleSetMaxDistance(option.value)}
            >
              <View
                style={[
                  styles.radioButton,
                  filters.maxDistance === option.value && styles.radioButtonActive,
                ]}
              />
              <Text
                style={[
                  styles.optionText,
                  filters.maxDistance === option.value && styles.optionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Open Now Filter */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={styles.toggleOption}
          onPress={handleToggleOpenNow}
        >
          <View
            style={[
              styles.checkbox,
              filters.openNow && styles.checkboxActive,
            ]}
          >
            {filters.openNow && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
          <Text style={styles.toggleText}>Open now</Text>
        </TouchableOpacity>
      </View>

      {/* Rating Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Minimum Rating</Text>
        <View style={styles.optionContainer}>
          {[0, 3.5, 4.0, 4.5].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.option,
                filters.minRating === rating && styles.optionActive,
              ]}
              onPress={() => handleSetMinRating(rating)}
            >
              <View
                style={[
                  styles.radioButton,
                  filters.minRating === rating && styles.radioButtonActive,
                ]}
              />
              <Text
                style={[
                  styles.optionText,
                  filters.minRating === rating && styles.optionTextActive,
                ]}
              >
                {rating === 0 ? 'Any rating' : `${rating} stars & up`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <>
      {/* Filter Button */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={onClose}
      >
        <Ionicons name="funnel" size={16} color="#0f172a" />
        <Text style={styles.filterButtonText}>Filters</Text>
        {activeFiltersCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeFiltersCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Providers</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {content}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                onFiltersChange({
                  serviceTypes: [],
                  openNow: false,
                  maxDistance: Infinity,
                  minRating: 0,
                });
              }}
            >
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={onClose}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: BLUE_PRIMARY,
  },
  badge: {
    marginLeft: 6,
    backgroundColor: BLUE_PRIMARY,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollView: {
    flex: 1,
    paddingVertical: 20,
  },
  content: {
    paddingHorizontal: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BLUE_LIGHT,
    borderWidth: 1,
    borderColor: BLUE_PRIMARY,
  },
  tagActive: {
    backgroundColor: BLUE_PRIMARY,
    borderColor: BLUE_PRIMARY,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: BLUE_DARK,
  },
  tagTextActive: {
    color: '#fff',
  },
  optionContainer: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionActive: {
    borderColor: BLUE_PRIMARY,
    backgroundColor: BLUE_LIGHT,
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
  },
  radioButtonActive: {
    borderColor: BLUE_PRIMARY,
    backgroundColor: BLUE_PRIMARY,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  optionTextActive: {
    color: BLUE_PRIMARY,
    fontWeight: '600',
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: BLUE_PRIMARY,
    backgroundColor: BLUE_PRIMARY,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: BLUE_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BLUE_PRIMARY,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: BLUE_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
