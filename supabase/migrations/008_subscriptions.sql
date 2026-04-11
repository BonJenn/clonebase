-- Subscription and credit tracking for Clonebase pricing tiers.
--
-- user_subscriptions: links a user to their active Stripe subscription.
-- One active subscription per user at a time.
--
-- credit_usage: tracks credits consumed per billing period. One row per
-- user per period. Incremented on each generation/follow-up.

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier_id text not null default 'free',              -- free | starter | pro | business
  credits_per_month integer not null default 30,     -- credits included in current plan
  stripe_subscription_id text unique,
  stripe_customer_id text,
  stripe_price_id text,
  status text not null default 'active',             -- active | canceled | past_due | trialing
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_user_subscriptions_user
  on public.user_subscriptions(user_id) where status = 'active';
create index if not exists idx_user_subscriptions_stripe
  on public.user_subscriptions(stripe_subscription_id) where stripe_subscription_id is not null;

create table if not exists public.credit_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_start timestamptz not null,                 -- billing period start
  period_end timestamptz not null,                   -- billing period end
  credits_used integer not null default 0,
  credits_limit integer not null default 30,         -- copied from subscription at period start
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_credit_usage_user_period
  on public.credit_usage(user_id, period_start);

-- RLS
alter table public.user_subscriptions enable row level security;
alter table public.credit_usage enable row level security;

-- Users can read their own subscription
create policy "subscriptions_select" on public.user_subscriptions
  for select using (user_id = auth.uid());

-- Users can read their own credit usage
create policy "credit_usage_select" on public.credit_usage
  for select using (user_id = auth.uid());

-- Only the service role (webhooks, API routes) writes to these tables.
-- No insert/update/delete policies for authenticated users.
