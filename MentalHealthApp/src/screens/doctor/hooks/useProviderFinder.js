import { useMemo, useState } from 'react';

import { searchProviders } from '../../../lib/providers';
import { getForegroundCoords } from '../../../lib/location';

const SERVICE_TYPE_KEYWORDS = {
  Psychiatrist: ['psychiatrist', 'psychiatry', 'mental health doctor'],
  Therapist: ['therapist', 'therapy', 'psychologist', 'psychotherapy', 'clinical psychologist'],
  Clinic: ['clinic', 'medical center', 'hospital', 'healthcare', 'specialist center', 'centre'],
  Counselor: ['counselor', 'counsellor', 'counseling', 'counselling'],
  'Wellness Center': ['wellness', 'rehab', 'rehabilitation', 'mindfulness', 'wellbeing', 'well-being'],
};

export function useProviderFinder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationWarning, setLocationWarning] = useState(null);
  const [providers, setProviders] = useState([]);
  const [coords, setCoords] = useState(null);
  const [usingMyLocation, setUsingMyLocation] = useState(false);
  const [filters, setFilters] = useState({
    serviceTypes: [],
    openNow: false,
    maxDistance: Infinity,
    minRating: 0,
  });

  const criteria = useMemo(() => ({ coords: usingMyLocation ? coords : null }), [usingMyLocation, coords]);

  const applyFilters = (allProviders) => {
    return allProviders.filter((provider) => {
      // Service Type Filter
      if (filters.serviceTypes.length > 0) {
        const haystack = [
          provider.service_type || '',
          provider.name || '',
          provider.address || '',
        ]
          .join(' ')
          .toLowerCase();

        const matchesType = filters.serviceTypes.some((selectedType) => {
          const keywords = SERVICE_TYPE_KEYWORDS[selectedType] || [selectedType.toLowerCase()];
          return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
        });

        if (!matchesType) return false;
      }

      // Distance Filter
      if (filters.maxDistance !== Infinity && typeof provider.distance_km === 'number') {
        if (provider.distance_km > filters.maxDistance) return false;
      }

      // Open Now Filter
      if (filters.openNow) {
        const statusText = (provider.open_state || '').toLowerCase();
        const isOpen = /\bopen\b/.test(statusText) || /\bcloses?\b/.test(statusText);
        if (!isOpen) return false;
      }

      // Rating Filter
      if (filters.minRating > 0 && typeof provider.rating === 'number') {
        if (provider.rating < filters.minRating) return false;
      }

      return true;
    });
  };

  const filteredProviders = useMemo(() => applyFilters(providers), [providers, filters]);

  const runSearch = async (override = null, { keepExistingError = false } = {}) => {
    try {
      setLoading(true);
      if (!keepExistingError) {
        setError(null);
      }

      const rows = await searchProviders(override ?? criteria);
      setProviders(rows);
    } catch (err) {
      setError(err?.message || 'Failed to load providers.');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshNearby = async () => {
    try {
      setLoading(true);
      setError(null);

      const nextCoords = await getForegroundCoords();
      setCoords(nextCoords);
      setUsingMyLocation(true);
      setLocationWarning(null);

      const rows = await searchProviders({ coords: nextCoords });
      setProviders(rows);
    } catch (err) {
      setUsingMyLocation(false);
      setCoords(null);
      setError(null);
      setProviders([]);
      setLocationWarning(
        err?.message
          ? err.message
          : 'Unable to use your current location.'
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    locationWarning,
    providers: filteredProviders,
    allProviders: providers,
    usingMyLocation,
    filters,
    setFilters,
    refreshNearby,
  };
}
