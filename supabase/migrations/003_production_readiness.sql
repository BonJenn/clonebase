-- Phase 5: Custom domains, analytics, rate limiting

-- Add production fields to tenants
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS custom_domain text UNIQUE,
  ADD COLUMN IF NOT EXISTS tier text DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  ADD COLUMN IF NOT EXISTS rate_limit_rpm int DEFAULT 60;

-- Custom domain verification
CREATE TABLE IF NOT EXISTS custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain text NOT NULL UNIQUE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
  verification_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX idx_custom_domains_tenant ON custom_domains(tenant_id);

-- Analytics events (lightweight, aggregated per day)
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  count int DEFAULT 1,
  metadata jsonb DEFAULT '{}',
  UNIQUE(tenant_id, event_type, event_date)
);

CREATE INDEX idx_analytics_tenant_date ON analytics_events(tenant_id, event_date);

-- Function to increment analytics counter (upsert)
CREATE OR REPLACE FUNCTION increment_analytics(
  p_tenant_id uuid,
  p_event_type text,
  p_metadata jsonb DEFAULT '{}'
) RETURNS void AS $$
BEGIN
  INSERT INTO analytics_events (tenant_id, event_type, event_date, count, metadata)
  VALUES (p_tenant_id, p_event_type, CURRENT_DATE, 1, p_metadata)
  ON CONFLICT (tenant_id, event_type, event_date)
  DO UPDATE SET count = analytics_events.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for custom_domains
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant owners can manage their domains"
  ON custom_domains FOR ALL
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- RLS for analytics (owner can read their own)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant owners can read their analytics"
  ON analytics_events FOR SELECT
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- Allow admin/service role to insert analytics
CREATE POLICY "Service role can insert analytics"
  ON analytics_events FOR INSERT
  WITH CHECK (true);
