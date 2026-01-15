/**
 * Supabase Data Hooks - DEPRECATED
 *
 * This file is deprecated and maintained only for backwards compatibility.
 * Please use the new typed hooks instead:
 *
 * - useWebinars, useWebinar, useCreateWebinar, etc. from './use-webinars'
 * - useIntegrations, useCreateIntegration, etc. from './use-integrations'
 * - useRegistrants, useCreateRegistrant, etc. from './use-registrants'
 *
 * The new hooks provide:
 * - Full TypeScript type safety (no `any` types)
 * - Retry logic with exponential backoff
 * - Stale data detection
 * - Proper error handling with ApiError types
 * - Query caching and invalidation
 *
 * @deprecated Use entity-specific hooks from '@/hooks' instead
 */

import { useCallback } from 'react'
import { useWebinars, useWebinar, useCreateWebinar, useUpdateWebinar, useDeleteWebinar } from './use-webinars'
import { useIntegrations, useCreateIntegration, useUpdateIntegration } from './use-integrations'
import { useRegistrants, useCreateRegistrant } from './use-registrants'
import { useCurrentWorkspaceId } from '@/contexts/auth-context'
import type { Webinar, Registrant, Integration } from '@/types/database'

// ============================================================================
// Backwards Compatibility Layer
// ============================================================================

/**
 * @deprecated Use useWebinars from './use-webinars' instead
 */
export function useWebinarsLegacy() {
  const workspaceId = useCurrentWorkspaceId()
  const result = useWebinars(workspaceId)

  return {
    webinars: (result.data ?? []) as Webinar[],
    isLoading: result.isLoading,
    error: result.error ? new Error(result.error.message) : null,
    refetch: result.refetch,
  }
}

/**
 * @deprecated Use useWebinar from './use-webinars' instead
 */
export function useWebinarLegacy(id: string | undefined) {
  const result = useWebinar(id)

  return {
    webinar: result.data as Webinar | null,
    isLoading: result.isLoading,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * @deprecated Use useRegistrants from './use-registrants' instead
 */
export function useRegistrantsLegacy(webinarId?: string) {
  const workspaceId = useCurrentWorkspaceId()
  const result = useRegistrants(workspaceId, webinarId)

  return {
    registrants: (result.data ?? []) as Registrant[],
    isLoading: result.isLoading,
    error: result.error ? new Error(result.error.message) : null,
    refetch: result.refetch,
  }
}

/**
 * @deprecated Use useIntegrations from './use-integrations' instead
 */
export function useIntegrationsLegacy() {
  const workspaceId = useCurrentWorkspaceId()
  const result = useIntegrations(workspaceId)
  const createMutation = useCreateIntegration(workspaceId)
  const updateMutation = useUpdateIntegration(workspaceId)

  const createIntegration = useCallback(
    async (integration: Omit<Integration, 'id' | 'created_at' | 'updated_at' | 'workspace_id'>) => {
      const res = await createMutation.mutate(integration as Parameters<typeof createMutation.mutate>[0])
      return {
        data: res.success ? res.data : null,
        error: res.success ? null : new Error(String(res.error)),
      }
    },
    [createMutation]
  )

  const updateIntegration = useCallback(
    async (id: string, updates: Partial<Integration>) => {
      const res = await updateMutation.mutate({ id, updates })
      return { error: res.success ? null : new Error(String(res.error)) }
    },
    [updateMutation]
  )

  return {
    integrations: (result.data ?? []) as Integration[],
    isLoading: result.isLoading,
    error: result.error ? new Error(result.error.message) : null,
    refetch: result.refetch,
    createIntegration,
    updateIntegration,
  }
}

/**
 * @deprecated Use useCreateWebinar from './use-webinars' instead
 */
export function useCreateWebinarLegacy() {
  const workspaceId = useCurrentWorkspaceId()
  const mutation = useCreateWebinar(workspaceId)

  const createWebinar = useCallback(
    async (webinar: Partial<Webinar>) => {
      const res = await mutation.mutate(webinar as Parameters<typeof mutation.mutate>[0])
      return {
        data: res.success ? res.data : null,
        error: res.success ? null : new Error(String(res.error)),
      }
    },
    [mutation]
  )

  return {
    createWebinar,
    isLoading: mutation.isLoading,
    error: mutation.error ? new Error(mutation.error.message) : null,
  }
}

/**
 * @deprecated Use useUpdateWebinar from './use-webinars' instead
 */
export function useUpdateWebinarLegacy() {
  const mutation = useUpdateWebinar()

  const updateWebinar = useCallback(
    async (id: string, updates: Partial<Webinar>) => {
      const res = await mutation.mutate({ id, updates })
      return {
        data: res.success ? res.data : null,
        error: res.success ? null : new Error(String(res.error)),
      }
    },
    [mutation]
  )

  return {
    updateWebinar,
    isLoading: mutation.isLoading,
    error: mutation.error ? new Error(mutation.error.message) : null,
  }
}

/**
 * @deprecated Use useDeleteWebinar from './use-webinars' instead
 */
export function useDeleteWebinarLegacy() {
  const workspaceId = useCurrentWorkspaceId()
  const mutation = useDeleteWebinar(workspaceId)

  const deleteWebinar = useCallback(
    async (id: string) => {
      const res = await mutation.mutate(id)
      return { error: res.success ? null : new Error(String(res.error)) }
    },
    [mutation]
  )

  return {
    deleteWebinar,
    isLoading: mutation.isLoading,
    error: mutation.error ? new Error(mutation.error.message) : null,
  }
}

/**
 * @deprecated Use useCreateRegistrant from './use-registrants' instead
 */
export function useCreateRegistrantLegacy() {
  const workspaceId = useCurrentWorkspaceId()
  const mutation = useCreateRegistrant(workspaceId)

  const createRegistrant = useCallback(
    async (registrant: Partial<Registrant>) => {
      const res = await mutation.mutate(registrant as Parameters<typeof mutation.mutate>[0])
      return {
        data: res.success ? res.data : null,
        error: res.success ? null : new Error(String(res.error)),
      }
    },
    [mutation]
  )

  return {
    createRegistrant,
    isLoading: mutation.isLoading,
    error: mutation.error ? new Error(mutation.error.message) : null,
  }
}

// ============================================================================
// Original Export Names (for backwards compatibility)
// ============================================================================

// These are the original function names - now aliased to legacy versions
// Eventually these should be removed and pages should use new hooks directly

export {
  useWebinarsLegacy as useWebinars,
  useWebinarLegacy as useWebinar,
  useRegistrantsLegacy as useRegistrants,
  useIntegrationsLegacy as useIntegrations,
  useCreateWebinarLegacy as useCreateWebinar,
  useUpdateWebinarLegacy as useUpdateWebinar,
  useDeleteWebinarLegacy as useDeleteWebinar,
  useCreateRegistrantLegacy as useCreateRegistrant,
}
