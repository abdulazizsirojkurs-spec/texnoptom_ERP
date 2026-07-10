'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

export default function DebtsPage() {
  const [activeTab, setActiveTab] = useState('suppliers');

  // Postavshiklar
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [suppliersData, setSuppliersData] = useState<any[]>([]);

  // Mijozlar (to'lanmagan buyurtmalar — is_paid=false)
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
      // Kanal bo'yicha taxmin qilish ISHONCHSIZ chiqdi (masalan Uzum Nasiya/Perechesleniya
      // ham darhol to'lanishi mumkin ekan — bu tashkilotdan tashkilotga farq qiladi).
      // Endi qarz FAQAT sales_orders.is_paid=false deb belgilangan aniq buyurtmalar
      // bo'yicha hisoblanadi (buxgalter tomonidan qo'lda belgilanadi).
      const { data, error } = await supabase
        .from('sales_orders')
        .select('order_code, client_name, client_phone, sales_channel, total_uzs_price, created_at')
        .eq('is_paid', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setChannelsData(data || []);
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
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Debitor Qarzdorlik (To'lanmagan buyurtmalar)</h2>
            {channelsLoading ? <p>Yuklanmoqda...</p> : (
              <table className="data-table" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '12px' }}>Buyurtma</th>
                    <th style={{ padding: '12px' }}>Mijoz</th>
                    <th style={{ padding: '12px' }}>Kanal</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Qarz summasi</th>
                  </tr>
                </thead>
                <tbody>
                  {channelsData.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>To'lanmagan buyurtma yo'q — barchasi to'langan.</td></tr>
                  ) : channelsData.map((o: any) => (
                    <tr key={o.order_code} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{o.order_code}</td>
                      <td style={{ padding: '12px' }}>{o.client_name}<div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{o.client_phone}</div></td>
                      <td style={{ padding: '12px' }}>{o.sales_channel}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#f59e0b' }}>
                        {formatUzs(o.total_uzs_price)}
                      </td>
                    </tr>
                  ))}
                  {channelsData.length > 0 && (
                    <tr style={{ backgroundColor: '#fffbeb', fontWeight: 'bold' }}>
                      <td colSpan={3} style={{ padding: '12px' }}>JAMI</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#f59e0b' }}>
                        {formatUzs(channelsData.reduce((s: number, o: any) => s + Number(o.total_uzs_price), 0))}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </>
        )}

      </div>
    </div>
  );
}
