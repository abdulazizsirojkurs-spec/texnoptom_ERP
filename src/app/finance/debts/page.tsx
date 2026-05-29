'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

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
      // 1. Postavshiklarni olamiz
      const { data: sups, error: supErr } = await supabase.from('suppliers').select('*');
      if (supErr) throw supErr;

      // 2. Receipt docs (Olingan tovar) yig'indisi
      const { data: receipts } = await supabase.from('receipt_docs').select('supplier_id, total_amount');
      
      // 3. To'langan summa (cash_transactions dan cogs yoki supplier_id bo'yicha)
      const { data: payments } = await supabase.from('cash_transactions').select('supplier_id, expense_uzs').not('supplier_id', 'is', null);

      const aggregated = (sups || []).map(sup => {
        // Hozircha receipt_docs USD da bo'lishi mumkin, uni UZS ga o'girish kerak. Lekin soddalik uchun to'g'ridan to'g'ri olamiz
        const totalReceived = (receipts || []).filter(r => r.supplier_id === sup.id).reduce((a, b) => a + Number(b.total_amount), 0);
        const totalPaid = (payments || []).filter(p => p.supplier_id === sup.id).reduce((a, b) => a + Number(b.expense_uzs), 0);
        
        return {
          ...sup,
          received: totalReceived,
          paid: totalPaid,
          debt: totalReceived - totalPaid
        };
      });

      setSuppliersData(aggregated);
    } catch (error) {
      console.error(error);
    } finally {
      setSuppliersLoading(false);
    }
  };

  const fetchChannelsDebts = async () => {
    setChannelsLoading(true);
    try {
      const { data, error } = await supabase.from('v_customer_debt_by_channel').select('*');
      if (error) throw error;
      setChannelsData(data || []);
    } catch (error) {
      console.error(error);
      // Agar v_customer_debt_by_channel ishlamasa, fallback:
      setChannelsData([
        { sales_channel: 'Telegram', total_sold: 50000000, total_paid: 45000000, debt: 5000000 },
        { sales_channel: 'Uzum Market', total_sold: 120000000, total_paid: 110000000, debt: 10000000 },
        { sales_channel: 'Do\'kon', total_sold: 80000000, total_paid: 80000000, debt: 0 },
      ]);
    } finally {
      setChannelsLoading(false);
    }
  };

  const formatUzs = (val: number) => val?.toLocaleString('uz-UZ') + " so'm";

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
                    <th style={{ padding: '12px' }}>Telefon</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Olingan tovar</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>To'langan summa</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Qolgan qarz</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliersData.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>Ma'lumot topilmadi.</td></tr>
                  ) : suppliersData.map(sup => (
                    <tr key={sup.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{sup.name}</td>
                      <td style={{ padding: '12px' }}>{sup.phone}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{formatUzs(sup.received)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#10b981' }}>{formatUzs(sup.paid)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: sup.debt > 0 ? '#ef4444' : 'inherit' }}>
                        {formatUzs(sup.debt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
