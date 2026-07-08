'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';
import { ArrowDownCircle, ArrowUpCircle, Download, Edit, Trash2, X, Check } from 'lucide-react';

type CashAccount = { id: string; name: string; currency: string };
type ChartAccount = { id: string; code: string; name: string; flow_sign: '+' | '-'; group_name: string };

export default function KassaPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [chartAccounts, setChartAccounts] = useState<ChartAccount[]>([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Tezkor kiritish formasi
  const [direction, setDirection] = useState<'income' | 'expense'>('expense');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [txnDate, setTxnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [cashAccountId, setCashAccountId] = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRefData();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate, typeFilter]);

  const fetchRefData = async () => {
    const { data: ca } = await supabase.from('cash_accounts').select('id, name, currency').eq('is_active', true).eq('is_virtual', false).order('sort_order');
    const { data: coa } = await supabase.from('chart_of_accounts').select('id, code, name, flow_sign, group_name').eq('is_active', true).order('sort_order');
    if (ca) {
      setCashAccounts(ca);
      const savedCash = localStorage.getItem('kassa_last_account');
      setCashAccountId(savedCash && ca.find(c => c.id === savedCash) ? savedCash : (ca[0]?.id || ''));
    }
    if (coa) setChartAccounts(coa);
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cash_transactions')
        .select(`*, cash_accounts(name, currency), chart_of_accounts(name), suppliers(name)`)
        .order('txn_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (startDate) query = query.gte('txn_date', startDate);
      if (endDate) query = query.lte('txn_date', endDate);
      if (typeFilter === 'income') query = query.gt('income', 0);
      else if (typeFilter === 'expense') query = query.gt('expense', 0);

      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatUzs = (val: number) => val?.toLocaleString('uz-UZ');

  const selectedCashAccount = cashAccounts.find(c => c.id === cashAccountId);
  const needsExchangeRate = selectedCashAccount?.currency === 'USD';
  const filteredChartAccounts = chartAccounts.filter(c => c.flow_sign === (direction === 'income' ? '+' : '-'));

  const resetForm = (keepContext: boolean) => {
    setEditingId(null);
    setAmount('');
    setNote('');
    if (!keepContext) {
      setDirection('expense');
      setAccountCode('');
      setExchangeRate('');
    }
    setTimeout(() => amountRef.current?.focus(), 50);
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setDirection(t.income > 0 ? 'income' : 'expense');
    setTxnDate(t.txn_date);
    setAmount(String(t.income > 0 ? t.income : t.expense));
    setCashAccountId(t.cash_account_id);
    setAccountCode(t.account_code);
    setExchangeRate(t.exchange_rate ? String(t.exchange_rate) : '');
    setNote(t.comment || t.customer_name || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => amountRef.current?.focus(), 300);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu tranzaksiyani o'chirasizmi? Bu amalni orqaga qaytarib bo'lmaydi!")) return;
    const { error } = await supabase.from('cash_transactions').delete().eq('id', id);
    if (error) {
      alert('Xatolik: ' + error.message);
      return;
    }
    fetchTransactions();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      amountRef.current?.focus();
      return;
    }
    if (!cashAccountId || !accountCode) {
      alert("Hisob va toifani tanlang!");
      return;
    }
    if (needsExchangeRate && !exchangeRate) {
      alert("USD hisob uchun kurs kiritilishi shart!");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        txn_date: txnDate,
        income: direction === 'income' ? Number(amount) : 0,
        expense: direction === 'expense' ? Number(amount) : 0,
        cash_account_id: cashAccountId,
        account_code: accountCode,
        exchange_rate: needsExchangeRate ? Number(exchangeRate) : null,
        comment: note || null,
        created_by: user?.id || null,
      };

      if (editingId) {
        const { error } = await supabase.from('cash_transactions').update(payload).eq('id', editingId);
        if (error) throw error;
        setFlash("Tranzaksiya yangilandi ✓");
      } else {
        const { error } = await supabase.from('cash_transactions').insert(payload);
        if (error) throw error;
        setFlash(direction === 'income' ? "Kirim saqlandi ✓" : "Chiqim saqlandi ✓");
      }

      localStorage.setItem('kassa_last_account', cashAccountId);
      resetForm(true);
      fetchTransactions();
      setTimeout(() => setFlash(''), 2000);
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Kassa (Pul harakatlari)</h1>
        <button className="btn btn-secondary">
          <Download size={18} style={{ marginRight: '6px' }} /> Eksport
        </button>
      </div>

      {/* TEZKOR KIRITISH PANELI */}
      <form onSubmit={handleSubmit} className="card" style={{ padding: '20px', marginBottom: '20px', border: `2px solid ${direction === 'income' ? 'var(--success-200, #bbf7d0)' : 'var(--danger-200, #fecaca)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => { setDirection('income'); setAccountCode(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px',
                border: direction === 'income' ? '2px solid #10b981' : '1px solid var(--border)',
                background: direction === 'income' ? '#dcfce7' : 'transparent',
                color: direction === 'income' ? '#15803d' : 'var(--text-secondary)',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
              }}
            >
              <ArrowDownCircle size={20} /> Kirim
            </button>
            <button
              type="button"
              onClick={() => { setDirection('expense'); setAccountCode(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px',
                border: direction === 'expense' ? '2px solid #ef4444' : '1px solid var(--border)',
                background: direction === 'expense' ? '#fee2e2' : 'transparent',
                color: direction === 'expense' ? '#991b1b' : 'var(--text-secondary)',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
              }}
            >
              <ArrowUpCircle size={20} /> Chiqim
            </button>
          </div>

          {flash && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: 600, fontSize: '0.9rem' }}>
              <Check size={16} /> {flash}
            </span>
          )}

          {editingId && (
            <button type="button" onClick={() => resetForm(true)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              <X size={14} style={{ marginRight: '4px' }} /> Tahrirlashni bekor qilish
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: needsExchangeRate ? '140px 1fr 1fr 1fr 120px' : '140px 1fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
          <div>
            <label className="field-label">Sana</label>
            <input type="date" className="input-field" value={txnDate} onChange={e => setTxnDate(e.target.value)} />
          </div>

          <div>
            <label className="field-label">Summa {selectedCashAccount ? `(${selectedCashAccount.currency})` : ''}</label>
            <input
              ref={amountRef}
              type="number"
              className="input-field"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ fontSize: '1.15rem', fontWeight: 700 }}
              autoFocus
            />
          </div>

          <div>
            <label className="field-label">Hisob</label>
            <select className="input-field" value={cashAccountId} onChange={e => setCashAccountId(e.target.value)}>
              {cashAccounts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="field-label">Toifa</label>
            <select className="input-field" value={accountCode} onChange={e => setAccountCode(e.target.value)}>
              <option value="">Tanlang...</option>
              {filteredChartAccounts.map(c => <option key={c.id} value={c.code}>{c.name}</option>)}
            </select>
          </div>

          {needsExchangeRate && (
            <div>
              <label className="field-label">Kurs</label>
              <input type="number" className="input-field" placeholder="12700" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'end' }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">Izoh / Postavshik-mijoz (ixtiyoriy)</label>
            <input type="text" className="input-field" placeholder="Masalan: Arenda to'lovi, iyul oyi" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '10px 28px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {saving ? 'Saqlanmoqda...' : editingId ? 'Yangilash' : 'Saqlash'}
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="card flex-mobile-col" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Dan</label>
          <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Gacha</label>
          <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Tipi</label>
          <select className="input-field" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Barchasi</option>
            <option value="income">Kirim</option>
            <option value="expense">Chiqim</option>
          </select>
        </div>
        <div>
          <button className="btn btn-secondary" onClick={() => { setStartDate(''); setEndDate(''); setTypeFilter(''); }}>
            Tozalash
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Yuklanmoqda...</div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px' }}>Sana</th>
                <th style={{ padding: '12px' }}>Hisob</th>
                <th style={{ padding: '12px' }}>Toifa</th>
                <th style={{ padding: '12px' }}>Izoh</th>
                <th style={{ padding: '12px' }}>Kirim</th>
                <th style={{ padding: '12px' }}>Chiqim</th>
                <th style={{ padding: '12px' }}>UZS Kirim</th>
                <th style={{ padding: '12px' }}>UZS Chiqim</th>
                <th style={{ padding: '12px' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '20px', textAlign: 'center' }}>Ma'lumot topilmadi.</td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.95rem', background: editingId === t.id ? '#fffbeb' : 'transparent' }}>
                    <td style={{ padding: '12px' }}>{new Date(t.txn_date).toLocaleDateString('uz-UZ')}</td>
                    <td style={{ padding: '12px' }}>{t.cash_accounts?.name}</td>
                    <td style={{ padding: '12px' }}>{Array.isArray(t.chart_of_accounts) ? t.chart_of_accounts[0]?.name : (t.chart_of_accounts as any)?.name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{t.comment || t.suppliers?.name || t.customer_name || '-'}</td>

                    <td style={{ padding: '12px', color: '#10b981', fontWeight: t.income > 0 ? 'bold' : 'normal' }}>
                      {t.income > 0 ? `${formatUzs(t.income)} ${t.cash_accounts?.currency}` : '-'}
                    </td>
                    <td style={{ padding: '12px', color: '#ef4444', fontWeight: t.expense > 0 ? 'bold' : 'normal' }}>
                      {t.expense > 0 ? `${formatUzs(t.expense)} ${t.cash_accounts?.currency}` : '-'}
                    </td>

                    <td style={{ padding: '12px', color: '#10b981' }}>{t.income_uzs > 0 ? formatUzs(t.income_uzs) : '-'}</td>
                    <td style={{ padding: '12px', color: '#ef4444' }}>{t.expense_uzs > 0 ? formatUzs(t.expense_uzs) : '-'}</td>

                    <td style={{ padding: '12px' }}>
                      <button onClick={() => handleEdit(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', marginRight: '10px' }}>
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
