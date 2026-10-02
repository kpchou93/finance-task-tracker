-- Adoption record for migrations applied and verified through the SQL Editor.
-- Uses the history table format from:
-- https://github.com/supabase/supabase/blob/master/packages/pg-meta/src/sql/studio/database/migrations.ts
begin;
do $$ begin
 if to_regclass('public.companies') is null or to_regclass('public.tasks') is null or to_regclass('public.audit_log') is null then
  raise exception 'Apply the three migrations before registering their history.';
 end if;
 if exists(select 1 from pg_policies where schemaname='public' and policyname in ('companies_v1_write','tasks_v1_write')) then
  raise exception 'Lockdown migration has not been applied.';
 end if;
end $$;
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations(version text not null primary key, statements text[], name text);
alter table supabase_migrations.schema_migrations enable row level security;
insert into supabase_migrations.schema_migrations(version,name,statements) values
 ('0001','init',array[]::text[]),('0002','company_integrity',array[]::text[]),('0003','private_workspaces_audit',array[]::text[])
on conflict(version) do nothing;
commit;
select version,name from supabase_migrations.schema_migrations order by version;
