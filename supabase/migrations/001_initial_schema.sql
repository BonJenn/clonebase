-- Clonebase Database Schema
-- Multi-tenant platform with Row-Level Security
-- All tenant-scoped tables enforce isolation via RLS policies

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto"; -- for gen_random_uuid()
create extension if not exists "citext";   -- case-insensitive text for slugs/emails

-- ============================================================
-- 1. USERS (extends Supabase auth.users)
-- Platform-level: no tenant_id
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  display_name text not null default '',
  avatar_url text,
  bio text,
  stripe_customer_id text,          -- for purchasing templates
  stripe_connect_account_id text,   -- for receiving payouts as a creator
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_email on public.profiles(email);
create index idx_profiles_stripe_customer on public.profiles(stripe_customer_id) where stripe_customer_id is not null;

-- ============================================================
-- 2. APP TEMPLATES
-- Platform-level: these are the "blueprints" users publish
-- ============================================================
create type template_status as enum ('draft', 'published', 'archived');
create type template_visibility as enum ('public', 'private');

create table public.app_templates (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug citext not null unique,          -- used in marketplace URLs
  description text,
  long_description text,                -- markdown content for detail page
  category text,
  tags text[] default '{}',
  icon_url text,
  preview_url text,                     -- screenshot/preview image
  status template_status not null default 'draft',
  visibility template_visibility not null default 'private',
  -- Template definition: describes the app's schema and config
  -- Stored as JSONB so templates can define arbitrary structures
  ui_config jsonb default '{}',         -- UI layout/component config
  api_config jsonb default '{}',        -- API route definitions
  db_schema jsonb default '{}',         -- table/column definitions for tenant DBs
  clone_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_templates_creator on public.app_templates(creator_id);
create index idx_templates_slug on public.app_templates(slug);
create index idx_templates_status on public.app_templates(status) where status = 'published';
create index idx_templates_category on public.app_templates(category) where category is not null;
create index idx_templates_tags on public.app_templates using gin(tags);

-- ============================================================
-- 3. TEMPLATE PRICING
-- Platform-level: pricing info for templates
-- ============================================================
create type pricing_type as enum ('free', 'one_time', 'subscription');

create table public.template_pricing (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null unique references public.app_templates(id) on delete cascade,
  pricing_type pricing_type not null default 'free',
  price_cents int not null default 0,           -- price in cents (USD)
  currency text not null default 'usd',
  stripe_price_id text,                         -- Stripe Price object ID
  stripe_product_id text,                       -- Stripe Product object ID
  revenue_share_percent int not null default 85, -- creator gets 85% by default
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_price check (
    (pricing_type = 'free' and price_cents = 0) or
    (pricing_type != 'free' and price_cents > 0)
  )
);

-- ============================================================
-- 4. TEMPLATE PURCHASES
-- Track who bought what
-- ============================================================
create table public.template_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid not null references public.app_templates(id) on delete cascade,
  stripe_payment_intent_id text,
  amount_cents int not null default 0,
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  unique(user_id, template_id)  -- one purchase per user per template
);

create index idx_purchases_user on public.template_purchases(user_id);
create index idx_purchases_template on public.template_purchases(template_id);

-- ============================================================
-- 5. TENANTS
-- Each cloned app gets a tenant. This is the isolation boundary.
-- ============================================================
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug citext not null unique,       -- becomes the subdomain: {slug}.clonebase.com
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Slug validation: only lowercase alphanumeric and hyphens
  constraint valid_slug check (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' and length(slug) >= 3 and length(slug) <= 63)
);

create index idx_tenants_owner on public.tenants(owner_id);
create index idx_tenants_slug on public.tenants(slug);

-- ============================================================
-- 6. APP INSTANCES
-- A cloned template running under a specific tenant
-- ============================================================
create type instance_status as enum ('provisioning', 'active', 'suspended', 'deleted');

