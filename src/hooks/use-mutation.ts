/**
 * useMutation - Generic mutation hook
 *
 * This hook provides a consistent pattern for data mutations with:
 * - Loading states
 * - Error handling
 * - Success/error callbacks
 * - Automatic cache invalidation
 */

import { useState, useCallback, useRef } from 'react'
import type { MutationState, ApiError, Result } from '@/types/api'
import { initialMutationState, toApiError } from '@/types/api'
import { invalidateQueries } from './use-query'

// ============================================================================
// Types
// ============================================================================

/**
 * Options for the useMutation hook
 */
export interface UseMutationOptions<TData, TVariables> {
  /**
   * Function that performs the mutation
   */
  mutationFn: (variables: TVariables) => Promise<Result<TData>>

  /**
   * Callback when mutation succeeds
   */
  onSuccess?: (data: TData, variables: TVariables) => void

  /**
   * Callback when mutation fails
   */
  onError?: (error: ApiError, variables: TVariables) => void

  /**
   * Callback that runs regardless of success or failure
   */
  onSettled?: (
    data: TData | null,
    error: ApiError | null,
    variables: TVariables
  ) => void

  /**
   * Query keys to invalidate on success
   * Can be an array of keys or a function that returns keys
   */
  invalidateQueries?: string[] | ((variables: TVariables) => string[])
}

/**
 * Return type for useMutation hook
 */
export interface UseMutationResult<TData, TVariables>
  extends MutationState<TData> {
  /** Execute the mutation */
  mutate: (variables: TVariables) => Promise<Result<TData>>
  /** Execute the mutation and return a promise */
  mutateAsync: (variables: TVariables) => Promise<TData>
  /** Reset the mutation state */
  reset: () => void
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useMutation<TData, TVariables = void>(
  options: UseMutationOptions<TData, TVariables>
): UseMutationResult<TData, TVariables> {
  const {
    mutationFn,
    onSuccess,
    onError,
    onSettled,
    invalidateQueries: queriesToInvalidate,
  } = options

  const [state, setState] = useState<MutationState<TData>>(
    initialMutationState<TData>()
  )

  // Ref to track if component is mounted
  const isMountedRef = useRef(true)

  /**
   * Reset mutation state
   */
  const reset = useCallback(() => {
    setState(initialMutationState<TData>())
  }, [])

  /**
   * Execute the mutation
   */
  const mutate = useCallback(
    async (variables: TVariables): Promise<Result<TData>> => {
      setState({
        isLoading: true,
        error: null,
        data: null,
        isSuccess: false,
        isError: false,
      })

      try {
        const result = await mutationFn(variables)

        if (!isMountedRef.current) {
          return result
        }

        if (result.success) {
          setState({
            isLoading: false,
            error: null,
            data: result.data,
            isSuccess: true,
            isError: false,
          })

          // Invalidate queries
          if (queriesToInvalidate) {
            const keys =
              typeof queriesToInvalidate === 'function'
                ? queriesToInvalidate(variables)
                : queriesToInvalidate

            keys.forEach((key) => invalidateQueries(key))
          }

          onSuccess?.(result.data, variables)
          onSettled?.(result.data, null, variables)
        } else {
          const apiError = toApiError(result.error)

          setState({
            isLoading: false,
            error: apiError,
            data: null,
            isSuccess: false,
            isError: true,
          })

          onError?.(apiError, variables)
          onSettled?.(null, apiError, variables)
        }

        return result
      } catch (error) {
        if (!isMountedRef.current) {
          return { success: false, error: error as Error }
        }

        const apiError = toApiError(error)

        setState({
          isLoading: false,
          error: apiError,
          data: null,
          isSuccess: false,
          isError: true,
        })

        onError?.(apiError, variables)
        onSettled?.(null, apiError, variables)

        return { success: false, error: error as Error }
      }
    },
    [mutationFn, onSuccess, onError, onSettled, queriesToInvalidate]
  )

  /**
   * Execute the mutation and throw on error
   * Useful when you want to use try/catch
   */
  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      const result = await mutate(variables)

      if (!result.success) {
        throw result.error
      }

      return result.data
    },
    [mutate]
  )

  // Cleanup on unmount
  // Note: We use useEffect with empty deps instead of useLayoutEffect
  // to avoid SSR issues
  useState(() => {
    return () => {
      isMountedRef.current = false
    }
  })

  return {
    ...state,
    mutate,
    mutateAsync,
    reset,
  }
}

// ============================================================================
// Convenience Types
// ============================================================================

/**
 * Extract the data type from a mutation result
 */
export type MutationData<T> = T extends UseMutationResult<infer D, unknown>
  ? D
  : never

/**
 * Extract the variables type from a mutation result
 */
export type MutationVariables<T> = T extends UseMutationResult<unknown, infer V>
  ? V
  : never
