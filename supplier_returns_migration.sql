-- "Hamkorga vozvrat" (2026-07-31) — sotib olingan tovarni hamkorga qaytarish uchun
-- audit jadvali. Ombor va hamkor balansi allaqachon warehouse/page.tsx'da
-- (handleVozvratSubmit) to'g'ridan-to'g'ri yangilanadi — bu jadval faqat tarixiy yozuv.

CREATE TABLE IF NOT EXISTS supplier_returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  cost_value NUMERIC NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE supplier_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vozvrat_read" ON supplier_returns FOR SELECT USING (true);
CREATE POLICY "vozvrat_write" ON supplier_returns FOR ALL USING (true) WITH CHECK (true);
