'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';

export default function ObligationsPage() {
  const [loading, setLoading] = useState(true);
  const [obligations, setObligations] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    obligation_date: new Date().toISOString().split('T')[0],
    type: 'Soliq',
    amount: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('obligations')
        .select('*')
        .order('obligation_date', { ascending: false });
      
      if (error) throw error;
      setObligations(data || []);
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
      const { error } = await supabase.from('obligations').insert([{
        obligation_date: formData.obligation_date,
        type: formData.type,
        amount: Number(formData.amount),
        description: formData.description,
        paid_amount: 0
      }]);
      
      if (error) throw error;
      
      setIsModalOpen(false);
      setFormData({ obligation_date: new Date().toISOString().split('T')[0], type: 'Soliq', amount: '', description: '' });
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
        <h1 className="page-title" style={{ margin: 0 }}>Majburiyatlar (Soliq, Arenda)</h1>
        
        <button 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', background: 'var(--primary)', color: 'white' }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} style={{ marginRight: '6px' }} /> Yangi Qo'shish
        </button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Oylik majburiyatlar (Masalan: daromad solig'i, ijara haqi, kommunal to'lovlar) bu yerga hisoblangan sifatida yozib boriladi.
        </p>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Yuklanmoqda...</div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px' }}>Sana</th>
                <th style={{ padding: '12px' }}>Turi</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Hisoblangan Summa</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>To'langan Summa</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Qarz/Qoldiq</th>
                <th style={{ padding: '12px' }}>Izoh</th>
                <th style={{ padding: '12px' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {obligations.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center' }}>Hozircha majburiyatlar yo'q.</td></tr>
              ) : (
                obligations.map(obl => {
                  const diff = obl.amount - obl.paid_amount;
                  return (
                    <tr key={obl.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.95rem' }}>
                      <td style={{ padding: '12px' }}>{new Date(obl.obligation_date).toLocaleDateString('uz-UZ')}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{obl.type}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{formatUzs(obl.amount)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#10b981' }}>{formatUzs(obl.paid_amount)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: diff > 0 ? '#ef4444' : '#10b981' }}>
                        {diff === 0 ? <span style={{display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'4px'}}><CheckCircle size={16}/>To'langan</span> : formatUzs(diff)}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{obl.description}</td>
                      <td style={{ padding: '12px' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', marginRight: '10px' }}><Edit size={16} /></button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '24px' }}>
            <h2 style={{ marginBottom: '20px' }}>Yangi Majburiyat</h2>
            <form onSubmit={handleSubmit}>
              
              <div className="flex-mobile-col" style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sana</label>
                  <input required type="date" className="input-field" style={{ width: '100%' }} value={formData.obligation_date} onChange={e => setFormData({...formData, obligation_date: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Turi</label>
                  <select required className="input-field" style={{ width: '100%' }} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="Soliq">Soliq</option>
                    <option value="Ijara">Ijara (Arenda)</option>
                    <option value="Kommunal">Kommunal to'lov</option>
                    <option value="Internet/Aloqa">Internet/Aloqa</option>
                    <option value="Boshqa">Boshqa</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Summa (UZS)</label>
                <input required type="number" min="0" className="input-field" style={{ width: '100%' }} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="Masalan: 2000000" />
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
