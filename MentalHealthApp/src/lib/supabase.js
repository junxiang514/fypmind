import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://lucksqjirrzltjerivrg.supabase.co'; // Replace with your Supabase project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1Y2tzcWppcnJ6bHRqZXJpdnJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMzAxMzcsImV4cCI6MjA4MjcwNjEzN30.66UoDYr3Rd9ChUNENLTzvk-MR3LPsC0n7Ga3ivS2TpU'; // Replace with your Supabase anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: AsyncStorage,
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: false,
	},
});
