-- Cheksiz aylanishni aniqlash uchun hisoblagich.
ALTER TABLE public.telegram_conversations
  ADD COLUMN IF NOT EXISTS stuck_counter SMALLINT NOT NULL DEFAULT 0;
