'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import SkladHeader from '@/components/sklad/SkladHeader';

type ReceiptDoc = {
  id: string;
  document_date: string;
  total_amount: number;
  status: string;
  created_at: string | null;
  created_by_name: string | null;
  suppliers: { name: string } | null;
};

export default function SkladKirimTarixPage() {
  const [docs, setDocs] = useState<ReceiptDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('receipt_docs')
      .select('id, document_date, total_amount, status, created_at, created_by_name, suppliers(name)')
      .order('document_date', { ascending: false })
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
          docs.map(d => (
            <div key={d.id} className="kirim-item-row">
              <div className="kirim-item-info">
                <div className="kirim-item-name">{d.suppliers?.name || '—'}</div>
                <div className="kirim-item-sub">{new Date(d.document_date).toLocaleDateString('uz-UZ')}</div>
                {d.created_at && (
                  <div className="kirim-item-sub" style={{ opacity: 0.7 }}>
                    {d.created_by_name || 'noma\'lum'} · {new Date(d.created_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              <div className="kirim-item-total">${Number(d.total_amount).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
