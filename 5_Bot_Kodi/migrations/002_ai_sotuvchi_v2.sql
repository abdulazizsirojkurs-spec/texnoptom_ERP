-- AI Sotuvchi v2 (to'liq 9-modulli tizim) uchun qo'shimcha sxema.
-- Mavjud telegram_conversations / telegram_messages jadvallari ustiga.

ALTER TABLE public.telegram_conversations
  ADD COLUMN IF NOT EXISTS ai_muted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS followup_stage SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_customer_message_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_ai_message_at TIMESTAMPTZ;

-- Kunlik xavfsizlik limiti (yangi suhbat / follow-up soni).
CREATE TABLE IF NOT EXISTS public.ai_daily_usage (
  day DATE PRIMARY KEY,
  new_conversations INTEGER NOT NULL DEFAULT 0,
  followups_sent INTEGER NOT NULL DEFAULT 0
);

-- Kill switch — operator guruhida "STOP"/"START" bilan boshqariladi.
CREATE TABLE IF NOT EXISTS public.bot_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  paused BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.bot_settings (id, paused) VALUES (1, false)
  ON CONFLICT (id) DO NOTHING;
