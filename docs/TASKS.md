# Tasks & Sprints

## Sprint 1 — Core Task CRUD & Dashboard (v1 functional milestone)
**Goal:** App renders with seed data, user can add/edit/complete tasks, cards auto-update.
- Create Supabase schema (companies, tasks) + seed 3 companies + 6 tasks
- Build `lib/data/` queries + mutations (all DB access)
- Build `lib/logic/categorize.ts` — overdue / due this week / in progress / completed
- Build Dashboard page: 4 summary cards with live counts + task list beneath
- Build TaskForm component (add task with all fields)
- Build edit task (inline or modal)
- One-click "Mark Completed" and "Start" (set in_progress) buttons
- Responsive sidebar nav (Dashboard, All Tasks, Companies)
- Loading, empty, error states on dashboard
- **DoD:** User adds a task with due date tomorrow → it appears in Due This Week card → user clicks Complete → it moves to Completed card. Counts update. Works without login.

## Sprint 2 — Filtering, Search & Polish
**Goal:** User can find and sort any task quickly.
- Filter bar: company, category, priority, status
- Free-text search across description / remarks / person_in_charge
- Sort by due date, priority, amount, created_at
- Company list page with task counts per company
- All Tasks page with full filterable table
- Empty/error states for every page
- **DoD:** User filters by company "Acme Corp" + priority "high" → only matching tasks show; switching filter resets correctly.

## Sprint 3 — Intelligence Layer
**Goal:** Auto-priority suggestions add value without blocking core.
- `lib/ai/priority.ts` — rule-based scoring (due date proximity, amount, category)
- Show suggested priority badge on task rows + form
- User can accept/reject suggestion (updates `ai_priority_review_status`)
- Tasks ranked by priority then due_date within each card
- **DoD:** New task with due_date in 2 days + amount 80k → badge shows "Suggested: High" with 0.82 confidence.

## Sprint 4 — Lock It Down
**Goal:** Auth + per-user data isolation; app ready for real finance team.
- Supabase Auth (email/password)
- Sign up / log in pages
- Replace permissive RLS with `auth.uid() = user_id` policies
- `user_id` populated on create
- Redirect to login if not authenticated (seed demo available on a public /demo route)
- Audit log trigger for status + amount changes
- **DoD:** User A's tasks are invisible to User B; deleting a task logs an audit entry.

## Text Gantt
```
Sprint 1: [====CRUD====][==cards==][==nav==]  → v1 functional
Sprint 2: [==filter==][==search==][==polish==]
Sprint 3: [==AI prio==][==ranking==]
Sprint 4: [==auth==][==RLS==][==audit==]
```
