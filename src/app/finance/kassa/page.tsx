'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Plus, Search, Filter, Download, Edit, Trash2 } from 'lucide-react';

export default function KassaPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // 'income', 'expense'

  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate, typeFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cash_transactions')
        .select(`
          *,
          cash_accounts(name, currency),
          chart_of_accounts(name),
          suppliers(name)
        `)
        .order('txn_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (startDate) {
        query = query.gte('txn_date', startDate);
      }
      if (endDate) {
        query = query.lte('txn_date', endDate);
      }
      if (typeFilter === 'income') {
        query = query.gt('income', 0);
      } else if (typeFilter === 'expense') {
        query = query.gt('expense', 0);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatUzs = (val: number) => val?.toLocaleString('uz-UZ');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Kassa (Pul harakatlari)</h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary">
            <Download size={18} style={{ marginRight: '6px' }} /> Eksport
          </button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', background: 'var(--primary)', color: 'white' }}>
            <Plus size={18} style={{ marginRight: '6px' }} /> Yangi Tranzaksiya
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Dan</label>
          <input 
            type="date" 
            className="input-field" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Gacha</label>
          <input 
            type="date" 
            className="input-field" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Tipi</label>
          <select 
            className="input-field" 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Barchasi</option>
            <option value="income">Kirim</option>
            <option value="expense">Chiqim</option>
          </select>
        </div>
        <div>
          <button className="btn btn-secondary" onClick={() => { setStartDate(''); setEndDate(''); setTypeFilter(''); }}>
            Tozlash
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Yuklanmoqda...</div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px' }}>Sana</th>
                <th style={{ padding: '12px' }}>Hisob</th>
                <th style={{ padding: '12px' }}>Manba (Modul)</th>
                <th style={{ padding: '12px' }}>Postavshik/Mijoz</th>
                <th style={{ padding: '12px' }}>Kirim</th>
                <th style={{ padding: '12px' }}>Chiqim</th>
                <th style={{ padding: '12px' }}>UZS Kirim</th>
                <th style={{ padding: '12px' }}>UZS Chiqim</th>
                <th style={{ padding: '12px' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '20px', textAlign: 'center' }}>Ma'lumot topilmadi.</td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.95rem' }}>
                    <td style={{ padding: '12px' }}>{new Date(t.txn_date).toLocaleDateString('uz-UZ')}</td>
                    <td style={{ padding: '12px' }}>{t.cash_accounts?.name}</td>
                    <td style={{ padding: '12px' }}>{Array.isArray(t.chart_of_accounts) ? t.chart_of_accounts[0]?.name : (t.chart_of_accounts as any)?.name}</td>
                    <td style={{ padding: '12px' }}>{t.suppliers?.name || t.customer_name || '-'}</td>
                    
                    <td style={{ padding: '12px', color: '#10b981', fontWeight: t.income > 0 ? 'bold' : 'normal' }}>
                      {t.income > 0 ? `${formatUzs(t.income)} ${t.cash_accounts?.currency}` : '-'}
                    </td>
                    <td style={{ padding: '12px', color: '#ef4444', fontWeight: t.expense > 0 ? 'bold' : 'normal' }}>
                      {t.expense > 0 ? `${formatUzs(t.expense)} ${t.cash_accounts?.currency}` : '-'}
                    </td>
                    
                    <td style={{ padding: '12px', color: '#10b981' }}>
                      {t.income_uzs > 0 ? formatUzs(t.income_uzs) : '-'}
                    </td>
                    <td style={{ padding: '12px', color: '#ef4444' }}>
                      {t.expense_uzs > 0 ? formatUzs(t.expense_uzs) : '-'}
                    </td>
                    
                    <td style={{ padding: '12px' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', marginRight: '10px' }}>
                        <Edit size={16} />
                      </button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
