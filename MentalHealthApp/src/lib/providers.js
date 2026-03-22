const SERPAPI_KEY = process.env.EXPO_PUBLIC_SERPAPI_KEY;
const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';

function extractCityFromAddress(address = '') {
  const parts = String(address)
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (!parts.length) return '';

  const raw = parts.length >= 3 ? parts[parts.length - 3] : parts[parts.length - 1];
  return raw.replace(/^\d{5}\s+/, '').trim();
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

function distanceKm(from, to) {
  const lat1 = Number(from?.latitude);
  const lon1 = Number(from?.longitude);
  const lat2 = Number(to?.latitude);
  const lon2 = Number(to?.longitude);

  if ([lat1, lon1, lat2, lon2].some((v) => Number.isNaN(v))) {
    return null;
  }

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toProviderShape(place = {}) {
  const gps = place?.gps_coordinates || {};
  const lat = gps?.latitude ?? null;
  const lng = gps?.longitude ?? null;

  return {
    id: place?.place_id || `${place?.title || 'provider'}-${lat || ''}-${lng || ''}`,
    name: place?.title || 'Unknown provider',
    service_type: place?.type || 'Healthcare provider',
    city: extractCityFromAddress(place?.address || ''),
    location: extractCityFromAddress(place?.address || ''),
    address: place?.address || '',
    phone: place?.phone || '',
    latitude: lat,
    longitude: lng,
    rating: typeof place?.rating === 'number' ? place.rating : Number(place?.rating) || null,
    website: place?.website || place?.links?.website || '',
    open_state: place?.open_state || place?.hours || '',
    operating_hours: place?.operating_hours || null,
    image_url: place?.thumbnail || place?.image || '',
  };
}

async function serpApiSearch({ limit, coords }) {
  if (!SERPAPI_KEY) {
    throw new Error('SerpApi key is missing. Set EXPO_PUBLIC_SERPAPI_KEY in your environment.');
  }

  const maxResults = Math.min(Number(limit) || 50, 100);
  let allResults = [];
  let startPage = 0;
  const resultsPerPage = 20; // SerpAPI returns max 20 per request

  // Calculate how many pages we need
  const pagesNeeded = Math.ceil(maxResults / resultsPerPage);

  for (let page = 0; page < pagesNeeded; page++) {
    const params = new URLSearchParams({
      engine: 'google_maps',
      type: 'search',
      q: 'mental health clinic in Malaysia',
      api_key: SERPAPI_KEY,
      hl: 'en',
      no_cache: 'true',
      num: String(resultsPerPage),
    });

    if (page > 0) {
      params.set('start', String(page * resultsPerPage));
    }

    // For google_maps engine, ll is the strongest geo signal.
    if (coords?.latitude != null && coords?.longitude != null) {
      params.set('ll', `@${coords.latitude},${coords.longitude},13z`);
    }

    const response = await fetch(`${SERPAPI_BASE_URL}?${params.toString()}`);
    const json = await response.json();

    if (!response.ok || json?.error) {
      // Continue with what we have if a page fails
      if (page === 0) {
        throw new Error(json?.error || 'Failed to fetch providers from SerpApi.');
      }
      break;
    }

    const pageResults = (json?.local_results || []).map(toProviderShape);
    
    // Deduplicate by place_id
    const seenIds = new Set(allResults.map(r => r.id));
    const newResults = pageResults.filter(r => !seenIds.has(r.id));
    allResults = [...allResults, ...newResults];

    // Stop if we got fewer results than expected (no more pages)
    if (pageResults.length < resultsPerPage) {
      break;
    }

    // Stop if we've reached the limit
    if (allResults.length >= maxResults) {
      break;
    }
  }

  return allResults.slice(0, maxResults);
}

export async function searchProviders({
  limit = 50,
  coords,
} = {}) {
  const rows = await serpApiSearch({ limit, coords });

  if (!coords?.latitude || !coords?.longitude) {
    return rows;
  }

  return rows
    .map((row) => ({
      ...row,
      distance_km: distanceKm(coords, { latitude: row?.latitude, longitude: row?.longitude }),
    }))
    .sort((a, b) => {
      const da = a.distance_km;
      const db = b.distance_km;

      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    });
}
