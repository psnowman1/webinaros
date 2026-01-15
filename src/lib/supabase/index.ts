/**
 * Supabase Module - Central exports
 */

// Client
export { supabase } from './client'
export type { Database, SupabaseClient } from './client'

// Storage
export {
  storage,
  STORAGE_KEYS,
  getCurrentWorkspaceId,
  setCurrentWorkspaceId,
  getTheme,
  setTheme,
  isOnboardingComplete,
  setOnboardingComplete,
  isSidebarCollapsed,
  setSidebarCollapsed,
} from './storage'
export type { StorageKey } from './storage'
