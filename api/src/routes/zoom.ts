import { Router } from 'express'
import { z } from 'zod'
import { authenticateRequest } from '../middleware/auth'
import { ApiError } from '../middleware/error-handler'
import { getZoomCredentials } from '../utils/supabase'
import {
  createZoomWebinar,
  registerZoomAttendee,
  getZoomWebinar,
  listZoomRegistrants,
} from '../services/zoom'

export const zoomRouter = Router()

// All Zoom routes require authentication
zoomRouter.use(authenticateRequest)

// Create a Zoom webinar
const createWebinarSchema = z.object({
  topic: z.string().min(1),
  startTime: z.string(), // ISO 8601
  duration: z.number().min(15).max(480),
  timezone: z.string(),
  agenda: z.string().optional(),
  settings: z
    .object({
      approval_type: z.number().optional(),
      registration_type: z.number().optional(),
      host_video: z.boolean().optional(),
      panelists_video: z.boolean().optional(),
      practice_session: z.boolean().optional(),
      hd_video: z.boolean().optional(),
      audio: z.enum(['both', 'telephony', 'voip']).optional(),
      auto_recording: z.enum(['none', 'local', 'cloud']).optional(),
    })
    .optional(),
})

zoomRouter.post('/webinars', async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId!

    // Validate request body
    const params = createWebinarSchema.parse(req.body)

    // Get Zoom credentials for this workspace
    const credentials = await getZoomCredentials(workspaceId)
    if (!credentials) {
      throw new ApiError('Zoom integration not configured for this workspace', 400)
    }

    const result = await createZoomWebinar(credentials, params)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
})

// Register an attendee
const registerSchema = z.object({
  webinarId: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  phone: z.string().optional(),
})

zoomRouter.post('/register', async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId!

    const params = registerSchema.parse(req.body)

    const credentials = await getZoomCredentials(workspaceId)
    if (!credentials) {
      throw new ApiError('Zoom integration not configured for this workspace', 400)
    }

    const result = await registerZoomAttendee(credentials, params)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
})

// Get webinar details
zoomRouter.get('/webinars/:webinarId', async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId!
    const { webinarId } = req.params

    const credentials = await getZoomCredentials(workspaceId)
    if (!credentials) {
      throw new ApiError('Zoom integration not configured for this workspace', 400)
    }

    const result = await getZoomWebinar(credentials, webinarId)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
})

// List webinar registrants
zoomRouter.get('/webinars/:webinarId/registrants', async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId!
    const { webinarId } = req.params

    const credentials = await getZoomCredentials(workspaceId)
    if (!credentials) {
      throw new ApiError('Zoom integration not configured for this workspace', 400)
    }

    const result = await listZoomRegistrants(credentials, webinarId)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
})

// Test Zoom connection
zoomRouter.post('/test', async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId!

    const credentials = await getZoomCredentials(workspaceId)
    if (!credentials) {
      throw new ApiError('Zoom integration not configured for this workspace', 400)
    }

    // Try to get an access token to verify credentials
    const { getZoomAccessToken } = await import('../services/zoom')
    await getZoomAccessToken(credentials)

    res.json({
      success: true,
      message: 'Zoom connection successful',
    })
  } catch (error) {
    next(error)
  }
})
