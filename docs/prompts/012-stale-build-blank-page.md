# Prompt 012 — Page disappears after refresh / navigation on the live site

> Follows `/CLAUDE.md`. Reported: "saytni refresh qilganda avvalgi UI chiqib keyin yana yo'q bo'lib qolyapti".

## Diagnosis
- Not reproducible locally (dev server and production build, as owner and as superadmin, no console errors).
- On Vercel a missing file under `/assets/` answers `200 text/html` (the SPA rewrite catches everything). A tab opened
  before a deploy asks for a lazy route chunk of the old build, receives `index.html`, the import fails and — with no
  error boundary — React unmounts the whole app: the UI shows, then the page goes blank. Three deploys today fit this.

## Fix
- `vercel.json`: rewrite everything except `/assets/*` to `index.html`, so a missing build file is a real 404.
- `lib/stale-build.ts`: on `vite:preloadError` reload once (session flag prevents loops) to pick up the new build.
- `components/common/error-boundary.tsx`: a render error shows "Something went wrong" with the technical message and a
  Reload button instead of a blank page (uz/ru/en).

## Acceptance
`make check` green; after deploy `/assets/missing.js` returns 404; the app still loads and refreshes normally.
