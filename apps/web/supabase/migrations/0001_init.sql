create extension if not exists pgcrypto;

create type public.app_role as enum ('user', 'admin');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'expired');
create type public.billing_interval as enum ('monthly', 'yearly');
create type public.provision_job_status as enum ('pending', 'running', 'provisioned', 'failed', 'revoked');
create type public.provision_template as enum ('vps-base', 'rpc-placeholder');
create type public.platform_name as enum ('telegram', 'farcaster', 'base');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  role public.app_role not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.plans (
  plan_id text primary key check (plan_id in ('starter', 'pro', 'scale')),
  name text not null,
  creem_product_id text not null,
  monthly_price_id text not null,
  yearly_price_id text not null,
  limits jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  creem_customer_id text,
  creem_subscription_id text,
  status public.subscription_status not null default 'expired',
  current_period_end timestamptz,
  plan_id text references public.plans(plan_id),
  interval public.billing_interval,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.provision_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.plans(plan_id),
  template public.provision_template not null,
  status public.provision_job_status not null default 'pending',
  region text not null,
  instance_id text,
  ip text,
  logs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platform_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform public.platform_name not null,
  platform_user_id text not null,
  username text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique(platform, platform_user_id)
);

create table if not exists public.webhook_events (
  id text primary key,
  provider text not null,
  type text not null,
  payload jsonb not null,
  received_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_provision_jobs_user_status on public.provision_jobs(user_id, status);
create index if not exists idx_provision_jobs_status_created on public.provision_jobs(status, created_at);
create index if not exists idx_platform_accounts_user on public.platform_accounts(user_id);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_plans_updated_at
before update on public.plans
for each row
execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

create trigger set_provision_jobs_updated_at
before update on public.provision_jobs
for each row
execute function public.set_updated_at();


