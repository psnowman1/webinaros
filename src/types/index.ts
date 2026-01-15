export interface Workspace {
  id: string
  name: string
  timezone: string
  createdAt: Date
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'admin' | 'member'
}

export interface Webinar {
  id: string
  workspaceId: string
  title: string
  description: string
  scheduledAt: Date
  timezone: string
  status: 'draft' | 'scheduled' | 'live' | 'completed'
  ghlWebhookUrl?: string
  ghlVipWebhookUrl?: string
  emailTag?: string
  slackChannel?: string
  webhookUrl: string
  createdAt: Date
  updatedAt: Date
}

export interface Registrant {
  id: string
  webinarId: string
  firstName: string
  lastName: string
  email: string
  isVip: boolean
  attended: boolean
  converted: boolean
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  revenue?: number
  registeredAt: Date
  joinUrl: string
}

export interface Email {
  id: string
  webinarId: string
  subject: string
  body: string
  segment: 'all' | 'vip' | 'non-vip'
  scheduleType: 'relative' | 'absolute'
  relativeTime?: string
  absoluteTime?: Date
  status: 'draft' | 'scheduled' | 'sent' | 'failed'
  sentAt?: Date
  openRate?: number
  clickRate?: number
  createdAt: Date
}

export interface Integration {
  id: string
  workspaceId: string
  type: IntegrationType
  name: string
  category: IntegrationCategory
  isConnected: boolean
  config?: Record<string, string>
  lastSyncedAt?: Date
}

export type IntegrationCategory =
  | 'webinar'
  | 'crm'
  | 'email'
  | 'sms'
  | 'tracking'
  | 'communication'
  | 'payments'
  | 'spreadsheets'
  | 'ads'

export type IntegrationType =
  | 'zoom'
  | 'webinarjam'
  | 'demio'
  | 'gotowebinar'
  | 'gohighlevel'
  | 'close'
  | 'hubspot'
  | 'salesforce'
  | 'pipedrive'
  | 'customerio'
  | 'convertkit'
  | 'activecampaign'
  | 'mailchimp'
  | 'klaviyo'
  | 'twilio'
  | 'plivo'
  | 'clickmagick'
  | 'hyros'
  | 'redtrack'
  | 'segment'
  | 'ga4'
  | 'slack'
  | 'discord'
  | 'telegram'
  | 'stripe'
  | 'whop'
  | 'thrivecart'
  | 'samcart'
  | 'google-sheets'
  | 'airtable'
  | 'notion'
  | 'meta-ads'
  | 'google-ads'
  | 'tiktok-ads'

export interface TeamMember {
  id: string
  userId: string
  workspaceId: string
  user: User
  role: 'owner' | 'admin' | 'member'
  invitedAt: Date
  joinedAt?: Date
}

export interface WebinarStats {
  totalRegistrants: number
  vipCount: number
  showRate: number
  conversionRate: number
  totalRevenue: number
  registrantsChange: number
  vipChange: number
  showRateChange: number
  conversionChange: number
}

export interface DailyRegistration {
  date: string
  total: number
  vip: number
}

export interface UTMBreakdown {
  source: string
  medium: string
  campaign: string
  registrations: number
  shows: number
  showRate: number
  conversions: number
  conversionRate: number
  revenue: number
}

export interface OnboardingStep {
  id: string
  title: string
  description: string
  isComplete: boolean
  isSkipped: boolean
}

// Sequence Flow Builder Types
export type SequenceTrigger = 'registration' | 'vip_purchase' | 'attendance' | 'no_show'
export type SequenceStatus = 'draft' | 'active' | 'paused'
export type FlowNodeType = 'trigger' | 'email' | 'sms' | 'wait' | 'branch' | 'tag' | 'goal'

export interface Sequence {
  id: string
  workspaceId: string
  name: string
  webinarId?: string
  trigger: SequenceTrigger
  status: SequenceStatus
  nodes: FlowNode[]
  edges: FlowEdge[]
  enrolledCount: number
  createdAt: Date
  updatedAt: Date
}

export interface FlowNode {
  id: string
  type: FlowNodeType
  position: { x: number; y: number }
  data: TriggerNodeData | EmailNodeData | SMSNodeData | WaitNodeData | BranchNodeData | TagNodeData | GoalNodeData
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
}

export interface TriggerNodeData {
  triggerType: SequenceTrigger
  label: string
}

export interface EmailNodeData {
  subject: string
  body: string
  templateId?: string
}

export interface SMSNodeData {
  message: string
  templateId?: string
}

export interface WaitNodeData {
  durationType: 'fixed' | 'relative'
  duration: number
  unit: 'hours' | 'days'
  relativeTo?: 'before_webinar' | 'after_webinar'
}

export type BranchCondition = 'is_vip' | 'attended' | 'opened_email' | 'clicked_link' | 'has_tag' | 'custom'

export interface BranchNodeData {
  condition: BranchCondition
  conditionValue?: string
}

export interface TagNodeData {
  tagName: string
  action: 'add' | 'remove'
}

export type GoalCondition = 'purchased' | 'booked_call' | 'attended' | 'clicked_link' | 'custom'

export interface GoalNodeData {
  condition: GoalCondition
  conditionValue?: string
}

// Email and SMS Template Types
export type MessageType = 'confirmation' | '24hr_reminder' | '1hr_reminder' | 'starting_now' | 'replay' | 'no_show' | 'custom'

export interface EmailTemplate {
  id: string
  workspaceId: string
  name: string
  subject: string
  body: string
  type: MessageType
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SMSTemplate {
  id: string
  workspaceId: string
  name: string
  message: string
  type: MessageType
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
