alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.provision_jobs enable row level security;
alter table public.platform_accounts enable row level security;
alter table public.webhook_events enable row level security;

create or replace function public.is_admin(user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = user_uuid and p.role = 'admin'
  );
$$;

create policy "profiles_select_self" on public.profiles
for select
using (auth.uid() = user_id);

create policy "profiles_update_self" on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "profiles_admin_all" on public.profiles
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "plans_public_read" on public.plans
for select
using (active = true);

create policy "plans_admin_all" on public.plans
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "subscriptions_select_self" on public.subscriptions
for select
using (auth.uid() = user_id);

create policy "subscriptions_admin_all" on public.subscriptions
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "provision_jobs_select_self" on public.provision_jobs
for select
using (auth.uid() = user_id);

create policy "provision_jobs_admin_all" on public.provision_jobs
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "platform_accounts_select_self" on public.platform_accounts
for select
using (auth.uid() = user_id);

create policy "platform_accounts_admin_all" on public.platform_accounts
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "webhook_events_admin_read" on public.webhook_events
for select
using (public.is_admin(auth.uid()));


