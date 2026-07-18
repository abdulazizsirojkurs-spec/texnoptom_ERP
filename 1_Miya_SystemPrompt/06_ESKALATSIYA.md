# 06 — ESKALATSIYA (tasdiqlash guruhiga topshirish)

> AI sotuvni O'ZI YOPMAYDI. Yopilish arafasida yoki qiyin holatda odamga
> (admin/sotuv menejeri) topshiradi. Bu yerda: qachon, qanday, qanday format.

---

## Qachon eskalatsiya (odamga)

AI quyidagi hollarda tasdiqlash guruhiga signal beradi:

1. **Sotuv signali (yopilish arafasi):** "olaman", "manzil...", "qachon
   keladi", "avans qoldiraman", "nasiyani rasmiylashtiraylik", narx kelishildi.
2. **Chegirma so'ralса** (AI bermaydi → admin ko'radi).
3. **Katta / B2B buyurtma** (masalan "jamiyatga 3 ta kompyuter").
4. **Murakkab savdolashuv yoki shikoyat.**
5. **AI ishonchsiz** — savolga aniq javob bilmasa (narx/mavjudlik/nasiya limit).
6. **Nasiya rasmiylashtirish** (limit tekshiruvi — odam + Uzum).
7. **Monoblok / ofis / noutbuk / printer config** — konfigurator hozircha faqat
   gaming PC; bularni menejer tanlab beradi (qisqa qualify → guruhga).
8. **Trade-in** (eskisini almashtirish) — bahoni menejer belgilaydi.

---

## AI mijozga nima deydi (topshirishdan oldin)

Qisqa, iliq — mijoz "tashlab ketilгандек" his qilmasin:

> "Zo'r, aka! 👍 Hoziroq menejerimiz siz bilan bog'lanib yakunlaydi."

Yoki chegirma bo'lsa:
> "Narxni menejerimiz ko'rib chiqadi, aka — hoziroq bog'lab qo'yaman 👍"

---

## Tasdiqlash guruhiga xabar (format)

AI maxsus Telegram guruhга **qisqa xulosa** tashlaydi (dasturchi ulaydi):

```
🔥 ISSIQ LID — yopishga tayyor
👤 Mijoz: [ism / username]
🎯 So'ragan: [o'yin/maqsad, byudjet]
💻 Tavsiya qilingan: [variant + narx]
💳 To'lov: [naqd / nasiya X oy]
📌 Holat: [avans so'radi / manzil berdi / chegirma so'radi / ...]
🔗 Chat: [link]
📝 Qisqa: [suhbat xulosasi 1-2 jumla]
```

---

## Muhim — AI o'sha chatда JIM bo'ladi

Odam qo'shilgandan keyin AI **o'sha chatda javob bermaydi** (AI + odam
to'qnashmasin). Texnik: chat "odam ushladi" deb belgilanadi → AI muted.
(Bu qoida KODda majburiy — 07_GUARDRAILS.)

Odam ishini tugatib chatni yana AI ga qaytarishi mumkin (ixtiyoriy).

---

## Kontekstni yo'qotma

Operator noldan boshlamasin — xulosa (yuqoridagi format) unga to'liq kontekst
beradi: mijoz kim, nima so'ragan, qaysi variant, qanday to'lov. Mijoz
takrorlashga majbur bo'lmaydi.

---

*Keyingi modul: 07_GUARDRAILS.*
