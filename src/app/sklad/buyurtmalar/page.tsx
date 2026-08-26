'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { ChevronRight } from 'lucide-react';
import SkladHeader from '@/components/sklad/SkladHeader';
import CashDeclareModal from '@/components/sklad/CashDeclareModal';

// Diqqat: bu so'rov tannarx (unit_cost_usd) kabi ustunlarni SO'RAMAYDI —
// skladchi buni ko'rmasligi kerak. Umumiy sotuv summasi va to'lov holati
// (v_order_payment_status'dan) esa CEO'ning aniq so'rovi bo'yicha ko'rsatiladi.
type SkladOrder = {
  id: string;
  order_code: string;
  client_name: string;
  client_phone: string | null;
  client_address: string | null;
  total_usd_price: number | null;
  status: string;
  is_shipped: boolean;
  created_at: string;
  shipped_by_name: string | null;
  shipped_at: string | null;
  sales_order_items: { id: string; product_name: string; quantity: number }[];
};

type PaymentStatus = { total_uzs_price: number; paid_uzs: number; remaining_uzs: number };

export default function SkladBuyurtmalarPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<SkladOrder[]>([]);
  const [paymentByOrder, setPaymentByOrder] = useState<Record<string, PaymentStatus>>({});
  const [loading, setLoading] = useState(true);
  const [cashModal, setCashModal] = useState<{ orderId: string; type: 'customer_payment' | 'delivery_expense' } | null>(null);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('id, order_code, client_name, client_phone, client_address, total_usd_price, status, is_shipped, created_at, shipped_by_name, shipped_at, sales_order_items(id, product_name, quantity)')
      .order('created_at', { ascending: false });
    if (data) {
      setOrders(data as any);
      const ids = data.map((o: any) => o.id);
      if (ids.length > 0) {
        const { data: ps } = await supabase.from('v_order_payment_status').select('*').in('order_id', ids);
        if (ps) {
          const m: Record<string, PaymentStatus> = {};
          ps.forEach((p: any) => { m[p.order_id] = p; });
          setPaymentByOrder(m);
        }
      }
    }
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <div className="sklad-page">
      <SkladHeader title="Buyurtmalar" backHref="/sklad" />
      <div className="sklad-body">
        {loading ? (
          <div className="kirim-empty">Yuklanmoqda...</div>
        ) : orders.length === 0 ? (
          <div className="kirim-empty">Buyurtma topilmadi</div>
        ) : (
          orders.map(o => {
            const ps = paymentByOrder[o.id];
            const fullyPaid = ps && ps.remaining_uzs <= 0 && ps.paid_uzs > 0;
            return (
              <div key={o.id} className="sklad-order-row" style={{ alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => router.push(`/sklad/buyurtmalar/${o.id}`)}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 650, fontSize: '0.95rem', color: 'var(--gray-900)' }}>{o.order_code}</span>
                    <span className={`sklad-status-pill ${o.is_shipped ? 'shipped' : 'pending'}`}>
                      {o.is_shipped ? '✅ Otgruzka qilingan' : '⏳ Kutilmoqda'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.client_name}{o.client_phone ? ` · ${o.client_phone}` : ''}
                  </div>
                  {o.client_address && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.client_address}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {new Date(o.created_at).toLocaleDateString('uz-UZ')}
                    {o.total_usd_price ? ` · $${Number(o.total_usd_price).toLocaleString()}` : ''}
                  </div>
                  {ps && (
                    <div style={{ fontSize: '0.78rem', marginTop: 3, fontWeight: 600, color: fullyPaid ? '#15803d' : ps.paid_uzs > 0 ? '#c2410c' : '#94a3b8' }}>
                      {fullyPaid
                        ? "✅ To'liq to'langan"
                        : ps.paid_uzs > 0
                          ? `To'landi: ${Number(ps.paid_uzs).toLocaleString('uz-UZ')} · Qoldiq: ${Number(ps.remaining_uzs).toLocaleString('uz-UZ')} so'm`
                          : `To'lanmagan: ${Number(ps.total_uzs_price).toLocaleString('uz-UZ')} so'm`}
                    </div>
                  )}
                  {o.is_shipped && o.shipped_at && (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                      🚚 {o.shipped_by_name || 'noma\'lum'} · {new Date(o.shipped_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button
                      onClick={e => { e.stopPropagation(); setCashModal({ orderId: o.id, type: 'customer_payment' }); }}
                      style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#047857', borderRadius: 8, padding: '5px 10px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      💰 Pul qabul qildim
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setCashModal({ orderId: o.id, type: 'delivery_expense' }); }}
                      style={{ background: '#fff7ed', border: '1px solid #fdba74', color: '#c2410c', borderRadius: 8, padding: '5px 10px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      🚚 Dostavka
                    </button>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--gray-400)" style={{ marginTop: 4, flexShrink: 0 }} />
              </div>
            );
          })
        )}
      </div>

      {cashModal && (
        <CashDeclareModal
          orderId={cashModal.orderId}
          type={cashModal.type}
          onClose={() => setCashModal(null)}
          onDeclared={() => {}}
        />
      )}
    </div>
  );
}
