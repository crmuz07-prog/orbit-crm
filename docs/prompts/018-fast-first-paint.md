# Prompt 018 — Pages show a skeleton for a long time on first open

> Follows `/CLAUDE.md`. Report: "sahifalar 1-marta ochilayotganda loading qismida skeleton juda uzoq chiqib qolyapti".

## Measured (production)
- Warm API: ~0.45 s per request from Tashkent to Render (Oregon); database calls are no slower.
- The long waits are Render free-tier cold starts (the instance sleeps after 15 idle minutes, ~50 s to wake).
- Every page also waits for two round trips in series: `/auth/me`, then the CRM lists.

## Fix
1. **Keep the API warm**: a GitHub Actions schedule pings `/api/health` every 10 minutes, around the clock. The repository
   was made public at the owner's request (history checked for secrets first: none — PBX and database secrets only
   live in git-ignored `.env` files; commit e-mails are GitHub no-reply), so Actions minutes are free.
2. **Instant repeat visits (stale-while-revalidate)**: the last session and the last loaded query data are kept in
   localStorage, per user and workspace, for 24 hours. The app renders them at once and refreshes in the background;
   a 401 still signs out. The cache is versioned and is removed on sign-out and on switching workspace.

## Acceptance
`make check` green; a reload shows the page immediately (no skeleton) with data refreshed in the background; signing
out clears the stored data.
