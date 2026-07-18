"""
Texno Optom — Build Konfigurator Telegram bot
==============================================

Operator botga byudjet va o'yin yozadi -> bot Claude (Anthropic API) ga
SKILL.md (mantiq) + prices.md (narxlar) ni yuboradi -> mijozga tayyor
xabar qaytaradi.

Muhim narsalar:
- SKILL.md va prices.md HAR SO'ROVDA qaytadan o'qiladi. Ya'ni narxni
  o'zgartirsangiz, botni qayta ishga tushirish shart emas — keyingi
  so'rovda yangi narx ishlatiladi.
- Suhbat konteksti saqlanadi (bot "monitor kiradimi?" desa, keyingi
  javobingiz oldingi xabar bilan bog'lanadi).
- Faqat ruxsat berilgan operatorlar ishlata oladi (.env dagi ID ro'yxati).

Sozlamalar .env faylida (bu fayl yonida). bot.py ga tegish shart emas.
"""

import os
import re
import json
import logging
from pathlib import Path

from dotenv import load_dotenv
from anthropic import Anthropic
from telegram import Update
from telegram.constants import ChatAction
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

# ---------------------------------------------------------------------------
# 1. Sozlamalarni .env faylidan o'qish
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "").strip()
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
# Model. Sonnet — narx/sifat jihatidan mos. Xohlasangiz .env da o'zgartiring.
MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5").strip()
# Sonnet/Opus "adaptive thinking" ni qo'llaydi — bu byudjet hisobini aniqroq
# qiladi. Haiku qo'llamaydi, shuning uchun shartli yoqamiz.
USE_THINKING = ("sonnet" in MODEL.lower()) or ("opus" in MODEL.lower())

# Ruxsat berilgan operatorlar (Telegram user ID lar), vergul bilan ajratilgan.
# Masalan: ALLOWED_USER_IDS=123456789,987654321
_allowed_raw = os.getenv("ALLOWED_USER_IDS", "").strip()
ALLOWED_USER_IDS = {
    int(x) for x in _allowed_raw.replace(" ", "").split(",") if x.isdigit()
}

# Suhbat tarixining maksimal uzunligi (juda uzayib ketmasligi uchun).
MAX_HISTORY_MESSAGES = 20

# Fayllar
SKILL_FILE = BASE_DIR / "SKILL.md"
PRICES_FILE = BASE_DIR / "prices.md"

# Telegram bitta xabar limiti
TELEGRAM_MSG_LIMIT = 4096

# ---------------------------------------------------------------------------
# 2. Log (nima bo'layotganini terminal/faylda ko'rish uchun)
# ---------------------------------------------------------------------------
logging.basicConfig(
    format="%(asctime)s  %(levelname)s  %(message)s",
    level=logging.INFO,
)
log = logging.getLogger("texno-optom-bot")

# ---------------------------------------------------------------------------
# 3. Boshlang'ich tekshiruvlar
# ---------------------------------------------------------------------------
if not TELEGRAM_TOKEN:
    raise SystemExit("XATO: .env faylida TELEGRAM_TOKEN yo'q.")
if not ANTHROPIC_API_KEY:
    raise SystemExit("XATO: .env faylida ANTHROPIC_API_KEY yo'q.")

client = Anthropic(api_key=ANTHROPIC_API_KEY)

# Har bir operator uchun suhbat tarixi: {chat_id: [ {role, content}, ... ]}
conversations: dict[int, list[dict]] = {}


