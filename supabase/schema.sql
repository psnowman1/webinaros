-- ============================================================================
-- WebinarOS Database Schema for Supabase
-- ============================================================================
-- This schema supports:
-- - Multi-tenant workspaces with team collaboration
-- - Webinar management with Zoom integration
-- - Registrant tracking with full UTM attribution
-- - Email/SMS automation sequences
-- - Comprehensive analytics and event tracking
-- - Secure API key and OAuth token storage
-- - Webhook management (incoming and outgoing)
-- - Audit logging for compliance
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE webinar_status AS ENUM ('draft', 'scheduled', 'live', 'completed', 'cancelled');
CREATE TYPE webinar_type AS ENUM ('live', 'automated', 'hybrid');
CREATE TYPE registrant_status AS ENUM ('registered', 'confirmed', 'attended', 'no_show', 'cancelled');
CREATE TYPE email_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled');
CREATE TYPE sms_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled');
CREATE TYPE message_type AS ENUM ('confirmation', '24hr_reminder', '1hr_reminder', '15min_reminder', 'starting_now', 'replay', 'no_show', 'custom');
CREATE TYPE integration_provider AS ENUM ('zoom', 'gohighlevel', 'stripe', 'sendgrid', 'postmark', 'twilio', 'google_calendar', 'outlook', 'zapier', 'make');
CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error', 'expired');
CREATE TYPE sequence_status AS ENUM ('active', 'paused', 'draft');
CREATE TYPE sequence_trigger AS ENUM ('registration', 'attendance', 'no_show', 'purchase', 'custom');
CREATE TYPE event_type AS ENUM (
  'page_view', 'registration_started', 'registration_completed',
  'email_sent', 'email_opened', 'email_clicked', 'email_bounced', 'email_unsubscribed',
  'sms_sent', 'sms_delivered', 'sms_failed',
  'webinar_joined', 'webinar_left', 'webinar_watched_replay',
  'offer_viewed', 'offer_clicked', 'purchase_started', 'purchase_completed',
  'vip_upgraded', 'custom'
);
CREATE TYPE webhook_direction AS ENUM ('incoming', 'outgoing');
CREATE TYPE webhook_status AS ENUM ('pending', 'success', 'failed', 'retrying');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'America/New_York',

  -- Preferences
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces (primary tenant boundary)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- Branding
  logo_url TEXT,
  brand_color TEXT DEFAULT '#6366F1',

  -- Settings
  timezone TEXT DEFAULT 'America/New_York',
  default_from_name TEXT,
  default_from_email TEXT,
  default_reply_to TEXT,

  -- Business info
  industry TEXT,
  website TEXT,

  -- Billing (Stripe)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'free',
  plan_limits JSONB DEFAULT '{"webinars": 3, "registrants": 500, "emails": 1000}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Workspace members (users can belong to multiple workspaces)
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'member',

  -- Invitation tracking
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, user_id)
);

-- ============================================================================
-- INTEGRATIONS & API KEYS
-- ============================================================================

-- Integration connections (OAuth and API key based)
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  name TEXT NOT NULL, -- Display name for this connection
  status integration_status DEFAULT 'inactive',

  -- OAuth tokens (encrypted at rest via Supabase Vault or pgcrypto)
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMPTZ,
  token_scope TEXT, -- OAuth scopes granted

  -- API Key (encrypted)
  api_key TEXT, -- Encrypted
  api_secret TEXT, -- Encrypted

  -- Provider-specific account info
  external_account_id TEXT, -- e.g., Zoom account ID
  external_user_id TEXT, -- e.g., Zoom user ID
  account_email TEXT,

  -- Provider-specific settings stored as JSON
  settings JSONB DEFAULT '{}',
  -- Example Zoom settings:
  -- {
  --   "default_meeting_settings": {
  --     "host_video": true,
  --     "participant_video": false,
  --     "join_before_host": true,
  --     "mute_upon_entry": true,
  --     "watermark": false,
  --     "use_pmi": false,
  --     "waiting_room": true,
  --     "registration_type": 2
  --   }
  -- }

  -- Error tracking
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  error_count INT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  UNIQUE(workspace_id, provider)
);

