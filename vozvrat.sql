-- Ombor qoldig'iga tovarlarni qaytarish (Vozvrat) funksiyasi
CREATE OR REPLACE FUNCTION public.vozvrat_order(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
    v_is_shipped BOOLEAN;
    v_item RECORD;
BEGIN
    -- Buyurtma otgruzka bo'lganligini tekshirish
    SELECT is_shipped INTO v_is_shipped FROM public.sales_orders WHERE id = p_order_id;
    
    IF NOT v_is_shipped THEN
        RAISE EXCEPTION 'Bu buyurtma hali otgruzka qilinmagan! Faqat otgruzka qilingan tovarlarni qaytarish (vozvrat) mumkin.';
    END IF;

    -- Har bir tovar uchun ombordagi miqdorga orqaga qo'shish (+)
    FOR v_item IN (SELECT product_id, quantity FROM public.sales_order_items WHERE order_id = p_order_id) LOOP
        -- Agar mahsulot ID mavjud bo'lsa
        IF v_item.product_id IS NOT NULL THEN
            UPDATE public.products 
            SET quantity = quantity + v_item.quantity
            WHERE id = v_item.product_id;
        END IF;
    END LOOP;

    -- Buyurtmani "Vozvrat qilindi" deb belgilash va otgruzkani bekor qilish
    UPDATE public.sales_orders 
    SET is_shipped = false, status = 'Vozvrat qilindi' 
    WHERE id = p_order_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
