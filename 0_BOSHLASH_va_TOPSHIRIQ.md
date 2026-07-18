# Boshlash va dasturchiga topshiriq

> Loyihani ishga tushirish tartibi: dasturchiga nima beriladi, qanday ruxsatlar
> kerak, u nima quradi, siz tomondan nima qoladi, va qanday test/launch.

---

## 1. Dasturchiga beriladigan fayllar

Butun **`AI Sotuvchi/`** papkasi, ayniqsa:

- **`3_Dasturchi_Texnik/texnik_TZ.md`** — asosiy texnik topshiriq (11 band).
- **`1_Miya_SystemPrompt/`** — 9 modul (AI xulqi, system prompt).
- **`2_Bilim_Bazasi/`** — `configurator_haqida.md` + `FAQ.md`.
- **`4_Tahlil/chatlar_tahlili.md`** — kontekst (577 chat).
- **Mavjud konfigurator:** `texno-optom-bot/` (SKILL.md + prices.md + bot.py `hisobla`).

---

## 2. Kerakli akkaunt / ruxsatlar (checklist)

Dasturchiga quyidagilar kerak:

- ☐ **Admin Telegram akkaunt** (userbot sessiyasi uchun)
- ☐ **Claude API kaliti** (Anthropic)
- ☐ **ERP katalog** access (prices.md / API — narx/mahsulot)
- ☐ **Krayin CRM** access (API — lid ochish/yangilash)
- ☐ **Server** (Krayin ishlaydigan yoki yangi — 24/7 uchun)
- ☐ **Tasdiqlash guruhi** (yangi Telegram guruh oching)
- ☐ **Telegram Premium** (ovozni matnga aylantirish uchun)

---

## 3. Dasturchi nima quradi (fazalar)

`texnik_TZ.md` bo'yicha, bosqichma-bosqich:

- **Faza 1:** userbot + Claude + katalog + xotira → kirayotgan chatga javob
  (trial: operator tasdig'i bilan).
- **Faza 2:** Krayin CRM + tasdiqlash guruhi + eskalatsiya.
- **Faza 3:** follow-up scheduler + ovoz (Premium) + rasm.
- **Faza 4:** to'liq avtomat + xavfsizlik/monitoring + reactivation.

---

## 4. Qolgan ishlar (qarorlar qilindi ✅)

1. **Nasiya + config narxi — KODда** (`hisobla` + `nasiya_hisobla` tool),
   LLM emas. Foizlar (46% / 32%) va kurs prices.md da. ✅ (dasturchiga topshiriq)
2. **Monoblok / ofis / noutbuk / printer → menejerga** (hozircha). Konfigurator
   faqat gaming PC. Keyinroq konfiguratorga qo'shiladi. ✅
3. **prices.md — rahbar dolzarb tutadi** (narx o'zgarsa darrov yangilaydi). ✅
4. **FAQ ni to'ldirish** (qoldi): avans foizi, kontakt, to'lov usullari.
5. **Tasdiqlash guruhи** ochib, **operator** tayinlash (trial tasdiqlash) (qoldi).

---

## 5. Test va ishga tushirish (xavfsiz)

1. **TEST (majburiy):** dasturchi qurgach — **577 real chatда qayta o'ynatib**
   (AI qanday javob berardi), xatolarni topib, promptni tuzatish. Testсiz
   ishga tushirmang.
2. **Trial rejim:** 1–2 hafta AI javobini **operator tasdiqlab** yuboradi,
   kichik hajmда. Sifat va xavfsizlikni ko'rasiz.
3. **Sekin avtomatga o'tish:** ishonch hosil bo'lgach, tasdiqni olib tashlash;
   monitoring bilan.
4. **Reactivation keyinroq:** inbound barqaror ishlagach, eski mijozlarni
   uyg'otishga o'tiladi (kam, tasdiq bilan).

---

## 6. Umumiy tartib (qadamlar)

```
1. Fayllar + ruxsatlar dasturchiга topshiriladi
2. Bo'shliqlar hal qilinadi (nasiya-kod, monoblok, prices, FAQ, guruh)
3. Dasturchi Faza 1 ni quradi
4. 577 chatда TEST + prompt tuzatish
5. Trial (operator tasdig'i) — 1-2 hafta
6. Avtomatga o'tish + Faza 2/3
7. Barqaror bo'lgach — reactivation (Faza 4)
```

---

## Kim nima qiladi (qisqa)

- **Dasturchi:** infratuzilma (texnik_TZ), kod-guardrail'lar, integratsiya, test muhiti.
- **Siz / assistent:** promptlar (tayyor), FAQ/monoblok/prices to'ldirish, test natijasidан tuzatish.
- **Operator (Farzona/admin):** trial tasdiqlash, tasdiqlash guruhida yopish.

---

*Versiya 1.0 · Texno Optom · 2026*