-- API keys for workspace (for external access to our API)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,

  -- Key (only prefix stored, full key shown once on creation)
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  key_hash TEXT NOT NULL, -- bcrypt hash of full key

  -- Permissions
  scopes TEXT[] DEFAULT ARRAY['read'], -- ['read', 'write', 'admin']

  -- Rate limiting
  rate_limit INT DEFAULT 1000, -- Requests per hour

  -- Tracking
  last_used_at TIMESTAMPTZ,
  request_count BIGINT DEFAULT 0,

  -- Expiration
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- ============================================================================
-- WEBINARS
-- ============================================================================

CREATE TABLE webinars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Basic info
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,

  -- Scheduling
  status webinar_status DEFAULT 'draft',
  type webinar_type DEFAULT 'live',
  scheduled_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'America/New_York',
  duration_minutes INT DEFAULT 60,

  -- For automated/recurring webinars
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- iCal RRULE format

  -- Zoom integration
  zoom_integration_id UUID REFERENCES integrations(id),
  zoom_meeting_id TEXT,
  zoom_meeting_uuid TEXT,
  zoom_join_url TEXT,
  zoom_start_url TEXT, -- Host URL (encrypted)
  zoom_password TEXT,
  zoom_settings JSONB DEFAULT '{}',

  -- Registration page settings
  registration_enabled BOOLEAN DEFAULT true,
  registration_fields JSONB DEFAULT '[
    {"name": "firstName", "label": "First Name", "type": "text", "required": true},
    {"name": "lastName", "label": "Last Name", "type": "text", "required": true},
    {"name": "email", "label": "Email", "type": "email", "required": true},
    {"name": "phone", "label": "Phone", "type": "tel", "required": false}
  ]',
  registration_page_settings JSONB DEFAULT '{}',
  -- {
  --   "headline": "Join Our Free Training",
  --   "subheadline": "Learn the secrets...",
  --   "bullet_points": ["Point 1", "Point 2"],
  --   "countdown_enabled": true,
  --   "social_proof_enabled": true,
  --   "urgency_message": "Only 100 spots available!"
  -- }

  -- Thank you page settings
  thank_you_page_settings JSONB DEFAULT '{}',
  -- {
  --   "headline": "You're Registered!",
  --   "show_calendar_links": true,
  --   "show_share_buttons": true,
  --   "redirect_url": null,
  --   "redirect_delay": 0
  -- }

  -- Offer/CTA settings
  offer_enabled BOOLEAN DEFAULT false,
  offer_settings JSONB DEFAULT '{}',
  -- {
  --   "product_name": "Trading Masterclass",
  --   "price": 997,
  --   "compare_price": 1997,
  --   "checkout_url": "https://...",
  --   "show_at_minute": 45,
  --   "urgency_deadline": "2024-01-20T23:59:59Z"
  -- }

  -- GHL/CRM webhooks
  ghl_registration_webhook TEXT,
  ghl_vip_webhook TEXT,
  ghl_attendance_webhook TEXT,
  ghl_purchase_webhook TEXT,

  -- VIP Settings
  vip_enabled BOOLEAN DEFAULT true,
  vip_criteria JSONB DEFAULT '{"method": "question", "question": "Are you serious about trading?", "vip_answer": "Yes, I am ready to invest"}',

  -- Stats (denormalized for performance)
  registrant_count INT DEFAULT 0,
  vip_count INT DEFAULT 0,
  attendee_count INT DEFAULT 0,
  peak_live_viewers INT DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),

  UNIQUE(workspace_id, slug)
);

-- ============================================================================
-- REGISTRANTS
-- ============================================================================

