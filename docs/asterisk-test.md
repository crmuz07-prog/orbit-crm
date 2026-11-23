# Asterisk sinovi: telefoningizdan haqiqiy qo'ng'iroq → Orbit

Operatorsiz va bepul. Telefoningiz Wi-Fi orqali kompyuteringizdagi Asterisk ATS'ga ulanadi. Har bir qo'ng'iroq
Orbit'ga avtomatik tushadi: ekran kartasi chiqadi, qo'ng'iroq kontaktga va bitimga bog'lanadi, **suhbat yozib olinadi**.

```
Telefon (Zoiper, 102) ──Wi-Fi──▶ Asterisk (Docker) ──AMI──▶ orbit-bridge ──imzolangan webhook──▶ Orbit
```

## 1. Ishga tushirish
```bash
make dev       # Orbit (API :8000, Web :5173)
make pbx-up    # Asterisk + bridge (.env avtomatik yaratiladi)
make pbx-logs  # nima bo'layotganini ko'rish
```

## 2. Telefonni ulash (Zoiper)
1. App Store / Play Market'dan **Zoiper Lite** ni o'rnating (bepul).
2. *Settings → Accounts → Add account → SIP* (yoki "Manual configuration") ni tanlang.
3. To'ldiring:

| Maydon | Qiymat |
|---|---|
| Username | `102` |
| Password | `infra/asterisk/.env` faylidagi `SIP_PASSWORD_102` |
| Domain / Host | kompyuter IP'si, masalan `172.16.12.114` (`make pbx-env` chiqaradi) |
| Port / Transport | `5060`, **UDP** |

4. Akkaunt yonida yashil belgi (Registered) chiqishi kerak. Tekshirish:
   `docker compose -f infra/asterisk/docker-compose.yml exec asterisk asterisk -rx "pjsip show contacts"`

Telefon va kompyuter **bitta Wi-Fi**da bo'lishi kerak. macOS "kiruvchi ulanishlarga ruxsat berasizmi?" deb so'rasa — **Allow**.

## 3. Sinov stsenariylari
| Telefonda tering | Nima bo'ladi | Orbit'da |
|---|---|---|
| `600` | Echo test — ovozingiz qaytib eshitiladi | yozilmaydi (faqat ovozni tekshirish) |
| CRM'dagi kontakt raqami, masalan `+884329631916` | "Virtual mijoz" 3 soniya jiringlaydi, javob beradi, salomlashadi, keyin ovozingizni qaytaradi | **Chiquvchi** qo'ng'iroq: ekran kartasi, kontakt + bitim, yozuv |
| `*2` + raqam, masalan `*2998935557711` | ATS uzadi va 4 soniyadan keyin **shu raqamdan sizga qo'ng'iroq qiladi** | **Kiruvchi** qo'ng'iroq. Javob bersangiz — yozuv; rad etsangiz — javobsiz + "Qayta qo'ng'iroq" eslatmasi |
| `101` | 101 raqamidagi ikkinchi qurilmaga (kompyuterdagi softphone) qo'ng'iroq | yozilmaydi (ichki) |

Qo'ng'iroq tugagach CRM'da **"Nimalar gaplashilganini yozish"** chiqadi. Yozuv esa qo'ng'iroq ostida pleyerda bo'ladi.

## 4. Muammolar
| Belgisi | Sababi va yechimi |
|---|---|
| Zoiper "Registration failed / timeout" | IP noto'g'ri, telefon boshqa tarmoqda yoki Wi-Fi'da **client isolation** yoqilgan (ofis va mehmon tarmoqlarida ko'p uchraydi). Uy Wi-Fi'ni yoki telefon hotspot'ini sinab ko'ring |
| Ulanadi, lekin ovoz yo'q | RTP portlari (UDP 10000–10050) bloklangan yoki IP o'zgargan. `make pbx-env && make pbx-up` |
| Kompyuter IP'si o'zgardi | `make pbx-up` — `.env` yangilanadi; Zoiper'da Domain'ni ham yangilang |
| Orbit'da qo'ng'iroq ko'rinmayapti | `make pbx-logs` — bridge `→ call.ringing … (200)` yozishi kerak. 401 bo'lsa Settings → Telefoniya'da kalit qayta yaratilgan: `make pbx-up` |

## 5. Haqiqiy raqamga o'tish
Operatordan SIP trunk yoki GSM-shlyuz olinganda `extensions.conf`dagi "virtual mijoz" o'rniga
`Dial(PJSIP/${DIALED}@trunk)` yoziladi va trunk `pjsip.conf`ga qo'shiladi. Bridge va Orbit tomoni o'zgarmaydi.
Production uchun: TLS/SRTP, fail2ban, kuchli parollar, yozuvlarni himoyalangan saqlash (imzolangan URL).
