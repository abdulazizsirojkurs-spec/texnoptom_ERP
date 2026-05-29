'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Edit, Save, X } from 'lucide-react';

export default function FinanceSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .order('code');
      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (acc: any) => {
    setEditingId(acc.id);
    setEditName(acc.name);
  };

  const handleSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chart_of_accounts')
        .update({ name: editName })
        .eq('id', id);
      
      if (error) throw error;
      
      setEditingId(null);
      fetchAccounts();
    } catch (error) {
      console.error(error);
      alert('Xatolik yuz berdi saqlashda.');
    }
  };

  return (
    <div>
      <h1 className="page-title">Moliya Sozlamalari</h1>
      
      <div className="card" style={{ overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Hisoblar Rejasi (Chart of Accounts)</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Tizimdagi moliya hisobotlari (P&L, Cash Flow) to'g'ri ishlashi uchun hisoblarning kodi o'zgartirilmaydi yoki o'chirilmaydi. 
          Siz faqat hisob nomlarini o'z biznesingizga moslashtirib (masalan, o'zbekchaga tarjima qilib) olishingiz mumkin.
        </p>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Yuklanmoqda...</div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px', width: '100px' }}>Kod</th>
                <th style={{ padding: '12px' }}>Hisob nomi (Siz o'zgartirishingiz mumkin)</th>
                <th style={{ padding: '12px' }}>P&L Bo'limi</th>
                <th style={{ padding: '12px', width: '120px' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr key={acc.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.95rem' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{acc.code}</td>
                  <td style={{ padding: '12px' }}>
                    {editingId === acc.id ? (
                      <input 
                        type="text" 
                        className="input-field" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ width: '100%', margin: 0 }}
                        autoFocus
                      />
                    ) : (
                      acc.name
                    )}
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{acc.pnl_section}</td>
                  <td style={{ padding: '12px' }}>
                    {editingId === acc.id ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleSave(acc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }} title="Saqlash">
                          <Save size={18} />
                        </button>
                        <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Bekor qilish">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleEditClick(acc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }} title="Tahrirlash">
                        <Edit size={18} /> Tahrirlash
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
