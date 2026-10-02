-- Run after 0004 and 0005 as postgres in Supabase SQL Editor. Synthetic records roll back.
begin;
do $$ begin
 if exists(select 1 from public.companies where (user_id is null) <> (workspace_id is null)) then raise exception 'FAIL: company migration scope'; end if;
 if exists(select 1 from public.tasks t join public.companies c on c.id=t.company_id where t.workspace_id is distinct from c.workspace_id) then raise exception 'FAIL: task migration scope'; end if;
 if exists(select 1 from public.audit_log a join auth.users u on u.id=a.user_id where a.workspace_id is null) then raise exception 'FAIL: historical audit scope'; end if;
end $$;
insert into auth.users(id,email,email_confirmed_at) values
 ('a5000000-0000-0000-0000-000000000001','tenant-owner@example.invalid',now()),
 ('a5000000-0000-0000-0000-000000000002','tenant-member@example.invalid',now()),
 ('a5000000-0000-0000-0000-000000000003','tenant-outsider@example.invalid',now());
set local role authenticated;
select set_config('request.jwt.claim.sub','a5000000-0000-0000-0000-000000000001',true);
-- Regression: first legacy private INSERT creates membership in a BEFORE trigger;
-- its RLS check must see that same-statement membership (0005).
insert into public.companies(id,name,user_id) values('b5000000-0000-0000-0000-000000000001','QA Personal Company',auth.uid());
select set_config('test.owner_personal',public.ensure_personal_workspace()::text,true);
select set_config('test.team_id',public.create_workspace('QA Finance Team')::text,true);
select public.rename_workspace(current_setting('test.team_id')::uuid,'QA Finance Team Renamed');
select public.add_workspace_member(current_setting('test.team_id')::uuid,'TENANT-MEMBER@example.invalid');
insert into public.companies(id,name,user_id,workspace_id) values('b5000000-0000-0000-0000-000000000002','QA Shared Company',auth.uid(),current_setting('test.team_id')::uuid);
insert into public.tasks(id,company_id,company_name,category,description,user_id,workspace_id) values('d5000000-0000-0000-0000-000000000001','b5000000-0000-0000-0000-000000000002','untrusted','Payment','QA shared task',auth.uid(),current_setting('test.team_id')::uuid);
do $$ begin
 if (select workspace_id from public.companies where id='b5000000-0000-0000-0000-000000000001') <> current_setting('test.owner_personal')::uuid then raise exception 'FAIL: legacy insert default'; end if;
 if (select count(*) from public.get_workspace_members(current_setting('test.team_id')::uuid)) <> 2 then raise exception 'FAIL: owner membership management'; end if;
 begin
  insert into public.companies(name,user_id,workspace_id) values('QA forged creator','a5000000-0000-0000-0000-000000000002',current_setting('test.team_id')::uuid);
  raise exception 'FAIL: forged company creator accepted';
 exception when raise_exception then if sqlerrm <> 'Company creator must be the signed-in user.' then raise; end if; end;
 begin
  insert into public.tasks(company_id,company_name,category,description,user_id,workspace_id) values('b5000000-0000-0000-0000-000000000002','QA','Payment','Forged creator','a5000000-0000-0000-0000-000000000002',current_setting('test.team_id')::uuid);
  raise exception 'FAIL: forged task creator accepted';
 exception when raise_exception then if sqlerrm <> 'Task creator must be the signed-in user.' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','a5000000-0000-0000-0000-000000000002',true);
select set_config('test.member_personal',public.ensure_personal_workspace()::text,true);
insert into public.companies(id,name,user_id,workspace_id) values('b5000000-0000-0000-0000-000000000003','QA Shared Company',auth.uid(),current_setting('test.member_personal')::uuid);
update public.tasks set status='completed',amount=1234 where id='d5000000-0000-0000-0000-000000000001';
update public.companies set name='QA Shared Renamed' where id='b5000000-0000-0000-0000-000000000002';
do $$ begin
 if not exists(select 1 from public.tasks where id='d5000000-0000-0000-0000-000000000001' and status='completed' and amount=1234 and user_id='a5000000-0000-0000-0000-000000000001' and company_name='QA Shared Renamed') then raise exception 'FAIL: teammate update and preserved creator'; end if;
 if not exists(select 1 from public.audit_log where target_id='d5000000-0000-0000-0000-000000000001' and action='update' and actor=auth.uid()::text and after_value->>'status'='completed') then raise exception 'FAIL: team audit visibility/actor'; end if;
 if exists(select 1 from public.companies where workspace_id=current_setting('test.owner_personal')::uuid) then raise exception 'FAIL: member sees owner personal company'; end if;
 begin
  update public.tasks set company_id='b5000000-0000-0000-0000-000000000003' where id='d5000000-0000-0000-0000-000000000001';
  raise exception 'FAIL: cross-workspace company accepted';
 exception when raise_exception then if sqlerrm <> 'Task and company must belong to the same workspace.' then raise; end if; end;
 begin
  update public.tasks set workspace_id=current_setting('test.member_personal')::uuid where id='d5000000-0000-0000-0000-000000000001';
  raise exception 'FAIL: task workspace moved';
 exception when raise_exception then if sqlerrm <> 'Task creator and workspace cannot be changed.' then raise; end if; end;
 begin
  update public.tasks set user_id=auth.uid() where id='d5000000-0000-0000-0000-000000000001';
  raise exception 'FAIL: task creator moved';
 exception when raise_exception then if sqlerrm <> 'Task creator and workspace cannot be changed.' then raise; end if; end;
 begin
  update public.companies set workspace_id=current_setting('test.member_personal')::uuid where id='b5000000-0000-0000-0000-000000000002';
  raise exception 'FAIL: company workspace moved';
 exception when raise_exception then if sqlerrm <> 'Company creator and workspace cannot be changed.' then raise; end if; end;
 begin
  update public.companies set user_id=auth.uid() where id='b5000000-0000-0000-0000-000000000002';
  raise exception 'FAIL: company creator moved';
 exception when raise_exception then if sqlerrm <> 'Company creator and workspace cannot be changed.' then raise; end if; end;
 begin
  perform public.add_workspace_member(current_setting('test.team_id')::uuid,'tenant-outsider@example.invalid');
  raise exception 'FAIL: member added a teammate';
 exception when raise_exception then if sqlerrm <> 'Only workspace owners can manage the team.' then raise; end if; end;
 begin
  perform public.remove_workspace_member(current_setting('test.team_id')::uuid,'a5000000-0000-0000-0000-000000000001');
  raise exception 'FAIL: member removed owner';
 exception when raise_exception then if sqlerrm <> 'Only workspace owners can manage the team.' then raise; end if; end;
 begin
  insert into public.workspace_members(workspace_id,user_id,role) values(current_setting('test.team_id')::uuid,'a5000000-0000-0000-0000-000000000003','owner');
  raise exception 'FAIL: direct membership insert';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','a5000000-0000-0000-0000-000000000003',true);
