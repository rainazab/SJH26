import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
  console.error('[DEADWAX] Missing VITE_SUPABASE_URL in .env.local')
}
if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key') {
  console.error('[DEADWAX] Missing VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
)