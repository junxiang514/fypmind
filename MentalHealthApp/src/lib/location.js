import * as Location from 'expo-location';

export async function getForegroundCoords({ accuracy = Location.Accuracy.Balanced } = {}) {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    const error = new Error('Location permission was not granted.');
    error.code = 'LOCATION_PERMISSION_DENIED';
    throw error;
  }

  const current = await Location.getCurrentPositionAsync({ accuracy });
  return {
    latitude: current.coords.latitude,
    longitude: current.coords.longitude,
  };
}
