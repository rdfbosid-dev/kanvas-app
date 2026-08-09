import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum diisi. ' +
    'Cek file .env kamu (lihat .env.example).'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
