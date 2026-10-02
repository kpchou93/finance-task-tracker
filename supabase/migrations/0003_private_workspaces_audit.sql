begin;
-- Keep anonymous demo data separate from every authenticated workspace.
drop policy if exists companies_v1_read on public.companies;
drop policy if exists companies_v1_write on public.companies;
drop policy if exists tasks_v1_read on public.tasks;
drop policy if exists tasks_v1_write on public.tasks;

alter table public.companies drop constraint companies_name_key;
create unique index companies_owned_name on public.companies(user_id, lower(name)) where user_id is not null;
create unique index companies_demo_name on public.companies(lower(name)) where user_id is null;
alter table public.companies add constraint company_owner_fk foreign key(user_id) references auth.users(id);
alter table public.companies add constraint company_name_valid check(char_length(trim(name)) between 1 and 200);
alter table public.tasks alter column company_id set not null;
alter table public.tasks add constraint task_owner_fk foreign key(user_id) references auth.users(id);
alter table public.tasks add constraint task_priority_valid check(priority in ('high','medium','low'));
alter table public.tasks add constraint task_status_valid check(status in ('pending','in_progress','completed'));
alter table public.tasks add constraint task_amount_valid check(amount >= 0 and amount <= 999999999999.99);
alter table public.tasks add constraint task_description_valid check(char_length(trim(description)) between 1 and 2000);
alter table public.tasks add constraint task_category_valid check(char_length(trim(category)) between 1 and 100);
create index tasks_owner_due on public.tasks(user_id, due_date);
create index tasks_company on public.tasks(company_id);

create policy companies_demo on public.companies for all to anon using(user_id is null) with check(user_id is null);
create policy tasks_demo on public.tasks for all to anon using(user_id is null) with check(user_id is null);
create policy companies_private on public.companies for all to authenticated using(user_id = (select auth.uid())) with check(user_id = (select auth.uid()));
create policy tasks_private on public.tasks for all to authenticated using(user_id = (select auth.uid())) with check(user_id = (select auth.uid()));

create function public.validate_task_company()
returns trigger language plpgsql set search_path = '' as $$
declare company_owner uuid; display_name text;
begin
  select user_id, name into company_owner, display_name from public.companies where id = new.company_id;
  if not found or company_owner is distinct from new.user_id then
    raise exception 'Task and company must belong to the same workspace.';
  end if;
  if tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception 'Task ownership cannot be changed.';
  end if;
  new.company_name := display_name;
  return new;
end;
$$;
create trigger task_company_owner before insert or update on public.tasks for each row execute function public.validate_task_company();
create function public.validate_company_owner()
returns trigger language plpgsql set search_path = '' as $$
begin
 if new.user_id is distinct from old.user_id then raise exception 'Company ownership cannot be changed.'; end if;
 return new;
end;
$$;
create trigger company_owner_immutable before update on public.companies for each row execute function public.validate_company_owner();

create table public.audit_log (
 id uuid primary key default gen_random_uuid(),
 action text not null,
 actor text not null,
 user_id uuid,
 target_table text not null,
 target_id uuid not null,
 before_value jsonb,
 after_value jsonb,
 timestamp timestamptz not null default now()
);
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;
create policy audit_private_read on public.audit_log for select to authenticated using(user_id = (select auth.uid()));
create index audit_owner_timestamp on public.audit_log(user_id, timestamp desc);
create function public.record_finance_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare previous_row jsonb; next_row jsonb; row_owner uuid; row_id uuid;
begin
 if tg_op <> 'INSERT' then previous_row := to_jsonb(old); row_owner := old.user_id; row_id := old.id; end if;
 if tg_op <> 'DELETE' then next_row := to_jsonb(new); row_owner := new.user_id; row_id := new.id; end if;
 insert into public.audit_log(action, actor, user_id, target_table, target_id, before_value, after_value)
 values(lower(tg_op), coalesce(auth.uid()::text, 'anonymous-demo'), row_owner, tg_table_name, row_id, previous_row, next_row);
 return null;
end;
$$;
revoke all on function public.record_finance_audit() from public;
create trigger tasks_audit after insert or update or delete on public.tasks for each row execute function public.record_finance_audit();
create trigger companies_audit after insert or update or delete on public.companies for each row execute function public.record_finance_audit();
commit;
