# Prompt 008 — Teams, invitations & roles, password reset, email verification, account settings, migrations

> Role: senior architect + SWE + UI/UX + B2B CRM expert. Follows `/CLAUDE.md`.
> Benchmarks: HubSpot / Pipedrive user management, Linear and Slack invite links.

## Why
Each sign-up gets an isolated workspace, but a sales **team** cannot work in one CRM. Forgotten passwords cannot be
recovered, emails are unverified, and the production schema (Supabase) cannot evolve because `create_all` never alters tables.

## Scope
### Database migrations (first)
- Alembic: `0001_baseline` (today's schema) and `0002_teams_accounts`. On boot, run `upgrade head`; an existing DB
  without `alembic_version` is stamped at the baseline first (production already has those tables). SQLite uses batch mode.

### Teams & roles
- Roles: **owner** (one or more, cannot remove the last), **admin** (manages team), **member** (CRM work only).
- Invitations: admin/owner invites by email + role. Each invite has a single-use, hashed, expiring (7 days) token, and the
  link `/invite?token=…` is shown to copy (Slack-style) and emailed when SMTP is configured. Invites can be revoked.
- Accepting: a logged-in user joins; a new person registers through the invite and joins **that** workspace (no extra
  empty workspace). The invite email must match.
- Team settings: members list (role change, remove), pending invites, admin-generated **password reset link** for a member.
- Demo workspace: team management is read-only (`demo_read_only`).

### Multiple workspaces
- The JWT carries the active workspace (`wid`); every request validates membership. `GET /auth/workspaces` and
  `POST /auth/switch` power a **workspace switcher** in the sidebar.

### Accounts
- Forgot / reset password: `POST /auth/forgot` always returns 204 (no user enumeration). Single-use token, valid for 1 hour.
- Email verification: link on register plus resend. Non-blocking banner until verified; accepting an invite verifies the email.
- Account settings: edit name, change password (requires the current password).
- `GET /auth/config` → `demo_enabled`; the login page hides the demo button when it is disabled.
- Mailer abstraction: SMTP when `SMTP_*` env is set, otherwise the link is logged (and admins can copy links in the UI).

### Frontend
- Public routes: `/forgot`, `/reset`, `/verify`, `/invite`, with the glass auth layout shared with Login.
- Settings: Account card, Team card (members, invite form, pending invites); sidebar workspace switcher; verification banner.
- All strings in uz/ru/en; ≤ 250 lines per file; reusable pieces (AuthLayout, CopyField, RoleSelect).

## Acceptance
- pytest covers migrations on a fresh DB, the invite flow (new and existing user), role guards, last-owner guard, reset
  (single use, expiry), verification, switch-workspace isolation and no enumeration on forgot.
- `make check` is green; the live site is upgraded **in place** on Supabase with existing data kept.
