'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/utils/supabase';
import { Search } from 'lucide-react';
import SkladHeader from '@/components/sklad/SkladHeader';

export default function SkladQoldiqPage() {
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('inventory_balances')
      .select('product_id, quantity, products(name, categories(name))')
      .order('quantity', { ascending: false })
      .then(({ data }) => {
        if (data) setBalances(data);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return balances;
    return balances.filter((b: any) => (b.products?.name || '').toLowerCase().includes(q));
  }, [balances, search]);

  return (
    <div className="sklad-page">
      <SkladHeader title="Ombor qoldig'i" backHref="/sklad" />
      <div className="sklad-body">
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <Search size={18} color="var(--gray-400)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="input-field input-lg"
            placeholder="Tovar nomi bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>

        {loading ? (
          <div className="kirim-empty">Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div className="kirim-empty">Tovar topilmadi</div>
        ) : (
          filtered.map((b: any) => (
            <div key={b.product_id} className="kirim-item-row" style={{ marginBottom: 8 }}>
              <div className="kirim-item-info">
                <div className="kirim-item-name">{b.products?.name || '—'}</div>
                <div className="kirim-item-sub">{b.products?.categories?.name || ''}</div>
              </div>
              <div className="kirim-item-total" style={{ color: Number(b.quantity) <= 0 ? 'var(--danger-600, #dc2626)' : undefined }}>
                {b.quantity} dona
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
