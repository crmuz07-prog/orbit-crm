# Prompt 015 — One design system everywhere: the superadmin uses the same shell as the CRM

> Follows `/CLAUDE.md`. Request: "butun projectda dizayn uchun 1 ta logika ishlashi kerak, superadmin ham shunday bo'lsin".

## Problem
The platform admin had its own `AdminShell` (top bar only, an info banner, tabs inside one page) while the CRM uses the
glass sidebar + topbar + `Page` layout. Two navigation models and two headers for one product.

## Solution (Linear / HubSpot: one shell, sections by context)
- `AppShell` is the only app layout. The sidebar shows:
  - the workspace switcher and the **Workspace** section when the session is inside a company;
  - a **Platform** section for superadmins: Companies, Users, Payments, Security — real routes (`/admin/:section`),
    replacing the tabs; a superadmin without a company sees a "Platform" header card instead of the switcher.
- Topbar: same component; CRM-only controls (search palette, New, reminders) appear only inside a company.
- CRM-only providers (call events, screen pop, palette) mount only inside a company; CRM queries never run without one.
- `AdminShell` and its banner are removed; every admin section is a normal `Page` with title and description.
- uz/ru/en; ≤ 250 lines per file.

## Acceptance
`make check` green; superadmin with and without a company, owner and member all see the same shell; `/admin` redirects
to `/admin/companies`; old tab state is gone.
