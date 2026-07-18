# AI Sotuvchi — Yo'l xaritasi (ROADMAP)

> Texno Optom uchun Telegram AI sotuvchi loyihasining umumiy rejasi va tuzilishi.
> Bu fayl — butun loyihaning **xaritasi**. Har bir qism alohida faylda; bu yerda
> nima qayerda ekani va qanday birlashishi yozilgan.

---

## 1. Loyiha maqsadi

Telegramda mijozlarga **real sotuvchi (odam) kabi** javob beradigan, ehtiyojni
aniqlab, xarakteristika tuzib, narx va nasiyani aytadigan, e'tirozlarni
yumshatib, yopilish arafasida **tasdiqlash guruhiga** uzatadigan AI sotuvchi.

**Miya:** Claude (Anthropic).
**Asos:** 577 real chat tahlili + mavjud konfigurator (SKILL.md + prices.md).

---

## 2. Umumiy arxitektura (bir qarashda)

```
Mijoz Telegramda yozadi
   -> Userbot (admin akkaunt, MTProto) ushlaydi
   -> MIYA: Claude + System Prompt + Bilim bazasi (config/narx/nasiya) + suhbat xotirasi
   -> Javob (tabiiy tezlik: 3-4s o'qildi, 5-7s javob)
   -> Yopilish arafasi -> Tasdiqlash guruhiga -> Admin/menejer yopadi
```

**Ikki qism:**
- **MIYA (xulq)** — System Prompt va modullari. Buni biznes assistenti yozadi.
- **TANA (infratuzilma)** — userbot, xotira, scheduler, integratsiyalar. Buni dasturchi quradi.

---

## 3. Papka va fayllar tuzilishi

```
AI Sotuvchi/
├── 00_ROADMAP.md                  <- shu fayl (xarita)
│
├── 1_Miya_SystemPrompt/           <- AI XULQI (Claude uchun)
│   ├── 01_PERSONA.md              — kim, ohang, uslub (577 chat asosida)
│   ├── 02_ETAPLAR.md              — sotuv oqimi, har etap qadam-baqadam
│   ├── 03_ETIROZLAR.md            — e'tirozlarga tayyor javoblar
│   ├── 04_NASIYA.md               — Uzum nasiya qoidasi (6/12 oy)
│   ├── 05_FOLLOW_UP.md            — follow-up ketma-ketligi va matnlar
│   ├── 06_ESKALATSIYA.md          — tasdiqlash guruhi: qachon, qanday format
│   ├── 07_GUARDRAILS.md           — qattiq qoidalar (chegirma yo'q, grounding...)
│   ├── 08_OVOZ_RASM.md            — audio/rasm siyosati
│   └── 09_SYSTEM_PROMPT.md        — hammasini birlashtirgan yakuniy prompt
│
├── 2_Bilim_Bazasi/                <- CONFIG va NARX (mavjud tizim)
│   ├── configurator_haqida.md     — SKILL.md + prices.md qanday ulanadi
│   └── (prices.md, SKILL.md — mavjud botdan)
│
├── 3_Dasturchi_Texnik/            <- INFRATUZILMA (dasturchi uchun)
│   └── texnik_TZ.md               — 11 bandli texnik topshiriq
│
└── 4_Tahlil/                      <- ASOS
    └── chatlar_tahlili.md         — 577 chat tahlili (xulosalar)
```

**Nega alohida:** har modul mustaqil — narx o'zgarsa prices.md, ohang o'zgarsa
PERSONA, follow-up o'zgarsa FOLLOW_UP tahrirlanadi. Aralashmaydi.

---

## 4. Modullar nima saqlaydi (qisqacha)

