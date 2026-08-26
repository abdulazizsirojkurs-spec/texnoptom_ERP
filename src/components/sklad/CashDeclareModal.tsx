'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

type CashAccount = { id: string; name: string; currency: string };

export default function CashDeclareModal({
  orderId,
  type,
  onClose,
  onDeclared,
}: {
  orderId: string;
  type: 'customer_payment' | 'delivery_expense';
  onClose: () => void;
  onDeclared: () => void;
}) {
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedAccount = accounts.find(a => a.id === accountId);
  const needsRate = !!selectedAccount && selectedAccount.currency !== 'UZS';
  const title = type === 'customer_payment' ? '💰 Mijozdan pul qabul qilindi' : "🚚 Dostavka puli to'landi";

  useEffect(() => {
    supabase.from('cash_accounts').select('id, name, currency').eq('is_active', true).eq('is_virtual', false).order('sort_order')
      .then(({ data }) => {
        if (data) {
          setAccounts(data as any);
          const naqd = data.find((a: any) => a.name === 'Naqd');
          if (naqd) setAccountId(naqd.id); else if (data[0]) setAccountId((data[0] as any).id);
        }
      });
    try {
      const saved = localStorage.getItem('exchangeRate');
      if (saved) setRate(saved);
    } catch {}
  }, []);

  const handleSubmit = async () => {
    if (!accountId) { alert('Hisobni tanlang!'); return; }
    const amountNum = Number(amount.replace(/[^0-9.]/g, ''));
    if (!amountNum || amountNum <= 0) { alert("Summani to'g'ri kiriting!"); return; }
    if (needsRate && (!rate || Number(rate) <= 0)) { alert('Kursni kiriting!'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.rpc('sklad_declare_cash', {
        p_order_id: orderId,
        p_type: type,
        p_cash_account_id: accountId,
        p_amount: amountNum,
        p_rate: needsRate ? Number(rate) : null,
        p_note: note || null,
      });
      if (error) throw error;
      alert("Yuborildi — Abdulaziz tasdiqlagach kassaga tushadi.");
      onDeclared();
      onClose();
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div
        style={{ background: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, width: '100%', maxWidth: 480, margin: '0 auto', padding: 20, paddingBottom: 28 }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: 0, marginBottom: 14, fontSize: '1.1rem' }}>{title}</h3>

        <div style={{ marginBottom: 12 }}>
          <label className="field-label">Hisob</label>
          <select className="input-field input-lg" value={accountId} onChange={e => setAccountId(e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">Summa {selectedAccount ? `(${selectedAccount.currency})` : ''}</label>
            <input type="number" inputMode="decimal" className="input-field input-lg" placeholder="0"
              value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          {needsRate && (
            <div style={{ flex: 1 }}>
              <label className="field-label">Kurs</label>
              <input type="number" inputMode="decimal" className="input-field input-lg" placeholder="12100"
                value={rate} onChange={e => setRate(e.target.value)} />
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Izoh (ixtiyoriy)</label>
          <input type="text" className="input-field input-lg" placeholder="Masalan: naqd qo'lda berildi"
            value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" style={{ flex: 1, background: '#f1f5f9', border: '1px solid var(--border)' }} onClick={onClose}>
            Bekor qilish
          </button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Yuborilmoqda...' : 'Yuborish'}
          </button>
        </div>
      </div>
    </div>
  );
}
