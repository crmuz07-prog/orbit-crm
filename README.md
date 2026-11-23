# Orbit CRM — B2B Sales CRM

React + shadcn/ui + framer-motion frontend (glassmorphism), **Python FastAPI** backend.
Interfeys 3 tilda: **Oʻzbekcha, Русский, English**.
UX va funksionallik HubSpot, Salesforce, Pipedrive, Attio va Linear'dan olingan.

| Hujjat | Mazmuni |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Doimiy muhandislik qoidalari (stack, ≤250 qator, DRY, UX qoidalari, prompt-first workflow) |
| [PROMPT.md](PROMPT.md) | Joriy prompt va promptlar tarixi (`docs/prompts/`) |
| [docs/architecture.md](docs/architecture.md) | Arxitektura, qatlamlar, API, qayta ishlatiladigan komponentlar |
| [docs/telephony.md](docs/telephony.md) | Qo'ng'iroqlarni avtomatik yozib olish: algoritm, PBX ulash, webhook formati |
| [docs/asterisk-test.md](docs/asterisk-test.md) | O'z Asterisk ATS'ingiz bilan telefoningizdan haqiqiy qo'ng'iroq sinovi (`make pbx-up`) |

## Tez start

```bash
make install   # Python 3.12 venv (uv) + npm install
make dev       # API :8000 + Web :5173
```

http://localhost:5173 → **Explore the demo workspace** — bir klikda namuna ma'lumotli workspace ochiladi.

## Buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `make dev` | Backend (auto-reload) va frontend |
| `make test` | Backend pytest (auth, tenant izolyatsiyasi, CRUD, biznes qoidalar, dashboard) |
| `make build` | Frontend type-check + production build |
| `make lines` | Hech bir fayl 250 qatordan oshmaganini tekshiradi |
| `make check` | Hammasi birga |

## Production

`backend/.env` (namuna: `backend/.env.example`):

```
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/postgres   # Supabase Postgres ham bo'ladi
JWT_SECRET=<uzun tasodifiy qator>
DEMO_ENABLED=false
```

## Imkoniyatlar

- **Dashboard** — server tomonda hisoblanadigan KPI'lar (open / weighted pipeline, won this quarter, win rate, avg deal, sales cycle), bosqichlar grafigi, won/lost trend, tasklar, top va "at risk" deallar
- **Deals** — Pipedrive Kanban (drag-and-drop, layout animatsiya, optimistic update), List ko'rinishi, Lost reason dialog
- **Deal record** — Salesforce Path, Won / Lost / Reopen, HubSpot associations va timeline
- **Companies / Contacts** — saralanadigan jadvallar, filtrlar, roll-up statistikalar va timeline
- **Activities** — Note / Call / Email / Meeting / Task; Overdue / Today / Upcoming / Completed
- **Avtomatik qo'ng'iroq yozish** — PBX webhook → kontakt/bitimga bog'lash → real-time ekran kartasi → tugagach "nimalar gaplashildi"; javobsiz qo'ng'iroq → qayta qo'ng'iroq eslatmasi; yozuv (audio) pleyeri; simulyator
- **Calls** — qo'lda qayd etish oynasi: click-to-dial, jonli taymer, yo'nalish, natija, **nimalar gaplashildi**, keyingi qadamlar, eslatmali follow-up; Calls sahifasi (bugun/hafta, dozvon %, o'rtacha va umumiy suhbat vaqti)
- **Eslatmalar (Reminders)** — har bir vazifa/uchrashuvga "Eslatish" (vaqtida, 15 daq, 1 soat, 1 kun oldin); top bar'da qo'ng'iroqcha, toast va brauzer bildirishnomasi, Snooze / Done
- **Pinned notes** — muhim eslatmalar timeline tepasida
- **⌘K palette**, glass dizayn (light/dark), til almashtirish (UZ/RU/EN), mobil drawer, Settings: pipeline editor, sample data, demo reset
