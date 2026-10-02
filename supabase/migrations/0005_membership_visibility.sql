begin;
-- Legacy inserts can create their personal workspace in a BEFORE trigger.
-- RLS must see that membership created by the same outer INSERT statement.
-- STABLE functions keep the statement-start snapshot; VOLATILE reads a fresh one.
-- https://www.postgresql.org/docs/current/xfunc-volatility.html
alter function public.is_workspace_member(uuid) volatile;
alter function public.is_workspace_owner(uuid) volatile;
-- Preserve the fixed search_path, definer identity and authenticated-only grants.
do $$ begin
 if to_regclass('supabase_migrations.schema_migrations') is not null then
  insert into supabase_migrations.schema_migrations(version,name,statements)
  values('0005','membership_visibility',array[]::text[]) on conflict(version) do nothing;
 end if;
end $$;
commit;
