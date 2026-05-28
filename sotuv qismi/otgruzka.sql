-- 1. sales_orders jadvaliga is_shipped ustunini qo'shish
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS is_shipped BOOLEAN DEFAULT false;

-- 2. Ombor qoldig'ini ayirish (Otgruzka) funksiyasi
CREATE OR REPLACE FUNCTION public.otgruzka_order(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
    v_is_shipped BOOLEAN;
    v_item RECORD;
BEGIN
    -- Buyurtma allaqachon otgruzka bo'lganligini tekshirish
    SELECT is_shipped INTO v_is_shipped FROM public.sales_orders WHERE id = p_order_id;
    
    IF v_is_shipped THEN
        RAISE EXCEPTION 'Bu buyurtma allaqachon otgruzka qilingan!';
    END IF;

    -- Har bir tovar uchun ombordan miqdorni ayirish
    FOR v_item IN (SELECT product_id, quantity FROM public.sales_order_items WHERE order_id = p_order_id) LOOP
        -- Agar mahsulot ID mavjud bo'lsa
        IF v_item.product_id IS NOT NULL THEN
            UPDATE public.products 
            SET quantity = quantity - v_item.quantity
            WHERE id = v_item.product_id;
        END IF;
    END LOOP;

    -- Buyurtmani "otgruzka qilingan" deb belgilash
    UPDATE public.sales_orders 
    SET is_shipped = true, status = 'Buyurtma topshirildi' 
    WHERE id = p_order_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