CREATE TABLE registrants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,

  -- Contact info
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,

  -- Custom field responses stored as JSON
  custom_fields JSONB DEFAULT '{}',

  -- VIP status
  is_vip BOOLEAN DEFAULT false,
  vip_response TEXT, -- Their answer to the VIP question

  -- Status
  status registrant_status DEFAULT 'registered',

  -- Zoom sync
  zoom_registrant_id TEXT,
  zoom_join_url TEXT, -- Unique join URL for this registrant
  zoom_synced_at TIMESTAMPTZ,

  -- GHL sync
  ghl_contact_id TEXT,
  ghl_synced_at TIMESTAMPTZ,

  -- Attendance tracking
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  watch_time_seconds INT DEFAULT 0,
  max_concurrent_time TIMESTAMPTZ, -- Peak engagement timestamp

  -- Replay tracking
  watched_replay BOOLEAN DEFAULT false,
  replay_watch_time_seconds INT DEFAULT 0,

  -- Purchase tracking
  has_purchased BOOLEAN DEFAULT false,
  purchase_amount DECIMAL(10,2),
  purchased_at TIMESTAMPTZ,
  stripe_payment_id TEXT,

  -- UTM Attribution (captured at registration)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  landing_page TEXT,

  -- Device/location info
  ip_address INET,
  user_agent TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  os TEXT,
  country TEXT,
  region TEXT,
  city TEXT,

  -- Email/SMS tracking
  email_count INT DEFAULT 0,
  email_opened_count INT DEFAULT 0,
  email_clicked_count INT DEFAULT 0,
  sms_count INT DEFAULT 0,
  last_email_at TIMESTAMPTZ,
  last_sms_at TIMESTAMPTZ,
  unsubscribed_email BOOLEAN DEFAULT false,
  unsubscribed_sms BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,

  -- Metadata
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(webinar_id, email)
);

-- Index for common queries
CREATE INDEX idx_registrants_webinar ON registrants(webinar_id);
CREATE INDEX idx_registrants_email ON registrants(email);
CREATE INDEX idx_registrants_workspace ON registrants(workspace_id);
CREATE INDEX idx_registrants_status ON registrants(webinar_id, status);
CREATE INDEX idx_registrants_vip ON registrants(webinar_id, is_vip);
CREATE INDEX idx_registrants_utm ON registrants(webinar_id, utm_source, utm_medium, utm_campaign);
CREATE INDEX idx_registrants_registered_at ON registrants(webinar_id, registered_at);

-- ============================================================================
-- EMAIL & SMS TEMPLATES
-- ============================================================================

CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type message_type DEFAULT 'custom',

  -- Content
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  body_html TEXT, -- Rich HTML version

  -- Settings
  from_name TEXT,
  from_email TEXT,
  reply_to TEXT,

  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type message_type DEFAULT 'custom',

  -- Content
  message TEXT NOT NULL,

  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- ============================================================================
-- SCHEDULED EMAILS & SMS
-- ============================================================================

CREATE TABLE scheduled_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,

  -- Content (can override template)
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  body_html TEXT,
  from_name TEXT,
  from_email TEXT,
  reply_to TEXT,

  -- Targeting
  segment TEXT DEFAULT 'all', -- 'all', 'vip', 'non_vip', 'attended', 'no_show'

  -- Scheduling
  schedule_type TEXT DEFAULT 'relative', -- 'relative', 'absolute'
  relative_trigger TEXT, -- '24_hours_before', '1_hour_before', 'immediately', etc.
  scheduled_for TIMESTAMPTZ,

  status email_status DEFAULT 'scheduled',

  -- Stats
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  opened_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,
  bounced_count INT DEFAULT 0,
  unsubscribed_count INT DEFAULT 0,

  -- Execution tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE TABLE scheduled_sms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  template_id UUID REFERENCES sms_templates(id) ON DELETE SET NULL,

  -- Content
  message TEXT NOT NULL,

  -- Targeting
  segment TEXT DEFAULT 'all',

  -- Scheduling
  schedule_type TEXT DEFAULT 'relative',
  relative_trigger TEXT,
  scheduled_for TIMESTAMPTZ,

  status sms_status DEFAULT 'scheduled',

  -- Stats
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,

  -- Execution tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- ============================================================================