# ---------------------------------------------------------------------------
# 4. Yordamchi funksiyalar
# ---------------------------------------------------------------------------
def build_system_prompt() -> str:
    """SKILL.md (mantiq) + prices.md (narxlar) ni birlashtirib system prompt qiladi.

    Har so'rovda qaytadan o'qiydi — shuning uchun narx o'zgarsa botni
    qayta ishga tushirish shart emas.
    """
    skill = SKILL_FILE.read_text(encoding="utf-8")
    prices = PRICES_FILE.read_text(encoding="utf-8")
    return (
        f"{skill}\n\n"
        f"=================== NARXLAR RO'YXATI (prices.md) ===================\n\n"
        f"{prices}\n"
        f"===================================================================\n\n"
        "Yuqoridagi ko'rsatmalar va narxlar ro'yxatiga QAT'IY amal qil. "
        "Operator xabariga yuqoridagi skill qoidalari bo'yicha javob ber. "
        "Javobing mijozga to'g'ridan-to'g'ri yuboriladigan tayyor xabar bo'lsin."
    )


# ---------------------------------------------------------------------------
#  NARX HISOBLASH — kod hisoblaydi, model emas (100% aniqlik uchun)
# ---------------------------------------------------------------------------
def parse_prices(md_text: str) -> tuple[dict, int]:
    """prices.md dagi jadvallardan {nom: narx} lug'atini va marjani o'qiydi."""
    prices: dict[str, float] = {}
    margin = 90
    m = re.search(r"MARJA[^:]*:\s*(\d+)", md_text)
    if m:
        margin = int(m.group(1))
    for line in md_text.splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 2:
            continue
        name, price = cells[0], cells[1]
        if name.lower() in ("nomi",) or set(price) <= set("-"):
            continue  # sarlavha yoki ajratuvchi qator
        if name.startswith("("):
            continue  # namuna qatorlar
        try:
            prices[name] = float(price)
        except ValueError:
            continue
    return prices, margin


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip().lower())


def run_hisobla(variantlar: dict, prices: dict, margin: int) -> dict:
    """Har bir variant uchun aniq narxni hisoblaydi (tannarx + marja).

    Nom prices.md da bo'lmasa — "topilmagan" ga qo'shiladi va yakuniy narx
    berilmaydi (model nomni to'g'rilashi kerak).
    """
    lookup = {_norm(k): (k, v) for k, v in prices.items()}
    result = {}
    for vname, comps in variantlar.items():
        items, total, notfound = [], 0.0, []
        for c in comps:
            hit = lookup.get(_norm(c))
            if hit:
                items.append({"nom": hit[0], "narx": hit[1]})
                total += hit[1]
            else:
                notfound.append(c)
        result[vname] = {
            "komponentlar": items,
            "topilmagan": notfound,
            "tannarx_jami": round(total, 2),
            "marja": margin,
            "yakuniy_narx": round(total + margin, 2) if not notfound else None,
        }
    return result


# Model chaqiradigan tool (funksiya) ta'rifi
HISOBLA_TOOL = {
    "name": "hisobla",
    "description": (
        "Yig'ilma variantlari uchun ANIQ narxni hisoblaydi. Har variant "
        "komponent nomlari ro'yxati sifatida beriladi. Narxlar prices.md dan "
        "olinadi, ustiga marja ($90) qo'shiladi. Narxni o'zing hisoblama — "
        "har doim shu toolni chaqir. Faqat prices.md dagi ANIQ nomlarni ishlat. "
        "Agar 'topilmagan' bo'sh bo'lmasa, o'sha nomni to'g'rilab qayta chaqir."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "variantlar": {
                "type": "object",
                "description": (
                    "Kalit = variant nomi (masalan Arzon/O'rtacha/Kuchli), "
                    "qiymat = shu variant komponentlari nomlari ro'yxati."
                ),
                "additionalProperties": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            }
        },
        "required": ["variantlar"],
    },
}


def is_allowed(user_id: int) -> bool:
    """Foydalanuvchi ruxsat ro'yxatidami?

    Agar ro'yxat bo'sh bo'lsa — hech kimga ruxsat berilmaydi (xavfsizlik uchun),
    lekin foydalanuvchiga o'z ID sini ko'rsatamiz, u sizga aytadi.
    """
    if not ALLOWED_USER_IDS:
        return False
    return user_id in ALLOWED_USER_IDS


