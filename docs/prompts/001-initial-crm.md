# Build prompt — "Orbit CRM" (B2B Sales CRM on React + Supabase)

> Role: You are a senior full-stack engineer and product designer. Build a production-grade
> B2B sales CRM from scratch. Quality bar: HubSpot / Pipedrive / Salesforce / Attio / Linear.

## 1. Product goal

A focused CRM for B2B sales teams that manage **accounts (companies) → people (contacts) →
opportunities (deals) → activities**. Reps must be able to see their pipeline at a glance, move
deals through stages in seconds, log every touchpoint, and never miss a follow-up. Managers must
see forecast, win rate and pipeline health without building reports.

## 2. Patterns borrowed from international CRMs

| Source        | Pattern to adopt                                                                 |
|---------------|-----------------------------------------------------------------------------------|
| Pipedrive     | Drag-and-drop Kanban pipeline; per-stage count + value; "rotting" (stale) deals   |
| Salesforce    | "Path" component — chevron stage progress bar on the deal record; win probability |
| HubSpot       | Record page: left "About" panel, center activity composer + timeline (note / call / email / meeting / task); associations (deal ↔ company ↔ contact) |
| Attio / Linear| ⌘K command palette, keyboard-first, dense yet calm neutral UI, dark mode          |
| All           | Dashboard: open pipeline, weighted forecast, win rate, avg deal size, sales cycle |

## 3. Tech stack (fixed)

- **Vite + React 18 + TypeScript (strict)**
- **Tailwind CSS 3** (class-based dark mode), Inter font, `lucide-react` icons
- **Supabase** — Postgres, Auth (email/password), Row Level Security
- **@tanstack/react-query** — server cache, optimistic updates
- **react-router-dom 6**, **@dnd-kit/core** (Kanban), **recharts** (charts), **cmdk** (⌘K), **sonner** (toasts), **date-fns**
- **Demo mode**: if `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing, the app runs fully
  on a localStorage adapter with seeded sample data, so it can be evaluated with zero setup.

## 4. Data model (Postgres)

Multi-tenant by **workspace** (a sales team). Every business row has `workspace_id` defaulting to
`current_workspace_id()`; RLS allows access only to members of that workspace.

- `workspaces(id, name)`
- `profiles(id → auth.users, full_name, email)`
- `workspace_members(workspace_id, user_id, role: owner|admin|member)`
- `pipeline_stages(id, workspace_id, name, position, probability 0–100, is_won, is_lost, color)`
- `companies(id, workspace_id, owner_id, name, domain, industry, employees, country, city, annual_revenue, lifecycle: lead|prospect|customer|churned, description)`
- `contacts(id, workspace_id, owner_id, company_id?, first_name, last_name, email, phone, title, linkedin_url)`
- `deals(id, workspace_id, owner_id, title, company_id?, contact_id?, stage_id, amount, currency, expected_close_date, priority: low|medium|high, source, lost_reason, closed_at)`
- `activities(id, workspace_id, owner_id, type: note|call|email|meeting|task, subject, body, due_at, done, deal_id?, company_id?, contact_id?)`

Rules: `created_at`/`updated_at` with trigger; FKs to companies/contacts/deals `on delete set null`;
stage `on delete restrict`. On sign-up a trigger creates profile + personal workspace + membership +
default stages (Lead In 10%, Qualified 25%, Discovery/Demo 40%, Proposal 60%, Negotiation 80%,
Closed Won 100%, Closed Lost 0%). Indexes on every FK and `workspace_id`.

## 5. Screens & features

1. **Auth** — split-screen sign in / sign up (skipped in demo mode).
2. **App shell** — collapsible left sidebar (Dashboard, Deals, Companies, Contacts, Activities,
   Settings; overdue-task badge), top bar with ⌘K search, "+ New" menu, theme toggle, user menu.
   Mobile: sidebar becomes a drawer.
3. **Dashboard** — KPI cards (open pipeline, weighted forecast, won this quarter, win rate with avg
   deal size & sales cycle), "Pipeline by stage" bar chart, "Won revenue – last 6 months" area chart,
   "My tasks" (overdue + today), "Top open deals", "Deals at risk" (no update ≥ 14 days).
4. **Deals** — Board / List toggle, search + priority filter, header totals.
   Board: columns per stage with count, total and probability; drag card to change stage
   (optimistic). Dropping on *Closed Lost* asks for a lost reason. Cards show company, amount,
   close date (red when overdue), priority, stale badge.
5. **Deal record** — Salesforce-style chevron Path (click to change stage), Mark won / lost, edit,
   delete; About panel; associated company & contact; activity composer + timeline.
6. **Companies / Contacts** — sortable searchable tables with filters; record pages with KPIs,
   associated deals/contacts and a combined activity timeline (HubSpot association roll-up).
7. **Activities** — Overdue / Today / Upcoming / Completed / All tabs, type filter, complete inline.
8. **Settings** — profile, pipeline stage editor (rename, probability, color, reorder, add,
   delete if unused), data tools (load sample data, reset demo), appearance.
9. **Command palette (⌘K)** — create anything, jump to any page or record.

## 6. UX / UI requirements

- Neutral zinc palette, single indigo accent, semantic colors only for status
  (emerald = won, rose = lost/overdue, amber = warning).
- 8-pt spacing, 14px base text, rounded-xl cards with 1px borders, subtle shadows.
- Every list has loading, empty and filtered-empty states; every mutation shows a toast.
- Destructive actions require confirmation (in-app modal, never `window.confirm`).
- Keyboard: ⌘K palette, Esc closes modals, forms submit with Enter.
- Full dark mode; responsive down to 375px; accessible labels and focus rings.

## 7. Engineering requirements

- Data access through one typed adapter (`api.list/create/createMany/update/remove`) with
  Supabase and localStorage implementations — UI never talks to Supabase directly.
- react-query hooks per table, optimistic updates for edits (Kanban drag must feel instant).
- Business logic (forecast, win rate, stale detection) in pure functions in `lib/metrics.ts`.
- Strict TypeScript, no `any` in UI code; `npm run build` must pass with zero errors.
- SQL migration in `supabase/migrations/`, README with setup steps.

## 8. Definition of done

`npm install && npm run dev` opens a working CRM in demo mode with realistic sample data;
adding Supabase keys + running the migration turns it into a real multi-user CRM with RLS.
