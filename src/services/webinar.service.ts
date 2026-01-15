/**
 * Webinar Service - Webinar CRUD operations
 *
 * This service handles all webinar-related database operations with
 * proper typing and error handling.
 */

import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type { Result } from '@/types/api'
import { ok, err, toApiError, createApiError } from '@/types/api'

// ============================================================================
// Type Definitions
// ============================================================================

type Webinar = Database['public']['Tables']['webinars']['Row']
type WebinarInsert = Database['public']['Tables']['webinars']['Insert']
type WebinarUpdate = Database['public']['Tables']['webinars']['Update']

export type { Webinar, WebinarInsert, WebinarUpdate }

/**
 * Options for listing webinars
 */
interface ListWebinarsOptions {
  workspaceId: string
  status?: Webinar['status']
  limit?: number
  offset?: number
}

// ============================================================================
// Webinar Service
// ============================================================================

export const webinarService = {
  /**
   * List all webinars for a workspace
   */
  async list(options: ListWebinarsOptions): Promise<Result<Webinar[]>> {
    try {
      const { workspaceId, status, limit = 50, offset = 0 } = options

      let query = supabase
        .from('webinars')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('scheduled_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        return err(toApiError(error))
      }

      return ok(data ?? [])
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Get upcoming webinars (scheduled in the future)
   */
  async listUpcoming(workspaceId: string, limit = 5): Promise<Result<Webinar[]>> {
    try {
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('webinars')
        .select('*')
        .eq('workspace_id', workspaceId)
        .in('status', ['scheduled', 'live'])
        .gte('scheduled_at', now)
        .order('scheduled_at', { ascending: true })
        .limit(limit)

      if (error) {
        return err(toApiError(error))
      }

      return ok(data ?? [])
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Get a single webinar by ID
   */
  async getById(id: string): Promise<Result<Webinar | null>> {
    try {
      const { data, error } = await supabase
        .from('webinars')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        // Not found is a valid result, not an error
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
   * Get a webinar by slug
   */
  async getBySlug(
    workspaceId: string,
    slug: string
  ): Promise<Result<Webinar | null>> {
    try {
      const { data, error } = await supabase
        .from('webinars')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('slug', slug)
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
   * Create a new webinar
   */
  async create(webinar: WebinarInsert): Promise<Result<Webinar>> {
    try {
      // Validate required fields
      if (!webinar.workspace_id) {
        return err(
          createApiError('VALIDATION_ERROR', 'Workspace ID is required')
        )
      }
      if (!webinar.title?.trim()) {
        return err(createApiError('VALIDATION_ERROR', 'Title is required'))
      }

      const { data, error } = await supabase
        .from('webinars')
        .insert(webinar as unknown as never)
        .select()
        .single()

      if (error) {
        // Handle unique constraint violations
        if (error.code === '23505') {
          return err(
            createApiError(
              'ALREADY_EXISTS',
              'A webinar with this slug already exists',
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
   * Update an existing webinar
   */
  async update(id: string, updates: WebinarUpdate): Promise<Result<Webinar>> {
    try {
      const { data, error } = await supabase
        .from('webinars')
        .update(updates as unknown as never)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return err(
            createApiError('NOT_FOUND', 'Webinar not found', { statusCode: 404 })
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
   * Delete a webinar
   */
  async delete(id: string): Promise<Result<void>> {
    try {
      const { error } = await supabase.from('webinars').delete().eq('id', id)

      if (error) {
        return err(toApiError(error))
      }

      return ok(undefined)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Update webinar status
   */
  async updateStatus(
    id: string,
    status: Webinar['status']
  ): Promise<Result<Webinar>> {
    return this.update(id, { status })
  },

  /**
   * Increment registrant count (called when a new registration is added)
   */
  async incrementRegistrantCount(id: string): Promise<Result<void>> {
    try {
      const { error } = await supabase.rpc('increment_registrant_count', {
        webinar_id: id,
      } as never)

      if (error) {
        // If RPC doesn't exist, fall back to direct update
        const { data: webinar } = await supabase
          .from('webinars')
          .select('registrant_count')
          .eq('id', id)
          .single()

        const currentCount = (webinar as { registrant_count: number } | null)?.registrant_count ?? 0
        await supabase
          .from('webinars')
          .update({ registrant_count: currentCount + 1 } as unknown as never)
          .eq('id', id)
      }

      return ok(undefined)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Get webinar statistics
   */
  async getStats(
    workspaceId: string
  ): Promise<Result<{ total: number; scheduled: number; completed: number }>> {
    try {
      const { data, error } = await supabase
        .from('webinars')
        .select('status')
        .eq('workspace_id', workspaceId)

      if (error) {
        return err(toApiError(error))
      }

      const webinars = data as { status: string }[] | null
      const stats = {
        total: webinars?.length ?? 0,
        scheduled: webinars?.filter((w) => w.status === 'scheduled').length ?? 0,
        completed: webinars?.filter((w) => w.status === 'completed').length ?? 0,
      }

      return ok(stats)
    } catch (error) {
      return err(toApiError(error))
    }
  },
}
