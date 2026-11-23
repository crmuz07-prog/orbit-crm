# Prompt 003 — Glass design system, 3 languages, Calls & Reminders

> Role: senior architect + SWE + UI/UX + B2B CRM expert. Follows `/CLAUDE.md`
> (≤250 lines/file, DRY, short functions, reusable components, international CRM benchmarks).

## 1. Design pattern: Glassmorphism
Replace the flat zinc look with a **glass design system** (in the spirit of Apple visionOS and Linear's frosted surfaces):
- Fixed ambient **gradient mesh** background (indigo / violet / teal blobs), tuned separately for light and dark.
- Surface tokens in one place (`index.css`): `.glass` (cards, sidebar, topbar), `.glass-strong`
  (dialogs, popovers, menus, selects), `.glass-subtle` (inputs, Kanban columns, chips).
  Components consume these utilities and never hand-roll blur or opacity.
- Primary actions: indigo→violet gradient with a soft glow. Focus rings stay visible.
- Performance: `backdrop-filter` only on containers, not on each of N Kanban cards.
- Contrast stays WCAG AA on translucent surfaces; reduced-transparency fallback is solid surfaces.

## 2. Internationalisation — English, Oʻzbekcha (Latin), Русский
- `i18next` + `react-i18next`; typed resources (keys are checked at compile time against `en`).
- Namespaced dictionaries per language, split so no file exceeds 250 lines.
- Real plural rules (ru: one/few/many; uz/en: one/other).
- Locale-aware numbers, currency and dates (`Intl` + date-fns `enUS` / `ru` / `uz`).
- Language switcher in the top bar and in Settings; choice persisted; `<html lang>` updated.
- Enum labels (lifecycle, priority, activity type, call outcome) are translated, never hardcoded.
- API errors carry a stable `code`; the UI translates codes and falls back to `detail`.

## 3. Calls (Close.com / HubSpot / Aircall pattern)
Data: `activities` with `type="call"` gain `call_direction` (outbound/inbound), `call_outcome`
(connected, no_answer, voicemail, busy, wrong_number), `duration_seconds`, `phone`, `next_steps`.
- **Call workspace dialog**, opened from contact, deal and company pages and from ⌘K:
  contact card + click-to-dial (`tel:`), live **call timer** (start / end), direction,
  outcome chips, **"What was discussed"** notes, next steps, optional **follow-up task with a reminder**.
- Backend `POST /api/calls` saves the call and its follow-up in one transaction.
- `GET /api/calls/stats`: calls today and this week, connect rate, average duration, total talk time, breakdown by outcome.
- **Calls page**: KPI strip, filters (outcome, direction), call log list.
- Timeline renders calls richly: direction icon, outcome badge, duration, summary, next steps.

## 4. Reminders & notes
- `remind_at` on activities. Forms and the composer offer "Remind me": at due time, 15 min, 1 h or 1 day before.
- `GET /api/reminders` lists pending reminders. A **bell** in the top bar shows a due count
  badge and a popover list with **Done** and **Snooze** (10 min, 1 h, tomorrow 9:00).
- In-app toast (plus the browser Notification API when permitted) fires when a reminder comes due; the bell polls every 30 s.
- Notes can be **pinned** (HubSpot). Pinned notes sit at the top of the record timeline.

## 5. Acceptance
- Every UI string is translated in all 3 languages, and switching language updates the whole app.
- A call can be logged end to end with timer, outcome, summary and follow-up, and appears on
  the timeline, the Calls page, the stats and (via its follow-up) the reminders bell.
- A reminder fires, can be snoozed and can be completed.
- Tests cover call logging with follow-up, stats, reminders and error codes.
- `make check` passes: no file over 250 lines, tests green, strict build.
