/**
 * Shared constants used across the application
 *
 * Centralizing these prevents duplication and ensures consistency
 * when the same data is needed in multiple components.
 */

// ============================================================================
// Timezones
// ============================================================================

export interface TimezoneOption {
  value: string
  label: string
}

/**
 * Common timezones for webinar scheduling
 * Values are IANA timezone identifiers
 */
export const TIMEZONES: TimezoneOption[] = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (AZ)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
]

/**
 * Get timezone label by value
 */
export function getTimezoneLabel(value: string): string {
  return TIMEZONES.find((tz) => tz.value === value)?.label ?? value
}

/**
 * Default timezone for new workspaces/webinars
 */
export const DEFAULT_TIMEZONE = 'America/New_York'

// ============================================================================
// Industries
// ============================================================================

/**
 * Industry categories for workspace classification
 */
export const INDUSTRIES: string[] = [
  'Trading & Finance',
  'Real Estate',
  'Coaching & Consulting',
  'Health & Fitness',
  'Software & SaaS',
  'E-commerce',
  'Education',
  'Marketing & Advertising',
  'Other',
]

// ============================================================================
// Webinar Status
// ============================================================================

export type WebinarStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled'

export interface StatusConfig {
  label: string
  variant: 'default' | 'secondary' | 'success' | 'warning' | 'error'
}

/**
 * Webinar status display configuration
 */
export const WEBINAR_STATUS_CONFIG: Record<WebinarStatus, StatusConfig> = {
  draft: { label: 'Draft', variant: 'secondary' },
  scheduled: { label: 'Scheduled', variant: 'default' },
  live: { label: 'Live', variant: 'success' },
  completed: { label: 'Completed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'error' },
}

/**
 * Get status configuration
 */
export function getStatusConfig(status: WebinarStatus): StatusConfig {
  return WEBINAR_STATUS_CONFIG[status] ?? { label: status, variant: 'secondary' }
}

// ============================================================================
// Message Types
// ============================================================================

export type MessageType =
  | 'confirmation'
  | '24hr_reminder'
  | '1hr_reminder'
  | '15min_reminder'
  | 'starting_now'
  | 'replay'
  | 'no_show'
  | 'custom'

export interface MessageTypeConfig {
  label: string
  description: string
  color: string
}

/**
 * Message type display configuration
 */
export const MESSAGE_TYPE_CONFIG: Record<MessageType, MessageTypeConfig> = {
  confirmation: {
    label: 'Registration Confirmation',
    description: 'Sent immediately after registration',
    color: 'text-success',
  },
  '24hr_reminder': {
    label: '24 Hour Reminder',
    description: 'Sent 24 hours before webinar',
    color: 'text-primary',
  },
  '1hr_reminder': {
    label: '1 Hour Reminder',
    description: 'Sent 1 hour before webinar',
    color: 'text-primary',
  },
  '15min_reminder': {
    label: '15 Minute Reminder',
    description: 'Sent 15 minutes before webinar',
    color: 'text-warning',
  },
  starting_now: {
    label: 'Starting Now',
    description: 'Sent when webinar begins',
    color: 'text-success',
  },
  replay: {
    label: 'Replay Available',
    description: 'Sent after webinar ends',
    color: 'text-muted-foreground',
  },
  no_show: {
    label: 'No Show Follow-up',
    description: 'Sent to registrants who missed the webinar',
    color: 'text-error',
  },
  custom: {
    label: 'Custom Message',
    description: 'Custom scheduled message',
    color: 'text-muted-foreground',
  },
}

/**
 * Get message type configuration
 */
export function getMessageTypeConfig(type: MessageType): MessageTypeConfig {
  return (
    MESSAGE_TYPE_CONFIG[type] ?? {
      label: type,
      description: '',
      color: 'text-muted-foreground',
    }
  )
}

// ============================================================================
// Brand Colors
// ============================================================================

/**
 * Default brand color for new workspaces
 */
export const DEFAULT_BRAND_COLOR = '#6366F1'

// ============================================================================
// Pagination
// ============================================================================

/**
 * Default page sizes for list views
 */
export const PAGE_SIZES = [10, 25, 50, 100] as const
export const DEFAULT_PAGE_SIZE = 25