do $$ declare affected integer; begin
 if exists(select 1 from public.tasks where id='d5000000-0000-0000-0000-000000000001') or exists(select 1 from public.workspaces where id=current_setting('test.team_id')::uuid) or exists(select 1 from public.audit_log where workspace_id=current_setting('test.team_id')::uuid) then raise exception 'FAIL: outsider visibility'; end if;
 update public.tasks set status='pending' where id='d5000000-0000-0000-0000-000000000001';
 get diagnostics affected=row_count;
 if affected <> 0 then raise exception 'FAIL: outsider update'; end if;
 begin
  insert into public.companies(name,user_id,workspace_id) values('QA forged tenant',auth.uid(),current_setting('test.team_id')::uuid);
  raise exception 'FAIL: forged tenant accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.workspace_members(workspace_id,user_id,role) values(current_setting('test.team_id')::uuid,auth.uid(),'owner');
  raise exception 'FAIL: outsider self-join';
 exception when insufficient_privilege then null; end;
 begin
  perform * from public.get_workspace_members(current_setting('test.team_id')::uuid);
  raise exception 'FAIL: outsider email lookup';
 exception when raise_exception then if sqlerrm <> 'Workspace access denied.' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','a5000000-0000-0000-0000-000000000001',true);
select public.remove_workspace_member(current_setting('test.team_id')::uuid,'a5000000-0000-0000-0000-000000000002');
do $$ begin
 begin
  perform public.remove_workspace_member(current_setting('test.team_id')::uuid,auth.uid());
  raise exception 'FAIL: final owner removed';
 exception when raise_exception then if sqlerrm <> 'The last owner cannot be removed.' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','a5000000-0000-0000-0000-000000000002',true);
do $$ declare affected integer; begin
 if exists(select 1 from public.tasks where workspace_id=current_setting('test.team_id')::uuid) or exists(select 1 from public.audit_log where workspace_id=current_setting('test.team_id')::uuid) then raise exception 'FAIL: removed member still sees team'; end if;
 update public.tasks set status='pending' where id='d5000000-0000-0000-0000-000000000001';
 get diagnostics affected=row_count;
 if affected <> 0 then raise exception 'FAIL: removed member can update'; end if;
end $$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
insert into public.companies(id,name) values('b5000000-0000-0000-0000-000000000004','QA Anonymous Demo');
insert into public.tasks(id,company_id,company_name,category,description) values('d5000000-0000-0000-0000-000000000002','b5000000-0000-0000-0000-000000000004','QA','Payment','QA demo writable');
update public.tasks set status='completed' where id='d5000000-0000-0000-0000-000000000002';
do $$ begin
 if exists(select 1 from public.companies where workspace_id is not null or user_id is not null) then raise exception 'FAIL: demo sees team companies'; end if;
 if not exists(select 1 from public.companies where workspace_id is null and user_id is null) then raise exception 'FAIL: demo unavailable'; end if;
 if not exists(select 1 from public.tasks where id='d5000000-0000-0000-0000-000000000002' and workspace_id is null and user_id is null and status='completed') then raise exception 'FAIL: demo writes'; end if;
 begin perform public.ensure_personal_workspace(); raise exception 'FAIL: anon workspace RPC'; exception when insufficient_privilege then null; end;
 begin perform 1 from public.audit_log; raise exception 'FAIL: anon audit'; exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'PASS: shared edits, creator/tenant integrity, personal scopes, outsider and removed-member isolation, owner-only membership, final-owner guard, scoped emails/audit, anonymous demo' as result;
