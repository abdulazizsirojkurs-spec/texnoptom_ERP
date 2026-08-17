'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import SkladHeader from '@/components/sklad/SkladHeader';

type CashAccount = { id: string; name: string; currency: string };

export default function SkladTolovPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);

  const [htSupplier, setHtSupplier] = useState('');
  const [htAmount, setHtAmount] = useState('');
  const [htAccountId, setHtAccountId] = useState('');
  const [htRate, setHtRate] = useState('');
  const [htReason, setHtReason] = useState('');
  const [htLoading, setHtLoading] = useState(false);
  const [htSuccess, setHtSuccess] = useState('');
  const htSelectedAccount = cashAccounts.find(c => c.id === htAccountId);

  useEffect(() => {
    supabase.from('suppliers').select('*').order('name').then(({ data }) => { if (data) setSuppliers(data); });
    supabase.from('cash_accounts').select('id, name, currency').eq('is_active', true).eq('is_virtual', false).order('sort_order')
      .then(({ data }) => { if (data) { setCashAccounts(data); if (data[0]) setHtAccountId(data[0].id); } });
  }, []);

  const handlePaySupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!htSupplier) { alert('Hamkorni tanlang!'); return; }
    if (!htAmount || Number(htAmount) <= 0) { alert('Summani kiriting!'); return; }
    if (!htAccountId) { alert('Hisobni tanlang!'); return; }
    if (!htRate || Number(htRate) <= 0) { alert('Kurs narxini kiriting!'); return; }
    if (!htReason.trim()) { alert('Sabab yozish majburiy!'); return; }
    setHtLoading(true); setHtSuccess('');
    try {
      const { error } = await supabase.rpc('sklad_pay_supplier', {
        p_supplier_id: htSupplier,
        p_amount: Number(htAmount),
        p_cash_account_id: htAccountId,
        p_exchange_rate: Number(htRate),
        p_reason: htReason || null,
      });
      if (error) throw error;
      setHtSuccess("To'lov saqlandi!");
      setHtSupplier(''); setHtAmount(''); setHtReason('');
    } catch (error: any) {
      alert('Xatolik: ' + error.message);
    } finally {
      setHtLoading(false);
    }
  };

  return (
    <div className="sklad-page">
      <SkladHeader title="Hamkorga to'lov" backHref="/sklad" actionHref="/sklad/tolov/tarix" />
      <div className="sklad-body">
        <div className="card">
          <h2 style={{ marginBottom: 4, fontSize: '1.2rem' }}>Hamkorga To'lov</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 0, marginBottom: 16 }}>
            Pulni CEO'dan olib, hamkorga berganingizdan so'ng shu yerga kiriting.
          </p>
          {htSuccess && <div style={{ padding: '12px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 16 }}>{htSuccess}</div>}

          <form onSubmit={handlePaySupplierSubmit} className="kirim-entry">
            <div>
              <label className="field-label">Hamkor</label>
              <select className="input-field input-lg" value={htSupplier} onChange={e => setHtSupplier(e.target.value)}>
                <option value="">Tanlang...</option>
                {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
              </select>
            </div>

            <div>
              <label className="field-label">Hisob</label>
              <select className="input-field input-lg" value={htAccountId} onChange={e => setHtAccountId(e.target.value)}>
                <option value="">Tanlang...</option>
                {cashAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
              </select>
            </div>

            <div className="kirim-two-col">
              <div>
                <label className="field-label">Summa {htSelectedAccount ? `(${htSelectedAccount.currency})` : ''}</label>
                <input type="number" inputMode="decimal" className="input-field input-lg" placeholder="0"
                  value={htAmount} onChange={e => setHtAmount(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Kurs</label>
                <input type="number" inputMode="decimal" className="input-field input-lg" placeholder="12100"
                  value={htRate} onChange={e => setHtRate(e.target.value)} />
              </div>
            </div>
            {htAmount && htRate && Number(htRate) > 0 && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                ≈ ${(htSelectedAccount?.currency === 'USD' ? Number(htAmount) : Number(htAmount) / Number(htRate)).toFixed(2)} hamkor balansidan yechiladi
              </div>
            )}

            <div>
              <label className="field-label">Sabab (majburiy)</label>
              <input type="text" className="input-field input-lg" placeholder="Masalan: tovar puli, naqd berildi"
                value={htReason} onChange={e => setHtReason(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary kirim-confirm-btn" disabled={htLoading}>
              {htLoading ? 'Saqlanmoqda...' : "✓ To'lovni saqlash"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
