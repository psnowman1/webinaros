/**
 * Webinar Hooks - Data fetching and mutations for webinars
 *
 * These hooks use the generic useQuery and useMutation hooks with
 * the webinar service to provide type-safe data operations.
 */

import { useCallback } from 'react'
import { useQuery, invalidateQueries } from './use-query'
import { useMutation } from './use-mutation'
import { webinarService } from '@/services/webinar.service'
import type { Webinar, WebinarInsert, WebinarUpdate } from '@/services/webinar.service'

// Re-export types for convenience
export type { Webinar, WebinarInsert, WebinarUpdate }

// ============================================================================
// Query Keys
// ============================================================================

export const webinarKeys = {
  all: 'webinars' as const,
  list: (workspaceId: string) => `webinars:${workspaceId}` as const,
  upcoming: (workspaceId: string) => `webinars:${workspaceId}:upcoming` as const,
  detail: (id: string) => `webinar:${id}` as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all webinars for a workspace
 */
export function useWebinars(workspaceId: string | undefined) {
  const queryFn = useCallback(
    () =>
      webinarService.list({
        workspaceId: workspaceId!,
      }),
    [workspaceId]
  )

  return useQuery({
    queryKey: workspaceId ? webinarKeys.list(workspaceId) : undefined,
    queryFn,
    enabled: !!workspaceId,
    staleTime: 30000, // 30 seconds
    retry: 2,
  })
}

/**
 * Fetch upcoming webinars for a workspace
 */
export function useUpcomingWebinars(
  workspaceId: string | undefined,
  limit = 5
) {
  const queryFn = useCallback(
    () => webinarService.listUpcoming(workspaceId!, limit),
    [workspaceId, limit]
  )

  return useQuery({
    queryKey: workspaceId ? webinarKeys.upcoming(workspaceId) : undefined,
    queryFn,
    enabled: !!workspaceId,
    staleTime: 60000, // 1 minute
    retry: 2,
  })
}

/**
 * Fetch a single webinar by ID
 */
export function useWebinar(id: string | undefined) {
  const queryFn = useCallback(() => webinarService.getById(id!), [id])

  return useQuery({
    queryKey: id ? webinarKeys.detail(id) : undefined,
    queryFn,
    enabled: !!id,
    staleTime: 30000,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new webinar
 */
export function useCreateWebinar(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: (webinar: Omit<WebinarInsert, 'workspace_id'>) =>
      webinarService.create({
        ...webinar,
        workspace_id: workspaceId!,
      }),
    onSuccess: () => {
      // Invalidate webinar lists
      if (workspaceId) {
        invalidateQueries(webinarKeys.list(workspaceId))
        invalidateQueries(webinarKeys.upcoming(workspaceId))
      }
    },
  })
}

/**
 * Update an existing webinar
 */
export function useUpdateWebinar() {
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: WebinarUpdate }) =>
      webinarService.update(id, updates),
    onSuccess: (data) => {
      // Invalidate the specific webinar and lists
      invalidateQueries(webinarKeys.detail(data.id))
      invalidateQueries(webinarKeys.all)
    },
  })
}

/**
 * Delete a webinar
 */
export function useDeleteWebinar(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: (id: string) => webinarService.delete(id),
    onSuccess: () => {
      // Invalidate all webinar queries for this workspace
      if (workspaceId) {
        invalidateQueries(webinarKeys.list(workspaceId))
        invalidateQueries(webinarKeys.upcoming(workspaceId))
      }
    },
  })
}

/**
 * Update webinar status
 */
export function useUpdateWebinarStatus() {
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: Webinar['status']
    }) => webinarService.updateStatus(id, status),
    onSuccess: (data) => {
      invalidateQueries(webinarKeys.detail(data.id))
      invalidateQueries(webinarKeys.all)
    },
  })
}

// ============================================================================
// Stats Hook
// ============================================================================

/**
 * Fetch webinar statistics for a workspace
 */
export function useWebinarStats(workspaceId: string | undefined) {
  const queryFn = useCallback(
    () => webinarService.getStats(workspaceId!),
    [workspaceId]
  )

  return useQuery({
    queryKey: workspaceId ? `webinar-stats:${workspaceId}` : undefined,
    queryFn,
    enabled: !!workspaceId,
    staleTime: 60000, // 1 minute
  })
}
