import type {
  Workspace,
  User,
  Webinar,
  Registrant,
  Email,
  Integration,
  TeamMember,
  DailyRegistration,
  UTMBreakdown,
  Sequence,
} from '@/types'
import { addDays, subDays, subHours, format } from 'date-fns'

// Workspaces
export const workspaces: Workspace[] = [
  {
    id: 'ws-1',
    name: 'Apex Trading',
    timezone: 'America/New_York',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'ws-2',
    name: 'Team Bull',
    timezone: 'America/Los_Angeles',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: 'ws-3',
    name: 'JDUN Academy',
    timezone: 'America/Chicago',
    createdAt: new Date('2024-03-10'),
  },
]

// Current user
export const currentUser: User = {
  id: 'user-1',
  name: 'Alex Johnson',
  email: 'alex@apextrading.com',
  avatar: undefined,
  role: 'owner',
}

// Team members
export const teamMembers: TeamMember[] = [
  {
    id: 'tm-1',
    userId: 'user-1',
    workspaceId: 'ws-1',
    user: currentUser,
    role: 'owner',
    invitedAt: new Date('2024-01-15'),
    joinedAt: new Date('2024-01-15'),
  },
  {
    id: 'tm-2',
    userId: 'user-2',
    workspaceId: 'ws-1',
    user: {
      id: 'user-2',
      name: 'Sarah Chen',
      email: 'sarah@apextrading.com',
      role: 'admin',
    },
    role: 'admin',
    invitedAt: new Date('2024-01-20'),
    joinedAt: new Date('2024-01-21'),
  },
  {
    id: 'tm-3',
    userId: 'user-3',
    workspaceId: 'ws-1',
    user: {
      id: 'user-3',
      name: 'Mike Wilson',
      email: 'mike@apextrading.com',
      role: 'member',
    },
    role: 'member',
    invitedAt: new Date('2024-02-05'),
    joinedAt: new Date('2024-02-06'),
  },
]

// Webinars for workspace 1 (Apex Trading)
export const webinars: Webinar[] = [
  {
    id: 'web-1',
    workspaceId: 'ws-1',
    title: 'Master Options Trading: From Zero to Hero',
    description: 'Learn the fundamentals of options trading and advanced strategies to maximize your returns.',
    scheduledAt: addDays(new Date(), 3),
    timezone: 'America/New_York',
    status: 'scheduled',
    ghlWebhookUrl: 'https://services.leadconnectorhq.com/hooks/options-webinar-jan',
    emailTag: 'options-series',
    slackChannel: '#options-webinar',
    webhookUrl: 'https://api.webinaros.com/webhooks/web-1',
    createdAt: subDays(new Date(), 14),
    updatedAt: subDays(new Date(), 2),
  },
  {
    id: 'web-2',
    workspaceId: 'ws-1',
    title: 'Crypto Day Trading Secrets',
    description: 'Discover the strategies professional traders use to profit from cryptocurrency markets.',
    scheduledAt: addDays(new Date(), 7),
    timezone: 'America/New_York',
    status: 'scheduled',
    ghlWebhookUrl: 'https://services.leadconnectorhq.com/hooks/crypto-webinar',
    emailTag: 'crypto-series',
    slackChannel: '#crypto-webinar',
    webhookUrl: 'https://api.webinaros.com/webhooks/web-2',
    createdAt: subDays(new Date(), 10),
    updatedAt: subDays(new Date(), 1),
  },
  {
    id: 'web-3',
    workspaceId: 'ws-1',
    title: 'Technical Analysis Masterclass',
    description: 'Deep dive into chart patterns, indicators, and price action trading.',
    scheduledAt: subDays(new Date(), 5),
    timezone: 'America/New_York',
    status: 'completed',
    ghlWebhookUrl: 'https://services.leadconnectorhq.com/hooks/ta-masterclass',
    emailTag: 'ta-series',
    slackChannel: '#ta-webinar',
    webhookUrl: 'https://api.webinaros.com/webhooks/web-3',
    createdAt: subDays(new Date(), 30),
    updatedAt: subDays(new Date(), 5),
  },
  {
    id: 'web-4',
    workspaceId: 'ws-1',
    title: 'Risk Management Essentials',
    description: 'Learn how to protect your capital and manage risk like a professional trader.',
    scheduledAt: subDays(new Date(), 12),
    timezone: 'America/New_York',
    status: 'completed',
    ghlWebhookUrl: 'https://services.leadconnectorhq.com/hooks/risk-mgmt',
    emailTag: 'risk-series',
    slackChannel: '#risk-webinar',
    webhookUrl: 'https://api.webinaros.com/webhooks/web-4',
    createdAt: subDays(new Date(), 45),
    updatedAt: subDays(new Date(), 12),
  },
  {
    id: 'web-5',
    workspaceId: 'ws-1',
    title: 'Advanced Futures Trading',
    description: 'Take your futures trading to the next level with advanced strategies.',
    scheduledAt: addDays(new Date(), 14),
    timezone: 'America/New_York',
    status: 'draft',
    webhookUrl: 'https://api.webinaros.com/webhooks/web-5',
    createdAt: subDays(new Date(), 3),
    updatedAt: subDays(new Date(), 1),
  },
]

