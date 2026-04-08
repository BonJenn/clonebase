-- Stripe Connect Express for tenant payments.
-- Lets cloners (tenant owners) accept payments from their end-users with a 3%
-- platform fee deducted automatically. Money flows: customer → Stripe → connected
-- account (cloner) with application_fee → platform.
--
-- One Connect account per user (stored on profile). All tenants owned by that
-- user share the same connected account.

-- ─── Profile columns ───────────────────────────────────────────────────────
-- stripe_connect_account_id already exists from 001_initial_schema.sql
alter table public.profiles
  add column if not exists stripe_connect_charges_enabled boolean not null default false,
  add column if not exists stripe_connect_payouts_enabled boolean not null default false,
  add column if not exists stripe_connect_details_submitted boolean not null default false,
  add column if not exists stripe_connect_country text,
  add column if not exists stripe_connect_onboarded_at timestamptz;

-- ─── tenant_payments ───────────────────────────────────────────────────────
-- Records every successful payment processed through a connected account.
-- Written by the Stripe Connect webhook handler on checkout.session.completed.
create table if not exists public.tenant_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  app_instance_id uuid references public.app_instances(id) on delete set null,
  stripe_account_id text not null,                -- the connected account that received the funds
  stripe_session_id text unique,                  -- checkout.session id
  stripe_payment_intent_id text,
  amount_cents integer not null,                  -- total charged to customer
  platform_fee_cents integer not null default 0,  -- our 3% cut
  currency text not null default 'usd',
  customer_email text,
  customer_name text,
  line_items jsonb not null default '[]',
  status text not null default 'pending',         -- pending | paid | refunded | failed
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists idx_tenant_payments_tenant on public.tenant_payments(tenant_id);
create index if not exists idx_tenant_payments_session on public.tenant_payments(stripe_session_id) where stripe_session_id is not null;
create index if not exists idx_tenant_payments_status on public.tenant_payments(tenant_id, status);
create index if not exists idx_tenant_payments_created on public.tenant_payments(tenant_id, created_at desc);

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.tenant_payments enable row level security;

-- Tenant owners can read their own payments
create policy "tenant_payments_select" on public.tenant_payments
  for select using (
    exists (select 1 from public.tenants where id = tenant_id and owner_id = auth.uid())
  );

-- Only the service role (webhooks) writes to this table
-- No insert/update/delete policies for authenticated users — admin client only.
