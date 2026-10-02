# Data Model

## companies
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | gen_random_uuid |
| name | text not null | Unique company name |
| user_id | uuid nullable | Owner-scoping (later) |
| created_at | timestamptz | default now() |

**Relationships:** 1 company → many tasks.

## tasks
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | gen_random_uuid |
| company_id | uuid | FK → companies.id |
| company_name | text | Denormalised for display/filter |
| category | text not null | e.g. Invoicing, Reconciliation, Reporting, Audit, Payment |
| description | text not null | Task detail |
| due_date | date | Nullable but expected |
| person_in_charge | text | Name of responsible staff |
| priority | text not null | high / medium / low |
| status | text not null default 'pending' | pending / in_progress / completed |
| amount | numeric(14,2) | Task-related financial amount |
| remarks | text | Free-form notes |
| ai_suggested_priority | text nullable | AI-generated priority suggestion |
| ai_priority_source | text nullable | Model/identifier that produced it |
| ai_priority_confidence | numeric nullable | 0–1 confidence score |
| ai_priority_review_status | text default 'unreviewed' | unreviewed / accepted / rejected |
| user_id | uuid nullable | Owner-scoping (later) |
| created_at | timestamptz | default now() |

**Relationships:** N tasks → 1 company.

## Categorisation Rules (server-derived, not stored)
- **Overdue:** `due_date < today::date AND status != 'completed'`
- **Due This Week:** `due_date >= today::date AND due_date <= today+7 AND status != 'completed'` (excludes overdue by date logic)
- **In Progress:** `status = 'in_progress' AND NOT in above two`
- **Completed:** `status = 'completed'`

## RLS Notes (v1 demo)
Permissive select + write policies on all tables — anonymous access works. Replaced with `auth.uid() = user_id` policies at lock-down sprint.
