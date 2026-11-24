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

## Kirish: faqat administrator bergan login va parol (ERP uslubi)
- Production'da `REGISTRATION_ENABLED=false` va `DEMO_ENABLED=false`: o'zi ro'yxatdan o'tish yo'q.
- **Superadmin** (platforma operatori): Render → Environment'da `SUPERADMIN_EMAIL` va `SUPERADMIN_PASSWORD`ni
  o'zingiz kiriting. Backend ishga tushganda shu akkaunt yaratiladi (mavjud bo'lsa superadmin qilinadi, parol o'zgartirilmaydi).
  Lokal: `make superadmin EMAIL=siz@kompaniya.uz` (parolni so'raydi).
- Superadmin `/admin` panelida kompaniya yaratadi va uning egasiga login + vaqtinchalik parol beradi.
- Kompaniya egasi/administratori Settings → Team'da xodimlarga login beradi, rolini o'zgartiradi, parolini tiklaydi.
- Vaqtinchalik parol bilan birinchi kirishda foydalanuvchi o'z parolini o'rnatmaguncha CRM ochilmaydi.
- Faolsizlantirilgan foydalanuvchi kira olmaydi, eski sessiyasi ham darhol to'xtaydi.

## Email (ixtiyoriy)
Parolni tiklash va email tasdiqlash xatlari uchun Render → Environment'ga SMTP qo'shiladi:
`SMTP_HOST`, `SMTP_PORT` (587), `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`.
SMTP bo'lmasa login sahifasida "parolni unutdingizmi" o'rniga "administratoringizga murojaat qiling" ko'rinadi.

## Ma'lumotlar bazasi migratsiyalari
Backend ishga tushganda Alembic `upgrade head` bajaradi (`backend/migrations`). Eski `create_all` bilan
yaratilgan baza avval baseline (`0001`) deb belgilanadi — mavjud ma'lumotlar saqlanadi.
Yangi migratsiya: `cd backend && .venv/bin/alembic revision --autogenerate -m "..."`.

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
- Suhbat yozuvlari lokal bridge'da (`localhost:8090`) — faqat ATS ishlayotgan kompyuterda tinglanadi.
  Hamma joyda tinglash uchun yozuvlarni bulut storage'ga yuklash kerak (keyingi qadam).
