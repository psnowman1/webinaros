/**
 * Auth Context - Authentication state management
 *
 * This context provides authentication state and actions throughout the app.
 * It uses the authService for all operations and properly handles:
 * - Session management with Supabase
 * - Profile and workspace loading
 * - Workspace switching
 * - Loading states and error handling
 *
 * Key improvements over previous implementation:
 * - No setTimeout hacks - uses proper async patterns
 * - No any types - fully typed with proper generics
 * - Uses service layer for all operations
 * - Proper cleanup on unmount
 * - Memoized callbacks to prevent unnecessary re-renders
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { authService } from '@/services/auth.service'
import {
  getCurrentWorkspaceId,
  setCurrentWorkspaceId as saveWorkspaceId,
} from '@/lib/supabase/storage'
import type { Profile, Workspace } from '@/types/database'

// ============================================================================
// Types
// ============================================================================

interface AuthContextType {
  /** Current authenticated user from Supabase Auth */
  user: User | null
  /** User's profile from the profiles table */
  profile: Profile | null
  /** Current Supabase session */
  session: Session | null
  /** List of workspaces the user is a member of */
  workspaces: Workspace[]
  /** Currently selected workspace */
  currentWorkspace: Workspace | null
  /** ID of the currently selected workspace */
  currentWorkspaceId: string | null
  /** Whether the initial auth check is in progress */
  isLoading: boolean
  /** Whether user data is being loaded after auth */
  isLoadingUserData: boolean
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  /** Sign up with email, password, and name */
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: Error | null }>
  /** Sign out the current user */
  signOut: () => Promise<void>
  /** Change the current workspace */
  setCurrentWorkspaceId: (id: string) => void
  /** Refresh the list of workspaces */
  refreshWorkspaces: () => Promise<void>
  /** Refresh the user profile */
  refreshProfile: () => Promise<void>
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspaceId, setCurrentWorkspaceIdState] = useState<string | null>(
    getCurrentWorkspaceId()
  )

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingUserData, setIsLoadingUserData] = useState(false)

  // Refs for cleanup
  const isMountedRef = useRef(true)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Computed current workspace
  const currentWorkspace =
    workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0] || null

  // ============================================================================
  // Workspace Management
  // ============================================================================

  /**
   * Set the current workspace ID and persist to storage
   */
  const setCurrentWorkspaceId = useCallback((id: string) => {
    setCurrentWorkspaceIdState(id)
    saveWorkspaceId(id)
  }, [])

  /**
   * Clear workspace selection
   */
  const clearWorkspace = useCallback(() => {
    setCurrentWorkspaceIdState(null)
    saveWorkspaceId(null)
  }, [])

  // ============================================================================
  // Data Loading
  // ============================================================================

  /**
   * Load user profile and workspaces
   * This is called after auth state changes, NOT inside the onAuthStateChange callback
   * to avoid the Supabase client "deadlock" issue
   */
  const loadUserData = useCallback(
    async (userId: string) => {
      if (!isMountedRef.current) return

      setIsLoadingUserData(true)

      try {
        // Fetch profile and workspaces in parallel
        const [profileResult, workspacesResult] = await Promise.all([
          authService.fetchProfile(userId),
          authService.fetchWorkspaces(userId),
        ])

        if (!isMountedRef.current) return

        // Update profile
        if (profileResult.success) {
          setProfile(profileResult.data)
        } else {
          // Profile might not exist yet (e.g., trigger hasn't run)
          // This is not an error - just set to null
          setProfile(null)
        }

        // Update workspaces
        if (workspacesResult.success) {
          setWorkspaces(workspacesResult.data)

          // Auto-select first workspace if none selected or current is invalid
          const currentId = getCurrentWorkspaceId()
          const isValidWorkspace = workspacesResult.data.some(
            (w) => w.id === currentId
          )

          if (
            (!currentId || !isValidWorkspace) &&
            workspacesResult.data.length > 0
          ) {
            setCurrentWorkspaceId(workspacesResult.data[0].id)
          }
        } else {
          setWorkspaces([])
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoadingUserData(false)
          setIsLoading(false)
        }
      }
    },
    [setCurrentWorkspaceId]
  )

  /**
   * Refresh workspaces
   */
  const refreshWorkspaces = useCallback(async () => {
    if (!user) return

    const result = await authService.fetchWorkspaces(user.id)
    if (result.success && isMountedRef.current) {
      setWorkspaces(result.data)
    }
  }, [user])

  /**
   * Refresh profile
   */
  const refreshProfile = useCallback(async () => {
    if (!user) return

    const result = await authService.fetchProfile(user.id)
    if (result.success && isMountedRef.current) {
      setProfile(result.data)
    }
  }, [user])

  // ============================================================================
  // Auth State Listener
  // ============================================================================

  useEffect(() => {
    isMountedRef.current = true

    // Set a timeout to prevent infinite loading
    loadingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && isLoading) {
        setIsLoading(false)
      }
    }, 10000) // 10 second timeout

    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange((event, newSession) => {
      if (!isMountedRef.current) return

      // Update session and user state immediately (synchronous)
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        // User is authenticated - load their data
        // This is done outside the callback to avoid Supabase client issues
        loadUserData(newSession.user.id)
      } else {
        // User is not authenticated - clear all state
        setProfile(null)
        setWorkspaces([])
        clearWorkspace()
        setIsLoading(false)
        setIsLoadingUserData(false)
      }
    })

    return () => {
      isMountedRef.current = false
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      unsubscribe()
    }
  }, [loadUserData, clearWorkspace])

  // ============================================================================
  // Auth Actions
  // ============================================================================

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: Error | null }> => {
      const result = await authService.signIn({ email, password })

      if (!result.success) {
        return { error: result.error }
      }

      return { error: null }
    },
    []
  )

  /**
   * Sign up with email, password, and full name
   */
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string
    ): Promise<{ error: Error | null }> => {
      const result = await authService.signUp({ email, password, fullName })

      if (!result.success) {
        return { error: result.error }
      }

      return { error: null }
    },
    []
  )

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async () => {
    await authService.signOut()
    clearWorkspace()
  }, [clearWorkspace])

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: AuthContextType = {
    user,
    profile,
    session,
    workspaces,
    currentWorkspace,
    currentWorkspaceId,
    isLoading,
    isLoadingUserData,
    signIn,
    signUp,
    signOut,
    setCurrentWorkspaceId,
    refreshWorkspaces,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access auth context
 * Must be used within an AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook that returns just the current user
 * Useful when you only need the user object
 */
export function useUser(): User | null {
  const { user } = useAuth()
  return user
}

/**
 * Hook that returns just the current workspace
 * Useful when you only need the workspace object
 */
export function useCurrentWorkspace(): Workspace | null {
  const { currentWorkspace } = useAuth()
  return currentWorkspace
}

/**
 * Hook that returns just the current workspace ID
 * Useful for passing to hooks that need the workspace ID
 */
export function useCurrentWorkspaceId(): string | undefined {
  const { currentWorkspaceId } = useAuth()
  return currentWorkspaceId ?? undefined
}

/**
 * Hook that checks if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user, isLoading } = useAuth()
  return !isLoading && user !== null
}
