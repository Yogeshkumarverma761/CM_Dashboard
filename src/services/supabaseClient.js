import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if credentials are placeholders or empty
const isCredentialsConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your_supabase_project_url') && 
  !supabaseAnonKey.includes('your_supabase_anon_key');

export const isMock = !isCredentialsConfigured;

if (isMock) {
  console.log('⚠️ Supabase credentials not found or unconfigured. Delhi CM Dashboard is running in robust Offline Mock Mode using LocalStorage.');
}

export const supabase = isMock ? null : createClient(supabaseUrl, supabaseAnonKey)
