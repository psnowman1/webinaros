/**
 * Auth Service - Authentication and user management operations
 *
 * This service encapsulates all authentication logic, providing a clean
 * interface for the rest of the application. All operations return a
 * Result type for consistent error handling.
 */

import { supabase } from '@/lib/supabase'
import type { Profile, Workspace } from '@/types/database'
import type { Result } from '@/types/api'
import { ok, err, toApiError, createApiError } from '@/types/api'
import type { User, Session } from '@supabase/supabase-js'

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Result of workspace member query with joined workspace data
 */
interface WorkspaceMemberWithWorkspace {
  workspace_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  workspaces: Workspace
}

/**
 * Sign up options
 */
interface SignUpOptions {
  email: string
  password: string
  fullName: string
}

/**
 * Sign in options
 */
interface SignInOptions {
  email: string
  password: string
}

// ============================================================================
// Auth Service
// ============================================================================

export const authService = {
  /**
   * Get the current session
   */
  async getSession(): Promise<Result<Session | null>> {
    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        return err(toApiError(error))
      }

      return ok(data.session)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Get the current user
   */
  async getUser(): Promise<Result<User | null>> {
    try {
      const { data, error } = await supabase.auth.getUser()

      if (error) {
        // Auth errors with specific codes indicate no session
        if (error.message?.includes('not authenticated')) {
          return ok(null)
        }
        return err(toApiError(error))
      }

      return ok(data.user)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Fetch user profile from database
   */
  async fetchProfile(userId: string): Promise<Result<Profile | null>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If profile doesn't exist, return null instead of error
        // This handles the case where profile creation trigger hasn't run yet
        if (error.code === 'PGRST116') {
          return ok(null)
        }
        return err(toApiError(error))
      }

      return ok(data)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Fetch all workspaces the user is a member of
   */
  async fetchWorkspaces(userId: string): Promise<Result<Workspace[]>> {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(
          `
          workspace_id,
          role,
          workspaces (*)
        `
        )
        .eq('user_id', userId)

      if (error) {
        return err(toApiError(error))
      }

      // Type-safe transformation with proper null handling
      const workspaces = (data as WorkspaceMemberWithWorkspace[] | null)
        ?.map((member) => member.workspaces)
        .filter((workspace): workspace is Workspace => workspace !== null) ?? []

      return ok(workspaces)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Fetch a single workspace by ID
   */
  async fetchWorkspace(workspaceId: string): Promise<Result<Workspace | null>> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return ok(null)
        }
        return err(toApiError(error))
      }

      return ok(data)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Check if user has access to a specific workspace
   */
  async hasWorkspaceAccess(
    userId: string,
    workspaceId: string
  ): Promise<Result<boolean>> {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return ok(false)
        }
        return err(toApiError(error))
      }

      return ok(!!data)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(options: SignInOptions): Promise<Result<User>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: options.email,
        password: options.password,
      })

      if (error) {
        // Map common auth errors to user-friendly messages
        if (error.message?.includes('Invalid login credentials')) {
          return err(
            createApiError('AUTH_INVALID', 'Invalid email or password', {
              statusCode: 401,
            })
          )
        }
        if (error.message?.includes('Email not confirmed')) {
          return err(
            createApiError(
              'EMAIL_NOT_CONFIRMED',
              'Please verify your email before signing in',
              { statusCode: 401 }
            )
          )
        }
        return err(toApiError(error))
      }

      if (!data.user) {
        return err(
          createApiError('AUTH_INVALID', 'Sign in failed', { statusCode: 401 })
        )
      }

      return ok(data.user)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Sign up with email, password, and name
   */
  async signUp(options: SignUpOptions): Promise<Result<User>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: options.email,
        password: options.password,
        options: {
          data: {
            full_name: options.fullName,
          },
        },
      })

      if (error) {
        // Map common signup errors
        if (error.message?.includes('already registered')) {
          return err(
            createApiError(
              'ALREADY_EXISTS',
              'An account with this email already exists',
              { statusCode: 409 }
            )
          )
        }
        return err(toApiError(error))
      }

      if (!data.user) {
        return err(
          createApiError('UNKNOWN_ERROR', 'Sign up failed', { statusCode: 500 })
        )
      }

      return ok(data.user)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<Result<void>> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return err(toApiError(error))
      }

      return ok(undefined)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<Result<void>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return err(toApiError(error))
      }

      return ok(undefined)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Update password with reset token
   */
  async updatePassword(newPassword: string): Promise<Result<void>> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return err(toApiError(error))
      }

      return ok(undefined)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'timezone' | 'email_notifications' | 'sms_notifications'>>
  ): Promise<Result<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates as unknown as never)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return err(toApiError(error))
      }

      return ok(data)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Subscribe to auth state changes
   * Returns an unsubscribe function
   */
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ): () => void {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(callback)

    return () => subscription.unsubscribe()
  },
}
