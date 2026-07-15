CREATE OR REPLACE FUNCTION public.otgruzka_order(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_is_shipped BOOLEAN;
    v_item RECORD;
    v_order RECORD;
    v_total_cost_usd NUMERIC := 0;
    v_revenue_code TEXT;
    v_problem TEXT;
BEGIN
    SELECT is_shipped INTO v_is_shipped FROM public.sales_orders WHERE id = p_order_id;
    IF v_is_shipped THEN
        RAISE EXCEPTION 'Bu buyurtma allaqachon otgruzka qilingan!';
    END IF;

    SELECT * INTO v_order FROM public.sales_orders WHERE id = p_order_id;

    -- Tan narxni otgruzka paytidagi eng oxirgi (joriy) ombor o'rtacha narxiga moslashtirish.
    UPDATE public.sales_order_items soi
    SET unit_cost_usd = ib.average_price
    FROM public.inventory_balances ib
    WHERE soi.order_id = p_order_id
      AND soi.product_id = ib.product_id
      AND ib.average_price > 0;

    -- Tekshiruv: har bir tovar bo'yicha ombordagi qoldiq yetarlimi va tan narxi ma'lummi.
    -- Birortasi mos kelmasa, otgruzka BUTUNLAY bloklanadi (hech narsa o'zgarmaydi).
    FOR v_item IN (
        SELECT
            soi.product_name,
            soi.quantity AS need_qty,
            soi.unit_cost_usd,
            COALESCE(ib.quantity, 0) AS have_qty
        FROM public.sales_order_items soi
        LEFT JOIN public.inventory_balances ib ON ib.product_id = soi.product_id
        WHERE soi.order_id = p_order_id
    ) LOOP
        IF v_item.have_qty < v_item.need_qty THEN
            v_problem := COALESCE(v_problem || E'\n', '') || format(
                '%s: kerak %s ta, ombordagi mavjud %s ta',
                v_item.product_name, v_item.need_qty, v_item.have_qty
            );
        ELSIF v_item.unit_cost_usd IS NULL OR v_item.unit_cost_usd = 0 THEN
            v_problem := COALESCE(v_problem || E'\n', '') || format(
                '%s: tan narxi hali noma''lum ($0) — avval kirim (prixod) qiling',
                v_item.product_name
            );
        END IF;
    END LOOP;

    IF v_problem IS NOT NULL THEN
        RAISE EXCEPTION 'Otgruzka qilib bo''lmaydi, quyidagi tovarlarni avval kirim qiling:%', v_problem;
    END IF;

    FOR v_item IN (SELECT product_id, quantity FROM public.sales_order_items WHERE order_id = p_order_id) LOOP
        IF v_item.product_id IS NOT NULL THEN
            UPDATE public.inventory_balances
            SET quantity = quantity - v_item.quantity, updated_at = now()
            WHERE product_id = v_item.product_id;

            INSERT INTO public.inventory_transactions (product_id, transaction_type, quantity_change, price, reference_id)
            VALUES (v_item.product_id, 'chiqim', -v_item.quantity, 0, p_order_id);
        END IF;
    END LOOP;

    SELECT COALESCE(SUM(soi.unit_cost_usd * soi.quantity), 0) INTO v_total_cost_usd
    FROM public.sales_order_items soi WHERE soi.order_id = p_order_id;

    v_revenue_code := CASE
        WHEN v_order.sales_channel ILIKE '%uzum%nasiya%' THEN '11003'
        WHEN v_order.sales_channel ILIKE '%uzum%' THEN '11002'
        ELSE '11001'
    END;

    INSERT INTO public.cash_transactions (txn_date, income, expense, cash_account_id, account_code, ref_table, ref_id, comment)
    SELECT CURRENT_DATE, v_order.total_uzs_price, 0, ca.id, v_revenue_code, 'sales_orders', p_order_id,
           'Avtomatik: ' || v_order.order_code || ' sotuv daromadi'
    FROM public.cash_accounts ca WHERE ca.code = 'NONCASH';

    IF v_total_cost_usd > 0 THEN
        INSERT INTO public.cash_transactions (txn_date, income, expense, exchange_rate, cash_account_id, account_code, ref_table, ref_id, comment)
        SELECT CURRENT_DATE, 0, v_total_cost_usd, v_order.exchange_rate, ca.id, '12001', 'sales_orders', p_order_id,
               'Avtomatik: ' || v_order.order_code || ' tan narx (COGS)'
        FROM public.cash_accounts ca WHERE ca.code = 'NONCASH';
    END IF;

    UPDATE public.sales_orders
    SET is_shipped = true, status = 'Buyurtma topshirildi'
    WHERE id = p_order_id;
END;
$function$