-- EMAIL & SMS DELIVERY LOGS
-- ============================================================================

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  scheduled_email_id UUID REFERENCES scheduled_emails(id) ON DELETE SET NULL,
  registrant_id UUID REFERENCES registrants(id) ON DELETE SET NULL,

  -- Recipient
  to_email TEXT NOT NULL,
  to_name TEXT,

  -- Content sent
  subject TEXT NOT NULL,

  -- Provider info
  provider TEXT, -- 'sendgrid', 'postmark', etc.
  provider_message_id TEXT,

  -- Status tracking
  status TEXT DEFAULT 'queued', -- 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'spam', 'unsubscribed'

  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,

  -- Error info
  error_code TEXT,
  error_message TEXT,

  -- Click tracking
  clicked_links JSONB DEFAULT '[]', -- [{url, clicked_at}]

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_logs_registrant ON email_logs(registrant_id);
CREATE INDEX idx_email_logs_scheduled ON email_logs(scheduled_email_id);
CREATE INDEX idx_email_logs_status ON email_logs(workspace_id, status);

CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  scheduled_sms_id UUID REFERENCES scheduled_sms(id) ON DELETE SET NULL,
  registrant_id UUID REFERENCES registrants(id) ON DELETE SET NULL,

  -- Recipient
  to_phone TEXT NOT NULL,

  -- Content
  message TEXT NOT NULL,

  -- Provider info
  provider TEXT, -- 'twilio', etc.
  provider_message_id TEXT,

  -- Status
  status TEXT DEFAULT 'queued', -- 'queued', 'sent', 'delivered', 'failed'

  -- Cost tracking
  segments INT DEFAULT 1,
  cost DECIMAL(10,4),

  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Error info
  error_code TEXT,
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sms_logs_registrant ON sms_logs(registrant_id);
CREATE INDEX idx_sms_logs_scheduled ON sms_logs(scheduled_sms_id);

-- ============================================================================
-- AUTOMATION SEQUENCES
-- ============================================================================

CREATE TABLE sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Trigger
  trigger sequence_trigger DEFAULT 'registration',
  trigger_webinar_id UUID REFERENCES webinars(id) ON DELETE SET NULL,
  trigger_conditions JSONB DEFAULT '{}', -- Additional conditions

  status sequence_status DEFAULT 'draft',

  -- Stats
  total_enrolled INT DEFAULT 0,
  total_completed INT DEFAULT 0,
  total_converted INT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE TABLE sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,

  -- Position
  step_order INT NOT NULL,

  -- Step type
  type TEXT NOT NULL, -- 'email', 'sms', 'wait', 'condition', 'webhook', 'tag'

  -- Timing
  delay_minutes INT DEFAULT 0, -- Wait time before this step
  delay_type TEXT DEFAULT 'after_previous', -- 'after_previous', 'after_trigger', 'specific_time'

  -- Action config based on type
  config JSONB NOT NULL,
  -- Email: {template_id, subject_override, body_override}
  -- SMS: {template_id, message_override}
  -- Wait: {minutes, until_time}
  -- Condition: {field, operator, value, true_step, false_step}
  -- Webhook: {url, method, headers, body}
  -- Tag: {action: 'add'|'remove', tag_name}

  -- Stats
  sent_count INT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  registrant_id UUID NOT NULL REFERENCES registrants(id) ON DELETE CASCADE,

  -- Progress
  current_step_id UUID REFERENCES sequence_steps(id),
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed', 'exited', 'failed'

  -- Tracking
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  exited_at TIMESTAMPTZ,
  exit_reason TEXT,

  -- Next action
  next_action_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(sequence_id, registrant_id)
);

CREATE INDEX idx_sequence_enrollments_next ON sequence_enrollments(next_action_at) WHERE status = 'active';

-- ============================================================================
-- ANALYTICS & EVENTS
-- ============================================================================

-- Flexible event tracking table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  webinar_id UUID REFERENCES webinars(id) ON DELETE SET NULL,
  registrant_id UUID REFERENCES registrants(id) ON DELETE SET NULL,

  -- Event info
  event_type event_type NOT NULL,
  event_name TEXT, -- For custom events

  -- Event properties
  properties JSONB DEFAULT '{}',
  -- Common properties:
  -- page_view: {url, referrer, title}
  -- email events: {email_id, subject, link_url}
  -- purchase: {amount, product, payment_id}

  -- Attribution (captured at event time)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,

  -- Session info
  session_id TEXT,

  -- Device/location
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  region TEXT,
  city TEXT,

  -- Timestamp
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_events_workspace_type ON events(workspace_id, event_type);
CREATE INDEX idx_events_webinar ON events(webinar_id, event_type);
CREATE INDEX idx_events_registrant ON events(registrant_id);
CREATE INDEX idx_events_occurred ON events(workspace_id, occurred_at);
CREATE INDEX idx_events_utm ON events(workspace_id, utm_source, utm_medium, utm_campaign);

