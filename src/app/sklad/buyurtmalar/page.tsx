'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { ChevronRight } from 'lucide-react';
import SkladHeader from '@/components/sklad/SkladHeader';

// Diqqat: bu so'rov to'lov holati/tannarx (unit_cost_usd, is_paid) kabi
// ustunlarni SO'RAMAYDI — skladchi bularni ko'rmasligi kerak. Umumiy sotuv
// summasi (total_usd_price) esa CEO'ning aniq so'rovi bo'yicha ko'rsatiladi.
type SkladOrder = {
  id: string;
  order_code: string;
  client_name: string;
  client_address: string | null;
  total_usd_price: number | null;
  status: string;
  is_shipped: boolean;
  created_at: string;
  shipped_by_name: string | null;
  shipped_at: string | null;
  sales_order_items: { id: string; product_name: string; quantity: number }[];
};

export default function SkladBuyurtmalarPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<SkladOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('sales_orders')
      .select('id, order_code, client_name, client_address, total_usd_price, status, is_shipped, created_at, shipped_by_name, shipped_at, sales_order_items(id, product_name, quantity)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (data) setOrders(data as any);
        if (error) console.error(error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="sklad-page">
      <SkladHeader title="Buyurtmalar" backHref="/sklad" />
      <div className="sklad-body">
        {loading ? (
          <div className="kirim-empty">Yuklanmoqda...</div>
        ) : orders.length === 0 ? (
          <div className="kirim-empty">Buyurtma topilmadi</div>
        ) : (
          orders.map(o => (
            <button key={o.id} className="sklad-order-row" style={{ alignItems: 'flex-start' }} onClick={() => router.push(`/sklad/buyurtmalar/${o.id}`)}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 650, fontSize: '0.95rem', color: 'var(--gray-900)' }}>{o.order_code}</span>
                  <span className={`sklad-status-pill ${o.is_shipped ? 'shipped' : 'pending'}`}>
                    {o.is_shipped ? '✅ Otgruzka qilingan' : '⏳ Kutilmoqda'}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {o.client_name}{o.client_address ? ` · ${o.client_address}` : ''}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {new Date(o.created_at).toLocaleDateString('uz-UZ')}
                  {o.total_usd_price ? ` · $${Number(o.total_usd_price).toLocaleString()}` : ''}
                </div>
                {o.is_shipped && o.shipped_at && (
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                    🚚 {o.shipped_by_name || 'noma\'lum'} · {new Date(o.shipped_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              <ChevronRight size={18} color="var(--gray-400)" style={{ marginTop: 4, flexShrink: 0 }} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
