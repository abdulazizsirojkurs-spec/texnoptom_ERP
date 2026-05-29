'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { TrendingUp, ArrowDownUp, DollarSign, Package } from 'lucide-react';

export default function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    sales: 0,
    margin: 0,
    marginPercent: 0,
    inventoryValue: 0,
    cashIn: 0,
    cashOut: 0,
    netCashflow: 0,
    usdRate: 12500, // Misol uchun statik yoki keyin API dan olinadi
  });

  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Joriy oy qachon boshlanganini topamiz
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Bu yerda hozircha mock ma'lumotlar turadi,
      // chunki hali bazada to'liq tranzaksiyalar yo'q.
      // Haqiqiy datani RPC yoki view dan tortish quyidagicha bo'ladi:
      
      /*
      const { data: pnlData } = await supabase.from('v_pnl_monthly').select('*');
      // ... hisob-kitoblar ...
      */

      setStats({
        sales: 125430000,
        margin: 38200000,
        marginPercent: 30.4,
        inventoryValue: 312500000,
        cashIn: 142100000,
        cashOut: 88350000,
        netCashflow: 53750000,
        usdRate: 12650,
      });

      setMonthlyData([
        { month: 'Yanvar', sales: 110000000, cogs: 75000000, margin: 35000000, marginPct: 31.8, cashIn: 120000000, cashOut: 90000000, netCf: 30000000 },
        { month: 'Fevral', sales: 115000000, cogs: 80000000, margin: 35000000, marginPct: 30.4, cashIn: 110000000, cashOut: 95000000, netCf: 15000000 },
        { month: 'Mart', sales: 125430000, cogs: 87230000, margin: 38200000, marginPct: 30.4, cashIn: 142100000, cashOut: 88350000, netCf: 53750000 },
      ]);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatUzs = (val: number) => {
    return val.toLocaleString('uz-UZ') + " so'm";
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Yuklanmoqda...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Moliya Dashboard</h1>
      
      {/* 4x2 Grid Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>JAMI SOTUV (BU OY)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--finance-revenue, #10b981)' }}>
            {formatUzs(stats.sales)}
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>JAMI MARJA (BU OY)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--finance-net, #2563eb)' }}>
            {formatUzs(stats.margin)}
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>MARJA %</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {stats.marginPercent}%
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>OMBOR QOLDIQ (UZS)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--finance-cogs, #f97316)' }}>
            {formatUzs(stats.inventoryValue)}
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>KASSA KIRIM (BU OY)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--finance-revenue, #10b981)' }}>
            {formatUzs(stats.cashIn)}
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>KASSA CHIQIM (BU OY)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--finance-tax, #ef4444)' }}>
            {formatUzs(stats.cashOut)}
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>SOF CASHFLOW</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stats.netCashflow >= 0 ? '#10b981' : '#ef4444' }}>
            {stats.netCashflow > 0 ? '+' : ''}{formatUzs(stats.netCashflow)}
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>DOLLAR KURSI</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {stats.usdRate.toLocaleString('uz-UZ')} so'm
          </div>
        </div>

      </div>

      {/* Yillik Tahlil Jadvali */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Yillik Tahlil</h2>
        <div style={{ overflowX: 'auto' }}>
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
        </div>
      </div>

    </div>
  );
}
