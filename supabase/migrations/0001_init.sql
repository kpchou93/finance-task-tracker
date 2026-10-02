create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  company_name text not null,
  category text not null,
  description text not null,
  due_date date,
  person_in_charge text,
  priority text not null default 'medium',
  status text not null default 'pending',
  amount numeric(14,2) default 0,
  remarks text,
  ai_suggested_priority text,
  ai_priority_source text,
  ai_priority_confidence numeric,
  ai_priority_review_status text default 'unreviewed',
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table companies enable row level security;
alter table tasks enable row level security;

drop policy if exists "companies_v1_read" on companies;
create policy "companies_v1_read" on companies for select using (true);
drop policy if exists "companies_v1_write" on companies;
create policy "companies_v1_write" on companies for all using (true) with check (true);

drop policy if exists "tasks_v1_read" on tasks;
create policy "tasks_v1_read" on tasks for select using (true);
drop policy if exists "tasks_v1_write" on tasks;
create policy "tasks_v1_write" on tasks for all using (true) with check (true);

insert into companies (id, name) values
  ('c1000000-0000-0000-0000-000000000001', 'Acme Corp'),
  ('c2000000-0000-0000-0000-000000000002', 'Globex Industries'),
  ('c3000000-0000-0000-0000-000000000003', 'Initech Solutions')
on conflict (name) do nothing;

insert into tasks (company_id, company_name, category, description, due_date, person_in_charge, priority, status, amount, remarks) values
  ('c1000000-0000-0000-0000-000000000001', 'Acme Corp', 'Payment', 'Process Q3 vendor payment run', current_date - 5, 'Sarah Chen', 'high', 'in_progress', 85000.00, 'Waiting on CFO approval'),
  ('c1000000-0000-0000-0000-000000000001', 'Acme Corp', 'Reconciliation', 'Reconcile bank statements for July', current_date + 3, 'Mike Wong', 'medium', 'pending', 0.00, 'Monthly close item'),
  ('c2000000-0000-0000-0000-000000000002', 'Globex Industries', 'Audit', 'Prepare year-end audit working papers', current_date - 10, 'Jane Smith', 'high', 'in_progress', 120000.00, 'External auditor visit next month'),
  ('c2000000-0000-0000-0000-000000000002', 'Globex Industries', 'Reporting', 'Submit monthly tax filing', current_date + 6, 'Sarah Chen', 'high', 'pending', 45000.00, null),
  ('c3000000-0000-0000-0000-000000000003', 'Initech Solutions', 'Invoicing', 'Send client invoices for August', current_date - 2, 'Mike Wong', 'medium', 'completed', 32000.00, 'All invoices sent and confirmed'),
  ('c3000000-0000-0000-0000-000000000003', 'Initech Solutions', 'Reconciliation', 'Verify AP aging report accuracy', current_date + 20, 'Jane Smith', 'low', 'pending', 0.00, 'Non-urgent review item')
on conflict do nothing;
