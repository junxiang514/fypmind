import * as Location from 'expo-location';

export async function getForegroundCoords({ accuracy = Location.Accuracy.Balanced } = {}) {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    const error = new Error('Location permission was not granted.');
    error.code = 'LOCATION_PERMISSION_DENIED';
    throw error;
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    const error = new Error('Location services are disabled on this device.');
    error.code = 'LOCATION_SERVICES_DISABLED';
    throw error;
  }

  // Fast path: use cached location first when available.
  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: 1000 * 60 * 10,
    requiredAccuracy: 2000,
  });

  if (lastKnown?.coords?.latitude != null && lastKnown?.coords?.longitude != null) {
    return {
      latitude: lastKnown.coords.latitude,
      longitude: lastKnown.coords.longitude,
    };
  }

  try {
    const current = await Location.getCurrentPositionAsync({
      accuracy,
      mayShowUserSettingsDialog: true,
    });

    return {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    };
  } catch {
    // Retry once with lower accuracy to support emulators / weak GPS.
    try {
      const retry = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
        mayShowUserSettingsDialog: true,
      });

      return {
        latitude: retry.coords.latitude,
        longitude: retry.coords.longitude,
      };
    } catch {
      const error = new Error('Unable to determine your current location. Please enable GPS and try again.');
      error.code = 'LOCATION_UNAVAILABLE';
      throw error;
    }
  }
}
