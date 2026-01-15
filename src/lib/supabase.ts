/**
 * Supabase Client - Re-export for backwards compatibility
 *
 * This file re-exports from the new modular structure.
 * New code should import directly from '@/lib/supabase/client' or '@/lib/supabase'.
 */

export { supabase } from './supabase/client'
export type { Database, SupabaseClient } from './supabase/client'
