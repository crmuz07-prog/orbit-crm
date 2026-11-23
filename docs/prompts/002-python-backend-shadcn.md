# Prompt 002 — Python backend, shadcn/ui, motion, clean architecture

> Role: senior architect + senior SWE + senior UI/UX + senior B2B CRM expert.
> Follows all rules in `/CLAUDE.md`.

## Goal
Re-platform Orbit CRM into a two-tier app: a **FastAPI (Python)** backend that owns data, auth,
multi-tenancy and analytics, and a **React + Tailwind + shadcn/ui + framer-motion** frontend built
from reusable components. Keep every feature from prompt 001. Raise the UI to the level of
HubSpot / Attio / Pipedrive.

## Backend (`backend/`)
- Python 3.12, FastAPI, SQLAlchemy 2 (typed `Mapped[]`), Pydantic v2, pydantic-settings.
- `DATABASE_URL` env: SQLite by default (zero setup); PostgreSQL or Supabase Postgres in production.
- Auth: email + password (bcrypt) → JWT bearer. `POST /api/auth/register | login | demo`, `GET /api/auth/me`.
  Registering creates a user, a workspace, an owner membership and the default pipeline.
  `demo` (enabled by `DEMO_ENABLED`) signs into a seeded demo workspace with no password.
- Multi-tenancy: every business row has `workspace_id`. Generic CRUD filters and stamps it from the token.
- **Generic CRUD router factory**: one implementation (list/get/create/update/delete) configured per
  entity (stages, companies, contacts, deals, activities). Business rules go in services:
  - deals: moving to a won/lost stage sets `closed_at`; reopening clears `closed_at` and `lost_reason`.
  - stages: a stage that still has deals cannot be deleted (409).
  - deleting a company or contact clears references to it (FK `SET NULL`).
- `GET /api/dashboard` returns server-side pipeline analytics: open/weighted value, won this quarter,
  win rate, avg deal size, sales cycle, by-stage, 6-month won/lost trend, stale deals, top deals.
- `POST /api/workspace/seed` loads sample data; `POST /api/workspace/reset` wipes and reseeds (demo only).
- pytest suite: auth, tenant isolation, CRUD, deal closing rules, dashboard.

## Frontend (`frontend/`)
- shadcn/ui (new-york style, CSS-variable theme, light/dark): Button, Input, Textarea, Label,
  Select, Dialog, AlertDialog, DropdownMenu, Tabs, Tooltip, Badge, Card, Avatar, Skeleton,
  Separator, Command, Sheet, Checkbox.
- Common reusable layer (`components/common`): PageHeader, EmptyState, DataTable, SearchInput,
  FormField wrappers, StatCard, PropertyList, ConfirmDialog, AnimatedNumber, MotionList.
- Feature folders: `features/{deals,companies,contacts,activities,dashboard,settings}` with their
  own components and forms; one `useEntityForm` hook handles create/update and toasts for every form.
- Typed REST client (`lib/api.ts`) keeps the same `list/create/update/remove` contract, so data hooks stay generic.
- Motion: page fade/slide, staggered lists, layout animation of Kanban cards, KPI count-up,
  dialogs and menus animated through tailwindcss-animate; honour reduced motion.
- Auth screen: sign in / sign up / "Explore the demo" (one click).

## Constraints
- ≤ 250 lines per file (enforced by `scripts/check-lines.sh`), DRY, short functions, no `any`.
- `make check` = backend pytest + frontend type-check/build + line check.

## Acceptance
1. `make dev` starts API (:8000) and web (:5173); "Explore the demo" opens a seeded workspace.
2. All flows work end to end against the API: Kanban drag, won/lost with reason, Path, timeline
   composer, CRUD for every entity, ⌘K, settings stage editor, seed and reset.
3. Tests pass, the build passes, no file is over 250 lines.
