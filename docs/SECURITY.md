# Security

## Secret Handling
- Supabase keys in environment variables only — never in client-visible code.
- Use Next.js server actions / route handlers for all mutations; client never calls Supabase admin API.
- Anon key is safe for client reads in v1 (demo-first). Service role key stays server-side only.

## Permission Model
- **v1 (demo):** Permissive RLS — anonymous read + write on all tables. Seed data visible to all. No auth required.
- **Lock-down (later):** `auth.uid() = user_id` policies replace permissive ones. Each user sees only their own tasks/companies. Admin role sees all.
- Agent inherits the acting user's permissions — never runs with service-role key for user actions.

## Approved-Tools Rule
Agent may only call named tools (`suggest_priority`, `propose_status_update`). Never raw SQL execution, never arbitrary function calls.

## Audit Principle
Every status change, amount edit, and delete is logged with actor, before/after values, and timestamp. In v1 this is via Supabase triggers; agent actions are logged identically to human actions.
