'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { ChevronRight } from 'lucide-react';
import SkladHeader from '@/components/sklad/SkladHeader';

// Diqqat: bu so'rov ataylab narx/to'lov/tannarx ustunlarini SO'RAMAYDI ham —
// skladchi bularni ko'rmasligi kerak (faqat UI'da yashirish emas).
type SkladOrder = {
  id: string;
  order_code: string;
  client_name: string;
  status: string;
  is_shipped: boolean;
  created_at: string;
  sales_order_items: { id: string; product_name: string; quantity: number }[];
};

export default function SkladBuyurtmalarPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<SkladOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('sales_orders')
      .select('id, order_code, client_name, status, is_shipped, created_at, sales_order_items(id, product_name, quantity)')
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
            <button key={o.id} className="sklad-order-row" onClick={() => router.push(`/sklad/buyurtmalar/${o.id}`)}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 650, fontSize: '0.95rem', color: 'var(--gray-900)' }}>{o.order_code}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {o.client_name} · {o.sales_order_items?.length || 0} tovar
                </div>
              </div>
              <span className={`sklad-status-pill ${o.is_shipped ? 'shipped' : 'pending'}`}>
                {o.is_shipped ? '✅ Otgruzka qilingan' : '⏳ Kutilmoqda'}
              </span>
              <ChevronRight size={18} color="var(--gray-400)" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
