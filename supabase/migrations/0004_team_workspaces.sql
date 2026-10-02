begin;

create table public.workspaces (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(trim(name)) between 1 and 200),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 is_personal boolean not null default false
);
create unique index workspace_personal_owner on public.workspaces(created_by) where is_personal;
create table public.workspace_members (
 workspace_id uuid not null references public.workspaces(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete restrict,
 role text not null check(role in ('owner','member')),
 joined_at timestamptz not null default now(),
 primary key(workspace_id,user_id)
);
create index workspace_members_user on public.workspace_members(user_id,workspace_id);
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
revoke all on public.workspaces,public.workspace_members from anon,authenticated;
grant select on public.workspaces,public.workspace_members to authenticated;

-- Definer helpers avoid recursive membership RLS. They only answer for the caller.
create function public.is_workspace_member(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists(select 1 from public.workspace_members m where m.workspace_id=p_workspace_id and m.user_id=auth.uid());
$$;
create function public.is_workspace_owner(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists(select 1 from public.workspace_members m where m.workspace_id=p_workspace_id and m.user_id=auth.uid() and m.role='owner');
$$;
revoke all on function public.is_workspace_member(uuid),public.is_workspace_owner(uuid) from public,anon,authenticated;
grant execute on function public.is_workspace_member(uuid),public.is_workspace_owner(uuid) to authenticated;
create policy workspaces_member_read on public.workspaces for select to authenticated using(public.is_workspace_member(id));
create policy workspace_members_team_read on public.workspace_members for select to authenticated using(public.is_workspace_member(workspace_id));

create function public.ensure_personal_workspace()
returns uuid language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); result uuid;
begin
 if caller is null then raise exception 'Sign in to create a workspace.'; end if;
 insert into public.workspaces(name,created_by,is_personal) values('My workspace',caller,true)
 on conflict(created_by) where is_personal do update set created_by=excluded.created_by
 returning id into result;
 insert into public.workspace_members(workspace_id,user_id,role) values(result,caller,'owner') on conflict do nothing;
 return result;
end;
$$;
create function public.create_workspace(p_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); result uuid;
begin
 if caller is null then raise exception 'Sign in to create a workspace.'; end if;
 if p_name is null or char_length(trim(p_name)) not between 1 and 200 then raise exception 'Workspace name must be 1 to 200 characters.'; end if;
 insert into public.workspaces(name,created_by) values(trim(p_name),caller) returning id into result;
 insert into public.workspace_members(workspace_id,user_id,role) values(result,caller,'owner');
 return result;
end;
$$;
create function public.rename_workspace(p_workspace_id uuid,p_name text)
returns void language plpgsql security definer set search_path = '' as $$
begin
 perform 1 from public.workspaces where id=p_workspace_id for update;
 if not public.is_workspace_owner(p_workspace_id) then raise exception 'Only workspace owners can manage the team.'; end if;
 if p_name is null or char_length(trim(p_name)) not between 1 and 200 then raise exception 'Workspace name must be 1 to 200 characters.'; end if;
 update public.workspaces set name=trim(p_name) where id=p_workspace_id;
end;
$$;
create function public.add_workspace_member(p_workspace_id uuid,p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare member_id uuid;
begin
 perform 1 from public.workspaces where id=p_workspace_id for update;
 if not public.is_workspace_owner(p_workspace_id) then raise exception 'Only workspace owners can manage the team.'; end if;
 select id into member_id from auth.users where lower(email)=lower(trim(p_email)) and email_confirmed_at is not null limit 1;
 if member_id is null then raise exception 'This person must sign up and confirm their email first.'; end if;
 insert into public.workspace_members(workspace_id,user_id,role) values(p_workspace_id,member_id,'member') on conflict do nothing;
end;
$$;
create function public.remove_workspace_member(p_workspace_id uuid,p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
 perform 1 from public.workspaces where id=p_workspace_id for update;
 if not public.is_workspace_owner(p_workspace_id) then raise exception 'Only workspace owners can manage the team.'; end if;
 if exists(select 1 from public.workspace_members where workspace_id=p_workspace_id and user_id=p_user_id and role='owner')
 and (select count(*) from public.workspace_members where workspace_id=p_workspace_id and role='owner') <= 1 then
  raise exception 'The last owner cannot be removed.';
 end if;
 delete from public.workspace_members where workspace_id=p_workspace_id and user_id=p_user_id;
end;
$$;
create function public.get_workspace_members(p_workspace_id uuid)
returns table(user_id uuid,email text,role text,joined_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.is_workspace_member(p_workspace_id) then raise exception 'Workspace access denied.'; end if;
 return query select m.user_id,u.email::text,m.role,m.joined_at from public.workspace_members m join auth.users u on u.id=m.user_id where m.workspace_id=p_workspace_id order by m.joined_at,m.user_id;
end;
$$;
revoke all on function public.ensure_personal_workspace(),public.create_workspace(text),public.rename_workspace(uuid,text),public.add_workspace_member(uuid,text),public.remove_workspace_member(uuid,uuid),public.get_workspace_members(uuid) from public,anon,authenticated;
grant execute on function public.ensure_personal_workspace(),public.create_workspace(text),public.rename_workspace(uuid,text),public.add_workspace_member(uuid,text),public.remove_workspace_member(uuid,uuid),public.get_workspace_members(uuid) to authenticated;

alter table public.companies add column workspace_id uuid references public.workspaces(id) on delete restrict;
alter table public.tasks add column workspace_id uuid references public.workspaces(id) on delete restrict;
alter table public.audit_log add column workspace_id uuid references public.workspaces(id) on delete restrict;

-- Preserve existing private data in one owner workspace per creator. Demo stays public.
insert into public.workspaces(name,created_by,is_personal)
select 'My workspace',owners.user_id,true from (select user_id from public.companies where user_id is not null union select user_id from public.tasks where user_id is not null union select a.user_id from public.audit_log a join auth.users u on u.id=a.user_id where a.user_id is not null) owners;
insert into public.workspace_members(workspace_id,user_id,role) select id,created_by,'owner' from public.workspaces where is_personal;
-- Temporarily detach integrity/audit triggers while assigning the new scope.
drop trigger task_company_owner on public.tasks;
drop trigger company_owner_immutable on public.companies;
drop trigger tasks_audit on public.tasks;
drop trigger companies_audit on public.companies;
update public.companies c set workspace_id=w.id from public.workspaces w where w.is_personal and w.created_by=c.user_id;
update public.tasks t set workspace_id=c.workspace_id from public.companies c where c.id=t.company_id;
update public.audit_log a set workspace_id=w.id from public.workspaces w where w.is_personal and w.created_by=a.user_id;

alter table public.companies add constraint company_demo_or_workspace check((user_id is null and workspace_id is null) or (user_id is not null and workspace_id is not null));
alter table public.tasks add constraint task_demo_or_workspace check((user_id is null and workspace_id is null) or (user_id is not null and workspace_id is not null));
drop index public.companies_owned_name;
drop index public.companies_demo_name;
create unique index companies_workspace_name on public.companies(workspace_id,lower(name)) where workspace_id is not null;
create unique index companies_demo_name on public.companies(lower(name)) where workspace_id is null and user_id is null;
create index tasks_workspace_due on public.tasks(workspace_id,due_date);
create index audit_workspace_timestamp on public.audit_log(workspace_id,timestamp desc);
alter table public.tasks drop constraint tasks_company_id_fkey;
alter table public.tasks add constraint tasks_company_id_fkey foreign key(company_id) references public.companies(id) on delete restrict;

create or replace function public.validate_company_owner()
returns trigger language plpgsql set search_path = '' as $$
begin
 if tg_op='UPDATE' then
  if new.user_id is distinct from old.user_id or new.workspace_id is distinct from old.workspace_id then raise exception 'Company creator and workspace cannot be changed.'; end if;
 elsif new.user_id is not null then
  if new.user_id is distinct from auth.uid() then raise exception 'Company creator must be the signed-in user.'; end if;
  if new.workspace_id is null then new.workspace_id := public.ensure_personal_workspace(); end if;
 end if;
 return new;
end;
$$;
create trigger company_owner_immutable before insert or update on public.companies for each row execute function public.validate_company_owner();
create or replace function public.validate_task_company()
returns trigger language plpgsql set search_path = '' as $$
declare company_workspace uuid; display_name text;
begin
 if tg_op='UPDATE' then
  if new.user_id is distinct from old.user_id or new.workspace_id is distinct from old.workspace_id then raise exception 'Task creator and workspace cannot be changed.'; end if;
 elsif new.user_id is not null then
  if new.user_id is distinct from auth.uid() then raise exception 'Task creator must be the signed-in user.'; end if;
  if new.workspace_id is null then new.workspace_id := public.ensure_personal_workspace(); end if;
 end if;
 select workspace_id,name into company_workspace,display_name from public.companies where id=new.company_id;
 if not found or company_workspace is distinct from new.workspace_id then raise exception 'Task and company must belong to the same workspace.'; end if;
 new.company_name := display_name;
 return new;
end;
$$;
create trigger task_company_owner before insert or update on public.tasks for each row execute function public.validate_task_company();

-- Retain the human-friendly guard as well as a restrictive foreign key.
create or replace function public.sync_company_name()
returns trigger language plpgsql set search_path = '' as $$
begin
 if new.name is distinct from old.name then update public.tasks set company_name=new.name where company_id=new.id; end if;
 return new;
end;
$$;
create or replace function public.prevent_company_with_tasks_delete()
returns trigger language plpgsql set search_path = '' as $$
begin
 if exists(select 1 from public.tasks where company_id=old.id) then raise exception 'Delete or reassign this company''s tasks first.'; end if;
 return old;
end;
$$;

drop policy companies_demo on public.companies;
drop policy tasks_demo on public.tasks;
drop policy companies_private on public.companies;
drop policy tasks_private on public.tasks;
drop policy audit_private_read on public.audit_log;
create policy companies_demo on public.companies for all to anon using(workspace_id is null and user_id is null) with check(workspace_id is null and user_id is null);
create policy tasks_demo on public.tasks for all to anon using(workspace_id is null and user_id is null) with check(workspace_id is null and user_id is null);
create policy companies_team on public.companies for all to authenticated using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id) and user_id is not null);
create policy tasks_team on public.tasks for all to authenticated using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id) and user_id is not null);
create policy audit_team_read on public.audit_log for select to authenticated using(public.is_workspace_member(workspace_id));

create or replace function public.record_finance_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare previous_row jsonb; next_row jsonb; row_owner uuid; row_id uuid; row_workspace uuid;
begin
 if tg_op <> 'INSERT' then previous_row:=to_jsonb(old); row_owner:=old.user_id; row_id:=old.id; row_workspace:=old.workspace_id; end if;
 if tg_op <> 'DELETE' then next_row:=to_jsonb(new); row_owner:=new.user_id; row_id:=new.id; row_workspace:=new.workspace_id; end if;
 insert into public.audit_log(action,actor,user_id,workspace_id,target_table,target_id,before_value,after_value)
 values(lower(tg_op),coalesce(auth.uid()::text,'anonymous-demo'),row_owner,row_workspace,tg_table_name,row_id,previous_row,next_row);
 return null;
end;
$$;
create trigger tasks_audit after insert or update or delete on public.tasks for each row execute function public.record_finance_audit();
create trigger companies_audit after insert or update or delete on public.companies for each row execute function public.record_finance_audit();

-- Record SQL Editor application in an existing Supabase migration history.
do $$ begin
 if to_regclass('supabase_migrations.schema_migrations') is not null then
  insert into supabase_migrations.schema_migrations(version,name,statements) values('0004','team_workspaces',array[]::text[]) on conflict(version) do nothing;
 end if;
end $$;
commit;
