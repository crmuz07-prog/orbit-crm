# Prompt 005 — Local Asterisk PBX test bench (real SIP calls → Orbit)

> Role: senior architect + SWE + telephony engineer. Follows `/CLAUDE.md`.

## Goal
Let the user make **real SIP calls from their own phone** (Zoiper over Wi-Fi, no operator, no cost) through a
self-hosted Asterisk. Every call must reach Orbit automatically through the existing signed webhook
(prompt 004), **with a recording of the conversation**.

## Architecture
```
Phone (Zoiper, ext 102) ──SIP/RTP over Wi-Fi──▶ Asterisk (Docker)
                                                 │ dialplan emits UserEvent(OrbitCall …) + MixMonitor recording
                                                 ▼ AMI (internal Docker network only)
                                          orbit-bridge (Python, stdlib only)
                                                 │ maps to the generic event, HMAC-signs it, retries
                                                 ▼
                         Orbit API /api/telephony/webhook/{token} → screen pop → wrap-up
                         (bridge also serves recordings at :8090 for the audio player)
```

## Test scenarios (phone only)
| Dial | Result in Orbit |
|---|---|
| any number, e.g. a CRM contact's phone | **Outbound** call: a "virtual customer" rings, answers, greets and echoes your voice; recorded |
| `*2` + number, e.g. `*2998935557711` | Asterisk hangs up and **calls you back from that number** → **inbound** call; decline it → missed call → call-back task |
| `600` | Echo test (audio check; not logged) |
| `101` ↔ `102` | Internal call between your devices (not logged) |

## Requirements
- `infra/asterisk/`: Dockerfile (Ubuntu 24.04 + Asterisk), templated PJSIP and AMI config (envsubst),
  dialplan, callback script, bridge, docker-compose with a fixed subnet (no clash with the 172.16.x LAN).
- NAT-safe PJSIP: external media/signalling address is the host's LAN IP; rtp_symmetric, force_rport, rewrite_contact; RTP 10000–10050.
- Security: random SIP/AMI passwords, AMI not published, unauthenticated SIP rejected.
- `scripts/pbx-env.py` generates `.env` (LAN IP, passwords, webhook URL and secret from the Orbit API).
- `make pbx-env | pbx-up | pbx-down | pbx-logs`; guide `docs/asterisk-test.md` (Uzbek, Zoiper steps).
- Files ≤ 250 lines (line check also covers `infra/`).

## Acceptance
Containers start; Asterisk accepts a registration; a call driven from inside the PBX creates the call in Orbit
with a playable recording; the user receives clear phone set-up instructions.
