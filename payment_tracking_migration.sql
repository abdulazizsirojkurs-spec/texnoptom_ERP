-- ============================================================
-- Buyurtmalar bo'yicha to'lov/qoldiq kuzatuvi
-- cash_transactions.ref_table/ref_id orqali buyurtmaga bog'langan
-- to'lov (account_code=90001) va dostavka xarajati (account_code=13014)
-- yozuvlaridan qoldiqni hisoblaydigan view.
-- ============================================================
create or replace view public.v_order_payment_status as
select
  so.id as order_id,
  so.total_uzs_price,
  coalesce(sum(ct.income_uzs) filter (where ct.account_code = '90001'), 0) as paid_uzs,
  coalesce(sum(ct.expense_uzs) filter (where ct.account_code = '13014'), 0) as delivery_cost_uzs,
  case
    when coalesce(sum(ct.income_uzs) filter (where ct.account_code = '90001'), 0) > 0
      then greatest(so.total_uzs_price - sum(ct.income_uzs) filter (where ct.account_code = '90001'), 0)
    when so.is_paid then 0
    else so.total_uzs_price
  end as remaining_uzs
from public.sales_orders so
left join public.cash_transactions ct on ct.ref_table = 'sales_orders' and ct.ref_id = so.id
group by so.id, so.total_uzs_price, so.is_paid;
