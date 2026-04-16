// ============================================================
// Clonebase Type Definitions
// Mirror the database schema for type-safe client/server code
// ============================================================

export type TemplateStatus = 'draft' | 'published' | 'archived';
export type TemplateVisibility = 'public' | 'private';
export type PricingType = 'free' | 'one_time' | 'subscription';
export type InstanceStatus = 'provisioning' | 'active' | 'suspended' | 'deleted';
export type IntegrationType = 'platform_managed' | 'user_provided' | 'optional';
export type ConnectionStatus = 'not_connected' | 'connected' | 'error';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  stripe_customer_id: string | null;
  stripe_connect_account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppTemplate {
  id: string;
  creator_id: string;
  name: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  category: string | null;
  tags: string[];
  icon_url: string | null;
  preview_url: string | null;
  status: TemplateStatus;
  visibility: TemplateVisibility;
  ui_config: Record<string, unknown>;
  api_config: Record<string, unknown>;
  db_schema: Record<string, unknown>;
  clone_count: number;
  average_rating: number;
  review_count: number;
  source_type: 'generated' | 'static';
  version: number;
  changelog: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  creator?: Profile;
  pricing?: TemplatePricing;
  integration_definitions?: IntegrationDefinition[];
  reviews?: TemplateReview[];
}

export interface TemplatePricing {
  id: string;
  template_id: string;
  pricing_type: PricingType;
  price_cents: number;
  currency: string;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  revenue_share_percent: number;
  created_at: string;
  updated_at: string;
}

export interface TemplatePurchase {
  id: string;
  user_id: string;
  template_id: string;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  status: string;
  created_at: string;
}

export interface TemplateReview {
  id: string;
  template_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
  reviewer?: Pick<Profile, 'display_name' | 'avatar_url'>;
}

export interface Tenant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  tier: 'free' | 'pro' | 'enterprise';
  rate_limit_rpm: number;
  created_at: string;
  updated_at: string;
}

export interface CustomDomain {
  id: string;
  tenant_id: string;
  domain: string;
  status: 'pending' | 'verified' | 'failed';
  verification_token: string;
  verified_at: string | null;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  tenant_id: string;
  event_type: string;
  event_date: string;
  count: number;
  metadata: Record<string, unknown>;
}

export interface AppInstance {
  id: string;
  tenant_id: string;
  template_id: string;
  name: string;
  status: InstanceStatus;
  config_snapshot: Record<string, unknown>;
  custom_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  tenant?: Tenant;
  template?: AppTemplate;
}

export interface IntegrationDefinition {
  id: string;
  template_id: string;
  name: string;
  service_key: string;
  description: string | null;
  integration_type: IntegrationType;
  required_fields: string[];
  validation_config: Record<string, unknown>;
  icon_url: string | null;
  created_at: string;
}

export interface TenantIntegration {
  id: string;
  tenant_id: string;
  integration_def_id: string;
  status: ConnectionStatus;
  connected_at: string | null;
  last_validated_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  definition?: IntegrationDefinition;
}

// Never sent to client — server-only type
export interface EncryptedSecret {
  id: string;
  tenant_integration_id: string;
  field_name: string;
  encrypted_value: string;
  iv: string;
  auth_tag: string;
  created_at: string;
  updated_at: string;
}
