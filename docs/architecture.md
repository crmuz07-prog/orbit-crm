# Architecture

```
React (Vite) ──/api proxy──▶ FastAPI ──SQLAlchemy──▶ SQLite (dev) / PostgreSQL (prod)
```

## Backend (`backend/app`)

| Layer | Path | Responsibility |
|---|---|---|
| core | `core/config.py`, `db.py`, `security.py`, `errors.py` | Settings, engine, UTC datetimes, bcrypt + JWT, domain errors |
| models | `models/base.py`, `tenancy.py`, `crm.py` | ORM. `TenantMixin` = id + timestamps + `workspace_id` |
| schemas | `schemas/*.py` | Pydantic I/O. `partial()` builds every PATCH schema from its create schema (DRY) |
| services | `services/crud.py` | **Generic** workspace-scoped list/get/create/update/delete plus FK tenant checks |
| | `services/rules.py` | Hooks: deal closing rules, stage delete guard |
| | `services/auth.py`, `onboarding.py`, `users.py` | Register / login / demo / switch workspace, workspace + default pipeline |
| | `services/workspaces.py`, `team.py` | Memberships, roles (owner > admin > member), admin-issued logins, last-owner guard |
| | `services/account.py`, `tokens.py`, `mailer.py` | Password reset, email verification, profile; hashed single-use tokens; SMTP or log |
| | `services/metrics.py` | Dashboard analytics |
| | `services/calls.py` | Call logging (call + follow-up task in one transaction), call stats, pending reminders |
| | `services/telephony.py`, `phone_match.py`, `events.py` | PBX webhook ingestion (HMAC, idempotent, caller matching, missed-call task) and the SSE event broker — see `docs/telephony.md` |
| | `services/seed.py`, `sample_data.py` | Deterministic sample workspace |
| api | `api/crud_router.py` | **One router factory**: an `EntitySpec` turns into 5 endpoints |
| | `api/routes/entities.py` | 5 entities declared as specs, with no repeated code |
| | `api/routes/auth.py`, `workspace.py` | Auth, dashboard, seed/reset |

### Multi-tenancy & roles
The JWT carries the active workspace (`wid`); `RequestContext` re-checks the membership on every request and exposes the role.
`AdminCtx` guards team management; `EntitySpec.write_role` makes pipeline stages admin-only; telephony settings are admin-only.
`SuperCtx` guards the platform `/admin` API (companies, users, passwords, memberships). A superadmin may have no workspace
(`wid` is null), so the session's workspace and role are optional; CRM routes still require a membership. Inactive users get
`account_disabled` on every request, and `must_change_password` gates the UI after an admin-issued password.
SQLite migrations run with foreign keys off, because batch mode rebuilds tables and would otherwise cascade-delete child rows.

### Access roles, record ownership & scope
Members get permissions from an **access role** (`services/permissions.py`): modules `companies`, `contacts`, `deals`,
`activities`, `reports` × actions `view/create/edit/delete/export`, each module with a records scope `own/team/all`.
Owners and admins have full access. Roles are resolved per request, so editing one applies at once; three built-in roles
are seeded per workspace (Sales rep = default, Team lead, Viewer). Companies, contacts, deals and activities carry
`owner_id`; `services/visibility.py` turns the scope into SQL filters, hides out-of-scope records as 404 and limits whom
records can be assigned to. The generic CRUD router applies it to list/get/update/delete and `GET /{entity}/export` (CSV);
the dashboard and call stats use the `reports` scope. The UI mirrors the session's `permissions` (`useAccess`).

### Subscriptions & seats (erp1 model)
A workspace has `subscription_ends_at` (inclusive calendar date in `BILLING_TIMEZONE`), `seat_limit`, `license_months`,
`price_paid` and a manual `status`. `services/billing.py` computes the effective status lazily on read (no scheduler):
expired or blocked companies are refused in `api/deps.py` (`subscription_expired` / `company_blocked`), superadmins and
the demo excepted. Payments (`workspace_payments`) extend from the later of today and the current end date with month-end
clamping. Adding or reactivating a member beyond `seat_limit` fails with `seat_limit_reached`. In PostgreSQL every table has
Row Level Security on without policies, so Supabase's public REST/GraphQL keys can't reach CRM data; the API connects as
the table owner and is not affected.

### Sessions & sign-in protection
Tokens carry the user's `session_version` (`sv`); bumping it (admin password reset, deactivation, own password change)
signs the user out everywhere. Sign-in is limited to 5 failures per account in 15 minutes; attempts are logged in
`login_attempts` and shown to superadmins.
`RequestContext` carries the workspace. Every query filters on `workspace_id`.
`assert_references` blocks links to another tenant's records. Tests check this (`test_tenant_isolation`).

