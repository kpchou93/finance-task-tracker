# Team workspaces extension

The current team release extends the original four-sprint plan. Each team is a separate tenant. A user can belong to multiple workspaces and choose the active one from the sidebar.

## Workflow

1. Sign up, confirm email, and sign in. A first workspace is initialized automatically when needed.
2. Open Team to create or rename a workspace. Its creator is the owner.
3. A colleague signs up and confirms their email. The owner adds their existing account by email; this operation does not send an invitation.
4. Members select the shared workspace and work on its companies and tasks. Members can edit tasks created by colleagues; the original creator remains unchanged.
5. Owners can remove members. Removal immediately ends access to that workspace's data and audit history. The final owner cannot be removed.

## Data and permissions

`workspaces` stores a name, creator and personal-workspace flag. `workspace_members` stores user membership and owner/member roles. Companies, tasks and audit rows carry `workspace_id`; only anonymous demo rows have both null workspace and null creator.

Existing private companies/tasks and historical audit entries move into their creator's personal workspace. Workspaces cannot be reassigned through task/company edits. Company and task workspace must match. Membership changes use owner-only database RPCs; direct membership writes are denied. Member email lookup is restricted to members of the requested team.

Server reads and mutations validate the active cookie against current memberships and filter by the selected workspace. Forms carry its ID and reject stale workspace selection. RLS independently enforces membership. The anonymous demo uses a separate stateless client.

Migrations 0004 and 0005 are applied and registered in Supabase history. 0005 ensures membership created during a legacy insert is visible to the same statement's RLS check. `tests/tenants.sql` exercises the real database with synthetic identities and rolls back all records.

## Responsive interface

The dashboard uses the supplied Stitch design's cream, coral and mint interface, with rounded cards and a live completion banner. At phone widths, dedicated task cards expose the same editing, status and priority-review actions as the desktop table, with bottom navigation to working routes. Filters, navigation, dialogs and company forms adapt to narrow viewports. Mobile controls use at least 44-pixel action targets and 16-pixel form inputs. See `FRIENDLY_DESIGN.md` for the design adaptation.

## Remaining account setup

Custom SMTP is still off. Staff outside the Supabase organization's member addresses cannot receive signup confirmation through the default mailer. Configure SMTP in Supabase before onboarding them. Password entry and email confirmation belong to the account holder; email delivery has not been verified.
