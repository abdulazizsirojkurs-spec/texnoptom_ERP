-- Telegram AI Sotuvchi (Faza 1) — suhbat holati va xabarlar tarixi.
-- Server (texnoserver, telegram-ai-seller.js) shu jadvallarni o'qiydi/yozadi.

CREATE TABLE IF NOT EXISTS public.telegram_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL UNIQUE,
  telegram_username TEXT,
  telegram_first_name TEXT,
  phone TEXT,
  krayin_lead_id INTEGER,
  status TEXT NOT NULL DEFAULT 'active', -- active | handed_off | closed
  handoff_reason TEXT, -- masalan: 'narx-savdolashuv', 'shikoyat', 'nomalum', 'ish_vaqtidan_tashqari'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.telegram_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.telegram_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL, -- 'in' (mijozdan) | 'out' (bizdan)
  text TEXT NOT NULL,
  is_ai_draft BOOLEAN NOT NULL DEFAULT false, -- true = trial rejimda hali tasdiqlanmagan AI javobi
  approved_by TEXT, -- operator ismi/telegram_id, tasdiqlagan bo'lsa
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_messages_conversation ON public.telegram_messages(conversation_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_telegram_conversations_status ON public.telegram_conversations(status);

CREATE OR REPLACE FUNCTION public.touch_telegram_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_telegram_conversations_updated ON public.telegram_conversations;
CREATE TRIGGER trg_telegram_conversations_updated
  BEFORE UPDATE ON public.telegram_conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_telegram_conversation_updated_at();
