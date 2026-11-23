# Bepul deploy (A variant)

| Qism | Xizmat | Manzil |
|---|---|---|
| Frontend | Vercel (Hobby) | https://orbit-crm-ashy-phi.vercel.app |
| Backend | Render free web service | https://orbit-crm-api-bs1i.onrender.com |
| Ma'lumotlar bazasi | Render free Postgres (`orbit-crm-db`) | faqat Render ichida |
| Telefoniya (ATS) | Lokal Asterisk (`make pbx-up`) | bridge bulutdagi API'ga yuboradi |

## Qanday tuzilgan
- **`render.yaml` (Blueprint)** backend va Postgres'ni yaratadi. `DATABASE_URL` bazadan avtomatik olinadi,
  `JWT_SECRET` esa Render tomonidan generatsiya qilinadi — hech qanday maxfiy kalit qo'lda kiritilmaydi.
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
- Render free Postgres muddatli va zaxira nusxasiz — joriy shartlarni Render panelidan tekshiring.
  Haqiqiy mijoz ma'lumotlarini bepul tarifda saqlamang.
- Demo workspace ochiq: havolani bilgan har kim kira oladi. Real ishga o'tishda Render'da `DEMO_ENABLED=false` qiling.
- Suhbat yozuvlari lokal bridge'da (`localhost:8090`) — faqat ATS ishlayotgan kompyuterda tinglanadi.
  Hamma joyda tinglash uchun yozuvlarni bulut storage'ga yuklash kerak (keyingi qadam).