async def send_long_message(update: Update, text: str) -> None:
    """Uzun javobni Telegram limitiga bo'lib yuboradi."""
    if len(text) <= TELEGRAM_MSG_LIMIT:
        await update.message.reply_text(text)
        return
    # Xatboshilar bo'yicha bo'lib, har bo'lakni limitdan kichik saqlaymiz
    chunk = ""
    for line in text.split("\n"):
        if len(chunk) + len(line) + 1 > TELEGRAM_MSG_LIMIT:
            await update.message.reply_text(chunk)
            chunk = ""
        chunk += line + "\n"
    if chunk.strip():
        await update.message.reply_text(chunk)


# ---------------------------------------------------------------------------
# 5. Buyruqlar: /start, /reset, /id
# ---------------------------------------------------------------------------
async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    if not is_allowed(user_id):
        await update.message.reply_text(
            "Kechirasiz, sizda botdan foydalanish ruxsati yo'q.\n\n"
            f"Sizning ID raqamingiz: {user_id}\n"
            "Ushbu raqamni administratorga yuboring — u sizni ro'yxatga qo'shadi."
        )
        return

    await update.message.reply_text(
        "Salom! Men Texno Optom build konfiguratorman.\n\n"
        "Menga mijozning byudjeti va o'yinini yozing — men 3 ta variantni "
        "mijozga yuboriladigan tayyor xabar ko'rinishida qaytaraman.\n\n"
        "Masalan:\n"
        "• 6 mln, CS2, monitorsiz\n"
        "• 600$ PUBG, monitor bilan\n"
        "• 8 million, o'yin uchun, keyin upgrade qilaman\n\n"
        "Agar biror narsa noaniq bo'lsa, men bitta savol beraman.\n\n"
        "Yangi mijozdan boshlash uchun: /reset"
    )


