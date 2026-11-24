# Prompt 011 — Subscriptions, seats and payments (erp1 model), Supabase RLS

> Role: senior architect + SWE + UI/UX + B2B CRM expert. Follows `/CLAUDE.md`.
> Source: the user's ERP (`~/Desktop/erplar/erp1`, `src/lib/subscription.ts`, `tenant-status.ts`,
> `api/admin/tenants/[id]/payments`) and per-seat SaaS billing (HubSpot / Pipedrive seats).

## Why
The platform operator (superadmin) sells the CRM to companies for a period and a number of users. Today every company
is unlimited forever and there is no record of what was paid.

## Rules (as in erp1)
- A company has `subscription_ends_at` (a date, **inclusive**: it works through that day; empty = no limit),
  `seat_limit` (active users allowed; empty = unlimited), `license_months` (the default term) and `price_paid` (total).
- **Lazy enforcement**: no scheduler. The effective status is computed on read — `blocked` when the superadmin blocked it
  or the end date has passed. Dates are calendar dates in the platform time zone (`BILLING_TIMEZONE`, default
  `Asia/Tashkent`), so a company is never cut off at UTC midnight.
- **Recording a payment** (amount, months, optional seats, note) extends the subscription from the later of today and the
  current end date (paying early stacks the term), with month-end clamping (31 Jan + 1 month = 28/29 Feb). Each payment
  stores its period start/end, months and seats; the company becomes active again.
- **Blocked company**: every CRM request answers 403 `subscription_expired` or `company_blocked`; members see a
  "subscription ended" screen (sign-out / switch workspace). Superadmins are never blocked. The demo is never blocked.
- **Warning**: owners and admins see a banner 7 days before the end date.
- **Seats** (stricter than erp1, which only displays the number): adding a member, adding a membership and reactivating
  a user fail with 409 `seat_limit_reached` when active members would exceed `seat_limit`. Team settings show "used / limit".
- Superadmin can block/unblock a company, set the seat limit and end date, and see the payment history; an
  Admin → Payments tab lists all payments with the total.
- Existing companies keep working: migration sets them active with no end date and no seat limit.

## Supabase RLS
Migration enables Row Level Security on every application table in PostgreSQL (no policies), as erp1 does for its
staff tables. The API connects as the table owner and is unaffected; Supabase's public REST/GraphQL endpoints (anon and
authenticated keys) can no longer read or write the CRM tables. No-op on SQLite.

## Acceptance
pytest: month arithmetic (month-end clamp, stacking, lapsed restart), inclusive end date, blocked/expired company
refused while superadmin passes, demo never blocked, seat limit on add/reactivate, payment history and totals,
migration 0005 on Postgres (existing companies active and unlimited, RLS on). `make check` green; UI verified.
