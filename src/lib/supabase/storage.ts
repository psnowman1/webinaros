/**
 * Storage Abstraction - Type-safe localStorage wrapper
 *
 * This module provides a centralized, type-safe interface for localStorage
 * operations. It handles:
 * - Type safety for keys and values
 * - Graceful fallback when localStorage is unavailable (SSR, private browsing)
 * - JSON serialization/deserialization
 * - Consistent error handling
 */

// ============================================================================
// Storage Keys
// ============================================================================

/**
 * All storage keys used in the application.
 * Adding a key here provides type safety throughout the codebase.
 */
export const STORAGE_KEYS = {
  /** Current workspace ID for multi-tenant context */
  CURRENT_WORKSPACE_ID: 'webinar-os:workspace-id',
  /** Theme preference (light/dark) */
  THEME: 'webinar-os:theme',
  /** Whether user has completed onboarding */
  ONBOARDING_COMPLETE: 'webinar-os:onboarding-complete',
  /** Last viewed webinar ID for quick access */
  LAST_WEBINAR_ID: 'webinar-os:last-webinar',
  /** Sidebar collapsed state */
  SIDEBAR_COLLAPSED: 'webinar-os:sidebar-collapsed',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

// ============================================================================
// Type Definitions for Stored Values
// ============================================================================

/**
 * Type map for storage values.
 * This ensures type safety when reading/writing to storage.
 */
interface StorageValueMap {
  [STORAGE_KEYS.CURRENT_WORKSPACE_ID]: string
  [STORAGE_KEYS.THEME]: 'light' | 'dark' | 'system'
  [STORAGE_KEYS.ONBOARDING_COMPLETE]: boolean
  [STORAGE_KEYS.LAST_WEBINAR_ID]: string
  [STORAGE_KEYS.SIDEBAR_COLLAPSED]: boolean
}

// ============================================================================
// Storage Implementation
// ============================================================================

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

const storageAvailable = typeof window !== 'undefined' && isStorageAvailable()

/**
 * Type-safe storage operations
 */
export const storage = {
  /**
   * Get a value from storage
   * @param key - Storage key
   * @param defaultValue - Default value if key doesn't exist
   */
  get<K extends StorageKey>(
    key: K,
    defaultValue: StorageValueMap[K]
  ): StorageValueMap[K] {
    if (!storageAvailable) {
      return defaultValue
    }

    try {
      const item = localStorage.getItem(key)
      if (item === null) {
        return defaultValue
      }
      return JSON.parse(item) as StorageValueMap[K]
    } catch {
      // If parsing fails, return default
      return defaultValue
    }
  },

  /**
   * Get a raw string value (for values that shouldn't be JSON parsed)
   */
  getString<K extends StorageKey>(key: K): string | null {
    if (!storageAvailable) {
      return null
    }

    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },

  /**
   * Set a value in storage
   * @param key - Storage key
   * @param value - Value to store
   */
  set<K extends StorageKey>(key: K, value: StorageValueMap[K]): void {
    if (!storageAvailable) {
      return
    }

    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Silent fail - likely quota exceeded or private browsing
      console.warn(`Failed to write to localStorage: ${key}`)
    }
  },

  /**
   * Set a raw string value (for values that shouldn't be JSON stringified)
   */
  setString<K extends StorageKey>(key: K, value: string): void {
    if (!storageAvailable) {
      return
    }

    try {
      localStorage.setItem(key, value)
    } catch {
      console.warn(`Failed to write to localStorage: ${key}`)
    }
  },

  /**
   * Remove a value from storage
   * @param key - Storage key to remove
   */
  remove(key: StorageKey): void {
    if (!storageAvailable) {
      return
    }

    try {
      localStorage.removeItem(key)
    } catch {
      // Silent fail
    }
  },

  /**
   * Clear all WebinarOS storage keys
   */
  clearAll(): void {
    if (!storageAvailable) {
      return
    }

    Object.values(STORAGE_KEYS).forEach((key) => {
      try {
        localStorage.removeItem(key)
      } catch {
        // Silent fail
      }
    })
  },
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get the current workspace ID from storage
 */
export function getCurrentWorkspaceId(): string | null {
  return storage.getString(STORAGE_KEYS.CURRENT_WORKSPACE_ID)
}

/**
 * Set the current workspace ID in storage
 */
export function setCurrentWorkspaceId(id: string | null): void {
  if (id) {
    storage.setString(STORAGE_KEYS.CURRENT_WORKSPACE_ID, id)
  } else {
    storage.remove(STORAGE_KEYS.CURRENT_WORKSPACE_ID)
  }
}

/**
 * Get the current theme from storage
 */
export function getTheme(): 'light' | 'dark' | 'system' {
  return storage.get(STORAGE_KEYS.THEME, 'system')
}

/**
 * Set the current theme in storage
 */
export function setTheme(theme: 'light' | 'dark' | 'system'): void {
  storage.set(STORAGE_KEYS.THEME, theme)
}

/**
 * Check if onboarding is complete
 */
export function isOnboardingComplete(): boolean {
  return storage.get(STORAGE_KEYS.ONBOARDING_COMPLETE, false)
}

/**
 * Mark onboarding as complete
 */
export function setOnboardingComplete(complete: boolean): void {
  storage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, complete)
}

/**
 * Get sidebar collapsed state
 */
export function isSidebarCollapsed(): boolean {
  return storage.get(STORAGE_KEYS.SIDEBAR_COLLAPSED, false)
}

/**
 * Set sidebar collapsed state
 */
export function setSidebarCollapsed(collapsed: boolean): void {
  storage.set(STORAGE_KEYS.SIDEBAR_COLLAPSED, collapsed)
}
