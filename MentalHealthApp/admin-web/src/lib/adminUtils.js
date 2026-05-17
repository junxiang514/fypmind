export function toInputDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function toIso(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function isAdmin(profile) {
  return Boolean(profile?.is_admin || String(profile?.role || '').toLowerCase() === 'admin');
}

export function nameFromEmail(email = '') {
  const base = String(email).split('@')[0] || '';
  if (!base) return '';
  return base
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function isMissingColumnError(error) {
  const message = String(error?.message || '');
  return error?.code === '42703' || /column .* does not exist/i.test(message);
}

export function serializeClinicalOptions(options) {
  if (!Array.isArray(options) || !options.length) return '';
  return options
    .map((x) => {
      const label = String(x?.label ?? '').trim();
      const value = Number(x?.value);
      if (!label || !Number.isFinite(value)) return '';
      return `${label}|${value}`;
    })
    .filter(Boolean)
    .join('\n');
}

export function parseClinicalOptionsText(text) {
  const rows = String(text || '')
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

  return rows
    .map((line) => {
      const [labelPart, valuePart] = line.split('|');
      const label = String(labelPart || '').trim();
      const value = Number(String(valuePart || '').trim());
      if (!label || !Number.isFinite(value)) return null;
      return { label, value };
    })
    .filter(Boolean);
}

export function buildFallbackProfile(user, profile) {
  return {
    id: user?.id,
    full_name:
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      nameFromEmail(user?.email),
    email: profile?.email || user?.email || '',
    phone: '',
    gender: '',
    role: profile?.role || 'admin',
    is_admin: true,
    is_active: true,
  };
}