// Generate realistic names
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
  'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Edward', 'Rebecca', 'Jason', 'Sharon',
]

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
]

const utmSources = ['google', 'facebook', 'youtube', 'instagram', 'twitter', 'tiktok', 'email', 'organic']
const utmMediums = ['cpc', 'social', 'email', 'organic', 'referral', 'display']
const utmCampaigns = ['options-launch', 'crypto-promo', 'trading-mastery', 'spring-sale', 'vip-invite', 'retarget-30d']

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com']
  const separator = Math.random() > 0.5 ? '.' : ''
  const number = Math.random() > 0.7 ? Math.floor(Math.random() * 99) : ''
  return `${firstName.toLowerCase()}${separator}${lastName.toLowerCase()}${number}@${randomElement(domains)}`
}

// Generate registrants for each webinar
export const registrants: Registrant[] = []

// Distribution: web-1: 180, web-2: 120, web-3: 250, web-4: 150 (total ~700)
const registrantCounts: Record<string, number> = {
  'web-1': 180,
  'web-2': 120,
  'web-3': 250,
  'web-4': 150,
}

let registrantId = 1

Object.entries(registrantCounts).forEach(([webinarId, count]) => {
  const webinar = webinars.find(w => w.id === webinarId)!
  const isCompleted = webinar.status === 'completed'

  for (let i = 0; i < count; i++) {
    const firstName = randomElement(firstNames)
    const lastName = randomElement(lastNames)
    const isVip = Math.random() < 0.15 // 15% VIP rate
    const attended = isCompleted ? Math.random() < 0.51 : false // 51% show rate
    const converted = attended ? Math.random() < 0.275 : false // ~14% conversion of total (27.5% of attendees)

    registrants.push({
      id: `reg-${registrantId++}`,
      webinarId,
      firstName,
      lastName,
      email: generateEmail(firstName, lastName),
      isVip,
      attended,
      converted,
      utmSource: Math.random() > 0.1 ? randomElement(utmSources) : undefined,
      utmMedium: Math.random() > 0.15 ? randomElement(utmMediums) : undefined,
      utmCampaign: Math.random() > 0.2 ? randomElement(utmCampaigns) : undefined,
      revenue: converted ? Math.floor(Math.random() * 4000) + 1000 : undefined,
      registeredAt: subDays(webinar.scheduledAt, Math.floor(Math.random() * 14) + 1),
      joinUrl: `https://webinar.apextrading.com/join/${webinarId}/${registrantId}`,
    })
  }
})

// Emails for webinars
export const emails: Email[] = [
  {
    id: 'email-1',
    webinarId: 'web-1',
    subject: 'You\'re In! Here\'s Your Webinar Access',
    body: 'Hi {{firstName}},\n\nThank you for registering! Your exclusive access link: {{joinUrl}}\n\nSee you there!',
    segment: 'all',
    scheduleType: 'relative',
    relativeTime: 'immediately',
    status: 'sent',
    sentAt: subDays(new Date(), 10),
    openRate: 72.5,
    clickRate: 45.2,
    createdAt: subDays(new Date(), 14),
  },
  {
    id: 'email-2',
    webinarId: 'web-1',
    subject: 'Reminder: Webinar Starts Tomorrow!',
    body: 'Hi {{firstName}},\n\nDon\'t forget - our webinar is tomorrow! Click here to join: {{joinUrl}}',
    segment: 'all',
    scheduleType: 'relative',
    relativeTime: '24 hours before',
    status: 'scheduled',
    openRate: undefined,
    clickRate: undefined,
    createdAt: subDays(new Date(), 14),
  },
  {
    id: 'email-3',
    webinarId: 'web-1',
    subject: 'VIP Early Access: Exclusive Bonus Content',
    body: 'Hi {{firstName}},\n\nAs a VIP registrant, you get exclusive early access to our bonus materials...',
    segment: 'vip',
    scheduleType: 'relative',
    relativeTime: '2 hours before',
    status: 'scheduled',
    createdAt: subDays(new Date(), 12),
  },
  {
    id: 'email-4',
    webinarId: 'web-1',
    subject: 'Starting in 1 Hour!',
    body: 'Hi {{firstName}},\n\nWe start in just 1 hour. Here\'s your link: {{joinUrl}}',
    segment: 'all',
    scheduleType: 'relative',
    relativeTime: '1 hour before',
    status: 'scheduled',
    createdAt: subDays(new Date(), 14),
  },
  {
    id: 'email-5',
    webinarId: 'web-2',
    subject: 'Welcome! Your Crypto Trading Webinar Access',
    body: 'Hi {{firstName}},\n\nYou\'re registered for our upcoming crypto trading webinar...',
    segment: 'all',
    scheduleType: 'relative',
    relativeTime: 'immediately',
    status: 'sent',
    sentAt: subDays(new Date(), 7),
    openRate: 68.3,
    clickRate: 42.1,
    createdAt: subDays(new Date(), 10),
  },
  {
    id: 'email-6',
    webinarId: 'web-3',
    subject: 'Replay Available: Technical Analysis Masterclass',
    body: 'Hi {{firstName}},\n\nMissed the live session? Watch the replay now...',
    segment: 'non-vip',
    scheduleType: 'relative',
    relativeTime: '24 hours after',
    status: 'sent',
    sentAt: subDays(new Date(), 4),
    openRate: 55.2,
    clickRate: 28.7,
    createdAt: subDays(new Date(), 6),
  },
]