create table public.app_instances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  template_id uuid not null references public.app_templates(id) on delete restrict,
  name text not null,
  status instance_status not null default 'provisioning',
  -- Snapshot of template config at clone time (so template updates don't break running apps)
  config_snapshot jsonb not null default '{}',
  custom_config jsonb default '{}',    -- user overrides after cloning
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_instances_tenant on public.app_instances(tenant_id);
create index idx_instances_template on public.app_instances(template_id);
create index idx_instances_status on public.app_instances(status);

-- ============================================================
-- 7. INTEGRATION DEFINITIONS
-- What integrations a template requires (defined by template creator)
-- ============================================================
create type integration_type as enum ('platform_managed', 'user_provided', 'optional');

create table public.integration_definitions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.app_templates(id) on delete cascade,
  name text not null,                   -- e.g., "OpenAI", "Stripe", "SendGrid"
  service_key text not null,            -- machine-readable key, e.g., "openai"
  description text,
  integration_type integration_type not null default 'user_provided',
  -- What fields the user needs to provide (e.g., ["api_key", "org_id"])
  required_fields jsonb not null default '["api_key"]',
  -- Validation endpoint or method
  validation_config jsonb default '{}',
  icon_url text,
  created_at timestamptz not null default now()
);

create index idx_integrations_template on public.integration_definitions(template_id);

-- ============================================================
-- 8. TENANT INTEGRATIONS
-- Per-tenant integration connections (tenant-scoped)
-- ============================================================
create type connection_status as enum ('not_connected', 'connected', 'error');

create table public.tenant_integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  integration_def_id uuid not null references public.integration_definitions(id) on delete cascade,
  status connection_status not null default 'not_connected',
  connected_at timestamptz,
  last_validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, integration_def_id)
);

create index idx_tenant_integrations_tenant on public.tenant_integrations(tenant_id);

-- ============================================================
-- 9. ENCRYPTED SECRETS
-- Stores encrypted API keys. NEVER exposed to client.
-- Encryption happens in application layer with AES-256-GCM.
-- The DB only stores ciphertext + IV + auth tag.
-- ============================================================
create table public.encrypted_secrets (
  id uuid primary key default gen_random_uuid(),
  tenant_integration_id uuid not null references public.tenant_integrations(id) on delete cascade,
  field_name text not null,             -- e.g., "api_key", "org_id"
  encrypted_value text not null,        -- base64-encoded ciphertext
  iv text not null,                     -- base64-encoded initialization vector
  auth_tag text not null,               -- base64-encoded GCM auth tag
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_integration_id, field_name)
);

-- No index on encrypted_value (never queried by value)
create index idx_secrets_integration on public.encrypted_secrets(tenant_integration_id);

