import { ApiError } from '../middleware/error-handler'

interface ZoomCredentials {
  accountId: string
  clientId: string
  clientSecret: string
}

interface ZoomTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface CreateWebinarParams {
  topic: string
  startTime: string // ISO 8601 format
  duration: number // minutes
  timezone: string
  agenda?: string
  settings?: {
    approval_type?: number // 0=auto, 1=manual, 2=none
    registration_type?: number // 1=once, 2=each, 3=once+select
    host_video?: boolean
    panelists_video?: boolean
    practice_session?: boolean
    hd_video?: boolean
    audio?: 'both' | 'telephony' | 'voip'
    auto_recording?: 'none' | 'local' | 'cloud'
  }
}

interface RegisterAttendeeParams {
  webinarId: string
  email: string
  firstName: string
  lastName?: string
  phone?: string
  customQuestions?: Record<string, string>
}

// Get Zoom OAuth access token using Server-to-Server OAuth
export async function getZoomAccessToken(credentials: ZoomCredentials): Promise<string> {
  const { accountId, clientId, clientSecret } = credentials

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'account_credentials',
      account_id: accountId,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Zoom OAuth error:', error)
    throw new ApiError('Failed to authenticate with Zoom', 401)
  }

  const data = (await response.json()) as ZoomTokenResponse
  return data.access_token
}

// Create a Zoom webinar
export async function createZoomWebinar(
  credentials: ZoomCredentials,
  params: CreateWebinarParams
): Promise<{ id: string; joinUrl: string; startUrl: string; registrationUrl: string }> {
  const accessToken = await getZoomAccessToken(credentials)

  // Get the user ID (use 'me' for the authenticated user)
  const response = await fetch('https://api.zoom.us/v2/users/me/webinars', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: params.topic,
      type: 5, // Scheduled webinar
      start_time: params.startTime,
      duration: params.duration,
      timezone: params.timezone,
      agenda: params.agenda || '',
      settings: {
        approval_type: params.settings?.approval_type ?? 0, // Auto-approve
        registration_type: params.settings?.registration_type ?? 1, // Register once
        host_video: params.settings?.host_video ?? true,
        panelists_video: params.settings?.panelists_video ?? true,
        practice_session: params.settings?.practice_session ?? false,
        hd_video: params.settings?.hd_video ?? true,
        audio: params.settings?.audio ?? 'both',
        auto_recording: params.settings?.auto_recording ?? 'cloud',
        registrants_email_notification: true,
        meeting_authentication: false,
      },
    }),
  })

  if (!response.ok) {
    const error = (await response.json()) as { message?: string }
    console.error('Zoom create webinar error:', error)
    throw new ApiError(`Failed to create Zoom webinar: ${error.message || 'Unknown error'}`, 400)
  }

  const data = (await response.json()) as {
    id: number | string
    join_url: string
    start_url: string
    registration_url: string
  }

  return {
    id: String(data.id),
    joinUrl: data.join_url,
    startUrl: data.start_url,
    registrationUrl: data.registration_url,
  }
}

// Register an attendee for a webinar
export async function registerZoomAttendee(
  credentials: ZoomCredentials,
  params: RegisterAttendeeParams
): Promise<{ registrantId: string; joinUrl: string }> {
  const accessToken = await getZoomAccessToken(credentials)

  const response = await fetch(
    `https://api.zoom.us/v2/webinars/${params.webinarId}/registrants`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        first_name: params.firstName,
        last_name: params.lastName || '-',
        phone: params.phone || '',
        custom_questions: params.customQuestions
          ? Object.entries(params.customQuestions).map(([title, value]) => ({
              title,
              value,
            }))
          : [],
      }),
    }
  )

  if (!response.ok) {
    const error = (await response.json()) as { message?: string }
    console.error('Zoom register attendee error:', error)
    throw new ApiError(`Failed to register for webinar: ${error.message || 'Unknown error'}`, 400)
  }

  const data = (await response.json()) as {
    registrant_id: string
    join_url: string
  }

  return {
    registrantId: data.registrant_id,
    joinUrl: data.join_url,
  }
}

// Get webinar details
export async function getZoomWebinar(
  credentials: ZoomCredentials,
  webinarId: string
): Promise<any> {
  const accessToken = await getZoomAccessToken(credentials)

  const response = await fetch(`https://api.zoom.us/v2/webinars/${webinarId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = (await response.json()) as { message?: string }
    throw new ApiError(`Failed to get webinar: ${error.message || 'Unknown error'}`, 400)
  }

  return response.json() as Promise<Record<string, unknown>>
}

// List webinar registrants
export async function listZoomRegistrants(
  credentials: ZoomCredentials,
  webinarId: string
): Promise<any[]> {
  const accessToken = await getZoomAccessToken(credentials)

  const response = await fetch(
    `https://api.zoom.us/v2/webinars/${webinarId}/registrants?page_size=100`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = (await response.json()) as { message?: string }
    throw new ApiError(`Failed to list registrants: ${error.message || 'Unknown error'}`, 400)
  }

  const data = (await response.json()) as { registrants?: unknown[] }
  return data.registrants || []
}
