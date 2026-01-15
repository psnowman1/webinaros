// Database types generated from Supabase schema
// These match the tables we created in schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          timezone: string
          email_notifications: boolean
          sms_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          timezone?: string
          email_notifications?: boolean
          sms_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          timezone?: string
          email_notifications?: boolean
          sms_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          brand_color: string
          timezone: string
          default_from_name: string | null
          default_from_email: string | null
          default_reply_to: string | null
          industry: string | null
          website: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan: string
          plan_limits: Json
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          slug?: string
          logo_url?: string | null
          brand_color?: string
          timezone?: string
          default_from_name?: string | null
          default_from_email?: string | null
          default_reply_to?: string | null
          industry?: string | null
          website?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: string
          plan_limits?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          brand_color?: string
          timezone?: string
          default_from_name?: string | null
          default_from_email?: string | null
          default_reply_to?: string | null
          industry?: string | null
          website?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: string
          plan_limits?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          invited_by: string | null
          invited_at: string
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          invited_by?: string | null
          invited_at?: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          invited_by?: string | null
          invited_at?: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      integrations: {
        Row: {
          id: string
          workspace_id: string
          provider: 'zoom' | 'gohighlevel' | 'stripe' | 'sendgrid' | 'postmark' | 'twilio' | 'google_calendar' | 'outlook' | 'zapier' | 'make'
          name: string
          status: 'active' | 'inactive' | 'error' | 'expired'
          credentials: Json
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          token_scope: string | null
          api_key: string | null
          api_secret: string | null
          external_account_id: string | null
          external_user_id: string | null
          account_email: string | null
          settings: Json
          last_error: string | null
          last_error_at: string | null
          error_count: number
          created_at: string
          updated_at: string
          last_used_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          provider: 'zoom' | 'gohighlevel' | 'stripe' | 'sendgrid' | 'postmark' | 'twilio' | 'google_calendar' | 'outlook' | 'zapier' | 'make'
          name: string
          status?: 'active' | 'inactive' | 'error' | 'expired'
          credentials?: Json
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          token_scope?: string | null
          api_key?: string | null
          api_secret?: string | null
          external_account_id?: string | null
          external_user_id?: string | null
          account_email?: string | null
          settings?: Json
          last_error?: string | null
          last_error_at?: string | null
          error_count?: number
          created_at?: string
          updated_at?: string
          last_used_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          provider?: 'zoom' | 'gohighlevel' | 'stripe' | 'sendgrid' | 'postmark' | 'twilio' | 'google_calendar' | 'outlook' | 'zapier' | 'make'
          name?: string
          status?: 'active' | 'inactive' | 'error' | 'expired'
          credentials?: Json
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          token_scope?: string | null
          api_key?: string | null
          api_secret?: string | null
          external_account_id?: string | null
          external_user_id?: string | null
          account_email?: string | null
          settings?: Json
          last_error?: string | null
          last_error_at?: string | null
          error_count?: number
          created_at?: string
          updated_at?: string
          last_used_at?: string | null
        }
      }
      webinars: {
        Row: {
          id: string
          workspace_id: string
          title: string
          slug: string
          description: string | null
          status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled'
          type: 'live' | 'automated' | 'hybrid'
          scheduled_at: string | null
          timezone: string
          duration_minutes: number
          is_recurring: boolean
          recurrence_rule: string | null
          zoom_integration_id: string | null
          zoom_meeting_id: string | null
          zoom_meeting_uuid: string | null
          zoom_join_url: string | null
          zoom_start_url: string | null
          zoom_password: string | null
          zoom_settings: Json
          registration_enabled: boolean
          registration_fields: Json
          registration_page_settings: Json
          thank_you_page_settings: Json
          offer_enabled: boolean
          offer_settings: Json
          ghl_registration_webhook: string | null
          ghl_vip_webhook: string | null
          ghl_attendance_webhook: string | null
          ghl_purchase_webhook: string | null
          vip_enabled: boolean
          vip_criteria: Json
          registrant_count: number
          vip_count: number
          attendee_count: number
          peak_live_viewers: number
          revenue: number
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          title: string
          slug?: string
          description?: string | null
          status?: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled'
          type?: 'live' | 'automated' | 'hybrid'
          scheduled_at?: string | null
          timezone?: string
          duration_minutes?: number
          is_recurring?: boolean
          recurrence_rule?: string | null
          zoom_integration_id?: string | null
          zoom_meeting_id?: string | null
          zoom_meeting_uuid?: string | null
          zoom_join_url?: string | null
          zoom_start_url?: string | null
          zoom_password?: string | null
          zoom_settings?: Json
          registration_enabled?: boolean
          registration_fields?: Json
          registration_page_settings?: Json
          thank_you_page_settings?: Json
          offer_enabled?: boolean
          offer_settings?: Json
          ghl_registration_webhook?: string | null
          ghl_vip_webhook?: string | null
          ghl_attendance_webhook?: string | null
          ghl_purchase_webhook?: string | null
          vip_enabled?: boolean
          vip_criteria?: Json
          registrant_count?: number
          vip_count?: number
          attendee_count?: number
          peak_live_viewers?: number
          revenue?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          title?: string
          slug?: string
          description?: string | null
          status?: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled'
          type?: 'live' | 'automated' | 'hybrid'
          scheduled_at?: string | null
          timezone?: string
          duration_minutes?: number
          is_recurring?: boolean
          recurrence_rule?: string | null
          zoom_integration_id?: string | null
          zoom_meeting_id?: string | null
          zoom_meeting_uuid?: string | null
          zoom_join_url?: string | null
          zoom_start_url?: string | null
          zoom_password?: string | null
          zoom_settings?: Json
          registration_enabled?: boolean
          registration_fields?: Json
          registration_page_settings?: Json
          thank_you_page_settings?: Json
          offer_enabled?: boolean
          offer_settings?: Json
          ghl_registration_webhook?: string | null
          ghl_vip_webhook?: string | null
          ghl_attendance_webhook?: string | null
          ghl_purchase_webhook?: string | null
          vip_enabled?: boolean
          vip_criteria?: Json
          registrant_count?: number
          vip_count?: number
          attendee_count?: number
          peak_live_viewers?: number
          revenue?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      registrants: {
        Row: {
          id: string
          workspace_id: string
          webinar_id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          custom_fields: Json
          is_vip: boolean
          vip_response: string | null
          status: 'registered' | 'confirmed' | 'attended' | 'no_show' | 'cancelled'
          zoom_registrant_id: string | null
          zoom_join_url: string | null
          zoom_synced_at: string | null
          ghl_contact_id: string | null
          ghl_synced_at: string | null
          joined_at: string | null
          left_at: string | null
          watch_time_seconds: number
          max_concurrent_time: string | null
          watched_replay: boolean
          replay_watch_time_seconds: number
          has_purchased: boolean
          purchase_amount: number | null
          purchased_at: string | null
          stripe_payment_id: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_term: string | null
          utm_content: string | null
          referrer: string | null
          landing_page: string | null
          ip_address: string | null
          user_agent: string | null
          device_type: string | null
          browser: string | null
          os: string | null
          country: string | null
          region: string | null
          city: string | null
          email_count: number
          email_opened_count: number
          email_clicked_count: number
          sms_count: number
          last_email_at: string | null
          last_sms_at: string | null
          unsubscribed_email: boolean
          unsubscribed_sms: boolean
          unsubscribed_at: string | null
          registered_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          webinar_id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          custom_fields?: Json
          is_vip?: boolean
          vip_response?: string | null
          status?: 'registered' | 'confirmed' | 'attended' | 'no_show' | 'cancelled'
          zoom_registrant_id?: string | null
          zoom_join_url?: string | null
          zoom_synced_at?: string | null
          ghl_contact_id?: string | null
          ghl_synced_at?: string | null
          joined_at?: string | null
          left_at?: string | null
          watch_time_seconds?: number
          max_concurrent_time?: string | null
          watched_replay?: boolean
          replay_watch_time_seconds?: number
          has_purchased?: boolean
          purchase_amount?: number | null
          purchased_at?: string | null
          stripe_payment_id?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          referrer?: string | null
          landing_page?: string | null
          ip_address?: string | null
          user_agent?: string | null
          device_type?: string | null
          browser?: string | null
          os?: string | null
          country?: string | null
          region?: string | null
          city?: string | null
          email_count?: number
          email_opened_count?: number
          email_clicked_count?: number
          sms_count?: number
          last_email_at?: string | null
          last_sms_at?: string | null
          unsubscribed_email?: boolean
          unsubscribed_sms?: boolean
          unsubscribed_at?: string | null
          registered_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          webinar_id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          custom_fields?: Json
          is_vip?: boolean
          vip_response?: string | null
          status?: 'registered' | 'confirmed' | 'attended' | 'no_show' | 'cancelled'
          zoom_registrant_id?: string | null
          zoom_join_url?: string | null
          zoom_synced_at?: string | null
          ghl_contact_id?: string | null
          ghl_synced_at?: string | null
          joined_at?: string | null
          left_at?: string | null
          watch_time_seconds?: number
          max_concurrent_time?: string | null
          watched_replay?: boolean
          replay_watch_time_seconds?: number
          has_purchased?: boolean
          purchase_amount?: number | null
          purchased_at?: string | null
          stripe_payment_id?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          referrer?: string | null
          landing_page?: string | null
          ip_address?: string | null
          user_agent?: string | null
          device_type?: string | null
          browser?: string | null
          os?: string | null
          country?: string | null
          region?: string | null
          city?: string | null
          email_count?: number
          email_opened_count?: number
          email_clicked_count?: number
          sms_count?: number
          last_email_at?: string | null
          last_sms_at?: string | null
          unsubscribed_email?: boolean
          unsubscribed_sms?: boolean
          unsubscribed_at?: string | null
          registered_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      email_templates: {
        Row: {
          id: string
          workspace_id: string
          name: string
          type: 'confirmation' | '24hr_reminder' | '1hr_reminder' | '15min_reminder' | 'starting_now' | 'replay' | 'no_show' | 'custom'
          subject: string
          body: string
          body_html: string | null
          from_name: string | null
          from_email: string | null
          reply_to: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          type?: 'confirmation' | '24hr_reminder' | '1hr_reminder' | '15min_reminder' | 'starting_now' | 'replay' | 'no_show' | 'custom'
          subject: string
          body: string
          body_html?: string | null
          from_name?: string | null
          from_email?: string | null
          reply_to?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          type?: 'confirmation' | '24hr_reminder' | '1hr_reminder' | '15min_reminder' | 'starting_now' | 'replay' | 'no_show' | 'custom'
          subject?: string
          body?: string
          body_html?: string | null
          from_name?: string | null
          from_email?: string | null
          reply_to?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      sms_templates: {
        Row: {
          id: string
          workspace_id: string
          name: string
          type: 'confirmation' | '24hr_reminder' | '1hr_reminder' | '15min_reminder' | 'starting_now' | 'replay' | 'no_show' | 'custom'
          message: string
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          type?: 'confirmation' | '24hr_reminder' | '1hr_reminder' | '15min_reminder' | 'starting_now' | 'replay' | 'no_show' | 'custom'
          message: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          type?: 'confirmation' | '24hr_reminder' | '1hr_reminder' | '15min_reminder' | 'starting_now' | 'replay' | 'no_show' | 'custom'
          message?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_has_workspace_access: {
        Args: {
          workspace_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: 'owner' | 'admin' | 'member' | 'viewer'
      webinar_status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled'
      webinar_type: 'live' | 'automated' | 'hybrid'
      registrant_status: 'registered' | 'confirmed' | 'attended' | 'no_show' | 'cancelled'
      integration_provider: 'zoom' | 'gohighlevel' | 'stripe' | 'sendgrid' | 'postmark' | 'twilio' | 'google_calendar' | 'outlook' | 'zapier' | 'make'
      integration_status: 'active' | 'inactive' | 'error' | 'expired'
      message_type: 'confirmation' | '24hr_reminder' | '1hr_reminder' | '15min_reminder' | 'starting_now' | 'replay' | 'no_show' | 'custom'
    }
  }
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row']
export type Integration = Database['public']['Tables']['integrations']['Row']
export type Webinar = Database['public']['Tables']['webinars']['Row']
export type Registrant = Database['public']['Tables']['registrants']['Row']
export type EmailTemplate = Database['public']['Tables']['email_templates']['Row']
export type SMSTemplate = Database['public']['Tables']['sms_templates']['Row']

export type InsertProfile = Database['public']['Tables']['profiles']['Insert']
export type InsertWorkspace = Database['public']['Tables']['workspaces']['Insert']
export type InsertWebinar = Database['public']['Tables']['webinars']['Insert']
export type InsertRegistrant = Database['public']['Tables']['registrants']['Insert']
