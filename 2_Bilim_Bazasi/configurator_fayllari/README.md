# Texno Optom — Build Konfigurator Bot

Operator botga byudjet va o'yin yozadi → bot mijozga yuboriladigan tayyor
xabar (3 ta variant) qaytaradi. Narxlar `prices.md` da, mantiq `SKILL.md` da.

---

## Fayllar nima uchun

| Fayl | Vazifasi | Siz tegasizmi? |
|---|---|---|
| `prices.md` | **Narxlar ro'yxati** — komponentlar va tannarxlar | ✅ HA, tez-tez |
| `SKILL.md` | Botning "miyasi" — qoidalar, mantiq | ba'zan |
| `bot.py` | Telegram bot kodi | ❌ Yo'q |
| `.env` | Maxfiy sozlamalar (token, kalit) | ✅ bir marta |
| `requirements.txt` | Kerakli kutubxonalar ro'yxati | ❌ Yo'q |

> **Narx o'zgarganda:** faqat `prices.md` ni tahrirlang. Botni qayta ishga
> tushirish shart emas — keyingi so'rovda yangi narx ishlatiladi.
>
> **Marjani o'zgartirish:** `prices.md` boshidagi `MARJA (foyda): 90` raqamini
> o'zgartiring.

---

## 1-QADAM — Telegram bot tokenini olish

