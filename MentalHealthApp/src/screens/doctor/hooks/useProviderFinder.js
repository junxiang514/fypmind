import { useEffect, useMemo, useState } from 'react';

import { searchProviders } from '../../../lib/providers';
import { getForegroundCoords } from '../../../lib/location';

export function useProviderFinder({ radiusKm = 10 } = {}) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [providers, setProviders] = useState([]);
  const [coords, setCoords] = useState(null);
  const [usingMyLocation, setUsingMyLocation] = useState(false);

  const criteria = useMemo(
    () => ({ query, location, serviceType, coords: usingMyLocation ? coords : null, radiusKm }),
    [query, location, serviceType, usingMyLocation, coords, radiusKm]
  );

  const runSearch = async (override = null) => {
    try {
      setLoading(true);
      setError(null);

      const rows = await searchProviders(override ?? criteria);
      setProviders(rows);
    } catch (err) {
      setError(err?.message || 'Failed to load providers.');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch: try GPS first, otherwise fall back to a simple fetch.
    (async () => {
      try {
        const nextCoords = await getForegroundCoords();
        setCoords(nextCoords);
        setUsingMyLocation(true);
        await runSearch({ query: '', location: '', serviceType: '', coords: nextCoords, radiusKm });
        return;
      } catch {
        // ignore automatic location errors — user can still search manually
      }
      await runSearch({ query: '', location: '', serviceType: '', coords: null, radiusKm });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enableMyLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      const nextCoords = await getForegroundCoords();
      setCoords(nextCoords);
      setUsingMyLocation(true);

      const rows = await searchProviders({ query, location, serviceType, coords: nextCoords, radiusKm });
      setProviders(rows);
    } catch (err) {
      setUsingMyLocation(false);
      setCoords(null);
      setError(err?.message || 'Unable to get your location.');
    } finally {
      setLoading(false);
    }
  };

  const disableMyLocation = () => {
    setUsingMyLocation(false);
    setCoords(null);
    setError(null);
  };

  return {
    query,
    setQuery,
    location,
    setLocation,
    serviceType,
    setServiceType,
    loading,
    error,
    providers,
    usingMyLocation,
    radiusKm,
    runSearch,
    enableMyLocation,
    disableMyLocation,
  };
}
