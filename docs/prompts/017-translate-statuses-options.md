# Prompt 017 — Every status and option in uz / ru / en

> Follows `/CLAUDE.md`. Request: "projectdagi barcha statuslar, optionlarni ham translationini qil".

## Found untranslated
- Option lists stored as English values: deal sources (Inbound, Referral, …) and industries (SaaS, Logistics, …).
- Built-in names the server seeds in English: the 7 default stages, "Sales pipeline", the roles Sales rep / Team lead /
  Viewer; and subjects written by the PBX integration ("Inbound call · Name", "Call back +998…").
- Literal UI text: the "Demo" badge in the admin panel, the dialog close label, example placeholders in forms.

## Solution
- Stored values don't change (no migration, other languages keep working). `hooks/useLabels` shows built-in names and
  option values in the user's language; anything a user typed or renamed is shown as written (HubSpot behaves the same).
- Editing a built-in name starts from the translated text, and an untouched name is never written back.
- `features/activities/useSubject` renders integration subjects from the call's own data.
- New dictionaries `labels.ts` (uz/ru/en): defaults, options, localised examples, misc.
- Applied to the board, record card, feed lines, stage selector, time-in-stages, movement report, dashboard chart,
  forms, tables, filters, settings (stages, pipelines, roles), team access pickers, reminders and the call wrap-up.

## Acceptance
`make check` green; switching the language changes stage, pipeline, role, source and industry names everywhere.