-- Pre-aggregated daily stats for fast dashboard queries
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Registration stats
  registrations INT DEFAULT 0,
  vip_registrations INT DEFAULT 0,

  -- Traffic stats
  page_views INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,

  -- Attendance stats
  attendees INT DEFAULT 0,
  peak_live_viewers INT DEFAULT 0,
  avg_watch_time_seconds INT DEFAULT 0,

  -- Email stats
  emails_sent INT DEFAULT 0,
  emails_delivered INT DEFAULT 0,
  emails_opened INT DEFAULT 0,
  emails_clicked INT DEFAULT 0,

  -- SMS stats
  sms_sent INT DEFAULT 0,
  sms_delivered INT DEFAULT 0,

  -- Revenue stats
  purchases INT DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,

  -- UTM breakdown stored as JSON for flexibility
  utm_breakdown JSONB DEFAULT '{}',
  -- {
  --   "by_source": {"facebook": 50, "google": 30},
  --   "by_medium": {"cpc": 40, "organic": 40},
  --   "by_campaign": {"jan_promo": 80}
  -- }

  -- Device breakdown
  device_breakdown JSONB DEFAULT '{}',
  -- {"desktop": 60, "mobile": 35, "tablet": 5}

  -- Geographic breakdown
  geo_breakdown JSONB DEFAULT '{}',
  -- {"US": 70, "CA": 15, "UK": 10, "other": 5}

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, webinar_id, date)
);

CREATE INDEX idx_analytics_daily_lookup ON analytics_daily(workspace_id, webinar_id, date);

-- Hourly stats for live webinar dashboards
CREATE TABLE analytics_hourly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
  hour TIMESTAMPTZ NOT NULL, -- Truncated to hour

  registrations INT DEFAULT 0,
  page_views INT DEFAULT 0,
  live_viewers INT DEFAULT 0, -- Point-in-time max

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, webinar_id, hour)
);

-- ============================================================================
-- WEBHOOKS
-- ============================================================================

-- Outgoing webhook configurations
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  url TEXT NOT NULL,

  -- Events to trigger on
  events TEXT[] NOT NULL, -- ['registration.created', 'attendance.joined', 'purchase.completed']

  -- Authentication
  secret TEXT, -- For HMAC signing
  headers JSONB DEFAULT '{}', -- Custom headers

  is_active BOOLEAN DEFAULT true,

  -- Stats
  success_count INT DEFAULT 0,
  failure_count INT DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook delivery logs (both incoming and outgoing)
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  endpoint_id UUID REFERENCES webhook_endpoints(id) ON DELETE SET NULL,

  direction webhook_direction NOT NULL,

  -- Request info
  url TEXT NOT NULL,
  method TEXT DEFAULT 'POST',
  headers JSONB,
  payload JSONB,

  -- Response info
  status_code INT,
  response_body TEXT,
  response_time_ms INT,

  -- Status
  status webhook_status DEFAULT 'pending',
  attempts INT DEFAULT 0,
  next_retry_at TIMESTAMPTZ,

  -- Error tracking
  error TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_workspace ON webhook_logs(workspace_id, created_at);
CREATE INDEX idx_webhook_logs_endpoint ON webhook_logs(endpoint_id, created_at);
CREATE INDEX idx_webhook_logs_retry ON webhook_logs(next_retry_at) WHERE status = 'retrying';

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Action info
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', etc.
  resource_type TEXT NOT NULL, -- 'webinar', 'registrant', 'integration', etc.
  resource_id UUID,

  -- Change details
  old_values JSONB,
  new_values JSONB,

  -- Request context
  ip_address INET,
  user_agent TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_workspace ON audit_logs(workspace_id, created_at);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ============================================================================
