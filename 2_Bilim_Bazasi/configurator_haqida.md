# Bilim bazasi — Konfigurator integratsiyasi

> AI sotuvchi config va narxni O'ZI TO'QIMAYDI — mavjud konfigurator tizimidan
> oladi. Bu yerda: u nima, qanday ulanadi.

---

## Mavjud tizim (allaqachon qurilgan)

Papka: `texno-optom-bot/` (Xarakteristika hisoblash web sayt loyihasi ichida)

| Fayl | Vazifasi |
|---|---|
| **SKILL.md** | Konfigurator mantig'i: halollik qoidalari, 3 variant (Arzon/O'rtacha⭐/Kuchli), moslik (socket/DDR/quvvat), chiqish formati, uslub |
| **prices.md** | Narxlar (tannarx) + global sozlamalar: marja $90, kurs 12600, Windows kirgan. **Yagona haqiqat manbai.** |
| **bot.py** | `hisobla` tool — prices.md dan aniq narx + marja = yakuniy narx |

**Kuchi:** narx/spec **o'ylab topilmaydi** — hammasi prices.md dan, `hisobla`
tool orqali. Bu AI sotuvchining eng katta xavfini (hallucination) yopadi.

---

## AI sotuvchiga qanday ulanadi

AI sotuvchi 3-ETAP (config) ga yetganda — **shu tizimni chaqiradi:**

```
Mijoz: byudjet + o'yin  (2-ETAP: qualify)
      ↓
Konfigurator mantig'i (SKILL.md) + prices.md + hisobla tool
      ↓
3 ta variant (to'liq spec + aniq narx + kafolat bloki)
      ↓
AI mijozga yuboradi (o'z ohangida)
```

**Ikki texnik yo'l** (dasturchi tanlaydi):

1. **Modul sifatida:** SKILL.md mantig'i + prices.md AI sotuvchining system
   promptiga qo'shiladi, `hisobla` tool ulanadi. (Mavjud botdagidek —
   `build_system_prompt()`.)
2. **Tool/sub-agent sifatida:** AI sotuvchi kerak bo'lganda konfiguratorni
   alohida chaqiradi (byudjet+o'yin beradi, 3 variant oladi).

Ikkalasida ham natija bir xil — grounding saqlanadi.

---

## Muhim qoidalar (o'zgarmaydi)

- Config/narx **faqat shu tizimdan.** AI qo'lda narx qo'shmaydi.
- **Omborda bor-yo'q — muhim emas.** Katalogdagi hammasini tavsiya qiladi
  (onlayn/buyurtma asosida ishlaymiz).
- Narx o'zgarsa → **prices.md**, config mantig'i o'zgarsa → **SKILL.md**.
  Kod/prompt tegilmaydi.
- **NASIYA** shu tizimda yo'q — u alohida (04_NASIYA). Config yakuniy narxini
  so'mga o'girib, nasiya formulasi qo'llanadi.

---

## Qamrov (scope) — hozircha faqat gaming PC

Konfigurator hozircha **gaming PC** ni qamraydi. **Monoblok, ofis kompyuter,
noutbuk, printer** uchun config AI tuzmaydi — bu so'rovlarni **menejerga**
uzatadi (06_ESKALATSIYA):

> "Aka, monoblok/ofis bo'yicha menejerimiz eng mos variantni tanlab beradi —
> hoziroq bog'lab qo'yaman 👍"

AI qisqa qualify qiladi (nima ishga, byudjet) va tasdiqlash guruhiga xulosa
tashlaydi. **Keyinroq** konfiguratorga monoblok/ofis ham qo'shiladi — o'shanда
bu qoida o'zgaradi.

(Aksessuar/monitor alohida so'ralса — narx prices.md da bo'lsa aytadi,
bo'lmasa menejerga.)

---

## Eslatma

Bu papkaga `SKILL.md` va `prices.md` ning nusxasini qo'yish yoki mavjud
`texno-optom-bot/` ga ishora qilish mumkin. Muhimi — **bitta manba** bo'lsin
(ikki joyda ikki xil narx bo'lmasin). prices.md ni rahbar dolzarb tutadi
(narx o'zgarsa darrov yangilaydi).
