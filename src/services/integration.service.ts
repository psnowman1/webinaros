/**
 * Integration Service - Third-party integration operations
 *
 * This service handles all integration-related database operations including
 * Zoom, GoHighLevel, and other third-party services.
 */

import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type { Result } from '@/types/api'
import { ok, err, toApiError, createApiError } from '@/types/api'

// ============================================================================
// Type Definitions
// ============================================================================

type Integration = Database['public']['Tables']['integrations']['Row']
type IntegrationInsert = Database['public']['Tables']['integrations']['Insert']
type IntegrationUpdate = Database['public']['Tables']['integrations']['Update']
type IntegrationProvider = Integration['provider']
type IntegrationStatus = Integration['status']

export type {
  Integration,
  IntegrationInsert,
  IntegrationUpdate,
  IntegrationProvider,
  IntegrationStatus,
}

/**
 * Integration with sensitive fields omitted for display
 */
export type IntegrationDisplay = Omit<
  Integration,
  'access_token' | 'refresh_token' | 'api_key' | 'api_secret'
>

// ============================================================================
// Integration Service
// ============================================================================

export const integrationService = {
  /**
   * List all integrations for a workspace
   */
  async list(workspaceId: string): Promise<Result<Integration[]>> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('provider')

      if (error) {
        return err(toApiError(error))
      }

      return ok(data ?? [])
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Get a specific integration by provider
   */
  async getByProvider(
    workspaceId: string,
    provider: IntegrationProvider
  ): Promise<Result<Integration | null>> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('provider', provider)
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
   * Get a specific integration by ID
   */
  async getById(id: string): Promise<Result<Integration | null>> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', id)
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
   * Get active integration for a provider
   */
  async getActive(
    workspaceId: string,
    provider: IntegrationProvider
  ): Promise<Result<Integration | null>> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('provider', provider)
        .eq('status', 'active')
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
   * Create a new integration
   */
  async create(integration: IntegrationInsert): Promise<Result<Integration>> {
    try {
      if (!integration.workspace_id) {
        return err(
          createApiError('VALIDATION_ERROR', 'Workspace ID is required')
        )
      }
      if (!integration.provider) {
        return err(createApiError('VALIDATION_ERROR', 'Provider is required'))
      }

      const { data, error } = await supabase
        .from('integrations')
        .insert(integration)
        .select()
        .single()

      if (error) {
        // Handle unique constraint (one integration per provider per workspace)
        if (error.code === '23505') {
          return err(
            createApiError(
              'ALREADY_EXISTS',
              `An integration for ${integration.provider} already exists`,
              { statusCode: 409 }
            )
          )
        }
        return err(toApiError(error))
      }

      return ok(data)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Update an integration
   */
  async update(id: string, updates: IntegrationUpdate): Promise<Result<Integration>> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return err(
            createApiError('NOT_FOUND', 'Integration not found', {
              statusCode: 404,
            })
          )
        }
        return err(toApiError(error))
      }

      return ok(data)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Update integration credentials
   */
  async updateCredentials(
    id: string,
    credentials: {
      access_token?: string | null
      refresh_token?: string | null
      token_expires_at?: string | null
      api_key?: string | null
      api_secret?: string | null
    }
  ): Promise<Result<Integration>> {
    return this.update(id, {
      ...credentials,
      status: 'active',
      last_error: null,
      last_error_at: null,
      error_count: 0,
    })
  },

  /**
   * Update integration settings (non-credential data)
   */
  async updateSettings(
    id: string,
    settings: Record<string, unknown>
  ): Promise<Result<Integration>> {
    try {
      // Get current settings first to merge
      const { data: current, error: fetchError } = await supabase
        .from('integrations')
        .select('settings')
        .eq('id', id)
        .single()

      if (fetchError) {
        return err(toApiError(fetchError))
      }

      const mergedSettings = {
        ...(current?.settings as Record<string, unknown> || {}),
        ...settings,
      }

      return this.update(id, { settings: mergedSettings })
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Mark integration as having an error
   */
  async markError(id: string, errorMessage: string): Promise<Result<Integration>> {
    try {
      const { data: current } = await supabase
        .from('integrations')
        .select('error_count')
        .eq('id', id)
        .single()

      return this.update(id, {
        status: 'error',
        last_error: errorMessage,
        last_error_at: new Date().toISOString(),
        error_count: (current?.error_count ?? 0) + 1,
      })
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Update last used timestamp
   */
  async markUsed(id: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        return err(toApiError(error))
      }

      return ok(undefined)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Delete an integration
   */
  async delete(id: string): Promise<Result<void>> {
    try {
      const { error } = await supabase.from('integrations').delete().eq('id', id)

      if (error) {
        return err(toApiError(error))
      }

      return ok(undefined)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Check if an integration is connected and active
   */
  async isConnected(
    workspaceId: string,
    provider: IntegrationProvider
  ): Promise<Result<boolean>> {
    const result = await this.getActive(workspaceId, provider)

    if (!result.success) {
      return result
    }

    return ok(result.data !== null)
  },
}
