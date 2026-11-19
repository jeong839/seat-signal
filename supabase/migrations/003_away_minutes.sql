-- 카페마다 자리 비움 제한 시간을 정한다 (분 단위, 시연 모드는 계속 10초)
alter table public.app_settings add column if not exists away_minutes integer not null default 20;
alter table public.app_settings drop constraint if exists app_settings_away_minutes_check;
alter table public.app_settings add constraint app_settings_away_minutes_check check (away_minutes between 1 and 180);

create or replace function public.away_limit() returns interval
language sql stable set search_path = public as $$
  select case when s.demo_mode then interval '10 seconds' else make_interval(mins => s.away_minutes) end
  from public.app_settings s where s.id = 1
$$;

create or replace function public.set_away_minutes(p_min integer) returns void
language sql security definer set search_path = public as $$
  update public.app_settings set away_minutes = greatest(1, least(180, p_min)), updated_at = now() where id = 1;
$$;
grant execute on function public.set_away_minutes(integer) to anon, authenticated;

create or replace function public.expire_chairs() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer; mins integer;
begin
  select away_minutes into mins from public.app_settings where id = 1;
  with expired as (
    update public.chairs
       set status = 'green', away_started_at = null, updated_at = now()
     where status = 'yellow' and now() - away_started_at >= public.away_limit()
    returning id
  ), l as (
    insert into public.staff_logs (chair_id, message)
    select id, '[' || id || '번 의자] ' || mins || '분 초과 - 소지품 보관 바구니 이동 필요' from expired
  ), e as (
    insert into public.chair_events (chair_id, from_status, to_status, reason)
    select id, 'yellow', 'green', '시간 초과' from expired
  )
  select count(*) into n from expired;
  return n;
end $$;