// Integrations
export const integrations: Integration[] = [
  // Webinar
  { id: 'int-1', workspaceId: 'ws-1', type: 'zoom', name: 'Zoom', category: 'webinar', isConnected: true, lastSyncedAt: subHours(new Date(), 2) },
  { id: 'int-2', workspaceId: 'ws-1', type: 'webinarjam', name: 'WebinarJam', category: 'webinar', isConnected: false },
  { id: 'int-3', workspaceId: 'ws-1', type: 'demio', name: 'Demio', category: 'webinar', isConnected: false },
  { id: 'int-4', workspaceId: 'ws-1', type: 'gotowebinar', name: 'GoToWebinar', category: 'webinar', isConnected: false },

  // CRM
  { id: 'int-5', workspaceId: 'ws-1', type: 'gohighlevel', name: 'GoHighLevel', category: 'crm', isConnected: true, lastSyncedAt: subHours(new Date(), 1) },
  { id: 'int-6', workspaceId: 'ws-1', type: 'close', name: 'Close', category: 'crm', isConnected: false },
  { id: 'int-7', workspaceId: 'ws-1', type: 'hubspot', name: 'HubSpot', category: 'crm', isConnected: false },
  { id: 'int-8', workspaceId: 'ws-1', type: 'salesforce', name: 'Salesforce', category: 'crm', isConnected: false },
  { id: 'int-9', workspaceId: 'ws-1', type: 'pipedrive', name: 'Pipedrive', category: 'crm', isConnected: false },

  // Email
  { id: 'int-10', workspaceId: 'ws-1', type: 'customerio', name: 'Customer.io', category: 'email', isConnected: true, lastSyncedAt: subHours(new Date(), 4) },
  { id: 'int-11', workspaceId: 'ws-1', type: 'convertkit', name: 'ConvertKit', category: 'email', isConnected: false },
  { id: 'int-12', workspaceId: 'ws-1', type: 'activecampaign', name: 'ActiveCampaign', category: 'email', isConnected: false },
  { id: 'int-13', workspaceId: 'ws-1', type: 'mailchimp', name: 'Mailchimp', category: 'email', isConnected: false },
  { id: 'int-14', workspaceId: 'ws-1', type: 'klaviyo', name: 'Klaviyo', category: 'email', isConnected: false },

  // SMS
  { id: 'int-15', workspaceId: 'ws-1', type: 'twilio', name: 'Twilio', category: 'sms', isConnected: false },
  { id: 'int-16', workspaceId: 'ws-1', type: 'plivo', name: 'Plivo', category: 'sms', isConnected: false },

  // Tracking
  { id: 'int-17', workspaceId: 'ws-1', type: 'clickmagick', name: 'ClickMagick', category: 'tracking', isConnected: false },
  { id: 'int-18', workspaceId: 'ws-1', type: 'hyros', name: 'Hyros', category: 'tracking', isConnected: true, lastSyncedAt: subHours(new Date(), 6) },
  { id: 'int-19', workspaceId: 'ws-1', type: 'redtrack', name: 'RedTrack', category: 'tracking', isConnected: false },
  { id: 'int-20', workspaceId: 'ws-1', type: 'segment', name: 'Segment', category: 'tracking', isConnected: false },
  { id: 'int-21', workspaceId: 'ws-1', type: 'ga4', name: 'Google Analytics 4', category: 'tracking', isConnected: true, lastSyncedAt: subHours(new Date(), 3) },

  // Communication
  { id: 'int-22', workspaceId: 'ws-1', type: 'slack', name: 'Slack', category: 'communication', isConnected: true, lastSyncedAt: subHours(new Date(), 1) },
  { id: 'int-23', workspaceId: 'ws-1', type: 'discord', name: 'Discord', category: 'communication', isConnected: false },
  { id: 'int-24', workspaceId: 'ws-1', type: 'telegram', name: 'Telegram', category: 'communication', isConnected: false },

  // Payments
  { id: 'int-25', workspaceId: 'ws-1', type: 'stripe', name: 'Stripe', category: 'payments', isConnected: true, lastSyncedAt: subHours(new Date(), 2) },
  { id: 'int-26', workspaceId: 'ws-1', type: 'whop', name: 'Whop', category: 'payments', isConnected: false },
  { id: 'int-27', workspaceId: 'ws-1', type: 'thrivecart', name: 'ThriveCart', category: 'payments', isConnected: false },
  { id: 'int-28', workspaceId: 'ws-1', type: 'samcart', name: 'SamCart', category: 'payments', isConnected: false },

  // Spreadsheets
  { id: 'int-29', workspaceId: 'ws-1', type: 'google-sheets', name: 'Google Sheets', category: 'spreadsheets', isConnected: true, lastSyncedAt: subHours(new Date(), 5) },
  { id: 'int-30', workspaceId: 'ws-1', type: 'airtable', name: 'Airtable', category: 'spreadsheets', isConnected: false },
  { id: 'int-31', workspaceId: 'ws-1', type: 'notion', name: 'Notion', category: 'spreadsheets', isConnected: false },

  // Ads
  { id: 'int-32', workspaceId: 'ws-1', type: 'meta-ads', name: 'Meta Ads', category: 'ads', isConnected: true, lastSyncedAt: subHours(new Date(), 8) },
  { id: 'int-33', workspaceId: 'ws-1', type: 'google-ads', name: 'Google Ads', category: 'ads', isConnected: true, lastSyncedAt: subHours(new Date(), 8) },
  { id: 'int-34', workspaceId: 'ws-1', type: 'tiktok-ads', name: 'TikTok Ads', category: 'ads', isConnected: false },
]

