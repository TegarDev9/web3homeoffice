alter table public.provision_jobs
  add column if not exists retry_count integer not null default 0,
  add column if not exists max_retries integer not null default 3,
  add column if not exists next_retry_at timestamptz not null default timezone('utc', now()),
  add column if not exists last_error text,
  add column if not exists ssh_public_key text;

create index if not exists idx_provision_jobs_retry_poll
  on public.provision_jobs(status, next_retry_at, created_at);

create table if not exists public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id text,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'in_review', 'closed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_cancellation_requests_user_created
  on public.cancellation_requests(user_id, created_at desc);

create trigger set_cancellation_requests_updated_at
before update on public.cancellation_requests
for each row
execute function public.set_updated_at();

alter table public.cancellation_requests enable row level security;

create policy "cancellation_requests_select_self" on public.cancellation_requests
for select
using (auth.uid() = user_id);

create policy "cancellation_requests_insert_self" on public.cancellation_requests
for insert
with check (auth.uid() = user_id);

create policy "cancellation_requests_admin_all" on public.cancellation_requests
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create or replace function public.dequeue_provision_jobs(batch_size int default 5)
returns setof public.provision_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidate as (
    select pj.id
    from public.provision_jobs pj
    where pj.status = 'pending'
      and pj.next_retry_at <= timezone('utc', now())
    order by pj.created_at asc
    for update skip locked
    limit batch_size
  ),
  updated as (
    update public.provision_jobs pj
    set status = 'running',
        updated_at = timezone('utc', now()),
        logs = pj.logs || jsonb_build_array(
          jsonb_build_object(
            'ts', timezone('utc', now()),
            'level', 'info',
            'message', 'Job claimed by worker'
          )
        )
    where pj.id in (select id from candidate)
    returning pj.*
  )
  select * from updated;
end;
$$;
