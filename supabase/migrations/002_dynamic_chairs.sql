-- 의자 수를 화면에서 늘리고 줄일 수 있게 한다 (20개 고정 해제)
alter table public.chairs drop constraint if exists chairs_id_check;
alter table public.staff_logs drop constraint if exists staff_logs_chair_id_fkey;
alter table public.staff_logs add constraint staff_logs_chair_id_fkey foreign key (chair_id) references public.chairs(id) on delete cascade;
alter table public.chair_events drop constraint if exists chair_events_chair_id_fkey;
alter table public.chair_events add constraint chair_events_chair_id_fkey foreign key (chair_id) references public.chairs(id) on delete cascade;

-- 새 의자 한 개 추가: 번호는 마지막 번호 + 1, 테이블은 4석씩
create or replace function public.add_chair() returns void
language plpgsql security definer set search_path = public as $$
declare nid integer;
begin
  lock table public.chairs in share row exclusive mode;
  select coalesce(max(id), 0) + 1 into nid from public.chairs;
  if nid > 200 then raise exception 'too many chairs'; end if;
  insert into public.chairs (id, table_number) values (nid, ((nid - 1) / 4) + 1);
end $$;

-- 마지막 번호 의자 한 개 삭제: 빈 의자(초록)일 때만, 최소 1개는 남김
create or replace function public.remove_chair() returns void
language plpgsql security definer set search_path = public as $$
declare lid integer; st text;
begin
  lock table public.chairs in share row exclusive mode;
  if (select count(*) from public.chairs) <= 1 then raise exception 'last chair'; end if;
  select id, status into lid, st from public.chairs order by id desc limit 1;
  if st <> 'green' then raise exception 'chair in use'; end if;
  delete from public.chairs where id = lid;
end $$;

grant execute on function public.add_chair(), public.remove_chair() to anon, authenticated;
