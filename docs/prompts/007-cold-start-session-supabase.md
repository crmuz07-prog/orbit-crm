# Prompt 007 — Survive backend cold starts; move the database to Supabase Postgres

## 1. Session must survive a sleeping backend
Render's free instance sleeps; the first request takes ~50 s or fails with a network error. Today any failure of
`/auth/me` signs the user out.
- Sign out **only on HTTP 401**. On network or 5xx errors, retry with back-off (about 1 minute in total) while
  showing "Waking up the server…" (uz/ru/en).
- Short, reusable helper; no change to API contracts.

## 2. Database → Supabase (free Postgres, not time-limited like Render's free DB)
- Create the Supabase project (the user sets the DB password; Claude never types credentials). Pick a region near
  the Render service.
- Use the **Session pooler** connection string (IPv4-compatible, port 5432). The direct host is IPv6-only, and the
  transaction pooler breaks prepared statements.
- `render.yaml`: `DATABASE_URL` becomes a dashboard-managed secret (`sync: false`), and the Render database is removed from the blueprint.
- The user pastes the URI into Render → Environment. The schema is created on boot and the demo data is re-seeded on first demo login.
- Verify end to end on the live site; document it in `docs/deploy.md`.
