import { supabase } from './supabase';

// Expected table: providers
// Recommended columns (you can adjust the select list to match your schema):
// id, name, service_type, location, address, phone, latitude, longitude, rating, website
export async function searchProviders({
  query,
  location,
  serviceType,
  limit = 25,
  coords,
  radiusKm = 10,
} = {}) {
  // If coordinates are provided, prefer the RPC (distance + radius filtering).
  if (coords?.latitude != null && coords?.longitude != null) {
    const { data, error } = await supabase.rpc('search_providers_nearby', {
      p_lat: coords.latitude,
      p_lng: coords.longitude,
      p_radius_km: radiusKm,
      p_query: (query ?? '').trim(),
      p_location: (location ?? '').trim(),
      p_service_type: (serviceType ?? '').trim(),
      p_limit: limit,
    });

    // If the RPC isn't created yet, fall back to the basic table query.
    if (!error) return data ?? [];
  }

  let request = supabase
    .from('providers')
    .select('id, name, service_type, location, address, phone, latitude, longitude, rating, website')
    .order('name', { ascending: true })
    .limit(limit);

  const trimmedQuery = (query ?? '').trim();
  const trimmedLocation = (location ?? '').trim();
  const trimmedServiceType = (serviceType ?? '').trim();

  if (trimmedQuery) {
    request = request.ilike('name', `%${trimmedQuery}%`);
  }

  if (trimmedLocation) {
    // If your schema uses city/state fields instead, change this to match.
    request = request.ilike('location', `%${trimmedLocation}%`);
  }

  if (trimmedServiceType) {
    request = request.ilike('service_type', `%${trimmedServiceType}%`);
  }

  const { data, error } = await request;
  if (error) throw error;

  return data ?? [];
}
