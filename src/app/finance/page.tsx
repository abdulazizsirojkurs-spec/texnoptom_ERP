'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

export default function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    sales: 0, margin: 0, marginPercent: 0, inventoryValue: 0,
    cashIn: 0, cashOut: 0, netCashflow: 0, usdRate: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Bu oy: sotuv va marja (P&L view'idan)
      const { data: pnlRows } = await supabase
        .from('v_pnl_monthly')
        .select('*')
        .gte('month', `${now.getFullYear()}-01-01`);

      const { data: lastRate } = await supabase
        .from('sales_orders').select('exchange_rate').order('created_at', { ascending: false }).limit(1);
      const usdRate = lastRate?.[0]?.exchange_rate ? Number(lastRate[0].exchange_rate) : 0;

      const { data: inv } = await supabase.from('inventory_balances').select('quantity, average_price');
      const inventoryValue = (inv || []).reduce((s, r: any) => s + Number(r.quantity) * Number(r.average_price), 0) * usdRate;

      // Bu oy va yil bo'yicha oylik jamlanma
      const monthly = MONTHS.map((name, idx) => {
        const rowsForMonth = (pnlRows || []).filter((r: any) => new Date(r.month).getMonth() === idx);
        const revenue = rowsForMonth.filter((r: any) => r.pnl_section === 'revenue').reduce((s: number, r: any) => s + Number(r.income_uzs), 0);
        const cogs = rowsForMonth.filter((r: any) => r.pnl_section === 'cogs').reduce((s: number, r: any) => s + Number(r.expense_uzs), 0);
        const cashIn = rowsForMonth.reduce((s: number, r: any) => s + Number(r.income_uzs), 0);
        const cashOut = rowsForMonth.reduce((s: number, r: any) => s + Number(r.expense_uzs), 0);
        const margin = revenue - cogs;
        return {
          month: name, sales: revenue, cogs, margin,
          marginPct: revenue > 0 ? Number(((margin / revenue) * 100).toFixed(1)) : 0,
          cashIn, cashOut, netCf: cashIn - cashOut,
        };
      }).filter(m => m.sales > 0 || m.cashIn > 0 || m.cashOut > 0);

      const thisMonthIdx = now.getMonth();
      const thisMonth = monthly.find((_, i) => MONTHS.indexOf(monthly[i]?.month) === thisMonthIdx) || monthly[monthly.length - 1];

      setStats({
        sales: thisMonth?.sales || 0,
        margin: thisMonth?.margin || 0,
        marginPercent: thisMonth?.marginPct || 0,
        inventoryValue,
        cashIn: thisMonth?.cashIn || 0,
        cashOut: thisMonth?.cashOut || 0,
        netCashflow: thisMonth?.netCf || 0,
        usdRate,
      });
      setMonthlyData(monthly);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatUzs = (val: number) => Math.round(val).toLocaleString('uz-UZ') + " so'm";

  if (loading) {
    return <div style={{ padding: '20px' }}>Yuklanmoqda...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Moliya Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>JAMI SOTUV (BU OY)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{formatUzs(stats.sales)}</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>JAMI MARJA (BU OY)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>{formatUzs(stats.margin)}</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>MARJA %</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.marginPercent}%</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>OMBOR QOLDIQ (UZS)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f97316' }}>{formatUzs(stats.inventoryValue)}</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>KASSA KIRIM (BU OY)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{formatUzs(stats.cashIn)}</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>KASSA CHIQIM (BU OY)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{formatUzs(stats.cashOut)}</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>SOF CASHFLOW</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stats.netCashflow >= 0 ? '#10b981' : '#ef4444' }}>
            {stats.netCashflow > 0 ? '+' : ''}{formatUzs(stats.netCashflow)}
          </div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>DOLLAR KURSI</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.usdRate.toLocaleString('uz-UZ')} so'm</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Yillik Tahlil</h2>
        <div style={{ overflowX: 'auto' }}>
          {monthlyData.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Hali ma'lumot yo'q — sotuvlar jo'natilishi bilan bu yerda oylik tahlil paydo bo'ladi.</p>
          ) : (
            <table className="data-table" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Oy</th>
                  <th style={{ padding: '12px' }}>Sotuv</th>
                  <th style={{ padding: '12px' }}>Tannarx</th>
                  <th style={{ padding: '12px' }}>Marja</th>
                  <th style={{ padding: '12px' }}>Marja %</th>
                  <th style={{ padding: '12px' }}>Kassa kirim</th>
                  <th style={{ padding: '12px' }}>Kassa chiqim</th>
                  <th style={{ padding: '12px' }}>Sof CF</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{row.month}</td>
                    <td style={{ padding: '12px' }}>{row.sales.toLocaleString('uz-UZ')}</td>
                    <td style={{ padding: '12px' }}>{row.cogs.toLocaleString('uz-UZ')}</td>
                    <td style={{ padding: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>{row.margin.toLocaleString('uz-UZ')}</td>
                    <td style={{ padding: '12px' }}>{row.marginPct}%</td>
                    <td style={{ padding: '12px', color: '#10b981' }}>{row.cashIn.toLocaleString('uz-UZ')}</td>
                    <td style={{ padding: '12px', color: '#ef4444' }}>{row.cashOut.toLocaleString('uz-UZ')}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: row.netCf >= 0 ? '#10b981' : '#ef4444' }}>
                      {row.netCf > 0 ? '+' : ''}{row.netCf.toLocaleString('uz-UZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
