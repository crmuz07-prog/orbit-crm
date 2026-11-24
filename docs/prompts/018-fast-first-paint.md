# Prompt 018 — Pages show a skeleton for a long time on first open

> Follows `/CLAUDE.md`. Report: "sahifalar 1-marta ochilayotganda loading qismida skeleton juda uzoq chiqib qolyapti".

## Measured (production)
- Warm API: ~0.45 s per request from Tashkent to Render (Oregon); database calls are no slower.
- The long waits are Render free-tier cold starts (the instance sleeps after 15 idle minutes, ~50 s to wake).
- Every page also waits for two round trips in series: `/auth/me`, then the CRM lists.

## Fix
1. **Keep the API warm**: a GitHub Actions schedule pings `/api/health` every 12 minutes, Mon–Sat 08:00–20:00 Tashkent.
   The repository is private (2,000 free Actions minutes a month, one minute billed per run), so a 24/7 ping would not
   fit (~4,300 min); working hours cost ~1,560 min. For 24/7, use a free external monitor (e.g. UptimeRobot, 5-minute
   checks) — that needs an account the owner creates.
2. **Instant repeat visits (stale-while-revalidate)**: the last session and the last loaded query data are kept in
   localStorage, per user and workspace, for 24 hours. The app renders them at once and refreshes in the background;
   a 401 still signs out. The cache is versioned and is removed on sign-out and on switching workspace.

## Acceptance
`make check` green; a reload shows the page immediately (no skeleton) with data refreshed in the background; signing
out clears the stored data.
