import { Alert } from 'react-native';

export const ALERT_VARIANTS = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  error: 'error',
};

export const ALERT_THEME = {
  success: { icon: '✅', fallbackTitle: 'Success' },
  info: { icon: 'ℹ️', fallbackTitle: 'Info' },
  warning: { icon: '⚠️', fallbackTitle: 'Warning' },
  error: { icon: '❌', fallbackTitle: 'Error' },
};

function resolveVariant(variant) {
  if (variant && ALERT_THEME[variant]) return variant;
  return ALERT_VARIANTS.info;
}

function getStyledTitle({ title, variant, showIcon = true }) {
  const v = resolveVariant(variant);
  const icon = showIcon ? `${ALERT_THEME[v].icon} ` : '';
  const text = String(title || ALERT_THEME[v].fallbackTitle).trim();
  return `${icon}${text}`.trim();
}

function normalizeButtons(buttons) {
  if (Array.isArray(buttons) && buttons.length) return buttons;
  return [{ text: 'OK' }];
}

export function createAlertButtons({
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
  destructive = false,
} = {}) {
  const result = [];
  if (cancelText) {
    result.push({ text: cancelText, style: 'cancel', onPress: onCancel });
  }
  result.push({
    text: confirmText,
    style: destructive ? 'destructive' : 'default',
    onPress: onConfirm,
  });
  return result;
}

/**
 * Project-wide alert template helper.
 *
 * @param {string} title
 * @param {string} message
 * @param {Array<{text:string, onPress?:Function, style?:'default'|'cancel'|'destructive'}>} buttons
 * @param {{
 *   variant?: 'success'|'info'|'warning'|'error',
 *   cancelable?: boolean,
 *   showIcon?: boolean
 * }} options
 */
export function appAlert(title, message, buttons, options = {}) {
  const { variant = ALERT_VARIANTS.info, cancelable = true, showIcon = true } = options || {};
  const alertTitle = getStyledTitle({ title, variant, showIcon });
  const alertButtons = normalizeButtons(buttons);

  Alert.alert(
    alertTitle,
    message || '',
    alertButtons,
    { cancelable }
  );
}

export function appConfirm({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = ALERT_VARIANTS.warning,
  destructive = false,
  cancelable = true,
} = {}) {
  return appAlert(
    title,
    message,
    createAlertButtons({ confirmText, cancelText, onConfirm, onCancel, destructive }),
    { variant, cancelable }
  );
}

export function appSuccess(title, message, buttons, options = {}) {
  return appAlert(title, message, buttons, { ...options, variant: ALERT_VARIANTS.success });
}

export function appInfo(title, message, buttons, options = {}) {
  return appAlert(title, message, buttons, { ...options, variant: ALERT_VARIANTS.info });
}

export function appWarning(title, message, buttons, options = {}) {
  return appAlert(title, message, buttons, { ...options, variant: ALERT_VARIANTS.warning });
}

export function appError(title, message, buttons, options = {}) {
  return appAlert(title, message, buttons, { ...options, variant: ALERT_VARIANTS.error });
}

export default appAlert;
