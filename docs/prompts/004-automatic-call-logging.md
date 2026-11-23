# Prompt 004 — Automatic call logging (telephony integration)

> Role: senior architect + SWE + UI/UX + B2B CRM expert. Follows `/CLAUDE.md`.

## Problem
Prompt 003 required reps to log calls by hand. The user wants every phone call to be
**captured by the CRM automatically**, the way Aircall, Close, HubSpot Calling and Bitrix24 telephony work.

## How it works (industry algorithm)
A browser cannot see a phone's calls. Calls must go through a **cloud PBX / VoIP provider**
(OnlinePBX, Zadarma, UTEL, Sipuni, Asterisk/FreePBX, Twilio …). The provider sends a **webhook** to the CRM for each call event:

```
Phone call ─▶ PBX / VoIP ─▶ POST /api/telephony/webhook/{token}  (HMAC-signed JSON)
                                   │
                                   ├─ 1. verify signature, resolve workspace from token
                                   ├─ 2. normalise number, match contact (last 9 digits)
                                   │      unknown number → auto-create contact (lead)
                                   ├─ 3. link the contact's company and newest open deal
                                   ├─ 4. upsert call activity by provider call_id (idempotent)
                                   │      ringing/answered → live call · ended → outcome, duration, recording
                                   ├─ 5. missed inbound call → "Call back" task with an immediate reminder
                                   └─ 6. push real-time event (SSE) → screen pop in the CRM
                                          after hang-up → "What was discussed?" wrap-up
```

## Scope
Backend
- `TelephonyIntegration` per workspace: webhook token (URL), signing secret (HMAC-SHA256), options.
- Activity gains `external_id` (provider call id), `recording_url` and `auto_logged`.
- Generic, documented event schema (`call.ringing | call.answered | call.ended | call.missed`); a
  provider adapter only has to map its payload onto it.
- Event broker plus `GET /api/telephony/stream` (Server-Sent Events, token in the query string).
- `GET /api/telephony` (settings), `POST /api/telephony/rotate`, `POST /api/telephony/simulate`
  (runs the exact same pipeline so the flow can be tested without a PBX).
- Tests: signature, idempotency, matching, unknown caller, missed-call task, workspace isolation.

Frontend
- **Screen pop** (glass card): incoming or outgoing call with contact, company and deal, a live timer and "Open record".
- After hang-up, a **wrap-up dialog** asks "What was discussed?", next steps and a follow-up with a reminder.
  It shares one `CallNotesFields` component with the manual call form (DRY).
- Calls list and timeline: "Auto" badge, recording player, "Write summary" when a summary is missing.
- Settings → Telephony: webhook URL, secret (copy, rotate), payload example, built-in **call simulator**.
- All texts in uz / ru / en.

## Acceptance
- A signed webhook (or the simulator) creates and updates the call automatically, the screen pop
  appears in real time, and the wrap-up saves the summary on the same call.
- A missed inbound call creates a call-back task that shows up in the reminder bell.
- `make check` is green; no file exceeds 250 lines.