| Fayl | Mazmuni |
|---|---|
| 01_PERSONA | Kim (Texno Optom sotuvchisi), ohang: qisqa, "aka", samimiy, ad-copy yo'q |
| 02_ETAPLAR | Salom -> qualify -> config -> narx -> nasiya -> e'tiroz -> yopilish arafasi |
| 03_ETIROZLAR | "qimmat", "o'ylayman", "chegirma" (->admin), "arzonroq bor" javoblari |
| 04_NASIYA | Uzum: 12 oy = narx x1.46/12; 6 oy = narx x1.32/6 (2% yashirin) |
| 05_FOLLOW_UP | +2-3 soat, +1 kun, +3 kun ketma-ketlik + matnlar, keyin to'xtash |
| 06_ESKALATSIYA | Sotuv signali -> guruhga xulosa; AI o'sha chatda jim bo'ladi |
| 07_GUARDRAILS | AI yopmaydi, chegirma bermaydi, faqat prices.md, bilmasa -> odam |
| 08_OVOZ_RASM | Ovoz: Telegram Premium transkript; Rasm: Claude vision |
| 09_SYSTEM_PROMPT | Yuqoridagilarni birlashtirgan yakuniy Claude system prompt |
| configurator_haqida | Mavjud SKILL.md + prices.md konfigurator qanday chaqiriladi |
| texnik_TZ | Userbot, xotira, scheduler, integratsiya, xavfsizlik (dasturchiga) |
| chatlar_tahlili | 577 chat: nima so'raladi, e'tirozlar, 62% teshik, xulosalar |

---

## 5. Hammasi qanday birlashadi (yakuniy System Prompt)

Dasturchi `build_system_prompt()` funksiyasi (mavjud botdagidek) har so'rovda
shu modullarni birlashtiradi:

```
01_PERSONA + 02_ETAPLAR + 03_ETIROZLAR + 04_NASIYA +
05_FOLLOW_UP + 06_ESKALATSIYA + 07_GUARDRAILS + 08_OVOZ_RASM
        +
2_Bilim_Bazasi (SKILL.md config mantig'i + prices.md narxlar)
        =
=> To'liq System Prompt -> Claude API ga yuboriladi (+ suhbat xotirasi)
```

Har modul alohida .md — birini o'zgartirish boshqasiga tegmaydi.

---

## 6. Yozish tartibi (etapma-etap)

Biznes assistenti quyidagi tartibda yozadi (har biri alohida fayl):

1. **4_Tahlil/chatlar_tahlili.md** — asos (tayyor, ko'chiriladi)
2. **01_PERSONA.md** — kim va qanday gapiradi
3. **02_ETAPLAR.md** — sotuv oqimi
4. **03_ETIROZLAR.md** — e'tirozlar
5. **04_NASIYA.md** — nasiya qoidasi
6. **05_FOLLOW_UP.md** — follow-up
7. **06_ESKALATSIYA.md** — tasdiqlash guruhi
8. **07_GUARDRAILS.md** — qattiq qoidalar
9. **08_OVOZ_RASM.md** — audio/rasm
10. **2_Bilim_Bazasi/configurator_haqida.md** — config integratsiyasi
11. **09_SYSTEM_PROMPT.md** — hammasini yig'ish
12. **3_Dasturchi_Texnik/texnik_TZ.md** — dasturchiga topshiriq

---

## 7. Kim nima qiladi

- **Biznes assistenti (Claude/Cowork):** 1_Miya papkasidagi hamma modul + texnik TZ.
- **Dasturchi:** 3_Dasturchi_Texnik/texnik_TZ.md bo'yicha infratuzilmani quradi.
- **Rahbar/operator:** boshida javoblarni tasdiqlaydi (trial), keyin avtomatga o'tadi.

---

## 8. Muhim tamoyillar (butun loyihaga)

1. **Grounding** — narx/spec/config faqat prices.md dan; AI to'qimaydi.
2. **AI yopmaydi** — yopilish arafasida tasdiqlash guruhiga (kodda majburiy).
3. **Chegirma yo'q** — kerak bo'lsa admin beradi.
4. **Human-in-the-loop** — boshida operator tasdig'i.
5. **Tabiiy va xavfsiz** — real tezlik, kunlik limit (blok bo'lmasin).

---

*Versiya 1.0 · Texno Optom · 2026*
