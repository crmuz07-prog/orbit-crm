# Bepul deploy (A variant)

| Qism | Xizmat | Manzil |
|---|---|---|
| Frontend | Vercel (Hobby) | https://orbit-crm-ashy-phi.vercel.app |
| Backend | Render free web service | https://orbit-crm-api-bs1i.onrender.com |
| Ma'lumotlar bazasi | **Supabase** Postgres (free, West US Oregon) | Session pooler orqali |
| Telefoniya (ATS) | Lokal Asterisk (`make pbx-up`) | bridge bulutdagi API'ga yuboradi |

## Qanday tuzilgan
- **`render.yaml` (Blueprint)** backend'ni yaratadi. `JWT_SECRET`ni Render generatsiya qiladi.
  `DATABASE_URL` — Render → Environment'da saqlanadigan maxfiy qiymat: Supabase **Session pooler** URI
  (`postgresql://postgres.<ref>:<parol>@aws-0-us-west-2.pooler.supabase.com:5432/postgres`).
  Direct ulanish faqat IPv6, transaction pooler esa prepared statement'larni buzadi — shuning uchun Session pooler.
  Jadvallar backend ishga tushganda yaratiladi, demo ma'lumot birinchi demo kirishda yuklanadi.
  CORS `CORS_ORIGIN_REGEX` orqali `https://orbit-crm…vercel.app` domenlariga ruxsat beradi.
- **Vercel**: Root Directory `frontend`, preset Vite (`frontend/vercel.json`), env `VITE_API_URL` = backend manzili.
- GitHub ilovalari (Render, Vercel) **faqat `orbit-crm` repo'siga** ruxsat bilan o'rnatilgan.
- `main` branch'ga har bir push ikkala xizmatni avtomatik qayta deploy qiladi.

## Lokal Asterisk'ni bulutdagi CRM'ga ulash
```bash
ORBIT_API=https://orbit-crm-api-bs1i.onrender.com python3 scripts/pbx-env.py
docker compose -f infra/asterisk/docker-compose.yml up -d
```

## Bepul tarif cheklovlari
- Render free backend ~15 daqiqa ishlatilmasa uxlaydi; birinchi so'rov ~50 soniya kutadi
  (bridge webhook'larni qayta yuboradi, shuning uchun qo'ng'iroqlar yo'qolmaydi).
- Supabase free loyiha bir hafta ishlatilmasa pauzaga tushadi (panelda "Restore" bilan qaytariladi); bepul tarifda
  kunlik zaxira nusxa yo'q. Haqiqiy mijoz ma'lumotlarini bepul tarifda saqlamang.
- Demo workspace ochiq: havolani bilgan har kim kira oladi. Real ishga o'tishda Render'da `DEMO_ENABLED=false` qiling.
- Suhbat yozuvlari lokal bridge'da (`localhost:8090`) — faqat ATS ishlayotgan kompyuterda tinglanadi.
  Hamma joyda tinglash uchun yozuvlarni bulut storage'ga yuklash kerak (keyingi qadam).
