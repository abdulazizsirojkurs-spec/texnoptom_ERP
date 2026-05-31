'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function PayrollAccrualsPage() {
  const [loading, setLoading] = useState(true);
  const [accruals, setAccruals] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    accrual_date: new Date().toISOString().split('T')[0],
    type: 'bonus',
    amount: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: empData } = await supabase.from('employees').select('id, full_name').eq('is_active', true);
      setEmployees(empData || []);

      const { data: accData } = await supabase
        .from('accruals')
        .select('*, employees(full_name)')
        .order('accrual_date', { ascending: false });
      setAccruals(accData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('accruals').insert([{
        employee_id: formData.employee_id,
        accrual_date: formData.accrual_date,
        type: formData.type,
        amount: Number(formData.amount),
        description: formData.description
      }]);
      
      if (error) throw error;
      
      setIsModalOpen(false);
      setFormData({ employee_id: '', accrual_date: new Date().toISOString().split('T')[0], type: 'bonus', amount: '', description: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const formatUzs = (val: number) => val?.toLocaleString('uz-UZ');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Hisoblanmalar (Bonus, Jarima, Avans)</h1>
        
        <button 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', background: 'var(--primary)', color: 'white' }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} style={{ marginRight: '6px' }} /> Yangi Qo'shish
        </button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Yuklanmoqda...</div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px' }}>Sana</th>
                <th style={{ padding: '12px' }}>Xodim</th>
                <th style={{ padding: '12px' }}>Turi</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Summa (UZS)</th>
                <th style={{ padding: '12px' }}>Izoh</th>
                <th style={{ padding: '12px' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {accruals.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center' }}>Hozircha hech qanday yozuv yo'q.</td></tr>
              ) : (
                accruals.map(acc => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.95rem' }}>
                    <td style={{ padding: '12px' }}>{new Date(acc.accrual_date).toLocaleDateString('uz-UZ')}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{acc.employees?.full_name}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
                        backgroundColor: acc.type === 'bonus' ? '#dcfce7' : (acc.type === 'penalty' ? '#fee2e2' : '#fef9c3'),
                        color: acc.type === 'bonus' ? '#166534' : (acc.type === 'penalty' ? '#991b1b' : '#854d0e')
                      }}>
                        {acc.type === 'bonus' ? 'Mukofot/Bonus' : (acc.type === 'penalty' ? 'Jarima/Ushlanma' : 'Avans (Oylikdan tashqari)')}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: acc.type === 'bonus' ? '#10b981' : '#ef4444' }}>
                      {acc.type === 'bonus' ? '+' : '-'}{formatUzs(acc.amount)}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{acc.description}</td>
                    <td style={{ padding: '12px' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', marginRight: '10px' }}><Edit size={16} /></button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '24px' }}>
            <h2 style={{ marginBottom: '20px' }}>Yangi Hisoblanma/Ushlanma</h2>
            <form onSubmit={handleSubmit}>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Xodim</label>
                <select required className="input-field" style={{ width: '100%' }} value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})}>
                  <option value="">-- Xodimni tanlang --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-mobile-col" style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sana</label>
                  <input required type="date" className="input-field" style={{ width: '100%' }} value={formData.accrual_date} onChange={e => setFormData({...formData, accrual_date: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Turi</label>
                  <select required className="input-field" style={{ width: '100%' }} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="bonus">Mukofot / Bonus (+)</option>
                    <option value="penalty">Jarima / Ushlanma (-)</option>
                    <option value="advance">Avans (-)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Summa (UZS)</label>
                <input required type="number" min="0" className="input-field" style={{ width: '100%' }} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="Masalan: 500000" />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Izoh</label>
                <input type="text" className="input-field" style={{ width: '100%' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Nima uchun (ixtiyoriy)" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--primary)', color: 'white' }} disabled={saving}>
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
