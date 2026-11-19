-- seat-signal: 의자 20개 상태, 직원 알림, 이력, 시연 모드

create table if not exists public.chairs (
  id integer primary key check (id between 1 and 20),
  table_number integer not null,
  status text not null default 'green',
  away_started_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint chairs_status_check check (status in ('green', 'red', 'yellow')),
  constraint chairs_away_consistency check ((status = 'yellow') = (away_started_at is not null))
);

create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  demo_mode boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_logs (
  id bigint generated always as identity primary key,
  chair_id integer not null references public.chairs(id),
  message text not null,
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

create table if not exists public.chair_events (
  id bigint generated always as identity primary key,
  chair_id integer not null references public.chairs(id),
  from_status text not null,
  to_status text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

insert into public.chairs (id, table_number)
select n, ((n - 1) / 4) + 1 from generate_series(1, 20) as n
on conflict (id) do nothing;
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

-- 자리 비움 제한 시간: 시연 모드 10초, 일반 20분
create or replace function public.away_limit() returns interval
language sql stable set search_path = public as $$
  select case when (select demo_mode from public.app_settings where id = 1)
    then interval '10 seconds' else interval '20 minutes' end
$$;

-- 시간이 지난 노란불 의자를 초록불로 바꾸고 직원 알림을 한 번만 남긴다
create or replace function public.expire_chairs() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with expired as (
    update public.chairs
       set status = 'green', away_started_at = null, updated_at = now()
     where status = 'yellow' and now() - away_started_at >= public.away_limit()
    returning id
  ), l as (
    insert into public.staff_logs (chair_id, message)
    select id, '[' || id || '번 의자] 20분 초과 - 소지품 보관 바구니 이동 필요' from expired
  ), e as (
    insert into public.chair_events (chair_id, from_status, to_status, reason)
    select id, 'yellow', 'green', '시간 초과' from expired
  )
  select count(*) into n from expired;
  return n;
end $$;

-- 센서 감지 흉내: 초록→빨강(착석), 빨강→노랑(이석), 노랑→빨강(복귀)
create or replace function public.tap_chair(p_id integer) returns void
language plpgsql security definer set search_path = public as $$
declare cur text; nxt text; why text;
begin
  perform public.expire_chairs();
  select status into cur from public.chairs where id = p_id for update;
  if cur is null then raise exception 'unknown chair'; end if;
  if cur = 'green' then nxt := 'red'; why := '착석';
  elsif cur = 'red' then nxt := 'yellow'; why := '이석';
  else nxt := 'red'; why := '복귀'; end if;
  update public.chairs
     set status = nxt,
         away_started_at = case when nxt = 'yellow' then now() else null end,
         updated_at = now()
   where id = p_id;
  insert into public.chair_events (chair_id, from_status, to_status, reason) values (p_id, cur, nxt, why);
end $$;

create or replace function public.set_demo_mode(p_on boolean) returns void
language sql security definer set search_path = public as $$
  update public.app_settings set demo_mode = p_on, updated_at = now() where id = 1;
$$;

create or replace function public.handle_log(p_id bigint) returns void
language sql security definer set search_path = public as $$
  update public.staff_logs set handled_at = now() where id = p_id and handled_at is null;
$$;

-- 시연을 처음부터 다시 하기 위한 초기화
create or replace function public.reset_demo() returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.chairs set status = 'green', away_started_at = null, updated_at = now() where true;
  delete from public.staff_logs where true;
  delete from public.chair_events where true;
end $$;

-- 권한: 익명 사용자는 읽기만, 변경은 위 함수로만
alter table public.chairs enable row level security;
alter table public.app_settings enable row level security;
alter table public.staff_logs enable row level security;
alter table public.chair_events enable row level security;

revoke all on public.chairs, public.app_settings, public.staff_logs, public.chair_events from anon, authenticated;
grant select on public.chairs, public.app_settings, public.staff_logs, public.chair_events to anon, authenticated;

drop policy if exists chairs_read on public.chairs;
create policy chairs_read on public.chairs for select to anon, authenticated using (true);
drop policy if exists settings_read on public.app_settings;
create policy settings_read on public.app_settings for select to anon, authenticated using (true);
drop policy if exists logs_read on public.staff_logs;
create policy logs_read on public.staff_logs for select to anon, authenticated using (true);
drop policy if exists events_read on public.chair_events;
create policy events_read on public.chair_events for select to anon, authenticated using (true);

revoke execute on all functions in schema public from public;
grant execute on function public.expire_chairs(), public.tap_chair(integer), public.set_demo_mode(boolean),
  public.handle_log(bigint), public.reset_demo() to anon, authenticated;

alter publication supabase_realtime add table public.chairs, public.app_settings, public.staff_logs, public.chair_events;

-- 화면 시계가 어긋나도 남은 시간을 맞출 수 있게 서버 시각을 알려 준다
create or replace function public.server_now() returns timestamptz
language sql stable set search_path = public as $$ select now() $$;
grant execute on function public.server_now() to anon, authenticated;
