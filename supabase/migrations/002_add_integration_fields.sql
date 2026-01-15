-- Add Zoom-related fields to webinars table
ALTER TABLE webinars
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS zoom_webinar_id TEXT,
ADD COLUMN IF NOT EXISTS zoom_join_url TEXT,
ADD COLUMN IF NOT EXISTS zoom_start_url TEXT,
ADD COLUMN IF NOT EXISTS zoom_registration_url TEXT,
ADD COLUMN IF NOT EXISTS ghl_tag TEXT;

-- Add Zoom and UTM fields to registrants table
ALTER TABLE registrants
ADD COLUMN IF NOT EXISTS zoom_registrant_id TEXT,
ADD COLUMN IF NOT EXISTS zoom_join_url TEXT,
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT;

-- Add credentials field to integrations table (JSON for API keys, secrets, etc.)
ALTER TABLE integrations
ADD COLUMN IF NOT EXISTS credentials JSONB DEFAULT '{}';

-- Create webhook_logs table for tracking incoming webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  webhook_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'received'
);

-- Create index for faster webhook log queries
CREATE INDEX IF NOT EXISTS idx_webhook_logs_workspace ON webhook_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);

-- Create index for webinar slug lookups
CREATE INDEX IF NOT EXISTS idx_webinars_slug ON webinars(slug);

-- Enable RLS on webhook_logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhook_logs
CREATE POLICY "Users can view webhook logs for their workspaces"
ON webhook_logs FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- Function to generate a URL-friendly slug
CREATE OR REPLACE FUNCTION generate_webinar_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base slug from title
  base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);

  -- If slug is not set, generate one
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    new_slug := base_slug;

    -- Check for uniqueness and append number if needed
    WHILE EXISTS (SELECT 1 FROM webinars WHERE slug = new_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.slug := new_slug;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug
DROP TRIGGER IF EXISTS webinar_slug_trigger ON webinars;
CREATE TRIGGER webinar_slug_trigger
BEFORE INSERT OR UPDATE ON webinars
FOR EACH ROW
EXECUTE FUNCTION generate_webinar_slug();
