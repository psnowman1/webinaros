import { ApiError } from '../middleware/error-handler'

interface GHLCredentials {
  apiKey?: string
  locationId?: string
  webhookUrl?: string
}

interface SendToGHLParams {
  webhookUrl: string
  data: {
    name: string
    email: string
    phone?: string
    tag?: string
    webinarDateTime?: string
    webinarUrl?: string
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
    utmTerm?: string
    utmContent?: string
    customFields?: Record<string, string>
  }
}

interface GHLContactParams {
  apiKey: string
  locationId: string
  contact: {
    email: string
    firstName: string
    lastName?: string
    phone?: string
    tags?: string[]
    customFields?: Record<string, string>
  }
}

// Send data to a GHL webhook (simplest integration)
export async function sendToGHLWebhook(params: SendToGHLParams): Promise<void> {
  const { webhookUrl, data } = params

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      Tag: data.tag || '',
      'date/time': data.webinarDateTime || '',
      webinar_url: data.webinarUrl || '',
      utm_source: data.utmSource || '',
      utm_medium: data.utmMedium || '',
      utm_campaign: data.utmCampaign || '',
      utm_term: data.utmTerm || '',
      utm_content: data.utmContent || '',
      ...data.customFields,
    }),
  })

  if (!response.ok) {
    console.error('GHL webhook error:', await response.text())
    throw new ApiError('Failed to send data to GHL webhook', 400)
  }
}

// Create or update a contact via GHL API (requires API key)
export async function createGHLContact(params: GHLContactParams): Promise<{ contactId: string }> {
  const { apiKey, locationId, contact } = params

  // First, try to find existing contact by email
  const searchResponse = await fetch(
    `https://services.leadconnectorhq.com/contacts/search?locationId=${locationId}&query=${encodeURIComponent(contact.email)}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
    }
  )

  let existingContactId: string | null = null

  if (searchResponse.ok) {
    const searchData = (await searchResponse.json()) as { contacts?: { id: string }[] }
    if (searchData.contacts && searchData.contacts.length > 0) {
      existingContactId = searchData.contacts[0].id
    }
  }

  // Create or update contact
  const contactData = {
    locationId,
    email: contact.email,
    firstName: contact.firstName,
    lastName: contact.lastName || '',
    phone: contact.phone || '',
    tags: contact.tags || [],
    customFields: contact.customFields
      ? Object.entries(contact.customFields).map(([key, value]) => ({
          key,
          value,
        }))
      : [],
  }

  let response: Response

  if (existingContactId) {
    // Update existing contact
    response = await fetch(
      `https://services.leadconnectorhq.com/contacts/${existingContactId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
        body: JSON.stringify(contactData),
      }
    )
  } else {
    // Create new contact
    response = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify(contactData),
    })
  }

  if (!response.ok) {
    const error = await response.text()
    console.error('GHL API error:', error)
    throw new ApiError('Failed to create/update GHL contact', 400)
  }

  const data = (await response.json()) as { contact?: { id: string } }
  return { contactId: data.contact?.id || existingContactId || '' }
}

// Add tags to a contact
export async function addGHLTags(
  apiKey: string,
  contactId: string,
  tags: string[]
): Promise<void> {
  const response = await fetch(
    `https://services.leadconnectorhq.com/contacts/${contactId}/tags`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify({ tags }),
    }
  )

  if (!response.ok) {
    console.error('GHL add tags error:', await response.text())
    throw new ApiError('Failed to add tags to GHL contact', 400)
  }
}
