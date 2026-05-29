'use client';
import { useState } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

export default function BalanceSheetPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Hozircha statik, chunki bu eng murakkab qism va barcha hisob raqamlardan tortib kelishni talab qiladi
  const [loading, setLoading] = useState(false);

  // Namuna ma'lumotlar
  const cashArr = Array(12).fill(0).map((_, i) => 100000000 + (i * 5000000));
  const inventoryArr = Array(12).fill(0).map((_, i) => 300000000 - (i * 2000000));
  const receivablesArr = Array(12).fill(0).map((_, i) => 50000000 + (i * 1000000));
  const fixedAssetsArr = Array(12).fill(150000000); // O'zgarmaydi (amortizatsiya olinmaguncha)
  
  const totalAssets = MONTHS.map((_, i) => cashArr[i] + inventoryArr[i] + receivablesArr[i] + fixedAssetsArr[i]);

  const payablesArr = Array(12).fill(0).map((_, i) => 80000000 + (i * 1500000));
  const loansArr = Array(12).fill(0).map((_, i) => 120000000 - (i * 5000000));
  const equityArr = Array(12).fill(300000000);
  const retainedEarnings = MONTHS.map((_, i) => totalAssets[i] - (payablesArr[i] + loansArr[i] + equityArr[i]));
  
  const totalLiabilities = MONTHS.map((_, i) => payablesArr[i] + loansArr[i]);
  const totalEquity = MONTHS.map((_, i) => equityArr[i] + retainedEarnings[i]);
  const totalPassives = MONTHS.map((_, i) => totalLiabilities[i] + totalEquity[i]);

  const diffs = MONTHS.map((_, i) => totalAssets[i] - totalPassives[i]);

  const formatUzs = (val: number) => val.toLocaleString('uz-UZ');

  const renderRow = (label: string, arr: number[], color = 'inherit', isSub = true) => (
    <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
      <td style={{ padding: '10px 12px', paddingLeft: isSub ? '32px' : '12px', color: 'var(--text-secondary)' }}>{label}</td>
      {arr.map((val, i) => <td key={i} style={{ padding: '10px 12px', textAlign: 'right', color }}>{formatUzs(val)}</td>)}
    </tr>
  );

  const renderSubTotal = (label: string, arr: number[], bg = '#f8fafc', color = 'inherit') => (
    <tr style={{ backgroundColor: bg, fontWeight: 'bold', borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '12px', color }}>{label}</td>
      {arr.map((val, i) => <td key={i} style={{ padding: '12px', textAlign: 'right', color }}>{formatUzs(val)}</td>)}
    </tr>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Balans (Balance Sheet)</h1>
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
            </tr>
          </thead>
          <tbody>
            
            {/* AKTIVLAR */}
            <tr style={{ backgroundColor: '#1e3a8a', color: 'white', fontWeight: 'bold' }}>
              <td colSpan={13} style={{ padding: '12px', textAlign: 'center' }}>AKTIVLAR (Assets)</td>
            </tr>
            
            {renderRow('Kassa qoldig\'i', cashArr)}
            {renderRow('Ombor zaxirasi', inventoryArr)}
            {renderRow('Mijozlar qarzi (Debitorlar)', receivablesArr)}
            {renderRow('Asosiy vositalar (qoldiq qiymat)', fixedAssetsArr)}
            
            {renderSubTotal('JAMI AKTIVLAR', totalAssets, '#dbeafe', '#1e40af')}

            {/* PASSIVLAR */}
            <tr style={{ backgroundColor: '#7f1d1d', color: 'white', fontWeight: 'bold' }}>
              <td colSpan={13} style={{ padding: '12px', textAlign: 'center' }}>PASSIVLAR (Liabilities & Equity)</td>
            </tr>
            
            {renderRow('Postavshiklardan qarz (Kreditorlar)', payablesArr)}
            {renderRow('Kredit / Qarzlar', loansArr)}
            {renderSubTotal('JAMI MAJBURIYATLAR', totalLiabilities, '#fee2e2', '#991b1b')}
            
            {renderRow('Ustav kapitali', equityArr)}
            {renderRow('Taqsimlanmagan foyda', retainedEarnings)}
            {renderSubTotal('JAMI KAPITAL', totalEquity, '#fef9c3', '#854d0e')}

            {renderSubTotal('JAMI PASSIVLAR', totalPassives, '#fecaca', '#991b1b')}

            {/* FARQ */}
            <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold', fontSize: '1.1rem' }}>
              <td style={{ padding: '16px' }}>FARQ (AKTIV - PASSIV)</td>
              {diffs.map((val, i) => (
                <td key={i} style={{ padding: '16px', textAlign: 'right', color: val === 0 ? '#10b981' : '#ef4444' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {val === 0 ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    {formatUzs(val)}
                  </div>
                </td>
              ))}
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
}
