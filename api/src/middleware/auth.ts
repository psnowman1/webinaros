/**
 * Authentication Middleware - Request authentication and authorization
 *
 * This middleware handles:
 * - JWT token validation from Supabase
 * - Workspace access verification
 * - Request user/workspace context injection
 * - Auth caching for performance
 */

import { Request, Response, NextFunction } from 'express'
import { supabase } from '../utils/supabase'
import { ApiError } from './error-handler'

// ============================================================================
// Type Augmentation
// ============================================================================

/**
 * Extended Express Request with auth context
 */
declare global {
  namespace Express {
    interface Request {
      /** Authenticated user ID from Supabase */
      userId?: string
      /** Current workspace ID */
      workspaceId?: string
      /** User's role in the workspace */
      userRole?: 'owner' | 'admin' | 'member' | 'viewer'
    }
  }
}

// ============================================================================
// Cache Implementation
// ============================================================================

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

// Cache for JWT validation results (1 minute TTL)
const authCache = new Map<string, CacheEntry<string>>()
const AUTH_CACHE_TTL = 60 * 1000 // 1 minute

// Cache for workspace membership checks (5 minute TTL)
const membershipCache = new Map<string, CacheEntry<string>>()
const MEMBERSHIP_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached value if not expired
 */
function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key)

  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }

  return entry.data
}

/**
 * Set cache entry
 */
function setCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  data: T,
  ttl: number
): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  })
}

/**
 * Clear auth caches (useful for testing or forced refresh)
 */
export function clearAuthCaches(): void {
  authCache.clear()
  membershipCache.clear()
}

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Authenticate requests from the frontend using Supabase JWT
 * Validates the token and verifies workspace access
 */
export async function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // ========================================================================
    // Extract and validate Authorization header
    // ========================================================================

    const authHeader = req.headers.authorization
    if (!authHeader) {
      throw new ApiError('Authorization header is required', 401)
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new ApiError(
        'Invalid authorization format. Expected: Bearer <token>',
        401
      )
    }

    const token = authHeader.slice(7) // Remove 'Bearer ' prefix
    if (!token) {
      throw new ApiError('Authorization token is required', 401)
    }

    // ========================================================================
    // Validate JWT token
    // ========================================================================

    let userId: string

    // Check auth cache first
    const cachedUserId = getCached(authCache, token)
    if (cachedUserId) {
      userId = cachedUserId
    } else {
      // Validate token with Supabase
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token)

      if (error) {
        // Token expired or invalid
        if (error.message?.includes('expired')) {
          throw new ApiError('Session expired. Please sign in again.', 401)
        }
        throw new ApiError('Invalid authorization token', 401)
      }

      if (!user) {
        throw new ApiError('User not found', 401)
      }

      userId = user.id

      // Cache the result
      setCache(authCache, token, userId, AUTH_CACHE_TTL)
    }

    req.userId = userId

    // ========================================================================
    // Extract and validate Workspace ID
    // ========================================================================

    const workspaceId =
      (req.headers['x-workspace-id'] as string) ||
      (req.query.workspaceId as string)

    if (!workspaceId) {
      throw new ApiError(
        'X-Workspace-Id header or workspaceId query parameter is required',
        400
      )
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(workspaceId)) {
      throw new ApiError('Invalid workspace ID format', 400)
    }

    // ========================================================================
    // Verify workspace membership
    // ========================================================================

    const membershipKey = `${userId}:${workspaceId}`
    let userRole: string | null

    // Check membership cache first
    userRole = getCached(membershipCache, membershipKey)

    if (!userRole) {
      // Query the database
      const { data: member, error: memberError } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single()

      if (memberError || !member) {
        throw new ApiError(
          'You do not have access to this workspace',
          403
        )
      }

      userRole = member.role

      // Cache the membership
      setCache(membershipCache, membershipKey, userRole, MEMBERSHIP_CACHE_TTL)
    }

    req.workspaceId = workspaceId
    req.userRole = userRole as Request['userRole']

    next()
  } catch (error) {
    next(error)
  }
}

// ============================================================================
// Role-Based Access Control
// ============================================================================

/**
 * Create middleware that requires a minimum role level
 */
export function requireRole(
  minRole: 'owner' | 'admin' | 'member' | 'viewer'
): (req: Request, res: Response, next: NextFunction) => void {
  const roleHierarchy = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  }

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      next(new ApiError('User role not determined', 403))
      return
    }

    const userLevel = roleHierarchy[req.userRole]
    const requiredLevel = roleHierarchy[minRole]

    if (userLevel < requiredLevel) {
      next(
        new ApiError(
          `This action requires ${minRole} role or higher`,
          403
        )
      )
      return
    }

    next()
  }
}

/**
 * Require admin or owner role
 */
export const requireAdmin = requireRole('admin')

/**
 * Require owner role
 */
export const requireOwner = requireRole('owner')

// ============================================================================
// Public Request Handler
// ============================================================================

/**
 * Handler for public endpoints (like registration)
 * No authentication required, but could implement:
 * - Rate limiting
 * - CORS validation
 * - Abuse detection
 */
export async function authenticatePublicRequest(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  // Public endpoints don't require authentication
  // Future enhancements could include:
  // - IP-based rate limiting
  // - Honeypot detection
  // - CAPTCHA validation

  next()
}

// ============================================================================
// Optional Authentication
// ============================================================================

/**
 * Optionally authenticate - continues even if no valid auth
 * Useful for endpoints that behave differently for authenticated users
 */
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      // No auth provided - continue without user context
      next()
      return
    }

    const token = authHeader.slice(7)
    if (!token) {
      next()
      return
    }

    // Try to validate token
    const cachedUserId = getCached(authCache, token)
    if (cachedUserId) {
      req.userId = cachedUserId
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser(token)

      if (user) {
        req.userId = user.id
        setCache(authCache, token, user.id, AUTH_CACHE_TTL)
      }
    }

    next()
  } catch {
    // Ignore auth errors for optional auth
    next()
  }
}