// Daily registrations for analytics (last 30 days)
export const dailyRegistrations: DailyRegistration[] = Array.from({ length: 30 }, (_, i) => {
  const date = subDays(new Date(), 29 - i)
  const baseTotal = Math.floor(Math.random() * 30) + 15
  const spike = i > 20 && i < 25 ? Math.floor(Math.random() * 40) + 20 : 0
  const total = baseTotal + spike
  return {
    date: format(date, 'yyyy-MM-dd'),
    total,
    vip: Math.floor(total * (0.12 + Math.random() * 0.06)), // 12-18% VIP
  }
})

// UTM breakdown for analytics
export const utmBreakdown: UTMBreakdown[] = [
  { source: 'google', medium: 'cpc', campaign: 'options-launch', registrations: 156, shows: 82, showRate: 52.6, conversions: 23, conversionRate: 14.7, revenue: 57500 },
  { source: 'facebook', medium: 'social', campaign: 'trading-mastery', registrations: 134, shows: 65, showRate: 48.5, conversions: 18, conversionRate: 13.4, revenue: 43200 },
  { source: 'youtube', medium: 'cpc', campaign: 'crypto-promo', registrations: 98, shows: 54, showRate: 55.1, conversions: 16, conversionRate: 16.3, revenue: 40000 },
  { source: 'email', medium: 'email', campaign: 'vip-invite', registrations: 87, shows: 52, showRate: 59.8, conversions: 19, conversionRate: 21.8, revenue: 52250 },
  { source: 'instagram', medium: 'social', campaign: 'spring-sale', registrations: 76, shows: 35, showRate: 46.1, conversions: 9, conversionRate: 11.8, revenue: 22500 },
  { source: 'organic', medium: 'organic', campaign: '(none)', registrations: 65, shows: 38, showRate: 58.5, conversions: 12, conversionRate: 18.5, revenue: 30000 },
  { source: 'twitter', medium: 'social', campaign: 'retarget-30d', registrations: 45, shows: 21, showRate: 46.7, conversions: 5, conversionRate: 11.1, revenue: 12500 },
  { source: 'tiktok', medium: 'cpc', campaign: 'options-launch', registrations: 39, shows: 18, showRate: 46.2, conversions: 4, conversionRate: 10.3, revenue: 9600 },
]

