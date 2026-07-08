'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Scale, CheckCircle, AlertTriangle } from 'lucide-react';

export default function KassaBalancePage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [runningBalances, setRunningBalances] = useState<Record<string, number>>({});
  
  // Bugungi qo'lda kiritilgan qoldiqlar (cash_account_id -> balance)
  const [actualBalances, setActualBalances] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Hisoblarni olamiz
      const { data: accData } = await supabase
        .from('cash_accounts')
        .select('*')
        .eq('is_active', true)
        .eq('is_virtual', false) // "Buxgalteriya (P&L)" virtual hisobi haqiqiy kassa emas — bu yerda ko'rsatilmaydi
        .order('sort_order');
      
      const accList = accData || [];
      setAccounts(accList);

      // 2. Hisoblangan qoldiqlarni olamiz
      // v_cash_running_balance dan eng so'nggi kun uchun eng oxirgi qoldiqni tortamiz
      // Hozircha soddalashtirish uchun, to'g'ridan to'g'ri tranzaksiyalar yig'indisini hisoblaymiz:
      const { data: txns } = await supabase
        .from('cash_transactions')
        .select('cash_account_id, income, expense, income_uzs, expense_uzs');
      
      const balances: Record<string, number> = {};
      if (txns) {
        txns.forEach(tx => {
          if (!balances[tx.cash_account_id]) balances[tx.cash_account_id] = 0;
          // asil valyutada hisoblash (native)
          balances[tx.cash_account_id] += (tx.income - tx.expense);
        });
      }
      setRunningBalances(balances);

      // 3. Bugungi kiritilgan "Haqiqiy" qoldiqlarni tortamiz
      const { data: actualData } = await supabase
        .from('cash_daily_balance')
        .select('*')
        .eq('txn_date', today);
      
      if (actualData) {
        const actuals: Record<string, string> = {};
        actualData.forEach(ad => {
          actuals[ad.cash_account_id] = ad.actual_balance.toString();
        });
        setActualBalances(actuals);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceChange = (accountId: string, val: string) => {
    setActualBalances(prev => ({ ...prev, [accountId]: val }));
  };

  const saveDailyBalance = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const upserts = accounts.map(acc => ({
        txn_date: today,
        cash_account_id: acc.id,
        actual_balance: Number(actualBalances[acc.id]) || 0,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('cash_daily_balance')
        .upsert(upserts, { onConflict: 'txn_date,cash_account_id' });
      
      if (error) throw error;
      setSaveMsg("Qoldiqlar muvaffaqiyatli saqlandi!");
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (error: any) {
      console.error(error);
      setSaveMsg("Xatolik: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Yuklanmoqda...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Kassa Nazorat (Qoldiqlar)</h1>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Har kuni ish yakunida haqiqiy kassangizdagi pul miqdorini shu yerga kiriting. 
          Tizim o'zining hisoblagan summasi bilan farqini ko'rsatib beradi.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Sana: {new Date(today).toLocaleDateString('uz-UZ')}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {saveMsg && <span style={{ color: '#10b981', fontWeight: 'bold' }}>{saveMsg}</span>}
            <button 
              className="btn btn-primary" 
              style={{ background: 'var(--primary)', color: 'white' }}
              onClick={saveDailyBalance}
              disabled={saving}
            >
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px' }}>Hisob Nomi</th>
                <th style={{ padding: '12px' }}>Valyuta</th>
                <th style={{ padding: '12px' }}>Tizim bo'yicha qoldiq</th>
                <th style={{ padding: '12px' }}>Haqiqiy qoldiq (Qo'lda kiritish)</th>
                <th style={{ padding: '12px' }}>Farq (Haqiqiy - Tizim)</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => {
                const systemBalance = runningBalances[acc.id] || 0;
                const actual = Number(actualBalances[acc.id] || 0);
                const diff = actual - systemBalance;
                
                return (
                  <tr key={acc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{acc.name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{acc.currency}</td>
                    
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#2563eb' }}>
                      {systemBalance.toLocaleString('uz-UZ')}
                    </td>
                    
                    <td style={{ padding: '12px' }}>
                      <input 
                        type="number"
                        className="input-field"
                        style={{ margin: 0, maxWidth: '200px' }}
                        value={actualBalances[acc.id] || ''}
                        onChange={(e) => handleBalanceChange(acc.id, e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    
                    <td style={{ padding: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: diff === 0 ? '#10b981' : '#ef4444' }}>
                      {diff === 0 ? (
                        <><CheckCircle size={18} /> {diff.toLocaleString('uz-UZ')}</>
                      ) : (
                        <><AlertTriangle size={18} /> {diff > 0 ? '+' : ''}{diff.toLocaleString('uz-UZ')}</>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
