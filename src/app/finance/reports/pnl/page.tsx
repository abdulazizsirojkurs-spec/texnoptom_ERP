'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

// Hisobot boshlanish sanasi: shu sanadan oldingi buyurtmalarda tan narx va batafsil
// kirim-chiqim ma'lumotlari kiritilmagan (tizimni yuritish shu sanadan boshlangan).
// Shu sababli marja/foyda hisob-kitobi faqat shu sanadan boshlab olinadi — aks holda
// tan narxi noma'lum katta hajmdagi tarixiy sotuvlar marjani soxta yuqori ko'rsatib yuboradi.
const DEFAULT_CUTOFF = '2026-07-10';

export default function PnLPage() {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [cutoffDate, setCutoffDate] = useState(DEFAULT_CUTOFF);
  const [legacyRevenue, setLegacyRevenue] = useState<{ count: number; total: number } | null>(null);

  // Data structure: section -> account_code -> monthIndex -> amount
  const [pnlData, setPnlData] = useState<any>({});

  useEffect(() => {
    fetchPnlData();
    fetchLegacySummary();
  }, [selectedYear, cutoffDate]);

  const fetchLegacySummary = async () => {
    // Kesim sanasidan oldingi buyurtmalar — faqat ma'lumot uchun, marja hisobiga kirmaydi.
    const { data, error } = await supabase
      .from('sales_orders')
      .select('total_uzs_price')
      .lt('created_at', cutoffDate);
    if (error) { setLegacyRevenue(null); return; }
    setLegacyRevenue({
      count: data?.length || 0,
      total: (data || []).reduce((s, r: any) => s + (Number(r.total_uzs_price) || 0), 0),
    });
  };

  const fetchPnlData = async () => {
    setLoading(true);
    try {
      const startOfYear = `${selectedYear}-01-01`;
      const endOfYear = `${selectedYear}-12-31`;
      const effectiveStart = cutoffDate > startOfYear ? cutoffDate : startOfYear;

      // v_pnl_monthly emas, cash_transactions'dan to'g'ridan-to'g'ri — kesim sanasi bo'yicha
      // kunlik filtr qo'yish uchun (oylik view buni qo'llab-quvvatlamaydi).
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('txn_date, income_uzs, expense_uzs, account_code, chart_of_accounts(pnl_section, name)')
        .gte('txn_date', effectiveStart)
        .lte('txn_date', endOfYear)
        .limit(5000);

      if (error) throw error;

      // Ma'lumotlarni guruhlash
      const grouped: any = {
        revenue: {}, cogs: {}, overhead: {}, admin: {}, selling: {}, tax: {}, other_income: {}
      };

      if (data) {
        data.forEach((row: any) => {
          const coa = row.chart_of_accounts;
          if (!coa) return;
          const m = new Date(row.txn_date).getMonth(); // 0-11
          const section = coa.pnl_section;
          if (grouped[section]) {
            if (!grouped[section][coa.name]) {
              grouped[section][coa.name] = Array(12).fill(0);
            }
            const net = (Number(row.income_uzs) || 0) - (Number(row.expense_uzs) || 0);
            const val = section === 'revenue' || section === 'other_income' ? net : (Number(row.expense_uzs) || 0);
            grouped[section][coa.name][m] += val;
          }
        });
      }

      setPnlData(grouped);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (sectionData: any, monthIndex: number): number => {
    if (!sectionData) return 0;
    return Object.values(sectionData).reduce((sum: number, arr: any) => sum + (Number(arr[monthIndex]) || 0), 0);
  };

  const formatUzs = (val: number) => {
    if (val === 0) return '-';
    return val.toLocaleString('uz-UZ');
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Yuklanmoqda...</div>;
  }

  // Row render helper
  const renderRow = (label: string, sectionData: any, isSubRow = false) => {
    if (!sectionData) return null;
    return Object.entries(sectionData).map(([accName, arr]: [string, any]) => (
      <tr key={accName} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        <td style={{ padding: '8px 12px', paddingLeft: isSubRow ? '32px' : '12px' }}>{accName}</td>
        {MONTHS.map((_, i) => <td key={i} style={{ padding: '8px 12px', textAlign: 'right' }}>{formatUzs(arr[i])}</td>)}
        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>
          {formatUzs(arr.reduce((a: number, b: number) => a + b, 0))}
        </td>
      </tr>
    ));
  };

  const renderSubTotal = (label: string, sectionKey: string, isNegative = false) => {
    const arr: number[] = MONTHS.map((_, i) => Number(calculateTotal(pnlData[sectionKey], i)) || 0);
    const total = arr.reduce((a, b) => a + b, 0);
    return (
      <tr style={{ backgroundColor: '#f0f9ff', fontWeight: 'bold', borderBottom: '1px solid var(--border)' }}>
        <td style={{ padding: '12px' }}>{label}</td>
        {arr.map((val, i) => (
          <td key={i} style={{ padding: '12px', textAlign: 'right', color: isNegative ? '#ef4444' : 'inherit' }}>
            {formatUzs(val)}
          </td>
        ))}
        <td style={{ padding: '12px', textAlign: 'right', color: isNegative ? '#ef4444' : 'inherit' }}>{formatUzs(total)}</td>
      </tr>
    );
  };

  // Asosiy hisoblar arraylari
  const revenueArr = MONTHS.map((_, i) => calculateTotal(pnlData.revenue, i));
  const cogsArr = MONTHS.map((_, i) => calculateTotal(pnlData.cogs, i));
  const marginArr = MONTHS.map((_, i) => revenueArr[i] - cogsArr[i]);
  const overheadArr = MONTHS.map((_, i) => calculateTotal(pnlData.overhead, i));
  const grossProfitArr = MONTHS.map((_, i) => marginArr[i] - overheadArr[i]);
  const adminArr = MONTHS.map((_, i) => calculateTotal(pnlData.admin, i));
  const sellingArr = MONTHS.map((_, i) => calculateTotal(pnlData.selling, i));
  const operatingProfitArr = MONTHS.map((_, i) => grossProfitArr[i] - adminArr[i] - sellingArr[i]);
  const otherIncArr = MONTHS.map((_, i) => calculateTotal(pnlData.other_income, i));
  const taxArr = MONTHS.map((_, i) => calculateTotal(pnlData.tax, i));
  const netProfitArr = MONTHS.map((_, i) => operatingProfitArr[i] + otherIncArr[i] - taxArr[i]);

  const ytd = (arr: number[]) => arr.reduce((a,b)=>a+b,0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Profit & Loss (P&L)</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Hisoblash boshlanish sanasi</label>
            <input type="date" className="input-field" value={cutoffDate} onChange={(e) => setCutoffDate(e.target.value)} />
          </div>
          <select
            className="input-field"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>
        </div>
      </div>

      {legacyRevenue && legacyRevenue.count > 0 && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
          padding: '14px 18px', marginBottom: 20, fontSize: '0.88rem', color: '#92400e',
        }}>
          <b>Diqqat:</b> {cutoffDate} sanasidan oldin <b>{legacyRevenue.count} ta buyurtma</b> bo'lgan
          (jami <b>{Math.round(legacyRevenue.total).toLocaleString('uz-UZ')} so'm</b> aylanma), lekin ularda
          tan narx va batafsil kirim-chiqim ma'lumotlari kiritilmagan (tizimni yuritish shu sanadan boshlangan).
          Shu sabab bu buyurtmalar <b>quyidagi hisob-kitobga kiritilmagan</b> — aks holda marja/foyda
          foizi noto'g'ri (soxta yuqori) chiqib qolar edi. Sanani yuqoridagi maydondan o'zgartirishingiz mumkin.
        </div>
      )}

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'right', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Ko'rsatkichlar</th>
              {MONTHS.map(m => <th key={m} style={{ padding: '12px' }}>{m}</th>)}
              <th style={{ padding: '12px' }}>YILLIK JAMI</th>
            </tr>
          </thead>
          <tbody>
            
            {renderSubTotal('Daromad (Revenue)', 'revenue')}
            {renderRow('', pnlData.revenue, true)}

            {renderSubTotal('Umumiy Tannarx (COGS)', 'cogs', true)}
            {renderRow('', pnlData.cogs, true)}

            {/* MARJA */}
            <tr style={{ backgroundColor: '#e0f2fe', fontWeight: 'bold' }}>
              <td style={{ padding: '12px', color: '#0369a1' }}>Umumiy Marja (Gross Margin)</td>
              {marginArr.map((val, i) => (
                <td key={i} style={{ padding: '12px', textAlign: 'right', color: val >= 0 ? '#10b981' : '#ef4444' }}>{formatUzs(val)}</td>
              ))}
              <td style={{ padding: '12px', textAlign: 'right', color: ytd(marginArr) >= 0 ? '#10b981' : '#ef4444' }}>{formatUzs(ytd(marginArr))}</td>
            </tr>

            {renderSubTotal('Nakladnoy xarajatlar', 'overhead', true)}
            {renderRow('', pnlData.overhead, true)}

            {/* YALPI FOYDA */}
            <tr style={{ backgroundColor: '#dbeafe', fontWeight: 'bold' }}>
              <td style={{ padding: '12px', color: '#1e40af' }}>Yalpi Foyda (Gross Profit)</td>
              {grossProfitArr.map((val, i) => (
                <td key={i} style={{ padding: '12px', textAlign: 'right', color: val >= 0 ? '#10b981' : '#ef4444' }}>{formatUzs(val)}</td>
              ))}
              <td style={{ padding: '12px', textAlign: 'right', color: ytd(grossProfitArr) >= 0 ? '#10b981' : '#ef4444' }}>{formatUzs(ytd(grossProfitArr))}</td>
            </tr>

            {renderSubTotal('Adminstrativ xarajatlar', 'admin', true)}
            {renderRow('', pnlData.admin, true)}

            {renderSubTotal('Tijoriy xarajatlar', 'selling', true)}
            {renderRow('', pnlData.selling, true)}

            {/* OPERATIV FOYDA */}
            <tr style={{ backgroundColor: '#bfdbfe', fontWeight: 'bold' }}>
              <td style={{ padding: '12px', color: '#1d4ed8' }}>Operativ Foyda (Operating Profit)</td>
              {operatingProfitArr.map((val, i) => (
                <td key={i} style={{ padding: '12px', textAlign: 'right', color: val >= 0 ? '#10b981' : '#ef4444' }}>{formatUzs(val)}</td>
              ))}
              <td style={{ padding: '12px', textAlign: 'right', color: ytd(operatingProfitArr) >= 0 ? '#10b981' : '#ef4444' }}>{formatUzs(ytd(operatingProfitArr))}</td>
            </tr>

            {renderSubTotal('Kutilmagan daromad/zaxira', 'other_income')}
            
            {renderSubTotal('Soliqlar', 'tax', true)}

            {/* SOF FOYDA */}
            <tr style={{ backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' }}>
              <td style={{ padding: '16px' }}>SOF FOYDA (Net Profit)</td>
              {netProfitArr.map((val, i) => (
                <td key={i} style={{ padding: '16px', textAlign: 'right' }}>{formatUzs(val)}</td>
              ))}
              <td style={{ padding: '16px', textAlign: 'right' }}>{formatUzs(ytd(netProfitArr))}</td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
}
