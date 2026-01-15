/**
 * Integration Hooks - Data fetching and mutations for integrations
 *
 * These hooks use the generic useQuery and useMutation hooks with
 * the integration service to provide type-safe data operations.
 */

import { useCallback } from 'react'
import { useQuery, invalidateQueries } from './use-query'
import { useMutation } from './use-mutation'
import { integrationService } from '@/services/integration.service'
import type {
  Integration,
  IntegrationInsert,
  IntegrationUpdate,
  IntegrationProvider,
} from '@/services/integration.service'

// Re-export types for convenience
export type { Integration, IntegrationInsert, IntegrationUpdate, IntegrationProvider }

// ============================================================================
// Query Keys
// ============================================================================

export const integrationKeys = {
  all: 'integrations' as const,
  list: (workspaceId: string) => `integrations:${workspaceId}` as const,
  byProvider: (workspaceId: string, provider: string) =>
    `integration:${workspaceId}:${provider}` as const,
  detail: (id: string) => `integration:${id}` as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all integrations for a workspace
 */
export function useIntegrations(workspaceId: string | undefined) {
  const queryFn = useCallback(
    () => integrationService.list(workspaceId!),
    [workspaceId]
  )

  return useQuery({
    queryKey: workspaceId ? integrationKeys.list(workspaceId) : undefined,
    queryFn,
    enabled: !!workspaceId,
    staleTime: 60000, // 1 minute - integrations don't change often
    retry: 2,
  })
}

/**
 * Fetch a specific integration by provider
 */
export function useIntegrationByProvider(
  workspaceId: string | undefined,
  provider: IntegrationProvider | undefined
) {
  const queryFn = useCallback(
    () => integrationService.getByProvider(workspaceId!, provider!),
    [workspaceId, provider]
  )

  return useQuery({
    queryKey:
      workspaceId && provider
        ? integrationKeys.byProvider(workspaceId, provider)
        : undefined,
    queryFn,
    enabled: !!workspaceId && !!provider,
    staleTime: 60000,
  })
}

/**
 * Fetch a specific integration by ID
 */
export function useIntegration(id: string | undefined) {
  const queryFn = useCallback(() => integrationService.getById(id!), [id])

  return useQuery({
    queryKey: id ? integrationKeys.detail(id) : undefined,
    queryFn,
    enabled: !!id,
    staleTime: 60000,
  })
}

/**
 * Check if an integration is connected
 */
export function useIsIntegrationConnected(
  workspaceId: string | undefined,
  provider: IntegrationProvider | undefined
) {
  const queryFn = useCallback(
    () => integrationService.isConnected(workspaceId!, provider!),
    [workspaceId, provider]
  )

  return useQuery({
    queryKey:
      workspaceId && provider
        ? `integration-connected:${workspaceId}:${provider}`
        : undefined,
    queryFn,
    enabled: !!workspaceId && !!provider,
    staleTime: 60000,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new integration
 */
export function useCreateIntegration(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: (integration: Omit<IntegrationInsert, 'workspace_id'>) =>
      integrationService.create({
        ...integration,
        workspace_id: workspaceId!,
      }),
    onSuccess: () => {
      if (workspaceId) {
        invalidateQueries(integrationKeys.list(workspaceId))
      }
    },
  })
}

/**
 * Update an integration
 */
export function useUpdateIntegration(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: IntegrationUpdate }) =>
      integrationService.update(id, updates),
    onSuccess: (data) => {
      invalidateQueries(integrationKeys.detail(data.id))
      if (workspaceId) {
        invalidateQueries(integrationKeys.list(workspaceId))
        invalidateQueries(integrationKeys.byProvider(workspaceId, data.provider))
      }
    },
  })
}

/**
 * Update integration credentials
 */
export function useUpdateIntegrationCredentials(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: ({
      id,
      credentials,
    }: {
      id: string
      credentials: Parameters<typeof integrationService.updateCredentials>[1]
    }) => integrationService.updateCredentials(id, credentials),
    onSuccess: (data) => {
      invalidateQueries(integrationKeys.detail(data.id))
      if (workspaceId) {
        invalidateQueries(integrationKeys.list(workspaceId))
        invalidateQueries(integrationKeys.byProvider(workspaceId, data.provider))
      }
    },
  })
}

/**
 * Update integration settings
 */
export function useUpdateIntegrationSettings(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: ({
      id,
      settings,
    }: {
      id: string
      settings: Record<string, unknown>
    }) => integrationService.updateSettings(id, settings),
    onSuccess: (data) => {
      invalidateQueries(integrationKeys.detail(data.id))
      if (workspaceId) {
        invalidateQueries(integrationKeys.list(workspaceId))
      }
    },
  })
}

/**
 * Delete an integration
 */
export function useDeleteIntegration(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: (id: string) => integrationService.delete(id),
    onSuccess: () => {
      if (workspaceId) {
        invalidateQueries(integrationKeys.list(workspaceId))
      }
    },
  })
}

/**
 * Mark integration as having an error
 */
export function useMarkIntegrationError(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: ({ id, error }: { id: string; error: string }) =>
      integrationService.markError(id, error),
    onSuccess: (data) => {
      invalidateQueries(integrationKeys.detail(data.id))
      if (workspaceId) {
        invalidateQueries(integrationKeys.list(workspaceId))
      }
    },
  })
}
