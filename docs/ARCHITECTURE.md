# Architecture

## Stack
Next.js 15 (App Router) · Supabase (Postgres + RLS) · Tailwind CSS · Vercel deploy.

## What to Build Now vs Later
- **Now:** companies + tasks CRUD, 4 summary cards, auto-categorisation, filtering, status updates.
- **Next:** auto-priority suggestions, overdue risk scoring, company detail view.
- **Later:** auth + per-user RLS, email reminders, task comments, audit trail.

## Key User Action Flow (Add & Categorise a Task)
1. User clicks "Add Task" → form opens with company, category, description, due date, person in charge, priority, status, amount, remarks.
2. On submit → task row inserted in Supabase `tasks` table.
3. App re-queries tasks → server logic computes category (overdue / due this week / in progress / completed).
4. Summary cards update with new counts; task appears in the correct card and list.
5. User clicks "Complete" → status set to `completed` → task moves to Completed card.

## Responsive Nav Shell
Persistent left sidebar (desktop): Dashboard, All Tasks, Companies. Collapses to hamburger menu on mobile. Current section highlighted.

## Layer Plan
1. **Data layer** — `lib/data/` — all Supabase reads/writes; one source of truth.
2. **App logic** — `lib/logic/` — categorisation rules, date math, filtering.
3. **UI** — `components/` + `app/` routes — presentational, calls data layer.
4. **Intelligence** — `lib/ai/` — priority suggestions (later); core works without it.

## Why Core Runs Without AI
Categorisation is pure date + status logic computed server-side. Priority suggestions are additive metadata shown alongside user-set priority — remove the module and the app still fully functions.

## Repo Structure
```
app/
  page.tsx              # Dashboard (summary cards + task list)
  tasks/page.tsx        # All tasks with filters
  companies/page.tsx    # Company list
lib/
  data/                 # queries.ts, mutations.ts
  logic/                # categorize.ts, filters.ts
  ai/                   # priority.ts (later)
components/
  SummaryCards.tsx
  TaskForm.tsx
  TaskList.tsx
  TaskRow.tsx
  Sidebar.tsx
tests/
  categorize.test.ts
```

## Module Map
| Module | Responsibility | Owns | Build Order |
|--------|---------------|------|-------------|
| data | All DB access | companies, tasks queries/mutations | 1 |
| logic | Categorisation + filtering | category rules, date math | 2 |
| dashboard | Summary cards + task list | home page rendering | 3 |
| task-form | Add/edit task | form state, validation, submit | 3 |
| companies | Company CRUD | company list + add | 4 |
| ai | Priority suggestions (later) | AI fields on tasks | 5 |
| auth | Login + RLS (later) | per-user isolation | 6 |
