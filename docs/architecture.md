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
| | `services/auth.py`, `onboarding.py` | Register / login / demo, workspace + default pipeline |
| | `services/metrics.py` | Dashboard analytics |
| | `services/calls.py` | Call logging (call + follow-up task in one transaction), call stats, pending reminders |
| | `services/telephony.py`, `phone_match.py`, `events.py` | PBX webhook ingestion (HMAC, idempotent, caller matching, missed-call task) and the SSE event broker — see `docs/telephony.md` |
| | `services/seed.py`, `sample_data.py` | Deterministic sample workspace |
| api | `api/crud_router.py` | **One router factory**: an `EntitySpec` turns into 5 endpoints |
| | `api/routes/entities.py` | 5 entities declared as specs, with no repeated code |
| | `api/routes/auth.py`, `workspace.py` | Auth, dashboard, seed/reset |

### Multi-tenancy
`RequestContext` (from the JWT) carries the workspace. Every query filters on `workspace_id`.
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
- `pytest`: 24 tests covering auth, isolation, CRUD, rules, dashboard, calls, reminders, telephony and error codes.
- `tsc` strict, with no `any`.