async def cmd_reset(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    if not is_allowed(user_id):
        return
    conversations.pop(update.effective_chat.id, None)
    await update.message.reply_text(
        "Tozalandi ✅ Yangi mijozdan boshlashingiz mumkin."
    )


async def cmd_id(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Foydalanuvchi o'z ID sini bilib olishi uchun (ro'yxatga qo'shish uchun kerak)."""
    await update.message.reply_text(
        f"Sizning Telegram ID raqamingiz: {update.effective_user.id}"
    )


# ---------------------------------------------------------------------------
# 6. Asosiy: matnli xabarga javob
# ---------------------------------------------------------------------------
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    chat_id = update.effective_chat.id

    if not is_allowed(user_id):
        await update.message.reply_text(
            "Sizda ruxsat yo'q.\n"
            f"Sizning ID: {user_id} — administratorga yuboring."
        )
        return

    user_text = update.message.text.strip()
    if not user_text:
        return

    # "Yozmoqda..." holatini ko'rsatamiz
    await context.bot.send_chat_action(chat_id=chat_id, action=ChatAction.TYPING)

    # Suhbat tarixiga qo'shamiz
    history = conversations.setdefault(chat_id, [])
    history.append({"role": "user", "content": user_text})

    # Tarix juda uzayib ketmasin
    if len(history) > MAX_HISTORY_MESSAGES:
        history[:] = history[-MAX_HISTORY_MESSAGES:]

    try:
        # Narxlar va system promptni har safar fayldan o'qiymiz (yangilanishi uchun).
        prices_text = PRICES_FILE.read_text(encoding="utf-8")
        prices, margin = parse_prices(prices_text)
        system_prompt = build_system_prompt()

        # Ishchi nusxa: suhbat tarixi + tool almashinuvi shu yerda kechadi.
        # Doimiy tarixga (history) faqat yakuniy javobni saqlaymiz.
        msgs = list(history)
        answer = ""

        # Tool-loop: model komponent tanlaydi -> kod narxni ANIQ hisoblaydi ->
        # model yakuniy xabarni yozadi. MAX_TOOL_ROUNDS marta narx hisoblashi
        # mumkin; oxirgi aylanishda toolni o'chiramiz — model majburan javob yozadi
        # (aks holda cheksiz hisoblab, javobsiz qolib ketishi mumkin edi).
        MAX_TOOL_ROUNDS = 3
        for i in range(MAX_TOOL_ROUNDS + 1):
            allow_tools = i < MAX_TOOL_ROUNDS  # oxirgi aylanishda tool yo'q
            # Oxirgi aylanishga o'tishdan oldin modelga aniq ko'rsatma beramiz:
            # boshqa hisoblama, eng yaqin variantlar bilan TAYYOR XABAR yoz.
            if not allow_tools and msgs and msgs[-1]["role"] == "user" \
                    and isinstance(msgs[-1]["content"], list):
                msgs.append({
                    "role": "user",
                    "content": (
                        "Yetarli hisoblading. Endi shu eng yaqin uch variant bilan "
                        "mijozga TAYYOR to'liq xabarni yoz (SKILL formatida: 3 variant, "
                        "narx, FPS, kafolat bloki, yakuniy savol). Boshqa hisoblama, "
                        "ichki fikringni yozma — faqat mijozga tayyor xabar."
                    ),
                })
            create_kwargs = dict(
                model=MODEL,
                max_tokens=8000 if USE_THINKING else 3000,
                system=[
                    {
                        "type": "text",
                        "text": system_prompt,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                messages=msgs,
            )
            if allow_tools:
                create_kwargs["tools"] = [HISOBLA_TOOL]
            if USE_THINKING:
                # adaptive thinking + past effort — aniqlik uchun, lekin tez
                create_kwargs["thinking"] = {"type": "adaptive"}
                create_kwargs["output_config"] = {"effort": "low"}
            response = client.messages.create(**create_kwargs)

            if allow_tools and response.stop_reason == "tool_use":
                # Model narx hisoblashni so'radi — bajarib, natijani qaytaramiz
                msgs.append({"role": "assistant", "content": response.content})
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use" and block.name == "hisobla":
                        out = run_hisobla(
                            block.input.get("variantlar", {}), prices, margin
                        )
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(out, ensure_ascii=False),
                        })
                msgs.append({"role": "user", "content": tool_results})
                continue

            # Yakuniy javob (matn)
            answer = "".join(
                b.text for b in response.content if b.type == "text"
            ).strip()
            break

        if not answer:
            answer = "Kechirasiz, javob tayyorlab bo'lmadi. Qaytadan urinib ko'ring."

        # Doimiy tarixga faqat yakuniy javobni qo'shamiz (kontekst uchun)
        history.append({"role": "assistant", "content": answer})

        await send_long_message(update, answer)

    except Exception as e:  # API xatosi bo'lsa jim qolmaymiz
        log.exception("Anthropic API xatosi")
        # Xato bo'lgan foydalanuvchi xabarini tarixdan olib tashlaymiz
        if history and history[-1]["role"] == "user":
            history.pop()
        await update.message.reply_text(
            "Xatolik yuz berdi 😕 Bir ozdan so'ng qaytadan urinib ko'ring.\n"
            f"(Texnik ma'lumot: {type(e).__name__})"
        )


# ---------------------------------------------------------------------------
# 7. Botni ishga tushirish
# ---------------------------------------------------------------------------
def main() -> None:
    app = Application.builder().token(TELEGRAM_TOKEN).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("reset", cmd_reset))
    app.add_handler(CommandHandler("id", cmd_id))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    if not ALLOWED_USER_IDS:
        log.warning(
            "DIQQAT: ALLOWED_USER_IDS bo'sh. Hozircha hech kim ishlata olmaydi. "
            "Botga /id yozib ID ni oling va .env ga qo'shing."
        )

    log.info("Bot ishga tushdi. Model: %s. Ruxsatli operatorlar: %s",
             MODEL, ALLOWED_USER_IDS or "(hali yo'q)")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
