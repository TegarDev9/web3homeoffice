create table if not exists public.academy_rooms (
  id text primary key,
  slug text not null unique,
  title_id text not null,
  title_en text not null,
  summary_id text not null,
  summary_en text not null,
  theme jsonb not null default '{}'::jsonb,
  position jsonb not null,
  marker text not null,
  sort_order int not null default 0,
  is_public_preview boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (jsonb_typeof(position) = 'array')
);

create table if not exists public.academy_tools (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.academy_rooms(id) on delete cascade,
  tool_key text not null unique,
  name_id text not null,
  name_en text not null,
  description_id text not null,
  description_en text not null,
  category text not null,
  difficulty text not null default 'beginner',
  is_member_only boolean not null default true,
  action_kind text not null check (action_kind in ('link', 'internal', 'demo')),
  action_payload jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.academy_pc_stations (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.academy_rooms(id) on delete cascade,
  label text not null,
  model_key text not null,
  position jsonb not null,
  rotation jsonb not null,
  specs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (room_id, label),
  check (jsonb_typeof(position) = 'array'),
  check (jsonb_typeof(rotation) = 'array')
);

create table if not exists public.academy_user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id text not null references public.academy_rooms(id) on delete cascade,
  tool_id uuid not null references public.academy_tools(id) on delete cascade,
  status text not null check (status in ('not_started', 'in_progress', 'completed')),
  score numeric,
  last_seen_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, room_id, tool_id)
);

create table if not exists public.academy_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  room_id text not null references public.academy_rooms(id) on delete cascade,
  tool_id uuid references public.academy_tools(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_academy_rooms_sort on public.academy_rooms(sort_order);
create index if not exists idx_academy_tools_room_sort on public.academy_tools(room_id, sort_order);
create index if not exists idx_academy_tools_member on public.academy_tools(is_member_only);
create index if not exists idx_academy_pc_stations_room on public.academy_pc_stations(room_id);
create index if not exists idx_academy_user_progress_user on public.academy_user_progress(user_id);
create index if not exists idx_academy_user_progress_room on public.academy_user_progress(room_id);
create index if not exists idx_academy_logs_room_created on public.academy_activity_logs(room_id, created_at desc);
create index if not exists idx_academy_logs_user_created on public.academy_activity_logs(user_id, created_at desc);

create trigger set_academy_rooms_updated_at
before update on public.academy_rooms
for each row
execute function public.set_updated_at();

create trigger set_academy_tools_updated_at
before update on public.academy_tools
for each row
execute function public.set_updated_at();

create trigger set_academy_pc_stations_updated_at
before update on public.academy_pc_stations
for each row
execute function public.set_updated_at();

create trigger set_academy_user_progress_updated_at
before update on public.academy_user_progress
for each row
execute function public.set_updated_at();
