# Finance Task Tracker — PRD

## Problem
Finance departments track tasks across multiple companies in Excel — deadlines slip, statuses go stale, and nobody has a quick view of what's overdue versus what's done.

## Target User
Finance managers and finance staff who need a shared, always-current task board replacing manual Excel tracking.

## Core Objects
- **Company** — name; tasks belong to a company.
- **Task** — company, category, description, due date, person in charge, priority (high/medium/low), status (pending/in_progress/completed), amount, remarks.

## MVP (v1) Checklist
- [ ] Home page with 4 summary cards: Overdue, Due This Week, In Progress, Completed
- [ ] Full task list beneath cards, colour-coded by category
- [ ] Add task form with all fields
- [ ] Edit task form
- [ ] One-click status update (mark completed, move to in_progress)
- [ ] Auto-categorisation: overdue (due_date < today, not completed), due this week (≤7 days, not completed, not overdue), in progress (status = in_progress, not in above), completed (status = completed)
- [ ] Filter by company, category, priority
- [ ] All actions persist to database, UI reflects changes immediately
- [ ] Works without login (demo-first with seed data)

## Non-goals (v1)
- No mobile app (responsive web only)
- No user authentication / login wall
- No email notifications
- No file attachments
- No multi-currency conversion

## Success Criteria
A finance manager opens the app, sees 4 summary cards with correct counts, clicks a task in the Overdue card, updates its status to Completed, and the card count decrements and the task moves to the Completed card — all without leaving the page.
