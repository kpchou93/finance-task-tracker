create or replace function public.sync_company_name()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.name is distinct from old.name then
    update public.tasks set company_name = new.name where company_id = new.id;
  end if;
  return new;
end;
$$;
create trigger company_name_changed after update of name on public.companies
for each row execute function public.sync_company_name();

create or replace function public.prevent_company_with_tasks_delete()
returns trigger language plpgsql set search_path = public as $$
begin
  if exists (select 1 from public.tasks where company_id = old.id) then
    raise exception 'Delete or reassign this company''s tasks first.';
  end if;
  return old;
end;
$$;
create trigger company_delete_guard before delete on public.companies
for each row execute function public.prevent_company_with_tasks_delete();
