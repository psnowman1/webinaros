import { Router } from 'express'
import { z } from 'zod'
import { ApiError } from '../middleware/error-handler'
import { supabase, getZoomCredentials, getGHLCredentials } from '../utils/supabase'
import { registerZoomAttendee } from '../services/zoom'
import { sendToGHLWebhook } from '../services/ghl'
import { format } from 'date-fns'

export const registrationRouter = Router()

// Type for webinar data used in registration
interface WebinarForRegistration {
  id: string
  workspace_id: string
  title: string
  slug: string | null
  scheduled_at: string | null
  zoom_webinar_id: string | null
  ghl_tag: string | null
}

// Public registration endpoint - no auth required
const registrationSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
})

// Register for a webinar by slug or ID
registrationRouter.post('/:webinarIdOrSlug', async (req, res, next) => {
  try {
    const { webinarIdOrSlug } = req.params
    const data = registrationSchema.parse(req.body)

    // Find the webinar
    const { data: webinarData, error: webinarError } = await supabase
      .from('webinars')
      .select('id, workspace_id, title, slug, scheduled_at, zoom_webinar_id, ghl_tag')
      .or(`id.eq.${webinarIdOrSlug},slug.eq.${webinarIdOrSlug}`)
      .single()

    if (webinarError || !webinarData) {
      throw new ApiError('Webinar not found', 404)
    }

    const webinar = webinarData as WebinarForRegistration
    const workspaceId = webinar.workspace_id

    // Check if already registered
    const { data: existingReg } = await supabase
      .from('registrants')
      .select('id')
      .eq('webinar_id', webinar.id)
      .eq('email', data.email)
      .single()

    if (existingReg) {
      // Return success but note they're already registered
      return res.json({
        success: true,
        message: 'Already registered',
        alreadyRegistered: true,
      })
    }

    let zoomJoinUrl: string | null = null
    let zoomRegistrantId: string | null = null

    // Register with Zoom if configured and webinar has zoom_webinar_id
    if (webinar.zoom_webinar_id) {
      const zoomCredentials = await getZoomCredentials(workspaceId)

      if (zoomCredentials) {
        try {
          const zoomResult = await registerZoomAttendee(zoomCredentials, {
            webinarId: webinar.zoom_webinar_id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
          })
          zoomJoinUrl = zoomResult.joinUrl
          zoomRegistrantId = zoomResult.registrantId
        } catch (error) {
          console.error('Zoom registration failed:', error)
          // Continue without Zoom registration
        }
      }
    }

    // Create registrant in our database
    const { data: registrant, error: regError } = await supabase
      .from('registrants')
      .insert({
        workspace_id: workspaceId,
        webinar_id: webinar.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName || null,
        phone: data.phone || null,
        status: 'registered',
        is_vip: false,
        has_purchased: false,
        zoom_registrant_id: zoomRegistrantId,
        zoom_join_url: zoomJoinUrl,
        utm_source: data.utmSource || null,
        utm_medium: data.utmMedium || null,
        utm_campaign: data.utmCampaign || null,
        utm_term: data.utmTerm || null,
        utm_content: data.utmContent || null,
        registered_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (regError) {
      console.error('Failed to create registrant:', regError)
      throw new ApiError('Failed to complete registration', 500)
    }

    // Send to GHL webhook if configured
    const ghlCredentials = await getGHLCredentials(workspaceId)

    if (ghlCredentials?.webhookUrl) {
      try {
        const webinarDateTime = webinar.scheduled_at
          ? format(new Date(webinar.scheduled_at), "dd-MMM-yyyy hh:mm a 'EST'")
          : ''

        await sendToGHLWebhook({
          webhookUrl: ghlCredentials.webhookUrl,
          data: {
            name: data.firstName,
            email: data.email,
            phone: data.phone,
            tag: webinar.ghl_tag || `Webinar: ${webinar.title}`,
            webinarDateTime,
            webinarUrl: zoomJoinUrl || '',
            utmSource: data.utmSource,
            utmMedium: data.utmMedium,
            utmCampaign: data.utmCampaign,
            utmTerm: data.utmTerm,
            utmContent: data.utmContent,
          },
        })
      } catch (error) {
        console.error('GHL webhook failed:', error)
        // Continue without GHL
      }
    }

    res.json({
      success: true,
      message: 'Registration successful',
      data: {
        registrantId: registrant.id,
        webinarTitle: webinar.title,
        webinarDate: webinar.scheduled_at,
        joinUrl: zoomJoinUrl,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Get registration page data (public)
registrationRouter.get('/:webinarIdOrSlug', async (req, res, next) => {
  try {
    const { webinarIdOrSlug } = req.params

    const { data: webinar, error } = await supabase
      .from('webinars')
      .select('id, title, description, scheduled_at, duration_minutes, timezone, type')
      .or(`id.eq.${webinarIdOrSlug},slug.eq.${webinarIdOrSlug}`)
      .single()

    if (error || !webinar) {
      throw new ApiError('Webinar not found', 404)
    }

    res.json({
      success: true,
      data: webinar,
    })
  } catch (error) {
    next(error)
  }
})
