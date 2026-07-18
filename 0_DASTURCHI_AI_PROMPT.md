# Dasturchi AI'siga topshiriq (prompt)

> Bu matnni dasturchingizning AI'siga (Claude Code / Cursor / boshqa) bering.
> U "Texno Optom Kompaniyam" papkasiga kirisha oladi.

---

## PROMPT (nusxa ko'chiring)

```
Sen — Texno Optom uchun Telegram AI SOTUVCHI tizimini quradigan senior
dasturchisan. Loyihaning hamma hujjatlari "Texno Optom Kompaniyam/AI Sotuvchi/"
papkasida. Avval shu fayllarni O'QIB CHIQ, keyin qur.

VAZIFANG: AI sotuvchining INFRATUZILMASINI (kod) qurish. "Miya" (system prompt)
tayyor — sen uni ishlatadigan tizimni yozasan.

═══════════════════════════════════════════
1-QADAM: FAYLLARNI O'QI (shu tartibda)
═══════════════════════════════════════════
1. AI Sotuvchi/0_BOSHLASH_va_TOPSHIRIQ.md   — umumiy tartib
2. AI Sotuvchi/00_ROADMAP.md                — arxitektura
3. AI Sotuvchi/3_Dasturchi_Texnik/texnik_TZ.md  — ASOSIY TEXNIK TOPSHIRIQ (11 band)
4. AI Sotuvchi/1_Miya_SystemPrompt/*.md     — 9 modul (AI xulqi, system prompt)
5. AI Sotuvchi/2_Bilim_Bazasi/configurator_haqida.md + FAQ.md
6. AI Sotuvchi/2_Bilim_Bazasi/configurator_fayllari/  — SKILL.md, prices.md, bot.py
   (mavjud config bot — narx/xarakteristika mantig'i)
7. AI Sotuvchi/4_Tahlil/chatlar_tahlili.md  — kontekst (577 chat)

═══════════════════════════════════════════
2-QADAM: NIMA QURASAN (texnik_TZ.md bo'yicha)
═══════════════════════════════════════════
STACK: Claude API + Telegram userbot (MTProto: Telethon/Pyrogram) + backend/n8n
       + prices.md katalog + Krayin CRM + tasdiqlash guruhi (Telegram).

- Userbot: admin akkauntga ulanib, kirayotgan xabar → javob. TABIIY TEZLIK:
  xabar kelgach 3-4s "o'qildi", keyin typing, 5-7s da javob (ozgina tasodifiy).
- build_system_prompt(): 1_Miya_SystemPrompt modullarini + 2_Bilim_Bazasi
  (SKILL.md config + prices.md + FAQ) ni birlashtirib, har so'rovda Claude'ga
  yuboriladigan to'liq system prompt yasaydi (mavjud bot.py dagidek).
- Xotira/state DB: har chat — tarix, oxirgi vaqt, follow-up bosqichi, status.
- Tool'lar (KODda, LLM EMAS):
    * hisobla(komponentlar) → config narxi (tannarx + marja). Mavjud bot.py da.
    * nasiya_hisobla(narx_usd) → oylik to'lov:
        narx_som = usd × KURS
        oylik_12 = round(narx_som × 1.46 / 12)   (46%, 12 oy)
        oylik_6  = round(narx_som × 1.32 / 6)     (32%, 6 oy)  → 1000 ga yaxlit
        (KURS va foizlar prices.md global sozlamalaridan)
- Krayin CRM: telefon bo'yicha lid ochish/yangilash.
- Tasdiqlash guruhi: sotuv signali/eskalatsiya → guruhga xulosa (06_ESKALATSIYA
  formati) + o'sha chatda AI'ni MUTED qilish (odam ushladi).
- Follow-up scheduler: cron → javobsiz chatlarga 05_FOLLOW_UP vaqtlarida
  Claude follow-up yozdiradi. Mijoz javob bersa — to'xtaydi.
- Ovoz: Telegram Premium transkript → matn → Claude. Rasm: Claude vision.

═══════════════════════════════════════════
3-QADAM: QATTIQ QOIDALAR — KODDA MAJBURLA (07_GUARDRAILS)
═══════════════════════════════════════════
Bularni faqat promptga ishonma — KODda majbur qil (AI xohlasa ham qila olmasin):
- AI SOTUVNI YOPMAYDI — sotuv signali → majburiy eskalatsiya + chat muted.
- CHEGIRMA YO'Q — so'ralsa menejerga.
- Odam ushlagan chatda AI JIM.
- Narx/nasiya — faqat hisobla/nasiya_hisobla tool (Claude arifmetika qilmaydi).
- MONOBLOK/OFIS/NOUTBUK/PRINTER config — konfigurator faqat gaming PC;
  bularni menejerga uzat.
- Tabiiy tezlik + kunlik limit (bloklanmaslik). Kill switch (admin to'xtatadi).
- Ichki ma'lumot (marja, 2% nasiya, tannarx, kurs) mijozga chiqmaydi.

═══════════════════════════════════════════
4-QADAM: BOSQICHLAR
═══════════════════════════════════════════
Faza 1: userbot + Claude + katalog + xotira → inbound javob (trial: operator
        tasdig'i bilan).
Faza 2: Krayin CRM + tasdiqlash guruhi + eskalatsiya.
Faza 3: follow-up scheduler + ovoz + rasm.
Faza 4: to'liq avtomat + xavfsizlik/monitoring.

═══════════════════════════════════════════
MUHIM
═══════════════════════════════════════════
- prices.md — YAGONA narx manbai. Rahbar tahrirlaydi; kod uni HAR so'rovda
  qayta o'qisin (qayta ishga tushirmasdan yangilansin).
- Kodlashdan oldin: agar biror narsa noaniq bo'lsa — MENGA SAVOL BER, taxmin
  qilma. Avval qisqa reja (arxitektura, fayl tuzilishi, DB sxema) taklif qil,
  tasdiqlagach kod yoz.
- Til: kod izohlarini o'zbek yoki ingliz; mijozga chiqadigan matn — o'zbekcha.
```

---

## Eslatma (siz uchun)

- Dasturchi AI'si prices.md ni ikki joyda ko'rishi mumkin (asl bot papkasida va
  bu yerda nusxa). **Bittasini asosiy (canonical)** qilib belgilang — chalkashmasin.
- Kod tayyor bo'lgach: **577 chatda test** + **trial (operator tasdig'i)** —
  keyin avtomatga.
