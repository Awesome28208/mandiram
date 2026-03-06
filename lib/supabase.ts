import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export const createClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey)

export const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL
