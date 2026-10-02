# Finance Task Tracker

A working Next.js 15 and Supabase finance task workspace.

## Use

- Sign up, confirm your email, and sign in for a private workspace.
- Add a company, then add tasks with deadlines, responsibilities, priorities, amounts and remarks.
- Open an overdue task from its dashboard card and mark it completed. The counts update on the same page.
- Filter by company, category, priority and status; search descriptions, remarks and responsible staff.
- Sort by due date, priority, amount or creation date.
- Review rule-based priority suggestions. Accepting adopts the suggested priority; rejecting keeps your choice.
- /demo provides persistent public sample data. Enter fictional information there.

## Local development

Requires Node 24 and pnpm 10.34.6. Run pnpm install, vercel link, vercel env pull .env.local, then pnpm dev.

Supabase settings are in Vercel development, preview and production. No admin key is needed by the app.
Use the existing Supabase project pdtwvsrdodogfyxedqox and Vercel project shirley-db90/finance-task-tracker.

## Database and deployment

Migrations 0001, 0002, and 0003 were applied through the Supabase SQL Editor. The adoption script
supabase/register_applied_migrations.sql records them in migration history after checking lockdown.
Do not rerun the permissive initial migration on a locked database. Add new migrations for future changes.

All reads and mutations use the acting user's session, or an anonymous client confined to demo rows.
RLS isolates each authenticated workspace; task/company ownership must match. Database triggers record creates,
updates and deletes in audit_log; users can read only their own entries and cannot write to that log.
Companies with tasks cannot be deleted. Rename updates task display names transactionally.

Deploy by pushing commits to main; Vercel's GitHub integration must be connected to this repository.
Never deploy local files with the Vercel CLI.

Supabase Auth's Site URL and exact production/local callbacks are configured for finance-task-tracker-pi.vercel.app.

## Validation

Run pnpm lint, pnpm typecheck, pnpm test, and pnpm build.

tests/rls.sql exercises two-user isolation, cross-owner rejection, company integrity, status/amount/delete
auditing and anonymous separation. Run as postgres in the SQL Editor; it rolls back all synthetic test rows.

The dashboard create/edit/complete workflow and suggestion reviews were exercised against the real database.
The production build passed. Auth email delivery and final Vercel deployment require the owning accounts' configuration.

If OneDrive causes an EINVAL error while cleaning generated build files, set NEXT_DIST_DIR to a fresh cache
such as .next-local-unique for pnpm build and use the same value for pnpm start.
Production uses the default .next directory.
