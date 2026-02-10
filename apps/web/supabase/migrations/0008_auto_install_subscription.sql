do $$
begin
  create type public.provision_os as enum ('debian', 'ubuntu', 'kali');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.provision_request_source as enum ('manual', 'subscription_auto');
exception
  when duplicate_object then null;
end
$$;

alter table public.provision_jobs
  add column if not exists os public.provision_os not null default 'ubuntu',
  add column if not exists request_source public.provision_request_source not null default 'manual',
  add column if not exists subscription_id text;

create unique index if not exists idx_provision_jobs_auto_subscription_once
  on public.provision_jobs (subscription_id)
  where request_source = 'subscription_auto' and subscription_id is not null;

create table if not exists public.auto_install_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  template public.provision_template not null default 'vps-base',
  target_os public.provision_os not null default 'ubuntu',
  auto_install_armed boolean not null default false,
  arm_expires_at timestamptz,
  last_checkout_at timestamptz,
  last_triggered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_auto_install_preferences_updated_at on public.auto_install_preferences;
create trigger set_auto_install_preferences_updated_at
before update on public.auto_install_preferences
for each row
execute function public.set_updated_at();

alter table public.auto_install_preferences enable row level security;

drop policy if exists "auto_install_preferences_select_self" on public.auto_install_preferences;
create policy "auto_install_preferences_select_self" on public.auto_install_preferences
for select
using (auth.uid() = user_id);

drop policy if exists "auto_install_preferences_update_self" on public.auto_install_preferences;
create policy "auto_install_preferences_update_self" on public.auto_install_preferences
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "auto_install_preferences_admin_all" on public.auto_install_preferences;
create policy "auto_install_preferences_admin_all" on public.auto_install_preferences
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

