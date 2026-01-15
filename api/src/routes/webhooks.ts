import { Router } from 'express'
import { supabase } from '../utils/supabase'

export const webhooksRouter = Router()

// Zoom webhook handler
// Zoom sends webhooks for various events (registration, attendance, etc.)
webhooksRouter.post('/zoom', async (req, res) => {
  try {
    const event = req.body

    console.log('Zoom webhook received:', event.event)

    // Handle Zoom URL validation challenge
    if (event.event === 'endpoint.url_validation') {
      const crypto = await import('crypto')
      const hashForValidate = crypto
        .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET || '')
        .update(event.payload.plainToken)
        .digest('hex')

      return res.json({
        plainToken: event.payload.plainToken,
        encryptedToken: hashForValidate,
      })
    }

    // Handle different event types
    switch (event.event) {
      case 'webinar.registration_created':
        // A new registration was created in Zoom
        // We can sync this back to our database if needed
        const regPayload = event.payload.object
        console.log('New Zoom registration:', regPayload.registrant)
        break

      case 'webinar.participant_joined':
        // Attendee joined the webinar
        const joinPayload = event.payload.object
        const participantEmail = joinPayload.participant?.email

        if (participantEmail) {
          // Update registrant status to attended
          await supabase
            .from('registrants')
            .update({ status: 'attended' })
            .eq('email', participantEmail)
            .eq('zoom_webinar_id', joinPayload.id)
        }
        break

      case 'webinar.participant_left':
        // Attendee left the webinar
        console.log('Participant left:', event.payload.object)
        break

      case 'webinar.ended':
        // Webinar ended
        const endPayload = event.payload.object
        console.log('Webinar ended:', endPayload.id)

        // Update webinar status
        await supabase
          .from('webinars')
          .update({ status: 'completed' })
          .eq('zoom_webinar_id', endPayload.id)
        break

      default:
        console.log('Unhandled Zoom event:', event.event)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Zoom webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

// GHL webhook handler (for inbound data from GHL)
webhooksRouter.post('/ghl', async (req, res) => {
  try {
    const data = req.body

    console.log('GHL webhook received:', data)

    // Handle different GHL events
    // e.g., contact updates, opportunity changes, etc.

    res.json({ received: true })
  } catch (error) {
    console.error('GHL webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

// Generic webhook for custom integrations
webhooksRouter.post('/custom/:workspaceId/:webhookId', async (req, res) => {
  try {
    const { workspaceId, webhookId } = req.params
    const data = req.body

    console.log(`Custom webhook ${webhookId} for workspace ${workspaceId}:`, data)

    // Store webhook data for processing
    await supabase.from('webhook_logs').insert({
      workspace_id: workspaceId,
      webhook_id: webhookId,
      payload: data,
      received_at: new Date().toISOString(),
    })

    res.json({ received: true })
  } catch (error) {
    console.error('Custom webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})
