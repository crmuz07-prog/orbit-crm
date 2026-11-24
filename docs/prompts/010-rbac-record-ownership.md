# Prompt 010 — Access roles, record ownership & data scope, session revocation, login protection

> Role: senior architect + SWE + UI/UX + B2B CRM expert. Follows `/CLAUDE.md`.
> Sources: the user's own ERP (`~/Desktop/erplar/erp1`: module × action permissions, `all/own/department` scope,
> role templates, force logout, login rate limit) and international CRMs — Salesforce (profiles + permission sets,
> record owner), HubSpot (user permissions with "owned only / team / everything"), Pipedrive (visibility groups).

## Why
Orbit has three fixed roles and every member sees and edits every record. A sales company needs a rep who sees only
their own deals, a team lead who sees the team, an assistant who can read but not delete, and export locked down.

## Access model
- **Owner / Admin** of a workspace: full access (like `admin` in erp1, which ignores permissions).
- **Member**: permissions come from an **access role** (role template) of the workspace.
- **Modules**: `companies`, `contacts`, `deals`, `activities` (tasks, notes, calls), `reports` (dashboard, call stats).
- **Actions**: `view`, `create`, `edit`, `delete`, `export` (any action implies `view`, as in erp1).
- **Scope** per module: `own` (records I own), `team` (records owned by my sales team), `all` (the workspace).
  Unowned records are visible at `team` and `all` scope.
- Built-in roles seeded per workspace: **Sales rep** (default: own scope, view/create/edit), **Team lead**
  (team scope, all actions), **Viewer** (all scope, view only). Admins create, edit and delete roles; the default
  role cannot be deleted, and members of a deleted role fall back to it. Editing a role applies to every holder at once
  (resolved at request time — no copied JSON to drift).
- **Sales teams**: named groups in a workspace; a member belongs to at most one team.

## Record ownership
- `owner_id` on companies, contacts, deals and activities (HubSpot/Salesforce "record owner").
  New records default to the creator. Assigning an owner is limited by scope: `own` → only yourself,
  `team` → your team, `all` → anyone in the workspace (`owner_out_of_scope`).
- Auto-logged calls inherit the owner of the matched contact (else the company owner).
- Migration backfills existing records to the workspace's first owner and seeds the three roles.

## Enforcement (server is the boundary, UI only mirrors it)
- Generic CRUD: list and export are filtered by scope; get, update and delete outside the scope answer 404.
  Missing action → 403 `permission_denied`.
- Dashboard and call statistics use the caller's `reports` + `deals`/`activities` scope.
- `GET /{entity}/export` → CSV, requires `export`.
- Session payload exposes the effective permissions; the UI hides nav items, buttons and forms the user can't use.

## Sessions & login protection
- `users.tokens_valid_after`: tokens issued before it are rejected (`session_revoked`). Set when an admin sets a
  password, when a user is deactivated, and when a user changes their own password (other devices signed out,
  the current one gets a fresh token).
- Login rate limit: 5 failed attempts per email in 15 minutes → 429 `too_many_attempts`. Attempts are stored
  (`login_attempts`: email, IP, success, time) and shown to superadmins in Admin → Security.

## Frontend
- Settings → **Roles & access**: role list, permission matrix editor (modules × actions + scope), default role.
- Settings → **Sales teams**: create, rename, delete. Team card: access role and team per member.
- Owner column and owner picker on companies, contacts and deals; export button on list pages.
- Admin → **Security** tab with recent login attempts.
- uz/ru/en, ≤ 250 lines per file, reusable pieces (`useAccess`, `OwnerSelect`, `PermissionMatrix`).

## Out of scope (ask later)
Subscription billing/seat limits and phone-number login from erp1.

## Acceptance
pytest: permission denied per action, own/team/all scope on list/get/update/delete/export, owner assignment limits,
dashboard scoping, role edit applies immediately, default-role fallback, session revocation, rate limit, migration
0004 on Postgres with backfill. `make check` green; UI verified in the browser as admin and as a scoped rep.
