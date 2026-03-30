import { Linking, Platform } from 'react-native';
import { appAlert } from './appAlert';

export async function openDirections({ latitude, longitude, address, label = 'Destination' } = {}) {
  let destination = '';

  if (typeof latitude === 'number' && typeof longitude === 'number') {
    destination = `${latitude},${longitude}`;
  } else if (latitude && longitude) {
    destination = `${latitude},${longitude}`;
  } else if (address) {
    destination = encodeURIComponent(address);
  }

  if (!destination) {
    appAlert('Missing location', 'This item does not have an address or coordinates.', [{ text: 'OK' }], { variant: 'warning' });
    return;
  }

  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=&travelmode=driving`;
  const iosUrl = address
    ? `maps:0,0?q=${encodeURIComponent(label)}@${destination}`
    : `maps:0,0?q=${destination}`;

  try {
    const url = Platform.OS === 'ios' ? iosUrl : googleUrl;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      await Linking.openURL(googleUrl);
      return;
    }
    await Linking.openURL(url);
  } catch {
    appAlert('Unable to open maps', 'Please check your internet connection or try again.', [{ text: 'OK' }], { variant: 'error' });
  }
}
