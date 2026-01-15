/**
 * API Client - HTTP client for backend communication
 *
 * This module provides a typed HTTP client for communicating with the backend API.
 * Features:
 * - Automatic auth header injection from Supabase session
 * - Retry logic with exponential backoff for transient failures
 * - Auto sign-out on 401 responses
 * - Request timeout handling
 * - Proper error types
 */

import { supabase } from '@/lib/supabase'
import type { ErrorCode } from '@/types/api'

// ============================================================================
// Configuration
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second base delay

// ============================================================================
// Types
// ============================================================================

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
  workspaceId?: string
  timeout?: number
  retry?: number
  signal?: AbortSignal
}

interface ApiErrorResponse {
  error?: string
  message?: string
  code?: string
  statusCode?: number
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  readonly statusCode: number
  readonly code: ErrorCode
  readonly retryable: boolean

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode = 'UNKNOWN_ERROR',
    retryable = false
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.retryable = retryable
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get auth header from current Supabase session
 */
async function getAuthHeader(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new ApiError('Not authenticated', 401, 'AUTH_REQUIRED')
  }

  return `Bearer ${session.access_token}`
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Map HTTP status code to error code
 */
function mapStatusToCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR'
    case 401:
      return 'AUTH_EXPIRED'
    case 403:
      return 'FORBIDDEN'
    case 404:
      return 'NOT_FOUND'
    case 409:
      return 'CONFLICT'
    case 429:
      return 'RATE_LIMITED'
    case 500:
    case 502:
    case 503:
    case 504:
      return 'SERVER_ERROR'
    default:
      return 'UNKNOWN_ERROR'
  }
}

/**
 * Check if error is retryable
 */
function isRetryable(status: number): boolean {
  // Retry on server errors and rate limits
  return status >= 500 || status === 429
}

// ============================================================================
// API Client
// ============================================================================

