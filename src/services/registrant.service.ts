/**
 * Registrant Service - Webinar registrant operations
 *
 * This service handles all registrant-related database operations including
 * creation, updates, and querying.
 */

import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type { Result } from '@/types/api'
import { ok, err, toApiError, createApiError } from '@/types/api'

// ============================================================================
// Type Definitions
// ============================================================================

type Registrant = Database['public']['Tables']['registrants']['Row']
type RegistrantInsert = Database['public']['Tables']['registrants']['Insert']
type RegistrantUpdate = Database['public']['Tables']['registrants']['Update']
type RegistrantStatus = Registrant['status']

export type {
  Registrant,
  RegistrantInsert,
  RegistrantUpdate,
  RegistrantStatus,
}

/**
 * Options for listing registrants
 */
interface ListRegistrantsOptions {
  workspaceId: string
  webinarId?: string
  status?: RegistrantStatus
  isVip?: boolean
  limit?: number
  offset?: number
  search?: string
}

/**
 * Registrant statistics
 */
interface RegistrantStats {
  total: number
  vipCount: number
  attendedCount: number
  noShowCount: number
  purchasedCount: number
  totalRevenue: number
}

// ============================================================================
// Registrant Service
// ============================================================================

export const registrantService = {
  /**
   * List registrants with filters
   */
  async list(options: ListRegistrantsOptions): Promise<Result<Registrant[]>> {
    try {
      const {
        workspaceId,
        webinarId,
        status,
        isVip,
        limit = 50,
        offset = 0,
        search,
      } = options

      let query = supabase
        .from('registrants')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('registered_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (webinarId) {
        query = query.eq('webinar_id', webinarId)
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (isVip !== undefined) {
        query = query.eq('is_vip', isVip)
      }

      if (search) {
        // Search by email, first name, or last name
        query = query.or(
          `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
        )
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
   * Get recent registrations
   */
  async listRecent(
    workspaceId: string,
    limit = 10
  ): Promise<Result<Registrant[]>> {
    try {
      const { data, error } = await supabase
        .from('registrants')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('registered_at', { ascending: false })
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
   * Get a registrant by ID
   */
  async getById(id: string): Promise<Result<Registrant | null>> {
    try {
      const { data, error } = await supabase
        .from('registrants')
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
   * Get a registrant by email for a specific webinar
   */
  async getByEmail(
    webinarId: string,
    email: string
  ): Promise<Result<Registrant | null>> {
    try {
      const { data, error } = await supabase
        .from('registrants')
        .select('*')
        .eq('webinar_id', webinarId)
        .eq('email', email.toLowerCase())
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
   * Create a new registrant
   */
  async create(registrant: RegistrantInsert): Promise<Result<Registrant>> {
    try {
      if (!registrant.workspace_id) {
        return err(
          createApiError('VALIDATION_ERROR', 'Workspace ID is required')
        )
      }
      if (!registrant.webinar_id) {
        return err(createApiError('VALIDATION_ERROR', 'Webinar ID is required'))
      }
      if (!registrant.email?.trim()) {
        return err(createApiError('VALIDATION_ERROR', 'Email is required'))
      }

      // Normalize email
      const normalizedRegistrant = {
        ...registrant,
        email: registrant.email.toLowerCase().trim(),
      }

      const { data, error } = await supabase
        .from('registrants')
        .insert(normalizedRegistrant)
        .select()
        .single()

      if (error) {
        // Handle unique constraint (one registration per email per webinar)
        if (error.code === '23505') {
          return err(
            createApiError(
              'ALREADY_EXISTS',
              'This email is already registered for this webinar',
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
   * Update a registrant
   */
  async update(id: string, updates: RegistrantUpdate): Promise<Result<Registrant>> {
    try {
      const { data, error } = await supabase
        .from('registrants')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return err(
            createApiError('NOT_FOUND', 'Registrant not found', {
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
   * Mark registrant as attended
   */
  async markAttended(id: string): Promise<Result<Registrant>> {
    return this.update(id, {
      status: 'attended',
      joined_at: new Date().toISOString(),
    })
  },

  /**
   * Mark registrant as no-show
   */
  async markNoShow(id: string): Promise<Result<Registrant>> {
    return this.update(id, {
      status: 'no_show',
    })
  },

  /**
   * Update Zoom sync data
   */
  async updateZoomSync(
    id: string,
    data: {
      zoom_registrant_id: string
      zoom_join_url: string
    }
  ): Promise<Result<Registrant>> {
    return this.update(id, {
      ...data,
      zoom_synced_at: new Date().toISOString(),
    })
  },

  /**
   * Update GHL sync data
   */
  async updateGhlSync(
    id: string,
    contactId: string
  ): Promise<Result<Registrant>> {
    return this.update(id, {
      ghl_contact_id: contactId,
      ghl_synced_at: new Date().toISOString(),
    })
  },

  /**
   * Record a purchase
   */
  async recordPurchase(
    id: string,
    amount: number,
    stripePaymentId?: string
  ): Promise<Result<Registrant>> {
    return this.update(id, {
      has_purchased: true,
      purchase_amount: amount,
      purchased_at: new Date().toISOString(),
      stripe_payment_id: stripePaymentId,
    })
  },

  /**
   * Delete a registrant
   */
  async delete(id: string): Promise<Result<void>> {
    try {
      const { error } = await supabase.from('registrants').delete().eq('id', id)

      if (error) {
        return err(toApiError(error))
      }

      return ok(undefined)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Get statistics for registrants
   */
  async getStats(
    workspaceId: string,
    webinarId?: string
  ): Promise<Result<RegistrantStats>> {
    try {
      let query = supabase
        .from('registrants')
        .select('is_vip, status, has_purchased, purchase_amount')
        .eq('workspace_id', workspaceId)

      if (webinarId) {
        query = query.eq('webinar_id', webinarId)
      }

      const { data, error } = await query

      if (error) {
        return err(toApiError(error))
      }

      const registrants = data ?? []

      const stats: RegistrantStats = {
        total: registrants.length,
        vipCount: registrants.filter((r) => r.is_vip).length,
        attendedCount: registrants.filter((r) => r.status === 'attended').length,
        noShowCount: registrants.filter((r) => r.status === 'no_show').length,
        purchasedCount: registrants.filter((r) => r.has_purchased).length,
        totalRevenue: registrants.reduce(
          (sum, r) => sum + (r.purchase_amount ?? 0),
          0
        ),
      }

      return ok(stats)
    } catch (error) {
      return err(toApiError(error))
    }
  },

  /**
   * Count registrants for a webinar
   */
  async count(webinarId: string): Promise<Result<number>> {
    try {
      const { count, error } = await supabase
        .from('registrants')
        .select('id', { count: 'exact', head: true })
        .eq('webinar_id', webinarId)

      if (error) {
        return err(toApiError(error))
      }

      return ok(count ?? 0)
    } catch (error) {
      return err(toApiError(error))
    }
  },
}
