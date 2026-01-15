/**
 * API Types - Standard result patterns and error handling
 *
 * This file defines the core types used throughout the application for
 * consistent error handling and data fetching patterns.
 */

// ============================================================================
// Result Pattern
// ============================================================================

/**
 * A discriminated union representing either success or failure.
 * This pattern eliminates the need for try/catch in most cases and
 * forces explicit handling of both success and error states.
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Helper to create a successful result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data }
}

/**
 * Helper to create a failed result
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error }
}

// ============================================================================
// API Error
// ============================================================================

/**
 * Standard error codes used across the application.
 * These provide machine-readable error identification.
 */
export type ErrorCode =
  // Authentication
  | 'AUTH_REQUIRED'
  | 'AUTH_EXPIRED'
  | 'AUTH_INVALID'
  | 'EMAIL_NOT_CONFIRMED'
  // Authorization
  | 'FORBIDDEN'
  | 'WORKSPACE_ACCESS_DENIED'
  // Resources
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'CONFLICT'
  // Validation
  | 'VALIDATION_ERROR'
  | 'INVALID_INPUT'
  // Rate limiting
  | 'RATE_LIMITED'
  // Server errors
  | 'SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'TIMEOUT'
  // Network
  | 'NETWORK_ERROR'
  | 'OFFLINE'
  // Generic
  | 'UNKNOWN_ERROR'

/**
 * Structured error type used across the application.
 * All API errors should conform to this interface.
 * Implements Error interface for compatibility.
 */
export interface ApiError extends Error {
  /** Machine-readable error code */
  code: ErrorCode
  /** Human-readable error message suitable for display to users */
  message: string
  /** Error name (required by Error interface) */
  name: string
  /** HTTP status code if applicable */
  statusCode?: number
  /** Additional context for debugging (not shown to users) */
  details?: unknown
  /** Whether the client should retry the request */
  retryable: boolean
  /** Seconds to wait before retrying (for rate limits) */
  retryAfter?: number
}

/**
 * Create a standard API error
 */
export function createApiError(
  code: ErrorCode,
  message: string,
  options: Partial<Omit<ApiError, 'code' | 'message' | 'name'>> = {}
): ApiError {
  return {
    name: 'ApiError',
    code,
    message,
    retryable: options.retryable ?? false,
    ...options,
  }
}

/**
 * Convert an unknown error to an ApiError
 */
export function toApiError(error: unknown): ApiError {
  // Already an ApiError
  if (isApiError(error)) {
    return error
  }

  // Supabase error
  if (isSupabaseError(error)) {
    return createApiError(
      mapSupabaseErrorCode(error.code),
      error.message,
      { statusCode: error.status, details: error }
    )
  }

  // Standard Error
  if (error instanceof Error) {
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return createApiError('NETWORK_ERROR', 'Unable to connect to server', {
        retryable: true,
        details: error,
      })
    }

    // Abort errors (timeout)
    if (error.name === 'AbortError') {
      return createApiError('TIMEOUT', 'Request timed out', {
        retryable: true,
        details: error,
      })
    }

    return createApiError('UNKNOWN_ERROR', error.message, { details: error })
  }

  // Unknown error type
  return createApiError('UNKNOWN_ERROR', 'An unexpected error occurred', {
    details: error,
  })
}

/**
 * Type guard for ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    'code' in error &&
    'message' in error &&
    'retryable' in error
  )
}

// ============================================================================
// Supabase Error Handling
// ============================================================================

interface SupabaseError {
  message: string
  code?: string
  status?: number
}

function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as SupabaseError).message === 'string'
  )
}

function mapSupabaseErrorCode(code: string | undefined): ErrorCode {
  switch (code) {
    case 'PGRST116': // Row not found
    case '22P02': // Invalid UUID
      return 'NOT_FOUND'
    case 'PGRST301': // JWT expired
    case 'PGRST302': // JWT invalid
      return 'AUTH_EXPIRED'
    case '23505': // Unique violation
      return 'ALREADY_EXISTS'
    case '23503': // Foreign key violation
      return 'VALIDATION_ERROR'
    case '42501': // RLS policy violation
      return 'FORBIDDEN'
    default:
      return 'UNKNOWN_ERROR'
  }
}

// ============================================================================
// Query State
// ============================================================================

/**
 * State for data fetching operations
 */
export interface QueryState<T> {
  /** The fetched data, or null if not yet loaded */
  data: T | null
  /** Whether a fetch is currently in progress */
  isLoading: boolean
  /** Error from the last fetch attempt */
  error: ApiError | null
  /** Whether the cached data is stale */
  isStale: boolean
  /** Whether the query has been executed at least once */
  isFetched: boolean
}

/**
 * Initial state for a query
 */
export function initialQueryState<T>(): QueryState<T> {
  return {
    data: null,
    isLoading: false,
    error: null,
    isStale: true,
    isFetched: false,
  }
}

// ============================================================================
// Mutation State
// ============================================================================

/**
 * State for mutation operations
 */
export interface MutationState<TData = unknown> {
  /** Whether a mutation is currently in progress */
  isLoading: boolean
  /** Error from the last mutation attempt */
  error: ApiError | null
  /** Data from the last successful mutation */
  data: TData | null
  /** Whether the mutation has been executed at least once */
  isSuccess: boolean
  /** Whether the last mutation failed */
  isError: boolean
}

/**
 * Initial state for a mutation
 */
export function initialMutationState<TData>(): MutationState<TData> {
  return {
    isLoading: false,
    error: null,
    data: null,
    isSuccess: false,
    isError: false,
  }
}
