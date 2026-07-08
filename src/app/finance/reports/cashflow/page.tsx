'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

export default function CashFlowPage() {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Ma'lumotlarni saqlash tuzilmasi: section -> array[12]
  const [cfData, setCfData] = useState<any>({});

  useEffect(() => {
    fetchCashFlowData();
  }, [selectedYear]);

  const fetchCashFlowData = async () => {
    setLoading(true);
    try {
      const startOfYear = `${selectedYear}-01-01`;
      const endOfYear = `${selectedYear}-12-31`;

      // MUHIM: "Buxgalteriya (P&L)" virtual hisobidagi yozuvlar bu yerga kirmasligi kerak —
      // ular haqiqiy pul harakati emas (faqat P&L uchun avtomatik daromad/tan narx yozuvi).
      // Cash Flow faqat HAQIQIY kassa harakatlarini ko'rsatishi kerak.
      const { data, error } = await supabase
        .from('cash_transactions')
        .select(`
          txn_date, income_uzs, expense_uzs,
          chart_of_accounts(pnl_section),
          cash_accounts!inner(is_virtual)
        `)
        .eq('cash_accounts.is_virtual', false)
        .gte('txn_date', startOfYear)
        .lte('txn_date', endOfYear);

      if (error) throw error;

      // Boshlang'ich qoldiq: shu yil boshidan OLDINGI barcha haqiqiy tranzaksiyalar yig'indisi
      const { data: priorTxns } = await supabase
        .from('cash_transactions')
        .select(`income_uzs, expense_uzs, cash_accounts!inner(is_virtual)`)
        .eq('cash_accounts.is_virtual', false)
        .lt('txn_date', startOfYear);
      const realStartBalance = (priorTxns || []).reduce(
        (s, t: any) => s + (Number(t.income_uzs) || 0) - (Number(t.expense_uzs) || 0), 0
      );

      // Kategoriya bo'yicha guruhlaymiz
      const grouped: any = {
        operational_in: Array(12).fill(0),
        operational_out: Array(12).fill(0),
        invest_in: Array(12).fill(0),
        invest_out: Array(12).fill(0),
        finance_in: Array(12).fill(0),
        finance_out: Array(12).fill(0),
      };

      if (data) {
        data.forEach(tx => {
          const m = new Date(tx.txn_date).getMonth();
          const chartAcc: any = tx.chart_of_accounts;
          const section = Array.isArray(chartAcc) ? chartAcc[0]?.pnl_section : chartAcc?.pnl_section;
          
          if (section === 'revenue' || section === 'other_income') {
            grouped.operational_in[m] += tx.income_uzs;
            grouped.operational_out[m] += tx.expense_uzs; // refund bo'lishi mumkin
          } 
          else if (['cogs', 'overhead', 'admin', 'selling', 'tax'].includes(section)) {
            grouped.operational_out[m] += tx.expense_uzs;
          }
          else if (section === 'capital') {
            grouped.invest_out[m] += tx.expense_uzs;
            grouped.invest_in[m] += tx.income_uzs;
          }
          else if (section === 'loan') {
            grouped.finance_in[m] += tx.income_uzs;
            grouped.finance_out[m] += tx.expense_uzs;
          }
        });
      }

      grouped.startBalance = realStartBalance;
      setCfData(grouped);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatUzs = (val: number) => {
    if (!val) return '-';
    return val.toLocaleString('uz-UZ');
  };

  if (loading) return <div style={{ padding: '20px' }}>Yuklanmoqda...</div>;

  const opIn = cfData.operational_in || Array(12).fill(0);
  const opOut = cfData.operational_out || Array(12).fill(0);
  const opNet = MONTHS.map((_, i) => opIn[i] - opOut[i]);

  const invIn = cfData.invest_in || Array(12).fill(0);
  const invOut = cfData.invest_out || Array(12).fill(0);
  const invNet = MONTHS.map((_, i) => invIn[i] - invOut[i]);

  const finIn = cfData.finance_in || Array(12).fill(0);
  const finOut = cfData.finance_out || Array(12).fill(0);
  const finNet = MONTHS.map((_, i) => finIn[i] - finOut[i]);

  const totalNet = MONTHS.map((_, i) => opNet[i] + invNet[i] + finNet[i]);
  const ytd = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  // Boshlang'ich qoldiq — shu yildan OLDINGI haqiqiy kassa qoldig'i (endi hardcoded 0 emas)
  let runningStart = cfData.startBalance || 0;
  const startBal = MONTHS.map((_, i) => {
    const s = runningStart;
    runningStart += totalNet[i];
    return s;
  });
  const endBal = MONTHS.map((_, i) => startBal[i] + totalNet[i]);

  const renderRow = (label: string, arr: number[], color = 'inherit', indent = false) => (
    <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
      <td style={{ padding: '10px 12px', paddingLeft: indent ? '32px' : '12px', color: 'var(--text-secondary)' }}>{label}</td>
      {arr.map((val, i) => <td key={i} style={{ padding: '10px 12px', textAlign: 'right', color }}>{formatUzs(val)}</td>)}
      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', color }}>{formatUzs(ytd(arr))}</td>
    </tr>
  );

  const renderSubTotal = (label: string, arr: number[], bg = '#f8fafc', color = 'inherit') => (
    <tr style={{ backgroundColor: bg, fontWeight: 'bold', borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '12px', color }}>{label}</td>
      {arr.map((val, i) => <td key={i} style={{ padding: '12px', textAlign: 'right', color }}>{formatUzs(val)}</td>)}
      <td style={{ padding: '12px', textAlign: 'right', color }}>{formatUzs(ytd(arr))}</td>
    </tr>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Pul Oqimlari (Cash Flow)</h1>
        <div>
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
            
            {/* OPERATSION */}
            {renderSubTotal('I. Operatsion faoliyat', opNet, '#e0f2fe', '#0369a1')}
            {renderRow('Tushumlar (Sotuv)', opIn, '#10b981', true)}
            {renderRow("To'lovlar (Tovarlar, Ish haqi, Soliq)", opOut, '#ef4444', true)}

            {/* INVESTITSION */}
            {renderSubTotal('II. Investitsion faoliyat', invNet, '#dbeafe', '#1e40af')}
            {renderRow('Asosiy vositalar sotish/investitsiya kiritish', invIn, '#10b981', true)}
            {renderRow('Asosiy vositalar xaridi', invOut, '#ef4444', true)}

            {/* MOLIYAVIY */}
            {renderSubTotal('III. Moliyaviy faoliyat', finNet, '#bfdbfe', '#1d4ed8')}
            {renderRow('Qarz olinishi', finIn, '#10b981', true)}
            {renderRow('Qarz qaytarilishi / Dividend', finOut, '#ef4444', true)}

            {/* JAMI SOF KASSA */}
            {renderSubTotal('SOF KASSA OQIMI (I+II+III)', totalNet, '#2563eb', 'white')}

            {/* QOLDIQLAR */}
            <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>
              <td style={{ padding: '16px', color: '#475569' }}>Kassa boshlang'ich qoldig'i</td>
              {startBal.map((val, i) => <td key={i} style={{ padding: '16px', textAlign: 'right' }}>{formatUzs(val)}</td>)}
              <td style={{ padding: '16px', textAlign: 'right' }}>-</td>
            </tr>
            <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
              <td style={{ padding: '16px', color: '#0f172a' }}>Kassa oxirgi qoldig'i</td>
              {endBal.map((val, i) => <td key={i} style={{ padding: '16px', textAlign: 'right' }}>{formatUzs(val)}</td>)}
              <td style={{ padding: '16px', textAlign: 'right' }}>-</td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
}
