'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import SkladHeader from '@/components/sklad/SkladHeader';

type PaymentTxn = {
  id: string;
  txn_date: string;
  expense: number;
  comment: string | null;
  suppliers: { name: string } | null;
  cash_accounts: { name: string; currency: string } | null;
};

export default function SkladTolovTarixPage() {
  const [txns, setTxns] = useState<PaymentTxn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('cash_transactions')
      .select('id, txn_date, expense, comment, suppliers(name), cash_accounts(name, currency)')
      .order('txn_date', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (data) setTxns(data as any);
        if (error) console.error(error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="sklad-page">
      <SkladHeader title="To'lovlar tarixi" backHref="/sklad/tolov" />
      <div className="sklad-body">
        {loading ? (
          <div className="kirim-empty">Yuklanmoqda...</div>
        ) : txns.length === 0 ? (
          <div className="kirim-empty">Hali to'lov yo'q</div>
        ) : (
          txns.map(t => (
            <div key={t.id} className="kirim-item-row" style={{ alignItems: 'flex-start' }}>
              <div className="kirim-item-info">
                <div className="kirim-item-name">{t.suppliers?.name || '—'}</div>
                <div className="kirim-item-sub">
                  {new Date(t.txn_date).toLocaleDateString('uz-UZ')} · {t.cash_accounts?.name}
                  {t.comment ? ` · ${t.comment}` : ''}
                </div>
              </div>
              <div className="kirim-item-total">
                {Number(t.expense).toLocaleString()} {t.cash_accounts?.currency}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
