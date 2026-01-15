import { Router } from 'express'
import { z } from 'zod'
import { authenticateRequest } from '../middleware/auth'
import { ApiError } from '../middleware/error-handler'
import { getGHLCredentials } from '../utils/supabase'
import { sendToGHLWebhook, createGHLContact, addGHLTags } from '../services/ghl'

export const ghlRouter = Router()

// All GHL routes require authentication
ghlRouter.use(authenticateRequest)

// Send data to GHL webhook
const webhookSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  tag: z.string().optional(),
  webinarDateTime: z.string().optional(),
  webinarUrl: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  customFields: z.record(z.string()).optional(),
})

ghlRouter.post('/webhook', async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId!

    const data = webhookSchema.parse(req.body)

    const credentials = await getGHLCredentials(workspaceId)
    if (!credentials?.webhookUrl) {
      throw new ApiError('GHL webhook not configured for this workspace', 400)
    }

    await sendToGHLWebhook({
      webhookUrl: credentials.webhookUrl,
      data,
    })

    res.json({
      success: true,
      message: 'Data sent to GHL webhook',
    })
  } catch (error) {
    next(error)
  }
})

// Create/update contact via API
const contactSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.string()).optional(),
})

ghlRouter.post('/contacts', async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId!

    const contact = contactSchema.parse(req.body)

    const credentials = await getGHLCredentials(workspaceId)
    if (!credentials?.apiKey || !credentials?.locationId) {
      throw new ApiError('GHL API not configured for this workspace', 400)
    }

    const result = await createGHLContact({
      apiKey: credentials.apiKey,
      locationId: credentials.locationId,
      contact,
    })

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
})

// Add tags to contact
const addTagsSchema = z.object({
  contactId: z.string(),
  tags: z.array(z.string()),
})

ghlRouter.post('/contacts/tags', async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId!

    const { contactId, tags } = addTagsSchema.parse(req.body)

    const credentials = await getGHLCredentials(workspaceId)
    if (!credentials?.apiKey) {
      throw new ApiError('GHL API not configured for this workspace', 400)
    }

    await addGHLTags(credentials.apiKey, contactId, tags)

    res.json({
      success: true,
      message: 'Tags added successfully',
    })
  } catch (error) {
    next(error)
  }
})

// Test GHL connection
ghlRouter.post('/test', async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId!

    const credentials = await getGHLCredentials(workspaceId)
    if (!credentials?.webhookUrl && !credentials?.apiKey) {
      throw new ApiError('GHL not configured for this workspace', 400)
    }

    res.json({
      success: true,
      message: 'GHL configuration found',
      hasWebhook: !!credentials.webhookUrl,
      hasApi: !!credentials.apiKey,
    })
  } catch (error) {
    next(error)
  }
})
