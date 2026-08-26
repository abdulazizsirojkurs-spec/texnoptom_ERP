'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { CheckCircle2, XCircle } from 'lucide-react';

type PendingRow = {
  id: string;
  order_id: string;
  type: 'customer_payment' | 'delivery_expense';
  declared_amount_uzs: number;
  note: string | null;
  declared_by_name: string | null;
  declared_at: string;
  status: string;
  sales_orders: { order_code: string; client_name: string } | null;
};

type CashAccount = { id: string; name: string; currency: string };

export default function SkladTolovlariPage() {
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [accountChoice, setAccountChoice] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const naqdAccountId = accounts.find(a => a.name === 'Naqd')?.id || accounts[0]?.id || '';

  const fetchData = async () => {
    const { data } = await supabase
      .from('sklad_cash_pending')
      .select('id, order_id, type, declared_amount_uzs, note, declared_by_name, declared_at, status, sales_orders(order_code, client_name)')
      .eq('status', 'pending')
      .order('declared_at', { ascending: true });
    if (data) {
      setRows(data as any);
      const defaults: Record<string, string> = {};
      (data as any).forEach((r: PendingRow) => { defaults[r.id] = String(r.declared_amount_uzs); });
      setAmounts(prev => ({ ...defaults, ...prev }));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    supabase.from('cash_accounts').select('id, name, currency').eq('is_active', true).eq('is_virtual', false).order('sort_order')
      .then(({ data }) => { if (data) setAccounts(data as any); });
  }, []);

  const handleConfirm = async (row: PendingRow) => {
    const amount = Number(String(amounts[row.id] ?? row.declared_amount_uzs).replace(/[^0-9]/g, ''));
    if (!amount || amount <= 0) { alert("Summa noto'g'ri."); return; }
    const accountId = accountChoice[row.id] || naqdAccountId;
    if (!accountId) { alert('Hisob tanlanmagan.'); return; }

    const diff = amount - Number(row.declared_amount_uzs);
    if (diff !== 0) {
      const ok = confirm(
        `Sardor e'lon qilgan: ${Number(row.declared_amount_uzs).toLocaleString('uz-UZ')} so'm\n` +
        `Siz kiritayotgan: ${amount.toLocaleString('uz-UZ')} so'm\n` +
        `Farq: ${diff > 0 ? '+' : ''}${diff.toLocaleString('uz-UZ')} so'm\n\nDavom etasizmi?`
      );
      if (!ok) return;
    }

    setBusyId(row.id);
    try {
      const { error } = await supabase.rpc('admin_confirm_cash_pending', {
        p_pending_id: row.id, p_confirmed_amount_uzs: amount, p_cash_account_id: accountId,
      });
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (row: PendingRow) => {
    const reason = prompt("Nima uchun rad etyapsiz? (sabab yozish majburiy)");
    if (!reason || !reason.trim()) return;
    setBusyId(row.id);
    try {
      const { error } = await supabase.rpc('admin_reject_cash_pending', { p_pending_id: row.id, p_reason: reason });
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };

  const totalPending = rows.reduce((s, r) => s + Number(r.declared_amount_uzs), 0);
  const customerPayments = rows.filter(r => r.type === 'customer_payment');
  const deliveryExpenses = rows.filter(r => r.type === 'delivery_expense');

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 6 }}>Sklad to&apos;lovlari</h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 0, marginBottom: 20 }}>
        Sklad xodimi (Sardor) buyurtma bo&apos;yicha qabul qilgan yoki to&apos;lagan pullarni shu yerda tasdiqlaysiz — tasdiqlangach kassaga tushadi.
      </p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Kutilayotgan (jami)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{rows.length} ta yozuv</div>
          <div style={{ fontSize: '0.95rem', color: '#64748b' }}>{totalPending.toLocaleString('uz-UZ')} so&apos;m</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>💰 Mijozdan qabul qilingan</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d' }}>{customerPayments.length} ta</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🚚 Dostavka xarajatlari</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c2410c' }}>{deliveryExpenses.length} ta</div>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center' }}>Yuklanmoqda...</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>Tasdiqlash kutilayotgan yozuv yo&apos;q.</div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: 12 }}>Tur</th>
                <th style={{ padding: 12 }}>Buyurtma</th>
                <th style={{ padding: 12 }}>Kim / Qachon</th>
                <th style={{ padding: 12 }}>E&apos;lon qilingan</th>
                <th style={{ padding: 12 }}>Tasdiqlanadigan summa</th>
                <th style={{ padding: 12 }}>Hisob</th>
                <th style={{ padding: 12 }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: 12 }}>
                    {row.type === 'customer_payment' ? '💰 Mijoz to\'lovi' : '🚚 Dostavka'}
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600 }}>{row.sales_orders?.order_code}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.sales_orders?.client_name}</div>
                  </td>
                  <td style={{ padding: 12, fontSize: '0.85rem' }}>
                    <div>{row.declared_by_name || 'noma\'lum'}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {new Date(row.declared_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {row.note && <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{row.note}</div>}
                  </td>
                  <td style={{ padding: 12, fontWeight: 600 }}>{Number(row.declared_amount_uzs).toLocaleString('uz-UZ')}</td>
                  <td style={{ padding: 12 }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={amounts[row.id] ?? ''}
                      onChange={e => setAmounts(prev => ({ ...prev, [row.id]: e.target.value }))}
                      style={{ width: 130, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 6 }}
                    />
                  </td>
                  <td style={{ padding: 12 }}>
                    <select
                      value={accountChoice[row.id] || naqdAccountId}
                      onChange={e => setAccountChoice(prev => ({ ...prev, [row.id]: e.target.value }))}
                      style={{ padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 6 }}
                    >
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleConfirm(row)}
                        disabled={busyId === row.id}
                        title="Tasdiqlash"
                        style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#047857', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <CheckCircle2 size={16} /> Tasdiqlash
                      </button>
                      <button
                        onClick={() => handleReject(row)}
                        disabled={busyId === row.id}
                        title="Rad etish"
                        style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
