# Orbit CRM — Engineering Rules

These rules apply to **every** change in this repository.

## Workflow: prompt first
1. For every request, first rewrite it as a complete engineering prompt (goal, scope,
   constraints, acceptance criteria) and save it as `docs/prompts/NNN-<slug>.md`.
2. Point `PROMPT.md` to the latest prompt.
3. Implement it, then verify: `make check` (lint, types, line limit, tests) and the UI in a browser.

## Roles
Work as a senior software architect, senior SWE, senior UI/UX designer and senior B2B CRM
specialist. Benchmark every screen and feature against international CRMs:
HubSpot, Salesforce, Pipedrive, Attio, Close, plus Linear for interaction quality.

## Stack
| Layer     | Choice |
|-----------|--------|
| Frontend  | React 18 + TypeScript (strict) + Vite |
| UI        | Tailwind CSS 3 + **shadcn/ui** (Radix primitives, `cva`), lucide-react icons, **glass design system** |
| i18n      | i18next + react-i18next — **Oʻzbekcha, Русский, English** (typed keys) |
| Motion    | framer-motion (page/list/layout transitions), tailwindcss-animate (Radix states) |
| Data      | @tanstack/react-query, typed REST client |
| Backend   | **Python 3.12 + FastAPI**, SQLAlchemy 2, Pydantic v2, JWT auth |
| Database  | PostgreSQL (e.g. Supabase Postgres) in production, SQLite for local dev |

## Code rules
- **Max 250 lines per file.** Split by responsibility before you reach it (`scripts/check-lines.sh`).
- **DRY**: shared UI goes in `components/ui` (shadcn) or `components/common`; shared logic goes in hooks, `lib` or backend `services`.
  Before copying code a second time, extract it.
- **Short, clear functions** — one job each, named after what they do. Prefer early returns.
- **Reusable components** with typed props; pages only compose components and hooks.
- No `any` in TypeScript; type hints everywhere in Python.
- Backend layering: `routes` (HTTP only) → `services` (business logic) → `models` (ORM).
  Generic CRUD lives in one place; entity routers only configure it.
- Every query is scoped to the caller's workspace (multi-tenant isolation).
- Comments explain *why*, not *what*.

## UX rules
- **Glassmorphism**: surfaces use only the `.glass`, `.glass-strong`, `.glass-subtle` and `.glass-glow` utilities
  from `index.css` (never hand-rolled blur/opacity); no backdrop blur on repeated small items.
- **No hardcoded UI text**: every string goes through `t()`; add keys to `en`, `uz`, `ru` together
  (Russian needs `_one/_few/_many/_other` plurals). Format money/dates with `lib/utils` (locale-aware).
- API errors return a stable `code`; add its translation under `errors.*`.
- Indigo→violet accent; semantic color only for status.
- Loading skeletons, empty states, filtered-empty states, toast on every mutation.
- Destructive actions are confirmed in an in-app dialog.
- Keyboard first: ⌘K palette, Esc closes, Enter submits.
- Motion is subtle (150–250 ms), respects `prefers-reduced-motion`.
- Dark mode, responsive down to 375 px, accessible labels and focus rings.
- **Spacing scale** (checked by `scripts/check-spacing.sh` in `make check`): card / section inset `px-4`, list rows `py-2`,
  stacks and grids `gap-1…3` / `space-y-1…3`, page header `mb-4`, toolbar `mb-3`. The page gutter is the `--gutter` CSS
  variable — full-bleed rows use `-mx-[var(--gutter)] px-[var(--gutter)]`, never hard-coded widths. Roomier spacing only in
  the files listed in `scripts/spacing-allow.txt` (sign-in screens, full-page states, `components/ui`).
- **Layouts never overflow**: rows that hold controls wrap (`flex-wrap`), text truncates (`min-w-0 truncate`), wide content
  scrolls inside its own container (tables, boards); empty states use `EmptyState` (`compact` inside cards).

## Layout
```
backend/   FastAPI app (app/core, app/models, app/schemas, app/services, app/api)
frontend/  React app (src/components/{ui,common,…}, src/features/*, src/pages, src/lib, src/hooks)
docs/      prompts/ history and architecture notes
```
