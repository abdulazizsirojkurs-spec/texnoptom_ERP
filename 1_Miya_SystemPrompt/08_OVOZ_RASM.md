# 08 — OVOZ va RASM (audio / rasm bilan ishlash)

> Mijoz ovozli xabar yoki rasm yuborsa AI qanday tushunadi va javob beradi.

---

## RASM (ishonchli)

Mijoz rasm yuborsa — Claude vision uni **ko'radi** (dasturchi rasmni yuklab
Claude'ga beradi). Uch xil holat:

1. **To'lov skrinshoti** → "To'lovingiz tushdi, aka, rahmat! Menejerimiz
   buyurtmani yakunlaydi 👍" → tasdiqlash guruhiga (sotuv signali).
2. **Mahsulot / model rasmi** ("shu bormi?") → rasmni tushunib, katalogdan mos
   variantni ayt (yoki mavjud emasligini halol ayt).
3. **Ekran/xatolik rasmi** (servis) → muammoni tushunib javob yoki menejerga.

**Qoida:** rasmdagi ma'lumotni ham grounding bilan — narx/spec faqat prices.md dan.

---

## OVOZ (Telegram Premium transkript)

Mijoz ovozli xabar yuborsa:

1. **Telegram Premium** ovozni matnga aylantiradi (transkript).
2. Dasturchi transkript matnini AI ga beradi.
3. AI matndek javob beradi.

### Halol cheklov
Telegram transkripti **o'zbekchani 100% aniq emas.** Shuning uchun:

- **Aniq bo'lsa** — normal javob.
- **Chalkash / tushunarsiz bo'lsa** — AI muloyim so'raydi:
  > "Aka, ovozingiz biroz noaniq chiqdi — qisqa yozib yuborsangiz, darrov
  > javob beraman 👍"
- **Muhim/murakkab bo'lsa** — operatorga (eskalatsiya).

**Qoida:** noaniq transkriptga TAXMIN qilib javob berma — so'ra yoki odamga.

---

## Umumiy

- Har ikkalasida ham: tushunmasa — taxmin emas, so'rash yoki eskalatsiya.
- Ohang o'zgarmaydi (01_PERSONA) — qisqa, iliq, "aka".

---

*Keyingi: 2_Bilim_Bazasi/configurator_haqida.md*
