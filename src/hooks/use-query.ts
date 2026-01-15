/**
 * useQuery - Generic data fetching hook
 *
 * This hook provides a consistent pattern for data fetching with:
 * - Automatic loading states
 * - Error handling with retry logic
 * - Stale data detection
 * - Request cancellation on unmount
 * - Conditional fetching
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { QueryState, ApiError, Result } from '@/types/api'
import { initialQueryState, toApiError } from '@/types/api'

// ============================================================================
// Types
// ============================================================================

/**
 * Options for the useQuery hook
 */
export interface UseQueryOptions<TData> {
  /**
   * Function that returns a Promise<Result<TData>>
   * This should be a stable reference (wrapped in useCallback if needed)
   */
  queryFn: () => Promise<Result<TData>>

  /**
   * Key to identify this query (used for caching and deduplication)
   * If not provided, the query will be executed on every mount
   */
  queryKey?: string

  /**
   * Whether the query should be executed
   * Useful for conditional fetching (e.g., wait for a user ID)
   */
  enabled?: boolean

  /**
   * Time in milliseconds before data is considered stale
   * Default: 0 (always stale)
   */
  staleTime?: number

  /**
   * Number of retry attempts for failed queries
   * Default: 0 (no retries)
   */
  retry?: number

  /**
   * Delay between retries in milliseconds
   * Will use exponential backoff: retryDelay * 2^attempt
   * Default: 1000ms
   */
  retryDelay?: number

  /**
   * Callback when query succeeds
   */
  onSuccess?: (data: TData) => void

  /**
   * Callback when query fails
   */
  onError?: (error: ApiError) => void

  /**
   * Whether to refetch when the window regains focus
   * Default: false
   */
  refetchOnWindowFocus?: boolean

  /**
   * Interval in milliseconds to refetch data
   * Default: undefined (no interval)
   */
  refetchInterval?: number
}

/**
 * Return type for useQuery hook
 */
export interface UseQueryResult<TData> extends QueryState<TData> {
  /** Manually refetch the data */
  refetch: () => Promise<void>
  /** Reset the query state */
  reset: () => void
}

// ============================================================================
// Simple cache for query results
// ============================================================================

interface CacheEntry<TData> {
  data: TData
  timestamp: number
}

const queryCache = new Map<string, CacheEntry<unknown>>()

function getCached<TData>(key: string, staleTime: number): TData | null {
  const entry = queryCache.get(key) as CacheEntry<TData> | undefined
  if (!entry) return null

  const isStale = Date.now() - entry.timestamp > staleTime
  if (isStale) return null

  return entry.data
}

function setCache<TData>(key: string, data: TData): void {
  queryCache.set(key, { data, timestamp: Date.now() })
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useQuery<TData>(
  options: UseQueryOptions<TData>
): UseQueryResult<TData> {
  const {
    queryFn,
    queryKey,
    enabled = true,
    staleTime = 0,
    retry = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
    refetchOnWindowFocus = false,
    refetchInterval,
  } = options

  // State
  const [state, setState] = useState<QueryState<TData>>(() => {
    // Check cache for initial data
    if (queryKey) {
      const cached = getCached<TData>(queryKey, staleTime)
      if (cached) {
        return {
          data: cached,
          isLoading: false,
          error: null,
          isStale: false,
          isFetched: true,
        }
      }
    }
    return initialQueryState<TData>()
  })

  // Refs for cleanup and retry tracking
  const isMountedRef = useRef(true)
  const retryCountRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Execute the query
   */
  const execute = useCallback(async () => {
    // Cancel any in-flight request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }))

    try {
      const result = await queryFn()

      // Check if component is still mounted
      if (!isMountedRef.current) return

      if (result.success) {
        // Reset retry count on success
        retryCountRef.current = 0

        // Update cache if we have a query key
        if (queryKey) {
          setCache(queryKey, result.data)
        }

        setState({
          data: result.data,
          isLoading: false,
          error: null,
          isStale: false,
          isFetched: true,
        })

        onSuccess?.(result.data)
      } else {
        const apiError = toApiError(result.error)

        // Retry logic
        if (retryCountRef.current < retry && apiError.retryable !== false) {
          retryCountRef.current++
          const delay = retryDelay * Math.pow(2, retryCountRef.current - 1)

          setTimeout(() => {
            if (isMountedRef.current) {
              execute()
            }
          }, delay)

          return
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: apiError,
          isFetched: true,
        }))

        onError?.(apiError)
      }
    } catch (error) {
      if (!isMountedRef.current) return

      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      const apiError = toApiError(error)

      // Retry logic for unexpected errors
      if (retryCountRef.current < retry) {
        retryCountRef.current++
        const delay = retryDelay * Math.pow(2, retryCountRef.current - 1)

        setTimeout(() => {
          if (isMountedRef.current) {
            execute()
          }
        }, delay)

        return
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: apiError,
        isFetched: true,
      }))

      onError?.(apiError)
    }
  }, [queryFn, queryKey, retry, retryDelay, onSuccess, onError])

  /**
   * Refetch function exposed to consumers
   */
  const refetch = useCallback(async () => {
    retryCountRef.current = 0
    await execute()
  }, [execute])

  /**
   * Reset function to clear state
   */
  const reset = useCallback(() => {
    setState(initialQueryState<TData>())
    retryCountRef.current = 0
  }, [])

  // Initial fetch and refetch on dependency changes
  useEffect(() => {
    isMountedRef.current = true

    if (enabled) {
      // Check if we need to fetch or if we have fresh cached data
      if (queryKey) {
        const cached = getCached<TData>(queryKey, staleTime)
        if (cached && state.data === cached) {
          // Data is still fresh, don't refetch
          return
        }
      }
      execute()
    } else {
      // Reset loading state if disabled
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }))
    }

    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [enabled, queryKey, execute, staleTime, state.data])

  // Window focus refetching
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return

    const handleFocus = () => {
      if (isMountedRef.current) {
        refetch()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnWindowFocus, enabled, refetch])

  // Interval refetching
  useEffect(() => {
    if (!refetchInterval || !enabled) return

    const intervalId = setInterval(() => {
      if (isMountedRef.current) {
        refetch()
      }
    }, refetchInterval)

    return () => clearInterval(intervalId)
  }, [refetchInterval, enabled, refetch])

  return {
    ...state,
    refetch,
    reset,
  }
}

// ============================================================================
// Utility: Clear query cache
// ============================================================================

/**
 * Clear the entire query cache
 */
export function clearQueryCache(): void {
  queryCache.clear()
}

/**
 * Invalidate a specific query key (remove from cache)
 */
export function invalidateQuery(queryKey: string): void {
  queryCache.delete(queryKey)
}

/**
 * Invalidate queries matching a prefix
 */
export function invalidateQueries(prefix: string): void {
  for (const key of queryCache.keys()) {
    if (key.startsWith(prefix)) {
      queryCache.delete(key)
    }
  }
}
