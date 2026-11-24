# Prompt 019 — Page goes blank after Dashboard → Deals → Dashboard → Deals

> Follows `/CLAUDE.md`. Report: "boshqaruv paneliga kirib, keyin bitimlarga kirib, yana boshqaruv va bitimlarga
> qaytsam pagega hech narsa ko'rinmay qolyapti prodda".

## Diagnosis
Reproduced locally with the same clicks. The page was rendered (its text was in the DOM) but the route wrapper's computed
opacity was 0. `AppShell` wrapped `<Outlet />` in `AnimatePresence mode="wait"` with an exit animation; back-and-forth
navigation interrupted the exit, and the entering page never started its enter animation — a blank screen.

## Fix
Enter-only route transition (`motion.div` keyed by path, 180 ms fade/rise, `prefers-reduced-motion` respected via the
global `MotionConfig`); no exit animation, so a new page can never wait on an interrupted one.

## Acceptance
Rapid Dashboard ↔ Deals switching (40–900 ms apart) always ends with the page visible (opacity 1); `make check` green.
