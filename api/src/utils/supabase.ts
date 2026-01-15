/**
 * Supabase Backend Client - Service role client with caching
 *
 * This module provides the Supabase client for backend operations.
 * Features:
 * - Service role key for bypassing RLS
 * - Credential caching with TTL
 * - Proper TypeScript types
 * - Error handling and logging
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// Environment Validation
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_SERVICE_KEY.'
  )
}

// ============================================================================
// Client Instance
// ============================================================================

/**
 * Supabase client with service role key for backend operations.
 * This bypasses RLS policies - use with caution.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// ============================================================================
// Credential Types
// ============================================================================

/**
 * Zoom integration credentials
 */
export interface ZoomCredentials {
  accountId: string
  clientId: string
  clientSecret: string
}

/**
 * GoHighLevel integration credentials
 */
export interface GHLCredentials {
  webhookUrl?: string
  apiKey?: string
  locationId?: string
}

/**
 * All integration credentials by provider
 */
export interface IntegrationCredentials {
  zoom?: ZoomCredentials
  gohighlevel?: GHLCredentials
}

// ============================================================================
// Credential Cache
// ============================================================================

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const credentialsCache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached credentials if not expired
 */
function getCached<T>(key: string): T | null {
  const entry = credentialsCache.get(key) as CacheEntry<T> | undefined

  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    credentialsCache.delete(key)
    return null
  }

  return entry.data
}

/**
 * Set credentials in cache
 */
function setCache<T>(key: string, data: T): void {
  credentialsCache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL,
  })
}

/**
 * Invalidate cached credentials for a workspace
 */
export function invalidateCredentialsCache(
  workspaceId: string,
  provider?: string
): void {
  if (provider) {
    credentialsCache.delete(`${workspaceId}:${provider}`)
  } else {
    // Clear all credentials for this workspace
    for (const key of credentialsCache.keys()) {
      if (key.startsWith(workspaceId)) {
        credentialsCache.delete(key)
      }
    }
  }
}

/**
 * Clear entire credentials cache
 */
export function clearCredentialsCache(): void {
  credentialsCache.clear()
}

// ============================================================================
// Credential Fetching
// ============================================================================

/**
 * Get Zoom credentials for a workspace
 */
export async function getZoomCredentials(
  workspaceId: string
): Promise<ZoomCredentials | null> {
  const cacheKey = `${workspaceId}:zoom`

  // Check cache first
  const cached = getCached<ZoomCredentials>(cacheKey)
  if (cached) return cached

  try {
    const { data, error } = await supabase
      .from('integrations')
      .select('credentials, settings')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'zoom')
      .eq('status', 'active')
      .single()

    if (error || !data) {
      console.warn(
        `Zoom credentials not found for workspace ${workspaceId}:`,
        error?.message
      )
      return null
    }

    const credentials = data.credentials as Record<string, string> | null
    const settings = data.settings as Record<string, string> | null

    if (!credentials?.account_id || !credentials?.client_id || !credentials?.client_secret) {
      console.warn(`Incomplete Zoom credentials for workspace ${workspaceId}`)
      return null
    }

    const result: ZoomCredentials = {
      accountId: credentials.account_id,
      clientId: credentials.client_id,
      clientSecret: credentials.client_secret,
      // Include any settings if needed
      ...settings,
    }

    // Cache the result
    setCache(cacheKey, result)

    return result
  } catch (error) {
    console.error(
      `Error fetching Zoom credentials for workspace ${workspaceId}:`,
      error
    )
    return null
  }
}

/**
 * Get GoHighLevel credentials for a workspace
 */
export async function getGHLCredentials(
  workspaceId: string
): Promise<GHLCredentials | null> {
  const cacheKey = `${workspaceId}:gohighlevel`

  // Check cache first
  const cached = getCached<GHLCredentials>(cacheKey)
  if (cached) return cached

  try {
    const { data, error } = await supabase
      .from('integrations')
      .select('credentials, settings')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'gohighlevel')
      .eq('status', 'active')
      .single()

    if (error || !data) {
      console.warn(
        `GHL credentials not found for workspace ${workspaceId}:`,
        error?.message
      )
      return null
    }

    const credentials = data.credentials as Record<string, string> | null
    const settings = data.settings as Record<string, string> | null

    const result: GHLCredentials = {
      webhookUrl: settings?.webhook_url,
      apiKey: credentials?.api_key,
      locationId: settings?.location_id,
    }

    // Cache the result
    setCache(cacheKey, result)

    return result
  } catch (error) {
    console.error(
      `Error fetching GHL credentials for workspace ${workspaceId}:`,
      error
    )
    return null
  }
}

/**
 * Generic function to get integration credentials
 * @deprecated Use getZoomCredentials or getGHLCredentials for type safety
 */
export async function getIntegrationCredentials(
  workspaceId: string,
  provider: string
): Promise<Record<string, unknown> | null> {
  const cacheKey = `${workspaceId}:${provider}`

  // Check cache first
  const cached = getCached<Record<string, unknown>>(cacheKey)
  if (cached) return cached

  try {
    const { data, error } = await supabase
      .from('integrations')
      .select('credentials, settings')
      .eq('workspace_id', workspaceId)
      .eq('provider', provider)
      .eq('status', 'active')
      .single()

    if (error || !data) {
      return null
    }

    const result = {
      ...(data.credentials as Record<string, unknown> || {}),
      ...(data.settings as Record<string, unknown> || {}),
    }

    // Cache the result
    setCache(cacheKey, result)

    return result
  } catch (error) {
    console.error(
      `Error fetching ${provider} credentials for workspace ${workspaceId}:`,
      error
    )
    return null
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Update integration status
 */
export async function updateIntegrationStatus(
  workspaceId: string,
  provider: string,
  status: 'active' | 'inactive' | 'error' | 'expired',
  error?: string
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (error) {
    updates.last_error = error
    updates.last_error_at = new Date().toISOString()
  }

  await supabase
    .from('integrations')
    .update(updates)
    .eq('workspace_id', workspaceId)
    .eq('provider', provider)

  // Invalidate cache
  invalidateCredentialsCache(workspaceId, provider)
}

/**
 * Mark integration as used (update last_used_at)
 */
export async function markIntegrationUsed(
  workspaceId: string,
  provider: string
): Promise<void> {
  await supabase
    .from('integrations')
    .update({ last_used_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)
    .eq('provider', provider)
}
