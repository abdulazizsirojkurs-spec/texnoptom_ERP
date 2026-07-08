'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

const REQUIRES_CONTRACT = [
  'Uzum Nasiya', 'Anor Nasiya', 'Paylater', 'Open Card',
  'Perechesleniya', 'Yarim nasiya yarim naqt',
];

export default function DebtsPage() {
  const [activeTab, setActiveTab] = useState('suppliers');
  
  // Postavshiklar
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [suppliersData, setSuppliersData] = useState<any[]>([]);

  // Mijozlar (Kanallar)
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsData, setChannelsData] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'suppliers') {
      fetchSuppliersDebts();
    } else {
      fetchChannelsDebts();
    }
  }, [activeTab]);

  const fetchSuppliersDebts = async () => {
    setSuppliersLoading(true);
    try {
      // suppliers.balance — yagona ishonchli manba (USD): tovar kelganda ko'payadi,
      // Kassa'da to'lov qilinganda (postavshik tanlansa) kamayadi. receipt_docs/cash_transactions'dan
      // qayta hisoblash AVVAL ishlatilardi, lekin valyutalar (USD/UZS) aralashib, noto'g'ri natija berardi.
      const { data: sups, error: supErr } = await supabase.from('suppliers').select('*').order('name');
      if (supErr) throw supErr;
      setSuppliersData(sups || []);
    } catch (error) {
      console.error(error);
    } finally {
      setSuppliersLoading(false);
    }
  };

  const fetchChannelsDebts = async () => {
    setChannelsLoading(true);
    try {
      // v_customer_debt_by_channel ishonchsiz chiqdi (naqd to'langan sotuvlarni ham
      // qarz deb hisoblagan). Shuning uchun faqat haqiqiy nasiya/perechisleniya
      // kanallarini "qarz" deb hisoblaymiz, qolganini to'liq to'langan deb qabul qilamiz.
      const { data, error } = await supabase
        .from('sales_orders')
        .select('sales_channel, total_uzs_price, is_shipped');
      if (error) throw error;

      const grouped: Record<string, { total_sold: number; debt: number }> = {};
      (data || []).forEach((o: any) => {
        const ch = o.sales_channel || 'Noma\'lum';
        if (!grouped[ch]) grouped[ch] = { total_sold: 0, debt: 0 };
        grouped[ch].total_sold += Number(o.total_uzs_price) || 0;
        if (REQUIRES_CONTRACT.includes(ch) && o.is_shipped) {
          grouped[ch].debt += Number(o.total_uzs_price) || 0;
        }
      });

      setChannelsData(Object.entries(grouped).map(([sales_channel, v]) => ({
        sales_channel, total_sold: v.total_sold, total_paid: v.total_sold - v.debt, debt: v.debt,
      })));
    } catch (error) {
      console.error(error);
      setChannelsData([]);
    } finally {
      setChannelsLoading(false);
    }
  };

  const formatUzs = (val: number) => val?.toLocaleString('uz-UZ') + " so'm";
  const formatUsd = (val: number) => '$' + Number(val || 0).toLocaleString('uz-UZ');

  return (
    <div>
      <h1 className="page-title">Qarzlar (Debitor va Kreditor)</h1>
      
      {/* TABS */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button 
          className="btn"
          style={{ 
            background: activeTab === 'suppliers' ? 'var(--primary)' : 'white', 
            color: activeTab === 'suppliers' ? 'white' : 'inherit',
            border: '1px solid var(--border)' 
          }}
          onClick={() => setActiveTab('suppliers')}
        >
          Postavshiklar (Bizning qarzimiz)
        </button>
        <button 
          className="btn"
          style={{ 
            background: activeTab === 'channels' ? 'var(--primary)' : 'white', 
            color: activeTab === 'channels' ? 'white' : 'inherit',
            border: '1px solid var(--border)' 
          }}
          onClick={() => setActiveTab('channels')}
        >
          Sotuv Kanallari (Mijozlar qarzi)
        </button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        
        {activeTab === 'suppliers' && (
          <>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Kreditor Qarzdorlik (Postavshiklar)</h2>
            {suppliersLoading ? <p>Yuklanmoqda...</p> : (
              <table className="data-table" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '12px' }}>Postavshik nomi</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Qolgan qarz ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliersData.length === 0 ? (
                    <tr><td colSpan={2} style={{ padding: '20px', textAlign: 'center' }}>Ma'lumot topilmadi.</td></tr>
                  ) : suppliersData.map(sup => (
                    <tr key={sup.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{sup.name}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: sup.balance > 0 ? '#ef4444' : sup.balance < 0 ? '#10b981' : 'inherit' }}>
                        {formatUsd(sup.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
              Musbat ($) — biz postavshikka qarzmiz. Manfiy — postavshik bizga ortiqcha qaytarishi kerak (haddan tashqari to'lov).
            </p>
          </>
        )}

        {activeTab === 'channels' && (
          <>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Debitor Qarzdorlik (Sotuv Kanallari / Mijozlar)</h2>
            {channelsLoading ? <p>Yuklanmoqda...</p> : (
              <table className="data-table" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '12px' }}>Sotuv Kanali</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Jami Sotilgan</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Jami To'langan (Kassa)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Qoldiq Qarz (Debitor)</th>
                  </tr>
                </thead>
                <tbody>
                  {channelsData.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>Ma'lumot topilmadi.</td></tr>
                  ) : channelsData.map(ch => (
                    <tr key={ch.sales_channel} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{ch.sales_channel}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{formatUzs(ch.total_sold)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#10b981' }}>{formatUzs(ch.total_paid)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: ch.debt > 0 ? '#f59e0b' : 'inherit' }}>
                        {formatUzs(ch.debt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

      </div>
    </div>
  );
}
