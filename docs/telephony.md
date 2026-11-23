# Telefoniya: qo'ng'iroqlarni avtomatik yozib olish

## Nima uchun PBX kerak
Brauzer yoki CRM telefoningizdagi qo'ng'iroqlarni o'zi "ko'ra olmaydi". Aircall, Close, HubSpot,
Bitrix24 va amoCRM'da ham qo'ng'iroqlar **bulutli ATS (PBX / VoIP)** orqali o'tadi. Har bir
qo'ng'iroqda ATS CRM'ga **webhook** (HTTP so'rov) yuboradi. Orbit ham aynan shunday ishlaydi.

```
Mijoz ⇄ Telefon raqami (ATS) ──webhook──▶ Orbit API ──SSE──▶ Menejer ekrani
```

## Algoritm (backend `services/telephony.py`)
1. **Xavfsizlik.** URL'dagi token workspace'ni aniqlaydi, `X-Orbit-Signature` (HMAC-SHA256) esa so'rov haqiqiyligini tekshiradi.
2. **Raqamni normallashtirish.** Oxirgi 9 raqam solishtiriladi: `+998 90 123-45-67` = `901234567`.
3. **Kontaktni topish.** Raqam kontaktga bog'lanadi; notanish raqam bo'lsa avtomatik kontakt (lid) yaratiladi.
4. **Bog'lash.** Kontaktning kompaniyasi va eng so'nggi ochiq bitimi qo'ng'iroqqa ulanadi.
5. **Idempotentlik.** Qo'ng'iroq `call_id` bo'yicha bitta yozuv bo'ladi. ATS bir xil webhook'ni qayta yuborsa, dublikat paydo bo'lmaydi.
6. **Yakun.** Davomiylik, natija va yozuv (`recording_url`) saqlanadi.
7. **Javobsiz kiruvchi qo'ng'iroq.** Darhol eslatmali "Qayta qo'ng'iroq" vazifasi yaratiladi.
8. **Real vaqt.** Menejer ekranida qo'ng'iroq kartasi chiqadi: jiringlayapti → suhbatda (taymer) → tugadi.
   Tugagach "Nimalar gaplashilganini yozish" tugmasi chiqadi va xulosa **shu qo'ng'iroqning o'ziga** saqlanadi.

## Ulash
> O'z Asterisk'ingiz bilan bepul sinov: [asterisk-test.md](asterisk-test.md) (`make pbx-up`).

1. **Settings → Telefoniya** bo'limidan *Webhook URL* va *Imzo kaliti*ni oling.
2. ATS kabinetida (OnlinePBX, Zadarma, UTEL, Sipuni, Mango, Asterisk/FreePBX, Twilio…)
   "HTTP-uvedomleniya / Webhook / Call events" bo'limiga URL'ni kiriting.
3. Agar ATS formati boshqacha bo'lsa, uni quyidagi formatga o'tkazuvchi kichik adapter kerak
   (ko'pincha 20–40 qator). Production'da API ochiq HTTPS domenda bo'lishi kerak.

### Hodisa formati
```http
POST /api/telephony/webhook/{token}
X-Orbit-Signature: sha256=<hex(HMAC_SHA256(secret, raw_body))>
Content-Type: application/json

{
  "event": "call.ringing | call.answered | call.ended | call.missed",
  "call_id": "pbx-8f2c1",
  "direction": "inbound | outbound",
  "from": "+998901234567",
  "to": "+998712000000",
  "duration": 245,
  "status": "answered | no_answer | busy | voicemail | failed",
  "recording_url": "https://…"
}
```

### Sinab ko'rish
- **Settings → Telefoniya → Qo'ng'iroq simulyatori**: ATS'siz xuddi shu jarayonni ishga tushiradi.
- Terminaldan imzolangan so'rov yuborish (Python):
  ```python
  import hmac, hashlib, json, urllib.request
  body = json.dumps({"event": "call.missed", "call_id": "t1", "direction": "inbound",
                     "from": "+998935557711", "to": "+998712000000"}).encode()
  sig = "sha256=" + hmac.new(SECRET.encode(), body, hashlib.sha256).hexdigest()
  urllib.request.urlopen(urllib.request.Request(WEBHOOK_URL, body, {"X-Orbit-Signature": sig, "Content-Type": "application/json"}))
  ```

## Cheklovlar va keyingi qadamlar
- Shaxsiy SIM-kartadan qilingan qo'ng'iroqlarni faqat **Android ilova** (qo'ng'iroqlar jurnalini o'qiydi) yozib oladi.
  iOS'da bunga ruxsat yo'q. Bunday ilova alohida loyiha bo'ladi.
- Real-time broker bitta jarayonda ishlaydi. Bir nechta API worker uchun uni Redis pub/sub bilan almashtirish kerak.
- Ma'lum bir ATS uchun tayyor adapter (masalan, OnlinePBX yoki Zadarma formati) qo'shish mumkin.
