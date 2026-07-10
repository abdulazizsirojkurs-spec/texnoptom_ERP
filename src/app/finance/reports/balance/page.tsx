'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function BalanceSheetPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    cash: 0, inventory: 0, receivable: 0, fixedAssets: 0,
    payable: 0, obligations: 0, rate: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Eng so'nggi ma'lum kurs
      const { data: lastRate } = await supabase
        .from('sales_orders').select('exchange_rate').order('created_at', { ascending: false }).limit(1);
      const rate = lastRate?.[0]?.exchange_rate ? Number(lastRate[0].exchange_rate) : 0;

      // Kassa (haqiqiy hisoblar, virtual emas) — barchasi UZS'ga o'girilgan holda
      const { data: txns } = await supabase
        .from('cash_transactions')
        .select('income, expense, income_uzs, expense_uzs, cash_accounts!inner(currency, is_virtual)')
        .eq('cash_accounts.is_virtual', false);
      let cash = 0;
      (txns || []).forEach((t: any) => {
        cash += (Number(t.income_uzs) || 0) - (Number(t.expense_uzs) || 0);
      });

      // Ombor zaxirasi (tan narx, USD -> UZS)
      const { data: inv } = await supabase.from('inventory_balances').select('quantity, average_price');
      const inventoryUsd = (inv || []).reduce((s, r: any) => s + Number(r.quantity) * Number(r.average_price), 0);

      // Mijozlar qarzi (AR) — nasiya/perechisleniya, jo'natilgan
      const { data: unpaidOrders } = await supabase
        .from('sales_orders').select('total_uzs_price')
        .eq('is_paid', false);
      const receivable = (unpaidOrders || []).reduce((s, r: any) => s + (Number(r.total_uzs_price) || 0), 0);

      // Asosiy vositalar (qoldiq qiymat)
      const { data: fa } = await supabase.from('fixed_assets').select('current_book_value, acquisition_cost').eq('status', 'active');
      const fixedAssets = (fa || []).reduce((s, r: any) => s + Number(r.current_book_value ?? r.acquisition_cost) || 0, 0);

      // Postavshiklarga qarz (AP) — USD -> UZS, faqat musbat balanslar
      const { data: sup } = await supabase.from('suppliers').select('balance');
      const payableUsd = (sup || []).reduce((s, r: any) => s + Math.max(0, Number(r.balance) || 0), 0);

      // To'lanmagan majburiyatlar
      const { data: obl } = await supabase.from('obligations').select('amount_uzs').eq('is_paid', false);
      const obligationsSum = (obl || []).reduce((s, r: any) => s + (Number(r.amount_uzs) || 0), 0);

      setData({
        cash, inventory: inventoryUsd * rate, receivable, fixedAssets,
        payable: payableUsd * rate, obligations: obligationsSum, rate,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatUzs = (val: number) => Math.round(val).toLocaleString('uz-UZ') + " so'm";

  if (loading) return <div style={{ padding: '20px' }}>Yuklanmoqda...</div>;

  const totalAssets = data.cash + data.inventory + data.receivable + data.fixedAssets;
  const totalLiabilities = data.payable + data.obligations;
  const retainedEarnings = totalAssets - totalLiabilities; // Ustav kapitali hali tizimda kuzatilmagani uchun to'liq qoldiq shu yerga tushadi
  const totalEquity = retainedEarnings;
  const totalPassives = totalLiabilities + totalEquity;
  const diff = totalAssets - totalPassives; // har doim 0 bo'lishi shart (ta'rif bo'yicha)

  const row = (label: string, val: number) => (
    <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.95rem' }}>
      <td style={{ padding: '10px 12px 10px 32px', color: 'var(--text-secondary)' }}>{label}</td>
      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatUzs(val)}</td>
    </tr>
  );

  const subtotal = (label: string, val: number, bg = '#f8fafc', color = 'inherit') => (
    <tr style={{ backgroundColor: bg, fontWeight: 'bold', borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '12px', color }}>{label}</td>
      <td style={{ padding: '12px', textAlign: 'right', color }}>{formatUzs(val)}</td>
    </tr>
  );

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Balans (Balance Sheet)</h1>
        <p className="page-subtitle">Joriy holat — {new Date().toLocaleDateString('uz-UZ')} kuni holatiga</p>
      </div>

      <div className="card" style={{ overflowX: 'auto', maxWidth: 700 }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'right', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Ko'rsatkichlar</th>
              <th style={{ padding: '12px' }}>Summa</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: '#1e3a8a', color: 'white', fontWeight: 'bold' }}>
              <td colSpan={2} style={{ padding: '12px', textAlign: 'center' }}>AKTIVLAR (Assets)</td>
            </tr>
            {row("Kassa qoldig'i (naqd+karta)", data.cash)}
            {row('Ombor zaxirasi (tan narx bo\'yicha)', data.inventory)}
            {row('Mijozlar qarzi (Debitorlar)', data.receivable)}
            {row('Asosiy vositalar (qoldiq qiymat)', data.fixedAssets)}
            {subtotal('JAMI AKTIVLAR', totalAssets, '#dbeafe', '#1e40af')}

            <tr style={{ backgroundColor: '#7f1d1d', color: 'white', fontWeight: 'bold' }}>
              <td colSpan={2} style={{ padding: '12px', textAlign: 'center' }}>PASSIVLAR (Liabilities &amp; Equity)</td>
            </tr>
            {row('Postavshiklardan qarz (Kreditorlar)', data.payable)}
            {row("To'lanmagan majburiyatlar", data.obligations)}
            {subtotal('JAMI MAJBURIYATLAR', totalLiabilities, '#fee2e2', '#991b1b')}

            {row("Taqsimlanmagan foyda (qoldiq)", retainedEarnings)}
            {subtotal('JAMI KAPITAL', totalEquity, '#fef9c3', '#854d0e')}

            {subtotal('JAMI PASSIVLAR', totalPassives, '#fecaca', '#991b1b')}

            <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold', fontSize: '1.05rem' }}>
              <td style={{ padding: '16px' }}>FARQ (AKTIV - PASSIV)</td>
              <td style={{ padding: '16px', textAlign: 'right', color: Math.abs(diff) < 1 ? '#10b981' : '#ef4444' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  {Math.abs(diff) < 1 ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  {formatUzs(diff)}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card" style={{ maxWidth: 700, marginTop: 16, padding: 16, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <strong>Eslatma:</strong> "Ustav kapitali" (boshlang'ich kiritilgan pul) tizimda alohida kuzatilmagani uchun,
        "Taqsimlanmagan foyda" qatorida ikkalasi birga hisoblanadi. Kurs: 1$ = {data.rate.toLocaleString('uz-UZ')} so'm
        (oxirgi ma'lum sotuv kursi).
      </div>
    </div>
  );
}
