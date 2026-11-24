# Prompt 009 — Closed access: credentials issued by admins, platform superadmin

> Role: senior architect + SWE + UI/UX + B2B CRM expert. Follows `/CLAUDE.md`.
> Model: ERP-style user provisioning (SAP / 1C / Odoo), where nobody signs up and every login is issued by an administrator.

## Access model
| Level | Who | Can |
|---|---|---|
| **Superadmin** (platform) | Operator of the CRM | Create, rename and suspend companies (workspaces); create users, set passwords, activate/deactivate, add/remove memberships, grant superadmin |
| **Owner / Admin** (workspace) | Company managers | Add users to their company with a login + temporary password, change roles, set passwords, remove members |
| **Member** | Sales reps | Work in the CRM |

## Rules
- **No self-service sign-up**: `REGISTRATION_ENABLED=false` in production hides "Create account" and the API answers
  `registration_disabled`. The demo is off in production (`DEMO_ENABLED=false`).
- **Invitation links are removed**: credentials are issued directly. The UI, API and table go away (migration drops `invitations`).
- Accounts created by an admin get a **temporary password** and `must_change_password=true`. After the first sign-in the user
  must set their own password before using the app.
- **Deactivated users** cannot sign in, and existing tokens stop working (`account_disabled`).
- **Superadmin bootstrap**: `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` env (set by the operator in Render; Claude never types it), or
  `make superadmin` locally (password via getpass). A superadmin may have no workspace and then lands in the admin panel.
- Guards: a superadmin cannot deactivate or demote themselves; a company keeps at least one owner.
- Forgot password stays for deployments with SMTP; without it the login says "ask your administrator".

## Backend
- Migration `0003`: `users.is_superadmin`, `users.is_active`, `users.must_change_password` (server defaults so existing rows stay valid); drop `invitations`.
- `services/admin.py` + `routes/admin.py` (`SuperCtx`); `team.add_member` and `team.set_member_password`.
- Session: `workspace`/`role` are optional (superadmin without a company); `UserOut` exposes `is_superadmin` and `must_change_password`.

## Frontend
- `/admin` panel (superadmin only, sidebar entry): **Companies** tab (list with owners and member counts, create company + owner
  login, rename) and **Users** tab (search, create user, activate/deactivate, set password, superadmin toggle, memberships).
- Team card: "Add user" (name, email, role, temporary password with generator) and "Set password" per member.
- First-login gate: "Set your own password" screen.
- uz/ru/en; reusable pieces (PasswordField with generator, admin dialogs); ≤ 250 lines per file.

## Acceptance
pytest: closed registration, superadmin endpoints and guards, admin-created user must change password, deactivated user blocked
(login and existing token), workspace admin adds users, migration 0003 on Postgres with data kept. `make check` green; UI verified in the browser.
