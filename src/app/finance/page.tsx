'use client';
import { useState, useEffect } from 'react';
import { Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/utils/supabase';

export default function FinancePage() {
  const [debts, setDebts] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch receipt docs that act as our debts
      const { data, error } = await supabase
        .from('receipt_docs')
        .select('*, suppliers(name, payment_term_days)')
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      setDebts(data || []);
    } catch (err: any) {
      setErrorMsg("Xatolik: " + err.message);
    }
  };

  const getStatusColor = (dueDate: string | null) => {
    if (!dueDate) return { bg: '#f1f5f9', text: '#475569', icon: <CheckCircle size={18} />, label: 'Muddat belgilanmagan' };
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { bg: '#fee2e2', text: '#b91c1c', icon: <AlertCircle size={18} />, label: `Muddati o'tgan (${Math.abs(diffDays)} kun)` };
    } else if (diffDays <= 3) {
      return { bg: '#fef08a', text: '#854d0e', icon: <Clock size={18} />, label: `Yaqinlashmoqda (${diffDays} kun qoldi)` };
    } else {
      return { bg: '#dcfce7', text: '#15803d', icon: <CheckCircle size={18} />, label: `Vaqti bor (${diffDays} kun qoldi)` };
    }
  };

  return (
    <div>
      <h1 className="page-title">Moliya va To'lovlar</h1>
      
      {/* TABS */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button 
          className="btn btn-primary"
          style={{ background: 'var(--primary)', color: 'white', border: '1px solid var(--border)' }}
        >
          <Calendar size={18} style={{ marginRight: '8px' }} /> To'lov Kalendari
        </button>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginBottom: '20px', fontWeight: 'bold' }}>
          {errorMsg}
        </div>
      )}

      {/* KALENDAR TAB */}
      <div className="card">
        <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Yaqinlashayotgan To'lovlar</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Bu yerda siz kiritgan nakladnoylar bo'yicha qachon kimga qancha qarz to'lashingiz kerakligi ko'rsatilgan.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {debts.length === 0 ? (
            <p>Hozircha qarzlar ro'yxati bo'sh.</p>
          ) : (
            debts.map(debt => {
              const status = getStatusColor(debt.due_date);
              return (
                <div key={debt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'white' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>{debt.suppliers?.name}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Kirim qilingan sana: {new Date(debt.document_date).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '6px', 
                      backgroundColor: status.bg, color: status.text, padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem' 
                    }}>
                      {status.icon} {status.label}
                    </div>
                    {debt.due_date && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Oxirgi kun: {new Date(debt.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      ${Number(debt.total_amount).toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  );
}
