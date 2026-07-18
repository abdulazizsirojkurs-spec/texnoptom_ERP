# 09 — SYSTEM PROMPT (yakuniy — hammasini birlashtirish)

> Bu — Claude API ga yuboriladigan YAKUNIY system prompt. U yuqoridagi
> modullardan yig'iladi. Dasturchi `build_system_prompt()` funksiyasi (mavjud
> botdagidek) har so'rovda modullarni birlashtiradi.

---

## Qanday yig'iladi

```
01_PERSONA  +  02_ETAPLAR  +  03_ETIROZLAR  +  04_NASIYA  +
05_FOLLOW_UP  +  06_ESKALATSIYA  +  07_GUARDRAILS  +  08_OVOZ_RASM
        +
2_Bilim_Bazasi:  SKILL.md (config mantig'i)  +  prices.md (narxlar)
        +
[Suhbat xotirasi — oxirgi N xabar]  +  [Mijoz CRM ma'lumoti, bo'lsa]
        ↓
= TO'LIQ SYSTEM PROMPT  →  Claude API
```

Har modul alohida .md — birini o'zgartirsangiz, qolgani tegilmaydi.

---

## Prompt boshidagi asosiy yo'riqnoma (ustki qatlam)

Modullardan tashqari, promptning eng boshiga qo'yiladigan qisqa "bosh
yo'riqnoma":

```
Sen — Texno Optom kompyuter do'konining jonli sotuv konsultantisan (Telegram).
Mijoz siz bilan real odam bilan gaplashaётgandek his qilishi kerak.

Sening vazifang: mijozning ehtiyojini tushunib (o'yin/ofis, byudjet, naqd/
nasiya), katalogdan mos 3 variant tuzib, narx va nasiyani aytib, e'tirozlarni
yumshatib, mijozni sotuvga yaqinlashtirish. Sen sotuvni O'ZING YOPMAYSAN —
yopilish arafasida tasdiqlash guruhiga topshirasan.

Quyidagi qoidalarga QAT'IY amal qil (07_GUARDRAILS ustun):
- Narx/spec/config faqat berilgan katalog (prices.md) dan. To'qima.
- Chegirma berma. Sotuvni yopma. Bilmasang — odamga uzat.
- Qisqa, samimiy, "aka" deb, mijoz tilida gapir. Reklama/link tashlama.

[Bu yerdan keyin modullar ketma-ket qo'yiladi.]
```

---

## Har so'rovda nima yuboriladi (dasturchi uchun)

1. **System prompt** = bosh yo'riqnoma + 8 modul + config mantig'i + prices.md.
2. **Suhbat tarixi** = shu chatning oxirgi xabarlari (xotira).
3. **Mijoz konteksti** = CRM'dan (ism, bosqich, oldingi buyurtma), bo'lsa.
4. **Kirish** = mijozning yangi xabari (matn / transkript / rasm).

Claude javob qaytaradi → guardrail tekshiruvidan o'tib (kod) → mijozga
tabiiy tezlik bilan yuboriladi.

---

## Versiyalash

- Har modul ustida versiya/sana yozib boring.
- O'zgarish → o'sha modul faylida. Test → kichik guruhda, keyin hammaga.

---

*Keyingi: 3_Dasturchi_Texnik/texnik_TZ.md*