-- TAGS (for segmentation)
-- ============================================================================

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366F1',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, name)
);

CREATE TABLE registrant_tags (
  registrant_id UUID NOT NULL REFERENCES registrants(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (registrant_id, tag_id)
);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_sms ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrant_tags ENABLE ROW LEVEL SECURITY;

-- Helper function to check workspace membership
CREATE OR REPLACE FUNCTION public.user_has_workspace_access(workspace_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = workspace_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Workspaces: Members can view their workspaces
CREATE POLICY "Members can view workspaces"
  ON workspaces FOR SELECT
  USING (public.user_has_workspace_access(id));

CREATE POLICY "Owners can update workspaces"
  ON workspaces FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Workspace members: Can view members of their workspaces
CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT
  USING (public.user_has_workspace_access(workspace_id));

-- Generic workspace-scoped policies for most tables
CREATE POLICY "Workspace access for integrations"
  ON integrations FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for webinars"
  ON webinars FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for registrants"
  ON registrants FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for email_templates"
  ON email_templates FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for sms_templates"
  ON sms_templates FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for scheduled_emails"
  ON scheduled_emails FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for scheduled_sms"
  ON scheduled_sms FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for email_logs"
  ON email_logs FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for sms_logs"
  ON sms_logs FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for sequences"
  ON sequences FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for sequence_steps"
  ON sequence_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sequences
      WHERE sequences.id = sequence_steps.sequence_id
      AND public.user_has_workspace_access(sequences.workspace_id)
    )
  );

CREATE POLICY "Workspace access for sequence_enrollments"
  ON sequence_enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sequences
      WHERE sequences.id = sequence_enrollments.sequence_id
      AND public.user_has_workspace_access(sequences.workspace_id)
    )
  );

CREATE POLICY "Workspace access for events"
  ON events FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for analytics_daily"
  ON analytics_daily FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for analytics_hourly"
  ON analytics_hourly FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for webhook_endpoints"
  ON webhook_endpoints FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for webhook_logs"
  ON webhook_logs FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for audit_logs"
  ON audit_logs FOR SELECT
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for api_keys"
  ON api_keys FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for tags"
  ON tags FOR ALL
  USING (public.user_has_workspace_access(workspace_id));

CREATE POLICY "Workspace access for registrant_tags"
  ON registrant_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM registrants
      WHERE registrants.id = registrant_tags.registrant_id
      AND public.user_has_workspace_access(registrants.workspace_id)
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_workspace_members_updated_at BEFORE UPDATE ON workspace_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_webinars_updated_at BEFORE UPDATE ON webinars FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_registrants_updated_at BEFORE UPDATE ON registrants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON sms_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_scheduled_emails_updated_at BEFORE UPDATE ON scheduled_emails FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_scheduled_sms_updated_at BEFORE UPDATE ON scheduled_sms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON sequences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sequence_steps_updated_at BEFORE UPDATE ON sequence_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sequence_enrollments_updated_at BEFORE UPDATE ON sequence_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_analytics_daily_updated_at BEFORE UPDATE ON analytics_daily FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON webhook_endpoints FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update webinar registrant count on registration
CREATE OR REPLACE FUNCTION update_webinar_registrant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE webinars SET
      registrant_count = registrant_count + 1,
      vip_count = vip_count + CASE WHEN NEW.is_vip THEN 1 ELSE 0 END
    WHERE id = NEW.webinar_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE webinars SET
      registrant_count = registrant_count - 1,
      vip_count = vip_count - CASE WHEN OLD.is_vip THEN 1 ELSE 0 END
    WHERE id = OLD.webinar_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_vip <> NEW.is_vip THEN
    UPDATE webinars SET
      vip_count = vip_count + CASE WHEN NEW.is_vip THEN 1 ELSE -1 END
    WHERE id = NEW.webinar_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_webinar_registrant_count
  AFTER INSERT OR UPDATE OR DELETE ON registrants
  FOR EACH ROW EXECUTE FUNCTION update_webinar_registrant_count();

