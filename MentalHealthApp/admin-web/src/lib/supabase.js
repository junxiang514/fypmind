import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export let supabaseInitError = null;
export let supabase = null;
export let publicReadClient = null;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in admin-web/.env.local');
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'mentalhealth-admin-auth',
    },
  });

  // Public read client without persisted auth state.
  // Useful for tables that are intentionally readable by everyone (events, educational_contents).
  publicReadClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
} catch (error) {
  supabaseInitError = error?.message || 'Failed to initialize Supabase client.';
  // eslint-disable-next-line no-console
  console.error('Supabase init failed:', supabaseInitError);
}