// Sequences
export const sequences: Sequence[] = [
  {
    id: 'seq-1',
    workspaceId: 'ws-1',
    name: 'Apex Reminder Sequence',
    webinarId: 'web-1',
    trigger: 'registration',
    status: 'active',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: { triggerType: 'registration', label: 'New Registration' },
      },
      {
        id: 'email-1',
        type: 'email',
        position: { x: 380, y: 200 },
        data: { subject: 'You\'re In! Here\'s Your Access', body: 'Hi {{firstName}},\n\nThank you for registering...' },
      },
      {
        id: 'wait-1',
        type: 'wait',
        position: { x: 660, y: 200 },
        data: { durationType: 'relative', duration: 24, unit: 'hours', relativeTo: 'before_webinar' },
      },
      {
        id: 'email-2',
        type: 'email',
        position: { x: 940, y: 200 },
        data: { subject: 'Reminder: Webinar Tomorrow!', body: 'Hi {{firstName}},\n\nDon\'t forget...' },
      },
      {
        id: 'sms-1',
        type: 'sms',
        position: { x: 1220, y: 200 },
        data: { message: 'Hey {{firstName}}! Webinar is TOMORROW. Join here: {{joinUrl}}' },
      },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'email-1' },
      { id: 'e2', source: 'email-1', target: 'wait-1' },
      { id: 'e3', source: 'wait-1', target: 'email-2' },
      { id: 'e4', source: 'email-2', target: 'sms-1' },
    ],
    enrolledCount: 847,
    createdAt: subDays(new Date(), 30),
    updatedAt: subDays(new Date(), 2),
  },
  {
    id: 'seq-2',
    workspaceId: 'ws-1',
    name: 'VIP Welcome Flow',
    trigger: 'vip_purchase',
    status: 'active',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: { triggerType: 'vip_purchase', label: 'VIP Purchase' },
      },
      {
        id: 'tag-1',
        type: 'tag',
        position: { x: 380, y: 200 },
        data: { tagName: 'vip-customer', action: 'add' },
      },
      {
        id: 'email-1',
        type: 'email',
        position: { x: 660, y: 200 },
        data: { subject: 'Welcome to VIP! Your Exclusive Access', body: 'Hi {{firstName}},\n\nCongratulations on becoming a VIP...' },
      },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'tag-1' },
      { id: 'e2', source: 'tag-1', target: 'email-1' },
    ],
    enrolledCount: 123,
    createdAt: subDays(new Date(), 20),
    updatedAt: subDays(new Date(), 5),
  },
  {
    id: 'seq-3',
    workspaceId: 'ws-1',
    name: 'No-Show Recovery',
    webinarId: 'web-1',
    trigger: 'no_show',
    status: 'draft',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: { triggerType: 'no_show', label: 'No Show' },
      },
      {
        id: 'wait-1',
        type: 'wait',
        position: { x: 380, y: 200 },
        data: { durationType: 'fixed', duration: 2, unit: 'hours' },
      },
      {
        id: 'email-1',
        type: 'email',
        position: { x: 660, y: 200 },
        data: { subject: 'We Missed You! Watch the Replay', body: 'Hi {{firstName}},\n\nWe noticed you couldn\'t make it...' },
      },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'wait-1' },
      { id: 'e2', source: 'wait-1', target: 'email-1' },
    ],
    enrolledCount: 0,
    createdAt: subDays(new Date(), 5),
    updatedAt: subDays(new Date(), 1),
  },
]

// Helper to calculate stats
export function calculateWebinarStats(webinarId?: string) {
  const relevantRegistrants = webinarId
    ? registrants.filter(r => r.webinarId === webinarId)
    : registrants

  const totalRegistrants = relevantRegistrants.length
  const vipCount = relevantRegistrants.filter(r => r.isVip).length
  const attendedCount = relevantRegistrants.filter(r => r.attended).length
  const convertedCount = relevantRegistrants.filter(r => r.converted).length
  const totalRevenue = relevantRegistrants.reduce((sum, r) => sum + (r.revenue || 0), 0)

  return {
    totalRegistrants,
    vipCount,
    showRate: totalRegistrants > 0 ? (attendedCount / totalRegistrants) * 100 : 0,
    conversionRate: totalRegistrants > 0 ? (convertedCount / totalRegistrants) * 100 : 0,
    totalRevenue,
    registrantsChange: 12.5,
    vipChange: 8.3,
    showRateChange: 2.1,
    conversionChange: -1.2,
  }
}
