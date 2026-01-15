/**
 * Supabase Client - Typed client instance
 *
 * This module initializes and exports the Supabase client with proper typing.
 * All database operations should use this client to ensure type safety.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// ============================================================================
// Environment Validation
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  )
}

// ============================================================================
// Client Instance
// ============================================================================

/**
 * Typed Supabase client for frontend use.
 * Uses the anon key and relies on RLS for security.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage
    persistSession: true,
    // Automatically refresh token before expiry
    autoRefreshToken: true,
    // Detect session from URL (for OAuth callbacks)
    detectSessionInUrl: true,
  },
})

// ============================================================================
// Type Exports
// ============================================================================

export type { Database }
export type SupabaseClient = typeof supabase
