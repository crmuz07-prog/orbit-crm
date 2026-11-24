# Prompt 016 — amoCRM-style record card (info | feed | widgets) and multiple pipelines

> Follows `/CLAUDE.md`. The user showed amoCRM screens: a deal card with fields on the left, a chronological feed in the
> middle (field changes, notes, calls, chats, composer at the bottom, "no planned tasks — add") and widgets on the right
> ("time of the deal in stages"); and the deals board with a pipeline switcher, column headers with "N deals: sum",
> stage rules under the header, quick add, and a "deal movement report". Benchmarks: amoCRM, Pipedrive (multiple
> pipelines, rotting deals), HubSpot (record timeline with property history).

## Backend
- **Pipelines** (`pipelines`: name, position, is_default) — every stage belongs to a pipeline; each pipeline has its own
  won/lost stages. Stage gains `description` (the rule shown under the column) and `max_days` (how long a deal may stay;
  past it the card is flagged). Deal gains `stage_entered_at`. Migration 0006 creates a default pipeline per workspace,
  moves the existing stages into it and backfills `stage_entered_at`. New workspaces get one pipeline with 7 stages.
  Pipelines CRUD is admin-only; a pipeline with deals can't be deleted; the default can't be deleted.
- **Record events** (`record_events`): created / field changes (old → new) / stage changes with the actor, written by the
  generic CRUD for companies, contacts and deals. `GET /events?deal_id|company_id|contact_id` (the record must be visible
  to the caller). Deleting the record deletes its events.
- `GET /deals/{id}/stage-times` — seconds spent in each stage (from stage events; the current stage counts until now).
- `GET /reports/deal-movement?pipeline_id&days` — per stage: deals now, entered in the period, average time in stage.

## Frontend
- **Record card** shared by deals, companies and contacts: left glass panel (back, title, short id, pipeline/stage
  dropdown with a progress bar for deals, inline-editable fields: click → edit → Enter/blur saves, Esc cancels), centre
  feed grouped by day (events as compact lines, notes/calls/tasks as cards, calls with recordings), a "no planned tasks —
  add" hint and the composer pinned at the bottom; right column widgets (deal: time in stages; client: deals).
- **Deals board**: pipeline switcher (remembered), uppercase column headers with "N deals: sum" and a coloured bar, the
  stage rule text, overdue-in-stage flag on cards, quick add (title + amount) in the first column, "Deal movement report".
- **Settings → Pipelines**: create, rename, reorder, delete pipelines; stages per pipeline with rule text and max days.
- uz/ru/en, ≤ 250 lines per file, reusable pieces (`InlineField`, `RecordCard`, `Feed`).

## Out of scope (needs a channel integration first)
Chat messages (Telegram / WhatsApp / Instagram) in the feed: the feed is built to take a "message" item; calls already
arrive automatically from the PBX.

## Acceptance
pytest: pipelines CRUD and guards, events on create/update/stage change with actor, events hidden for invisible records,
stage times, movement report, migration 0006 on Postgres. `make check` green; UI verified in the browser.
