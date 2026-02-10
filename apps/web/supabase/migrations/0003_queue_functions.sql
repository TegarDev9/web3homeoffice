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

create or replace function public.append_provision_job_log(job_id uuid, log_line jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  update public.provision_jobs
  set logs = logs || jsonb_build_array(log_line),
      updated_at = timezone('utc', now())
  where id = job_id;
$$;