### Business rules
- Moving a deal to a won/lost stage sets `closed_at`. Moving to an open stage clears `closed_at` and `lost_reason`.
- A stage that still has deals returns **409** on delete.
- Deleting a company or contact unlinks it (`ON DELETE SET NULL`).

### API
`/api/auth/{register,login,demo,me}` · `/api/calls` (POST) · `/api/calls/stats` · `/api/reminders` · `/api/telephony[/rotate|/simulate|/stream|/webhook/{token}]` · `/api/{stages,companies,contacts,deals,activities}[/{id}]`
(GET, POST, PATCH, DELETE) · `/api/dashboard` · `/api/workspace/{seed,reset}` · docs at `/docs`.

## Test PBX (`infra/asterisk`)
Ubuntu 24.04 + Asterisk 20 in Docker (PJSIP extensions 101/102, NAT-safe, RTP 10000–10050). The dialplan reports
customer calls with `UserEvent(OrbitCall …)` and records them with `MixMonitor`. `bridge/` (stdlib Python) reads AMI,
maps the events to the generic telephony event, HMAC-signs and retries delivery, and serves recordings on :8090.
See `docs/asterisk-test.md`.

## Frontend (`frontend/src`)

| Folder | Contents |
|---|---|
| `components/ui` | shadcn/ui (new-york): button, input, select, dialog, alert-dialog, dropdown-menu, tabs, tooltip, badge, card, skeleton, separator, checkbox, sheet, command |
| `components/common` | Reusable building blocks: `Page`, `DataTable`, `form-fields` (TextField, SelectField, SelectBox, FormLayout), `record` (RecordHeader, RecordLayout, PropertyList, StatStrip, ListCard, RowLink), `MotionList`, `AnimatedNumber`, avatars, `ConfirmDialog`, `DeleteRecordButton`, `SearchInput` and `matches()` |
| `components/layout` | AppShell (route transitions, ⌘K), Sidebar (sliding active pill), Topbar, CommandPalette |
| `features/*` | Domain UI per module: deals (board, card, path, form, table), companies, contacts, activities (timeline, composer, row), dashboard, settings, entity-modal, auth |
| `hooks` | `useData` (generic react-query CRUD, optimistic updates), `useEntityForm` (one hook for every form), `useTheme`, `usePersistentState` |
| `lib` | `http` (fetch + token + errors), `api` (typed REST), `types`, `metrics` (deal-level helpers), `motion` (shared variants), `constants`, `utils` |
| `pages` | Composition only: hooks and feature components |

### Design system — Glass
`index.css` defines all tokens: an ambient gradient mesh (`body::before`) plus `.glass` (cards, sidebar,
topbar), `.glass-strong` (dialogs, popovers, menus), `.glass-subtle` (inputs, Kanban columns, chips, no blur)
and `.glass-glow` (primary gradient). shadcn primitives use these utilities, so components never repeat surface styles.
`prefers-reduced-transparency` falls back to solid cards.

### i18n
`src/i18n/` holds the i18next setup and `locales/{en,uz,ru}/{core,sales,engage}.ts`. `en` is the typed source of
truth (`i18next.d.ts`), and `Locale<T>` forces uz/ru to define every key (extra plural forms are allowed). Money,
numbers and dates are formatted in `lib/utils` with `Intl` + date-fns locales that follow the active language;
routes remount on language change. API `DomainError` codes map to `errors.*`.

### Calls & reminders
`features/calls` (CallForm workspace, CallHeader dialer/timer, pickers, CallDetails, stats strip) and
`features/reminders` (30 s polling, burst-aware toasts plus the Notification API, bell popover with snooze).
One `EntityModalProvider` opens `call` and `wrapUp` like any other entity. `features/telephony` holds the SSE
`CallEventsProvider`, the `CallScreenPop`, `CallWrapUpForm` (shares `CallNotesFields` with the manual form), the settings card and the simulator.

### Motion
framer-motion handles route fades, staggered lists (`MotionList`), Kanban `layout`/`layoutId` (a dropped
card animates into its new column), the sliding nav highlight, KPI count-up and Path transitions.
tailwindcss-animate handles Radix enter/exit states. `MotionConfig reducedMotion="user"` plus a CSS media query respect reduced motion.

## Quality gates
- `scripts/check-lines.sh` enforces a maximum of 250 lines per file.
- `pytest`: 63 tests covering auth, isolation, CRUD, rules, dashboard, calls, reminders, telephony, teams, superadmin, closed access, access roles and scope, sessions, accounts, migrations and error codes.
- Alembic migrations (`backend/migrations`) run on boot; legacy databases are stamped at the baseline first.
- `tsc` strict, with no `any`.
