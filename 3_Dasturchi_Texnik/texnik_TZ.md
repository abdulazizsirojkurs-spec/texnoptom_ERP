# Dasturchi uchun texnik topshiriq (TZ) — AI sotuvchi infratuzilmasi

> "Miya" (System Prompt) tayyor. Bu — uni 24/7 ishlatadigan "tana"ni qurish
> uchun dasturchiga topshiriq. Stack: Claude API + Telegram userbot + n8n/
> backend + ERP katalog + Krayin CRM + tasdiqlash guruhi.

---

## 0. Umumiy oqim

```
Mijoz Telegram -> Userbot (admin akkaunt, MTProto) -> Backend/n8n ->
Claude API (system prompt + xotira + katalog + CRM) -> Javob ->
tabiiy tezlik bilan yuborish -> yopilish arafasi -> tasdiqlash guruhi
```

---

## 1. Telegram userbot (MTProto)
- Admin akkauntga ulanish (Telethon yoki Pyrogram — bot API EMAS, userbot).
- Kirayotgan xabarni olish, javob yuborish.
- **Tabiiy tezlik:** xabar kelgach 3–4s kutib "o'qildi" (read), keyin "yozяпti"
  (typing), 5–7s da javob. Har safar ozgina tasodifiy (patternga tushmaslik).
- Read/typing indikatorlarini boshqarish.

## 2. Claude API integratsiyasi
- Har so'rovda: system prompt (modullar + config + prices.md) + suhbat xotirasi
  + CRM konteksti + mijoz xabari → Claude → javob.
- Rasm bo'lsa — Claude vision (rasmni yuklab qo'shish).

## 3. Xotira / holat bazasi (DB)
- Har chat: suhbat tarixi, oxirgi xabar vaqti, kim oxirgi yozdi, follow-up
  bosqichi (0–3), status (AI / odam / yopilgan), CRM link.

## 4. Katalog + hisob toollari (KODда — LLM emas!)
- prices.md (yoki ERP katalog) → Claude bilim bazasiga.
- **`hisobla` tool** (mavjud bot.py dagidek) — config narxi = tannarx + marja.
- **`nasiya_hisobla` tool** (YANGI) — oylik to'lov:
  `narx_som = usd × KURS; oylik_12 = narx_som×1.46/12; oylik_6 = narx_som×1.32/6`
  (1000 ga yaxlit). Foizlar va KURS — prices.md dan (tahrirlanadi).
- **Muhim:** narx va nasiya hisobini Claude EMAS, shu toollar qiladi
  (arifmetika xatosini oldini oladi). AI faqat natijani gapiradi.

## 5. Krayin CRM ulanishi
- Mijoz telefonni bergач — CRM'da telefon bo'yicha lid qidirish/ochish,
  bosqichni yangilash.

## 6. Tasdiqlash guruhi + AI muted
- Sotuv signali / eskalatsiya → maxsus Telegram guruhga xulosa (06_ESKALATSIYA
  formati).
- O'sha chatда AI'ni **muted** qilish (odam ushladi). Admin qaytara oladi.

## 7. Follow-up scheduler
- Cron (~har 20–30 daq): javobsiz, ochiq, odam ushlamagan chatlarni topib,
  05_FOLLOW_UP vaqtlariga ko'ra Claude'ga follow-up yozdirish.
- Mijoz javob bersa — sequence to'xtaydi.

## 8. Ovoz
- Telegram Premium transkript (transcribeAudio) → matn → Claude.
- Noaniq bo'lsa — AI "yozib bering" (08_OVOZ_RASM).

## 9. Rasm
- Rasmni yuklab Claude vision'ga. To'lov skrini → eskalatsiya signali.

## 10. Xavfsizlik
- Kunlik limit (yangi suhbat / follow-up soni).
- Faqat mavjud chatlarga (cold ommaviy yo'q).
- Log (har xabar/javob), monitoring (akkaunt limit/blok signali).
- **Kill switch** — admin AI ni bir tugma bilan to'xtatadi.

## 11. Admin nazorati
- Yoqish/o'chirish, chatni qo'lga olish (muted), loglarni ko'rish.
- **Trial rejim:** boshida AI javobini operator tasdiqlab yuboradi.

---

## Qattiq qoidalar — KODда majburiy (promptga ishonmang)

Bular AI xohlasa ham bajarilmasin (07_GUARDRAILS):
- AI sotuvni yopmaydi (signal → majburiy eskalatsiya).
- Chegirma bermaydi.
- Odam ushlagan chatда AI muted.
- Tabiiy tezlik + kunlik limit.
- Ichki ma'lumot (marja, 2%, tannarx) mijozga chiqmaydi.

---

## Bosqichlar (joriy etish)

1. **Faza 1:** userbot + Claude + katalog + xotira → inbound javob (trial: operator tasdig'i).
2. **Faza 2:** CRM ulanishi + tasdiqlash guruhi + eskalatsiya.
3. **Faza 3:** follow-up scheduler + ovoz/rasm.
4. **Faza 4:** to'liq avtomat + xavfsizlik/monitoring + reactivation.
