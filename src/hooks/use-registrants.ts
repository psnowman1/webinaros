/**
 * Registrant Hooks - Data fetching and mutations for registrants
 *
 * These hooks use the generic useQuery and useMutation hooks with
 * the registrant service to provide type-safe data operations.
 */

import { useCallback } from 'react'
import { useQuery, invalidateQueries } from './use-query'
import { useMutation } from './use-mutation'
import { registrantService } from '@/services/registrant.service'
import type {
  Registrant,
  RegistrantInsert,
  RegistrantUpdate,
} from '@/services/registrant.service'

// Re-export types for convenience
export type { Registrant, RegistrantInsert, RegistrantUpdate }

// ============================================================================
// Query Keys
// ============================================================================

export const registrantKeys = {
  all: 'registrants' as const,
  list: (workspaceId: string) => `registrants:${workspaceId}` as const,
  byWebinar: (webinarId: string) => `registrants:webinar:${webinarId}` as const,
  recent: (workspaceId: string) => `registrants:${workspaceId}:recent` as const,
  detail: (id: string) => `registrant:${id}` as const,
  stats: (workspaceId: string, webinarId?: string) =>
    `registrant-stats:${workspaceId}${webinarId ? `:${webinarId}` : ''}` as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch registrants for a workspace, optionally filtered by webinar
 */
export function useRegistrants(
  workspaceId: string | undefined,
  webinarId?: string
) {
  const queryFn = useCallback(
    () =>
      registrantService.list({
        workspaceId: workspaceId!,
        webinarId,
      }),
    [workspaceId, webinarId]
  )

  const queryKey = webinarId
    ? registrantKeys.byWebinar(webinarId)
    : workspaceId
      ? registrantKeys.list(workspaceId)
      : undefined

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!workspaceId,
    staleTime: 30000, // 30 seconds
    retry: 2,
  })
}

/**
 * Fetch registrants for a specific webinar
 */
export function useWebinarRegistrants(webinarId: string | undefined) {
  const queryFn = useCallback(
    () =>
      registrantService.list({
        workspaceId: '', // Will be filtered by webinar
        webinarId: webinarId!,
      }),
    [webinarId]
  )

  return useQuery({
    queryKey: webinarId ? registrantKeys.byWebinar(webinarId) : undefined,
    queryFn,
    enabled: !!webinarId,
    staleTime: 30000,
    retry: 2,
  })
}

/**
 * Fetch recent registrations for a workspace
 */
export function useRecentRegistrants(
  workspaceId: string | undefined,
  limit = 10
) {
  const queryFn = useCallback(
    () => registrantService.listRecent(workspaceId!, limit),
    [workspaceId, limit]
  )

  return useQuery({
    queryKey: workspaceId ? registrantKeys.recent(workspaceId) : undefined,
    queryFn,
    enabled: !!workspaceId,
    staleTime: 30000,
    retry: 2,
  })
}

/**
 * Fetch a single registrant by ID
 */
export function useRegistrant(id: string | undefined) {
  const queryFn = useCallback(() => registrantService.getById(id!), [id])

  return useQuery({
    queryKey: id ? registrantKeys.detail(id) : undefined,
    queryFn,
    enabled: !!id,
    staleTime: 30000,
  })
}

/**
 * Fetch registrant statistics
 */
export function useRegistrantStats(
  workspaceId: string | undefined,
  webinarId?: string
) {
  const queryFn = useCallback(
    () => registrantService.getStats(workspaceId!, webinarId),
    [workspaceId, webinarId]
  )

  return useQuery({
    queryKey: workspaceId
      ? registrantKeys.stats(workspaceId, webinarId)
      : undefined,
    queryFn,
    enabled: !!workspaceId,
    staleTime: 60000, // 1 minute
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new registrant
 */
export function useCreateRegistrant(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: (registrant: Omit<RegistrantInsert, 'workspace_id'>) =>
      registrantService.create({
        ...registrant,
        workspace_id: workspaceId!,
      }),
    onSuccess: (data) => {
      if (workspaceId) {
        invalidateQueries(registrantKeys.list(workspaceId))
        invalidateQueries(registrantKeys.recent(workspaceId))
        invalidateQueries(registrantKeys.stats(workspaceId))
      }
      invalidateQueries(registrantKeys.byWebinar(data.webinar_id))
    },
  })
}

/**
 * Update a registrant
 */
export function useUpdateRegistrant(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: RegistrantUpdate }) =>
      registrantService.update(id, updates),
    onSuccess: (data) => {
      invalidateQueries(registrantKeys.detail(data.id))
      invalidateQueries(registrantKeys.byWebinar(data.webinar_id))
      if (workspaceId) {
        invalidateQueries(registrantKeys.list(workspaceId))
        invalidateQueries(registrantKeys.stats(workspaceId))
      }
    },
  })
}

/**
 * Mark registrant as attended
 */
export function useMarkAttended(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: (id: string) => registrantService.markAttended(id),
    onSuccess: (data) => {
      invalidateQueries(registrantKeys.detail(data.id))
      invalidateQueries(registrantKeys.byWebinar(data.webinar_id))
      if (workspaceId) {
        invalidateQueries(registrantKeys.stats(workspaceId))
      }
    },
  })
}

/**
 * Mark registrant as no-show
 */
export function useMarkNoShow(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: (id: string) => registrantService.markNoShow(id),
    onSuccess: (data) => {
      invalidateQueries(registrantKeys.detail(data.id))
      invalidateQueries(registrantKeys.byWebinar(data.webinar_id))
      if (workspaceId) {
        invalidateQueries(registrantKeys.stats(workspaceId))
      }
    },
  })
}

/**
 * Record a purchase for a registrant
 */
export function useRecordPurchase(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: ({
      id,
      amount,
      stripePaymentId,
    }: {
      id: string
      amount: number
      stripePaymentId?: string
    }) => registrantService.recordPurchase(id, amount, stripePaymentId),
    onSuccess: (data) => {
      invalidateQueries(registrantKeys.detail(data.id))
      invalidateQueries(registrantKeys.byWebinar(data.webinar_id))
      if (workspaceId) {
        invalidateQueries(registrantKeys.stats(workspaceId))
      }
    },
  })
}

/**
 * Update Zoom sync data
 */
export function useUpdateZoomSync() {
  return useMutation({
    mutationFn: ({
      id,
      zoomRegistrantId,
      zoomJoinUrl,
    }: {
      id: string
      zoomRegistrantId: string
      zoomJoinUrl: string
    }) =>
      registrantService.updateZoomSync(id, {
        zoom_registrant_id: zoomRegistrantId,
        zoom_join_url: zoomJoinUrl,
      }),
    onSuccess: (data) => {
      invalidateQueries(registrantKeys.detail(data.id))
    },
  })
}

/**
 * Update GHL sync data
 */
export function useUpdateGhlSync() {
  return useMutation({
    mutationFn: ({ id, contactId }: { id: string; contactId: string }) =>
      registrantService.updateGhlSync(id, contactId),
    onSuccess: (data) => {
      invalidateQueries(registrantKeys.detail(data.id))
    },
  })
}

/**
 * Delete a registrant
 */
export function useDeleteRegistrant(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: (id: string) => registrantService.delete(id),
    onSuccess: () => {
      if (workspaceId) {
        invalidateQueries(registrantKeys.list(workspaceId))
        invalidateQueries(registrantKeys.recent(workspaceId))
        invalidateQueries(registrantKeys.stats(workspaceId))
      }
      // Note: We don't know the webinar_id here, so we invalidate all webinar registrant queries
      invalidateQueries(registrantKeys.all)
    },
  })
}