-- Auto-create profile on user signup
-- NOTE: This function is created but the trigger must be added via Supabase Dashboard
-- Go to: Database > Triggers > Create a new trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- IMPORTANT: After running this schema, manually create this trigger in Supabase Dashboard:
-- Table: auth.users
-- Event: AFTER INSERT
-- Function: public.handle_new_user()

-- Generate workspace slug from name
CREATE OR REPLACE FUNCTION generate_workspace_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INT := 0;
BEGIN
  -- Convert name to URL-friendly slug
  base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  new_slug := base_slug;

  -- Check for uniqueness and append number if needed
  WHILE EXISTS (SELECT 1 FROM workspaces WHERE slug = new_slug AND id <> COALESCE(NEW.id, uuid_generate_v4())) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := new_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_workspace_slug_trigger
  BEFORE INSERT OR UPDATE OF name ON workspaces
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '')
  EXECUTE FUNCTION generate_workspace_slug();

-- ============================================================================
-- STORAGE BUCKETS (for file uploads)
-- ============================================================================

-- These would be created via Supabase Dashboard or API:
-- 1. workspace-logos - Public bucket for workspace logos
-- 2. webinar-assets - Public bucket for webinar images, thumbnails
-- 3. email-attachments - Private bucket for email attachments

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for tables that need live updates
-- Run in Supabase Dashboard under Database > Replication

-- ALTER PUBLICATION supabase_realtime ADD TABLE registrants;
-- ALTER PUBLICATION supabase_realtime ADD TABLE events;
-- ALTER PUBLICATION supabase_realtime ADD TABLE webinars;

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

-- Webinar summary view with computed stats
CREATE OR REPLACE VIEW webinar_summaries AS
SELECT
  w.*,
  ws.name as workspace_name,
  COALESCE(r.total_registrants, 0) as total_registrants,
  COALESCE(r.total_vips, 0) as total_vips,
  COALESCE(r.total_attended, 0) as total_attended,
  COALESCE(r.total_purchased, 0) as total_purchased,
  COALESCE(r.total_revenue, 0) as total_revenue,
  CASE
    WHEN COALESCE(r.total_registrants, 0) > 0
    THEN ROUND((COALESCE(r.total_attended, 0)::NUMERIC / r.total_registrants) * 100, 1)
    ELSE 0
  END as show_rate,
  CASE
    WHEN COALESCE(r.total_attended, 0) > 0
    THEN ROUND((COALESCE(r.total_purchased, 0)::NUMERIC / r.total_attended) * 100, 1)
    ELSE 0
  END as conversion_rate
FROM webinars w
JOIN workspaces ws ON ws.id = w.workspace_id
LEFT JOIN (
  SELECT
    webinar_id,
    COUNT(*) as total_registrants,
    COUNT(*) FILTER (WHERE is_vip) as total_vips,
    COUNT(*) FILTER (WHERE status = 'attended') as total_attended,
    COUNT(*) FILTER (WHERE has_purchased) as total_purchased,
    SUM(COALESCE(purchase_amount, 0)) as total_revenue
  FROM registrants
  GROUP BY webinar_id
) r ON r.webinar_id = w.id;

-- ============================================================================
-- SEED DATA (Optional - for development)
-- ============================================================================

-- Uncomment to add sample data for testing
/*
-- Insert a test workspace
INSERT INTO workspaces (id, name, slug, brand_color, industry)
VALUES ('00000000-0000-0000-0000-000000000001', 'Apex Trading', 'apex-trading', '#6366F1', 'Trading & Finance');

-- Insert test email templates
INSERT INTO email_templates (workspace_id, name, type, subject, body) VALUES
('00000000-0000-0000-0000-000000000001', 'Welcome Email', 'confirmation',
 'You''re Registered! {{firstName}}, here''s your access',
 'Hey {{firstName}},

Welcome to the Apex Masterclass! Your spot is confirmed.

Save this link: {{joinUrl}}

See you there!'),
('00000000-0000-0000-0000-000000000001', '24h Reminder', '24hr_reminder',
 '{{firstName}}, the Apex Masterclass is TOMORROW',
 'Hey {{firstName}},

Quick reminder - the Apex Masterclass is happening tomorrow!

Join here: {{joinUrl}}

Don''t miss it.');
*/
