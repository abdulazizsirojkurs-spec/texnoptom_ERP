-- Catch-up mexanizmi uchun: har suhbatda so'nggi ko'rilgan Telegram xabar ID'si.
ALTER TABLE public.telegram_conversations
  ADD COLUMN IF NOT EXISTS last_telegram_msg_id BIGINT;
