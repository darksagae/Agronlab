import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase Configuration
// AGROF Project: xtklayjpdpfykjbttaac (us-east-2)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xtklayjpdpfykjbttaac.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0a2xheWpwZHBmeWtqYnR0YWFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTI2NTcsImV4cCI6MjA3NTY2ODY1N30.GXPo5n_MlOWqIe5lEKcgVJD_A3wyx2IPNyH9DmgXtWM';

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const getSupabaseConfig = () => ({
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
});

console.log('🟢 Supabase client initialized');
console.log('   URL:', SUPABASE_URL);

export default supabase;


