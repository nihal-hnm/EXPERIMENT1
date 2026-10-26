import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Use placeholder values during build-time SSG/SSR when env vars are absent.
// These won't allow real API calls but prevent the "supabaseUrl is required"
// crash during Next.js static page generation.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any> = createClient(supabaseUrl, supabaseAnonKey);
