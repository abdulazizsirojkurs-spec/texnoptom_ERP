'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import SkladHeader from '@/components/sklad/SkladHeader';

type ReceiptItem = {
  id: string;
  quantity: number;
  incoming_price: number;
  products: { name: string } | null;
};

type ReceiptDoc = {
  id: string;
  document_date: string;
  total_amount: number;
  status: string;
  created_at: string | null;
  created_by_name: string | null;
  suppliers: { name: string } | null;
  receipt_items: ReceiptItem[];
};

export default function SkladKirimTarixPage() {
  const [docs, setDocs] = useState<ReceiptDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('receipt_docs')
      .select('id, document_date, total_amount, status, created_at, created_by_name, suppliers(name), receipt_items(id, quantity, incoming_price, products(name))')
      .order('document_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (data) setDocs(data as any);
        if (error) console.error(error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="sklad-page">
      <SkladHeader title="Kirim tarixi" backHref="/sklad/kirim" />
      <div className="sklad-body">
        {loading ? (
          <div className="kirim-empty">Yuklanmoqda...</div>
        ) : docs.length === 0 ? (
          <div className="kirim-empty">Hali kirim hujjati yo'q</div>
        ) : (
          docs.map(d => {
            const items = d.receipt_items || [];
            return (
              <div key={d.id} className="tarix-doc-card">
                <div className="tarix-doc-head">
                  <div style={{ minWidth: 0 }}>
                    <div className="tarix-doc-supplier">{d.suppliers?.name || "noma'lum hamkor"}</div>
                    <div className="tarix-doc-date">{new Date(d.document_date).toLocaleDateString('uz-UZ')}</div>
                  </div>
                  <div className="tarix-doc-total">${Number(d.total_amount).toLocaleString()}</div>
                </div>

                {items.length > 0 ? (
                  <div className="tarix-doc-items">
                    {items.map(it => (
                      <div key={it.id} className="tarix-doc-item-row">
                        <div style={{ minWidth: 0 }}>
                          <div className="tarix-doc-item-name">{it.products?.name || "noma'lum tovar"}</div>
                          <div className="tarix-doc-item-sub">{it.quantity} dona × ${Number(it.incoming_price).toLocaleString()}</div>
                        </div>
                        <div className="tarix-doc-item-total">${(Number(it.quantity) * Number(it.incoming_price)).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="tarix-doc-item-sub" style={{ padding: '4px 0' }}>Tovar ro'yxati yo'q</div>
                )}

                {d.created_at && (
                  <div className="tarix-doc-meta">
                    {d.created_by_name || "noma'lum"} kiritdi · {new Date(d.created_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
