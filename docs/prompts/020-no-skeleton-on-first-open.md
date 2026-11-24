# Prompt 020 — No full-screen skeleton the first time a page is opened

> Follows `/CLAUDE.md`. Report: "projectdagi 1-kirishda skeleton chiqishini ham problemini fix qil, ux uchun bu yaxshi emas".

## Causes
1. The `Suspense` around the routes sat outside the app shell: the first visit to any page (its lazy chunk loading)
   replaced the whole screen — sidebar and top bar included — with a skeleton.
2. Pages showed a title-less generic skeleton until every CRM list had loaded.
3. Page chunks were only requested when clicked.

## Fix (Linear-style: the frame is always real, only the data area waits)
- `Suspense` lives inside `AppShell`, outside the keyed page wrapper; React Router's `v7_startTransition` is on, so a
  navigation keeps the current page on screen until the next page's code is ready (no fallback flash).
- All page chunks are preloaded when the browser is idle.
- `PageLoading` shows the real title and description with a skeleton only for the content; record pages show a
  skeleton in the same info | feed frame. (Together with prompt 018's cached data, repeat visits show data at once.)

## Acceptance
Opening each section for the first time shows its title immediately and never a title-less fallback; rapid navigation
still ends on a visible page; `make check` green.
