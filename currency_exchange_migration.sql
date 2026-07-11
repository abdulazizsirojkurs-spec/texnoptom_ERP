-- Hisob-raqamlar orasida pul/valyuta almashish (masalan: so'm naqddan dollar sotib olish,
-- yoki kartadan naqdga o'tkazish). P&L'ga ta'sir qilmaydi (account_code = 99999, pnl_section = 'transfer').
-- Ikkala oyoq (leg) ham bitta RPC ichida yoziladi — yarim bajarilib qolish xavfi yo'q.
CREATE OR REPLACE FUNCTION public.exchange_currency(
  p_txn_date DATE,
  p_from_account UUID,
  p_to_account UUID,
  p_from_amount NUMERIC,
  p_to_amount NUMERIC,
  p_comment TEXT,
  p_created_by UUID
) RETURNS VOID AS $$
DECLARE
  v_from_currency TEXT;
  v_to_currency TEXT;
  v_from_rate NUMERIC := NULL;
  v_to_rate NUMERIC := NULL;
BEGIN
  IF p_from_account = p_to_account THEN
    RAISE EXCEPTION 'Bir xil hisobga almashtirib bo''lmaydi!';
  END IF;
  IF p_from_amount <= 0 OR p_to_amount <= 0 THEN
    RAISE EXCEPTION 'Summalar musbat bo''lishi kerak!';
  END IF;

  SELECT currency INTO v_from_currency FROM public.cash_accounts WHERE id = p_from_account;
  SELECT currency INTO v_to_currency FROM public.cash_accounts WHERE id = p_to_account;

  -- Valyutasi UZS bo'lmagan oyoq uchun UZS-ekvivalent kursini ikkinchi oyoqdan chiqarib olamiz
  IF v_from_currency <> 'UZS' AND v_to_currency = 'UZS' THEN
    v_from_rate := p_to_amount / p_from_amount;
  ELSIF v_to_currency <> 'UZS' AND v_from_currency = 'UZS' THEN
    v_to_rate := p_from_amount / p_to_amount;
  END IF;

  INSERT INTO public.cash_transactions (txn_date, income, expense, exchange_rate, cash_account_id, account_code, comment, created_by)
  VALUES (p_txn_date, 0, p_from_amount, v_from_rate, p_from_account, '99999', p_comment, p_created_by);

  INSERT INTO public.cash_transactions (txn_date, income, expense, exchange_rate, cash_account_id, account_code, comment, created_by)
  VALUES (p_txn_date, p_to_amount, 0, v_to_rate, p_to_account, '99999', p_comment, p_created_by);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
