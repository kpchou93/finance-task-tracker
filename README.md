# Finance Task Tracker

A working Next.js 15 and Supabase finance task workspace.

## Use

- Sign up, confirm your email, and sign in for your workspace.
- Open Team to create a shared workspace, rename it, and add or remove confirmed accounts by email.
- Owners manage membership; members share the workspace's companies and tasks. Switch workspaces from the sidebar.
- On phones, tasks appear as cards with the same editing, completion and suggestion actions as desktop.
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

Migrations 0001 through 0005 were applied through the Supabase SQL Editor. The adoption script
supabase/register_applied_migrations.sql records the first three after checking lockdown; 0004 and 0005 record their own application.
Do not rerun the permissive initial migration on a locked database. Add new migrations for future changes.

All reads and mutations use the acting user's session, or an anonymous client confined to demo rows.
RLS isolates each team workspace; task/company scopes must match and original creators stay immutable. Database triggers record creates,
updates and deletes in audit_log; team members can read their workspace's entries and cannot write to that log.
Companies with tasks cannot be deleted. Rename updates task display names transactionally.

Deploy by pushing commits to main; Vercel's GitHub integration is connected to this repository.
Never deploy local files with the Vercel CLI.

Supabase Auth's Site URL and exact production/local callbacks are configured for finance-task-tracker-pi.vercel.app.

## Validation

Run pnpm lint, pnpm typecheck, pnpm test, and pnpm build.

tests/tenants.sql exercises shared editing, outsider and removed-member isolation, owner-only membership, creator/tenant integrity, scoped audit access and anonymous demo writes. Run as postgres in the SQL Editor; it rolls back all synthetic test rows. tests/rls.sql documents the earlier per-user model and is superseded by the tenant test.

The dashboard create/edit/complete workflow and suggestion reviews were exercised against the real database.
The production build passed. Custom SMTP is currently off: Supabase's default mailer only sends confirmation emails to organization members. Configure Authentication / Emails / SMTP Settings before onboarding other staff (https://supabase.com/docs/guides/auth/auth-smtp). The app is deployed at https://finance-task-tracker-pi.vercel.app/demo through the connected GitHub repository. The production overdue-to-completed workflow passed against Supabase. Vercel's GitHub app is limited to this repository. Email confirmation delivery remains unverified.

If OneDrive causes an EINVAL error while cleaning generated build files, set NEXT_DIST_DIR to a fresh cache
such as .next-local-unique for pnpm build and use the same value for pnpm start.
Production uses the default .next directory.

Team members must already have signed up and confirmed their email before an owner adds them. Adding a member does not send an invitation email. SMTP remains required to onboard staff outside the Supabase organization.