-- ============================================================
-- 10. TENANT DATA (generic tenant-scoped data store)
-- For MVP, templates store their runtime data here as JSONB
-- ============================================================
create table public.tenant_data (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  app_instance_id uuid not null references public.app_instances(id) on delete cascade,
  collection text not null,             -- logical table name (e.g., "orders", "posts")
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tenant_data_tenant on public.tenant_data(tenant_id);
create index idx_tenant_data_collection on public.tenant_data(tenant_id, collection);
create index idx_tenant_data_instance on public.tenant_data(app_instance_id);

-- ============================================================
-- ROW-LEVEL SECURITY POLICIES
-- Critical: these enforce multi-tenant isolation at the DB level
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.app_templates enable row level security;
alter table public.template_pricing enable row level security;
alter table public.template_purchases enable row level security;
alter table public.tenants enable row level security;
alter table public.app_instances enable row level security;
alter table public.integration_definitions enable row level security;
alter table public.tenant_integrations enable row level security;
alter table public.encrypted_secrets enable row level security;
alter table public.tenant_data enable row level security;

-- ---- PROFILES ----
-- Users can read any profile (public) but only update their own
create policy "profiles_select" on public.profiles
  for select using (true);

create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

-- ---- APP TEMPLATES ----
-- Anyone can read published public templates; creators can CRUD their own
create policy "templates_select_public" on public.app_templates
  for select using (
    (status = 'published' and visibility = 'public')
    or creator_id = auth.uid()
  );

create policy "templates_insert" on public.app_templates
  for insert with check (creator_id = auth.uid());

create policy "templates_update" on public.app_templates
  for update using (creator_id = auth.uid());

create policy "templates_delete" on public.app_templates
  for delete using (creator_id = auth.uid());

-- ---- TEMPLATE PRICING ----
-- Readable by anyone (public info), writable by template creator
create policy "pricing_select" on public.template_pricing
  for select using (true);

create policy "pricing_insert" on public.template_pricing
  for insert with check (
    exists (select 1 from public.app_templates where id = template_id and creator_id = auth.uid())
  );

create policy "pricing_update" on public.template_pricing
  for update using (
    exists (select 1 from public.app_templates where id = template_id and creator_id = auth.uid())
  );

-- ---- TEMPLATE PURCHASES ----
-- Users can see their own purchases
create policy "purchases_select" on public.template_purchases
  for select using (user_id = auth.uid());

create policy "purchases_insert" on public.template_purchases
  for insert with check (user_id = auth.uid());

-- ---- TENANTS ----
-- Owners can see and manage their tenants
create policy "tenants_select" on public.tenants
  for select using (owner_id = auth.uid());

create policy "tenants_insert" on public.tenants
  for insert with check (owner_id = auth.uid());

create policy "tenants_update" on public.tenants
  for update using (owner_id = auth.uid());

-- ---- APP INSTANCES ----
-- Only visible to the tenant owner
create policy "instances_select" on public.app_instances
  for select using (
    exists (select 1 from public.tenants where id = tenant_id and owner_id = auth.uid())
  );

create policy "instances_insert" on public.app_instances
  for insert with check (
    exists (select 1 from public.tenants where id = tenant_id and owner_id = auth.uid())
  );

create policy "instances_update" on public.app_instances
  for update using (
    exists (select 1 from public.tenants where id = tenant_id and owner_id = auth.uid())
  );

-- ---- INTEGRATION DEFINITIONS ----
-- Readable if template is visible; writable by template creator
create policy "integ_defs_select" on public.integration_definitions
  for select using (
    exists (
      select 1 from public.app_templates
      where id = template_id
        and ((status = 'published' and visibility = 'public') or creator_id = auth.uid())
    )
  );

create policy "integ_defs_insert" on public.integration_definitions
  for insert with check (
    exists (select 1 from public.app_templates where id = template_id and creator_id = auth.uid())
  );

create policy "integ_defs_update" on public.integration_definitions
  for update using (
    exists (select 1 from public.app_templates where id = template_id and creator_id = auth.uid())
  );

-- ---- TENANT INTEGRATIONS ----
-- Only visible to tenant owner. NEVER expose to other users.
create policy "tenant_integ_select" on public.tenant_integrations
  for select using (
    exists (select 1 from public.tenants where id = tenant_id and owner_id = auth.uid())
  );

create policy "tenant_integ_insert" on public.tenant_integrations
  for insert with check (
    exists (select 1 from public.tenants where id = tenant_id and owner_id = auth.uid())
  );

create policy "tenant_integ_update" on public.tenant_integrations
  for update using (
    exists (select 1 from public.tenants where id = tenant_id and owner_id = auth.uid())
  );

-- ---- ENCRYPTED SECRETS ----
-- CRITICAL: Secrets are NEVER readable by the client.
-- Only the service role (server-side) can access these.
-- No select policy for authenticated users = they cannot read secrets.
create policy "secrets_no_client_read" on public.encrypted_secrets
  for select using (false);  -- Blocks all client reads. Service role bypasses RLS.

-- Only allow insert/update via server (service role). Block client writes too.
create policy "secrets_no_client_write" on public.encrypted_secrets
  for insert with check (false);

create policy "secrets_no_client_update" on public.encrypted_secrets
  for update using (false);

-- ---- TENANT DATA ----
-- Strict tenant isolation: only tenant owner can access their data
create policy "tenant_data_select" on public.tenant_data
  for select using (
    exists (select 1 from public.tenants where id = tenant_id and owner_id = auth.uid())
  );

create policy "tenant_data_insert" on public.tenant_data
  for insert with check (
    exists (select 1 from public.tenants where id = tenant_id and owner_id = auth.uid())
  );

create policy "tenant_data_update" on public.tenant_data
  for update using (
    exists (select 1 from public.tenants where id = tenant_id and owner_id = auth.uid())
  );

create policy "tenant_data_delete" on public.tenant_data
  for delete using (
    exists (select 1 from public.tenants where id = tenant_id and owner_id = auth.uid())
  );

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers to all mutable tables
create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.app_templates
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.template_pricing
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.tenants
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.app_instances
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.tenant_integrations
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.encrypted_secrets
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.tenant_data
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup (triggered by Supabase auth)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Increment clone count (called server-side during clone)
create or replace function public.increment_clone_count(template_uuid uuid)
returns void as $$
begin
  update public.app_templates
  set clone_count = clone_count + 1
  where id = template_uuid;
end;
$$ language plpgsql security definer;
