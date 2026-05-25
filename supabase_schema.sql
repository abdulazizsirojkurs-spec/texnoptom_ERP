-- Supabase SQL Editor orqali ishga tushiriladigan kodlar:

-- 1. Kategoriyalar jadvali
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tovarlar bazasi (Katalog)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Postavshiklar (Ta'minotchilar)
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  balance NUMERIC DEFAULT 0, -- Qarzimiz (Kreditorka)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Kirim hujjatlari (Nakladnoylar)
CREATE TABLE receipt_docs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  document_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'completed'
);

-- 5. Nakladnoy ichidagi tovarlar ro'yxati
CREATE TABLE receipt_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id UUID REFERENCES receipt_docs(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  incoming_price NUMERIC NOT NULL CHECK (incoming_price >= 0)
);

-- 6. Ombor qoldig'i (Inventory balances)
CREATE TABLE inventory_balances (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  average_price NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Barcha harakatlar (Tranzaksiyalar) - Ostatka va Tahlillar uchun
CREATE TABLE inventory_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'kirim', 'chiqim', 'inventarizatsiya_kamomad', 'inventarizatsiya_ortiqcha'
  quantity_change INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  reference_id UUID, -- Qaysi nakladnoy yoki zakaz asosida qilinganligi
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Boshlang'ich kategoriyalar va postavshiklarni qo'shish
INSERT INTO categories (name) VALUES ('Monitorlar'), ('Videokartalar'), ('Protsessorlar'), ('Aksessuarlar');
INSERT INTO suppliers (name) VALUES ('Xtech Hamkor'), ('Nexes LLC');