1. Telegramda **@BotFather** ni toping (ko'k belgili rasmiy bot).
2. `/newbot` deb yozing.
3. Botga nom bering (masalan: `Texno Optom Konfigurator`).
4. Username bering — `bot` bilan tugashi shart (masalan: `texnooptom_config_bot`).
5. BotFather sizga **token** beradi — shunga o'xshash uzun satr:
   `8123456789:AAH-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
6. Shu tokenni nusxalab oling — keyin kerak bo'ladi.

---

## 2-QADAM — Anthropic API kalitini olish

1. Brauzerda **console.anthropic.com** ga kiring, ro'yxatdan o'ting.
2. **Billing** bo'limiga o'ting va **balans to'ldiring** (kartadan, minimal $5).
   API pullik — quyida oylik taxminiy xarajat bor.
3. Chapdagi menyudan **API Keys** → **Create Key** bosing.
4. Kalitni nusxalang — `sk-ant-...` bilan boshlanadi.
   ⚠️ Kalit faqat bir marta ko'rsatiladi — darhol saqlang.

---

## 3-QADAM — Sozlamalarni kiritish (.env)

1. `.env.example` faylini nusxalab, nomini **`.env`** ga o'zgartiring.
2. Ichidagi qiymatlarni to'ldiring:
   ```
   TELEGRAM_TOKEN=1-qadamdagi_token
   ANTHROPIC_API_KEY=2-qadamdagi_kalit
   ALLOWED_USER_IDS=
   ANTHROPIC_MODEL=claude-sonnet-5
   ```
3. `ALLOWED_USER_IDS` ni hozircha bo'sh qoldiring — 5-qadamda to'ldiramiz.

---

## 4-QADAM — Botni ishga tushirish

### A variant — o'z kompyuteringizda (sinov uchun eng oson)

Kompyuterda **Python 3.10+** o'rnatilgan bo'lishi kerak
(python.org dan yuklab oling).

Terminal (macOS: Terminal, Windows: PowerShell) ochib, bot papkasiga o'ting:

```bash
cd "texno-optom-bot"        # papka joylashgan joyni ko'rsating
pip install -r requirements.txt
python bot.py
```

Terminalda `Bot ishga tushdi` chiqsa — tayyor. Bot faqat terminal ochiq
turganda ishlaydi.

### B variant — server (24/7 ishlashi uchun, tavsiya etiladi)

Bot doim ishlab turishi uchun arzon serverga qo'ying. Eng oson variantlar:

- **Railway.app** — oyiga ~$5, sozlash oson, GitHub bilan bog'lanadi.
- **Render.com** — "Background Worker" (start buyrug'i: `python bot.py`).
- **VPS** (masalan Hetzner ~€4/oy) — biroz texnikroq.

Umumiy tartib (Railway misolida):
1. Bu papkani GitHub ga yuklang (`.env` YUKLANMAYDI — `.gitignore` himoyalaydi).
2. Railway da yangi loyiha → GitHub repodan.
3. Railway sozlamalarida `.env` dagi o'zgaruvchilarni qo'shing
   (Variables bo'limi): `TELEGRAM_TOKEN`, `ANTHROPIC_API_KEY`,
   `ALLOWED_USER_IDS`, `ANTHROPIC_MODEL`.
4. Start buyrug'i: `python bot.py`.

---

## 5-QADAM — Operatorlarni ro'yxatga qo'shish

Bot ochiq bo'lmasligi kerak — faqat sizning operatorlaringiz ishlatsin.

1. Bot ishlab turganda, har bir operator botga **/id** deb yozsin.
2. Bot ularning ID raqamini qaytaradi (masalan `123456789`).
3. Shu raqamlarni `.env` dagi `ALLOWED_USER_IDS` ga vergul bilan yozing:
   ```
   ALLOWED_USER_IDS=123456789,987654321
   ```
4. Botni qayta ishga tushiring (server bo'lsa — Restart).

Endi faqat shu operatorlar botdan foydalana oladi.

---

## Botdan foydalanish

Operator botga oddiy yozadi:
- `6 mln, CS2, monitorsiz`
- `600$ PUBG, monitor bilan, 24 dyum`
- `8 million, o'yin uchun, keyin upgrade`

Bot 3 ta variantni tayyor xabar ko'rinishida qaytaradi — operator
ko'chirib mijozga yuboradi.

Buyruqlar:
- `/start` — yo'riqnoma
- `/reset` — yangi mijozdan boshlash (suhbatni tozalash)
- `/id` — o'z Telegram ID ni bilish

---

## Oylik xarajat (taxminiy)

Kuniga **50 so'rov** (oyiga ~1500) uchun taxminiy:

| Model (.env dagi) | Byudjet aniqligi | Tezlik | Oylik xarajat |
|---|---|---|---|
| **claude-sonnet-5** (hozirgi) | Aniq | ~30s | **~$250–350** |
| **claude-haiku-4-5-20251001** | Taxminiy | ~20s | **~$40–60** |

- Sonnet byudjetni aniq ushlaydi (mijoz $500 desa, variantlar $500 atrofida),
  lekin qimmatroq va sekinroq.
- Haiku arzon va tez, lekin byudjetni taxminiy ushlaydi — operator narxni
  biroz o'zi to'g'rilashi kerak bo'lishi mumkin.
- **Prompt caching** yoqilgan — takroriy so'rovlarda arzonlashadi, real
  xarajat quyi chegaraga yaqin bo'lishi mumkin.

Modelni almashtirish: `.env` da `ANTHROPIC_MODEL` ni o'zgartiring, botni qayta
ishga tushiring. Real sarfni **console.anthropic.com → Usage** da kuzatasiz.

> Maslahat: avval Sonnet bilan boshlang. Bir oy ishlatib, xarajat va operator
> ehtiyojini ko'ring — kerak bo'lsa Haiku ga o'tasiz.

---

## Muammolar

| Muammo | Yechim |
|---|---|
| `TELEGRAM_TOKEN yo'q` xatosi | `.env` faylini `.env.example` dan yaratganingizni tekshiring |
| Bot javob bermaydi | Operator ID `ALLOWED_USER_IDS` da bormi? Bot ishlab turibdimi? |
| `Xatolik yuz berdi` | Anthropic balansi tugagan bo'lishi mumkin — Billing ni tekshiring |
| Narx eski chiqyapti | `prices.md` saqlanganini tekshiring (server bo'lsa qayta deploy) |