class ApiClient {
  /**
   * Make an authenticated API request
   */
  async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      workspaceId,
      timeout = DEFAULT_TIMEOUT,
      retry = MAX_RETRIES,
    } = options

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retry; attempt++) {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        // Build headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: await getAuthHeader(),
        }

        if (workspaceId) {
          headers['X-Workspace-Id'] = workspaceId
        }

        // Make request
        const response = await fetch(`${API_URL}${endpoint}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: options.signal ?? controller.signal,
        })

        clearTimeout(timeoutId)

        // Parse response
        const data = await response.json().catch(() => ({}))

        // Handle error responses
        if (!response.ok) {
          const errorData = data as ApiErrorResponse
          const message =
            errorData.error || errorData.message || 'Request failed'
          const code = mapStatusToCode(response.status)

          // Handle 401 - sign out user
          if (response.status === 401) {
            // Sign out in background, don't wait
            supabase.auth.signOut().catch(() => {})
            throw new ApiError(
              'Session expired. Please sign in again.',
              401,
              'AUTH_EXPIRED'
            )
          }

          // Handle rate limiting
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After')
            if (retryAfter && attempt < retry) {
              await sleep(parseInt(retryAfter, 10) * 1000)
              continue
            }
          }

          // Check if error is retryable
          const shouldRetry = isRetryable(response.status) && attempt < retry

          if (shouldRetry) {
            lastError = new ApiError(
              message,
              response.status,
              code,
              true
            )
            // Exponential backoff
            await sleep(RETRY_DELAY * Math.pow(2, attempt))
            continue
          }

          throw new ApiError(message, response.status, code, false)
        }

        return data as T
      } catch (error) {
        clearTimeout(timeoutId)

        // Handle abort errors (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ApiError(
            'Request timed out',
            0,
            'TIMEOUT',
            true
          )
        }

        // Handle network errors
        if (
          error instanceof TypeError &&
          error.message.includes('fetch')
        ) {
          if (attempt < retry) {
            lastError = new ApiError(
              'Network error. Retrying...',
              0,
              'NETWORK_ERROR',
              true
            )
            await sleep(RETRY_DELAY * Math.pow(2, attempt))
            continue
          }
          throw new ApiError(
            'Unable to connect to server',
            0,
            'NETWORK_ERROR',
            true
          )
        }

        // Re-throw ApiErrors
        if (error instanceof ApiError) {
          throw error
        }

        // Wrap other errors
        throw new ApiError(
          error instanceof Error ? error.message : 'Unknown error',
          0,
          'UNKNOWN_ERROR'
        )
      }
    }

    // Should not reach here, but just in case
    throw lastError || new ApiError('Request failed', 0, 'UNKNOWN_ERROR')
  }

  // ==========================================================================
  // Zoom Endpoints
  // ==========================================================================

  /**
   * Create a Zoom webinar
   */
  async createZoomWebinar(
    workspaceId: string,
    params: {
      topic: string
      startTime: string
      duration: number
      timezone: string
      agenda?: string
    }
  ) {
    return this.request<{
      success: boolean
      data: {
        id: string
        joinUrl: string
        startUrl: string
        registrationUrl: string
      }
    }>('/api/zoom/webinars', {
      method: 'POST',
      workspaceId,
      body: params,
    })
  }

  /**
   * Test Zoom connection
   */
  async testZoomConnection(workspaceId: string) {
    return this.request<{ success: boolean; message: string }>('/api/zoom/test', {
      method: 'POST',
      workspaceId,
    })
  }

  /**
   * Register for a Zoom webinar
   */
  async registerForZoomWebinar(
    workspaceId: string,
    params: {
      webinarId: string
      email: string
      firstName: string
      lastName?: string
      phone?: string
    }
  ) {
    return this.request<{
      success: boolean
      data: { registrantId: string; joinUrl: string }
    }>('/api/zoom/register', {
      method: 'POST',
      workspaceId,
      body: params,
    })
  }

  /**
   * Get Zoom webinar details
   */
  async getZoomWebinar(workspaceId: string, webinarId: string) {
    return this.request<{
      success: boolean
      data: Record<string, unknown>
    }>(`/api/zoom/webinars/${webinarId}`, {
      method: 'GET',
      workspaceId,
    })
  }

  /**
   * List Zoom webinar registrants
   */
  async listZoomRegistrants(workspaceId: string, webinarId: string) {
    return this.request<{
      success: boolean
      data: Array<Record<string, unknown>>
    }>(`/api/zoom/webinars/${webinarId}/registrants`, {
      method: 'GET',
      workspaceId,
    })
  }

  // ==========================================================================
  // GoHighLevel Endpoints
  // ==========================================================================

  /**
   * Test GHL connection
   */
  async testGHLConnection(workspaceId: string) {
    return this.request<{
      success: boolean
      message: string
      hasWebhook: boolean
      hasApi: boolean
    }>('/api/ghl/test', {
      method: 'POST',
      workspaceId,
    })
  }

  /**
   * Send data to GHL webhook
   */
  async sendToGHLWebhook(
    workspaceId: string,
    params: {
      name: string
      email: string
      phone?: string
      tag?: string
      webinarDateTime?: string
      webinarUrl?: string
    }
  ) {
    return this.request<{ success: boolean }>('/api/ghl/webhook', {
      method: 'POST',
      workspaceId,
      body: params,
    })
  }

  /**
   * Create or update a GHL contact
   */
  async createGHLContact(
    workspaceId: string,
    params: {
      email: string
      firstName?: string
      lastName?: string
      phone?: string
      tags?: string[]
    }
  ) {
    return this.request<{
      success: boolean
      data: { contactId: string }
    }>('/api/ghl/contacts', {
      method: 'POST',
      workspaceId,
      body: params,
    })
  }

  /**
   * Add tags to a GHL contact
   */
  async addGHLTags(
    workspaceId: string,
    params: {
      contactId: string
      tags: string[]
    }
  ) {
    return this.request<{ success: boolean }>('/api/ghl/contacts/tags', {
      method: 'POST',
      workspaceId,
      body: params,
    })
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const api = new ApiClient()

// ============================================================================
// Public (Unauthenticated) Functions
// ============================================================================

/**
 * Register for a webinar (public endpoint)
 */
export async function registerForWebinar(
  webinarIdOrSlug: string,
  params: {
    email: string
    firstName: string
    lastName?: string
    phone?: string
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
    utmTerm?: string
    utmContent?: string
  }
): Promise<{
  success: boolean
  message: string
  alreadyRegistered?: boolean
  data?: {
    registrantId: string
    webinarTitle: string
    webinarDate: string
    joinUrl: string | null
  }
}> {
  const response = await fetch(`${API_URL}/api/register/${webinarIdOrSlug}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(
      data.error || 'Registration failed',
      response.status,
      mapStatusToCode(response.status)
    )
  }

  return data
}

/**
 * Get public webinar info (for registration page)
 */
export async function getWebinarInfo(webinarIdOrSlug: string): Promise<{
  id: string
  title: string
  description: string | null
  scheduled_at: string
  duration_minutes: number
  timezone: string
  type: string
}> {
  const response = await fetch(`${API_URL}/api/register/${webinarIdOrSlug}`)
  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(
      data.error || 'Webinar not found',
      response.status,
      mapStatusToCode(response.status)
    )
  }

  return data.data
}
