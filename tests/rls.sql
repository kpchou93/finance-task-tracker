-- Run as postgres in the Supabase SQL Editor. Every test row is rolled back.
begin;
insert into auth.users(id) values ('a4000000-0000-0000-0000-000000000001'),('a4000000-0000-0000-0000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub','a4000000-0000-0000-0000-000000000001',true);
insert into public.companies(id,name,user_id) values('b4000000-0000-0000-0000-000000000001','QA Workspace','a4000000-0000-0000-0000-000000000001');
insert into public.tasks(id,company_id,company_name,category,description,due_date,amount,user_id) values('d4000000-0000-0000-0000-000000000001','b4000000-0000-0000-0000-000000000001','not trusted','Payment','QA isolation task',current_date-1,80000,'a4000000-0000-0000-0000-000000000001');
do $$ begin
 if (select count(*) from public.tasks) <> 1 then raise exception 'FAIL: User A visibility'; end if;
 if (select company_name from public.tasks limit 1) <> 'QA Workspace' then raise exception 'FAIL: company name integrity'; end if;
end $$;
select set_config('request.jwt.claim.sub','a4000000-0000-0000-0000-000000000002',true);
insert into public.companies(id,name,user_id) values('b4000000-0000-0000-0000-000000000002','QA Workspace','a4000000-0000-0000-0000-000000000002');
do $$ declare affected integer; begin
 if exists(select 1 from public.tasks) then raise exception 'FAIL: User B can read A tasks'; end if;
 update public.tasks set status='completed' where id='d4000000-0000-0000-0000-000000000001';
 get diagnostics affected = row_count;
 if affected <> 0 then raise exception 'FAIL: User B can update A'; end if;
 begin
  insert into public.tasks(company_id,company_name,category,description,user_id) values('b4000000-0000-0000-0000-000000000001','QA Workspace','Payment','Cross-owner task','a4000000-0000-0000-0000-000000000002');
  raise exception 'FAIL: cross-owner company accepted';
 exception when raise_exception then
  if sqlerrm not like 'Task and company must belong%' then raise; end if;
 end;
 if exists(select 1 from public.audit_log where user_id <> auth.uid()) then raise exception 'FAIL: foreign audit data'; end if;
end $$;
select set_config('request.jwt.claim.sub','a4000000-0000-0000-0000-000000000001',true);
update public.companies set name='QA Renamed' where id='b4000000-0000-0000-0000-000000000001';
do $$ begin
 if (select company_name from public.tasks limit 1) <> 'QA Renamed' then raise exception 'FAIL: rename synchronization'; end if;
 begin
  delete from public.companies where id='b4000000-0000-0000-0000-000000000001';
  raise exception 'FAIL: company with tasks deleted';
 exception when raise_exception then
  if sqlerrm not like 'Delete or reassign%' then raise; end if;
 end;
end $$;
update public.tasks set status='completed',amount=1234 where id='d4000000-0000-0000-0000-000000000001';
delete from public.tasks where id='d4000000-0000-0000-0000-000000000001';
do $$ begin
 if not exists(select 1 from public.audit_log where target_id='d4000000-0000-0000-0000-000000000001' and action='update' and before_value->>'status'='pending' and after_value->>'status'='completed' and (after_value->>'amount')::numeric=1234) then raise exception 'FAIL: status/amount audit'; end if;
 if not exists(select 1 from public.audit_log where target_id='d4000000-0000-0000-0000-000000000001' and action='delete' and actor=auth.uid()::text) then raise exception 'FAIL: delete audit'; end if;
end $$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
do $$ begin
 if exists(select 1 from public.companies where user_id is not null) then raise exception 'FAIL: demo sees private companies'; end if;
 if not exists(select 1 from public.companies where user_id is null) then raise exception 'FAIL: demo unavailable'; end if;
 begin
  perform 1 from public.audit_log;
  raise exception 'FAIL: anonymous audit access';
 exception when insufficient_privilege then null;
 end;
end $$;
rollback;
select 'PASS: two-user isolation, cross-owner protection, company integrity, status/amount/delete audit, and anonymous demo separation' as result;
