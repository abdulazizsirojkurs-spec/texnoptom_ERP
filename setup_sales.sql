-- ERP Sotuv Moduli uchun SQL skript (Supabase SQL Editor orqali ishga tushiring)

-- 1. Yetishmayotgan kategoriyalarni qo'shish (Borlarini o'tkazib yuboradi)
INSERT INTO categories (name) 
VALUES 
  ('Ona plata'),
  ('Pratsessor'),
  ('Kuller'),
  ('Video karta'),
  ('Keys'),
  ('Blok pitaniya'),
  ('Operativ xotira'),
  ('SSD'),
  ('Monitor'),
  ('Klaviatura'),
  ('Sichqoncha'),
  ('Kovrik'),
  ('Naushnik'),
  ('Qo''shimcha 1'),
  ('Qo''shimcha 2'),
  ('Qo''shimcha 3')
ON CONFLICT (name) DO NOTHING;

-- 2. Buyurtmalar (Sales Orders) jadvali
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_code TEXT NOT NULL UNIQUE, -- Masalan: TOG-0001
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_address TEXT NOT NULL,
  total_usd_price NUMERIC NOT NULL,
  exchange_rate NUMERIC NOT NULL,
  total_uzs_price NUMERIC NOT NULL,
  sales_channel TEXT NOT NULL,
  contract_number TEXT,
  seller_id UUID,
  seller_name TEXT NOT NULL,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT DEFAULT 'Buyurtma qabul qilindi' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Buyurtma qismlari (Sales Order Items) jadvali
CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL, 
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT, 
  quantity INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) o'chirib turiladi, agar RLS yoqilgan bo'lsa bularni ishlashiga ruxsat berish:
ALTER TABLE sales_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items DISABLE ROW LEVEL SECURITY;
