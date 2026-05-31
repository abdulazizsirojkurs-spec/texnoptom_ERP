'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function FixedAssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    acquisition_date: new Date().toISOString().split('T')[0],
    acquisition_cost: '',
    useful_life_months: '60'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fixed_assets')
        .select('*')
        .order('acquisition_date', { ascending: false });
      
      if (error) throw error;

      // Qoldiq qiymatni hisoblash (Amortizatsiya)
      const now = new Date();
      const enriched = (data || []).map(asset => {
        const acqDate = new Date(asset.acquisition_date);
        
        let monthsPassed = (now.getFullYear() - acqDate.getFullYear()) * 12 + (now.getMonth() - acqDate.getMonth());
        if (monthsPassed < 0) monthsPassed = 0;
        if (monthsPassed > asset.useful_life_months) monthsPassed = asset.useful_life_months;

        const amortizedAmount = monthsPassed * asset.monthly_depreciation;
        const currentBookValue = asset.acquisition_cost - amortizedAmount;

        return { ...asset, currentBookValue, monthsPassed };
      });

      setAssets(enriched);
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
      const { error } = await supabase.from('fixed_assets').insert([{
        name: formData.name,
        category: formData.category,
        acquisition_date: formData.acquisition_date,
        acquisition_cost: Number(formData.acquisition_cost),
        useful_life_months: Number(formData.useful_life_months),
        status: 'active'
      }]);
      if (error) throw error;
      
      setIsModalOpen(false);
      setFormData({ name: '', category: '', acquisition_date: new Date().toISOString().split('T')[0], acquisition_cost: '', useful_life_months: '60' });
      fetchAssets();
    } catch (error) {
      console.error(error);
      alert("Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const formatUzs = (val: number) => val?.toLocaleString('uz-UZ');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Asosiy Vositalar</h1>
        
        <button 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', background: 'var(--primary)', color: 'white' }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} style={{ marginRight: '6px' }} /> Yangi qo'shish
        </button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Yuklanmoqda...</div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px' }}>Nomi</th>
                <th style={{ padding: '12px' }}>Kategoriya</th>
                <th style={{ padding: '12px' }}>Olingan sana</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Boshlang'ich qiymat</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Xizmat muddati</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Oylik Amortizatsiya</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Qoldiq qiymat</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '20px', textAlign: 'center' }}>Asosiy vositalar mavjud emas.</td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.95rem' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{asset.name}</td>
                    <td style={{ padding: '12px' }}>{asset.category || '-'}</td>
                    <td style={{ padding: '12px' }}>{new Date(asset.acquisition_date).toLocaleDateString('uz-UZ')}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formatUzs(asset.acquisition_cost)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{asset.useful_life_months} oy <br/><span style={{fontSize:'0.8rem', color:'gray'}}>({asset.monthsPassed} o'tdi)</span></td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#f59e0b' }}>{formatUzs(asset.monthly_depreciation)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#2563eb' }}>{formatUzs(asset.currentBookValue)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
                        backgroundColor: asset.status === 'active' ? '#dcfce7' : '#f1f5f9',
                        color: asset.status === 'active' ? '#166534' : '#475569'
                      }}>
                        {asset.status === 'active' ? 'Aktiv' : 'Sotilgan'}
                      </span>
                    </td>
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

      {/* Qo'shish Modali */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '24px' }}>
            <h2 style={{ marginBottom: '20px' }}>Yangi asosiy vosita qo'shish</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nomi</label>
                <input required type="text" className="input-field" style={{ width: '100%' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="flex-mobile-col" style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Kategoriya</label>
                  <input type="text" className="input-field" style={{ width: '100%' }} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Masalan: Mebel, Texnika" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Olingan sana</label>
                  <input required type="date" className="input-field" style={{ width: '100%' }} value={formData.acquisition_date} onChange={e => setFormData({...formData, acquisition_date: e.target.value})} />
                </div>
              </div>

              <div className="flex-mobile-col" style={{ marginBottom: '24px', display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Qiymati (UZS)</label>
                  <input required type="number" min="0" className="input-field" style={{ width: '100%' }} value={formData.acquisition_cost} onChange={e => setFormData({...formData, acquisition_cost: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Yaroqlilik muddati (Oy)</label>
                  <input required type="number" min="1" className="input-field" style={{ width: '100%' }} value={formData.useful_life_months} onChange={e => setFormData({...formData, useful_life_months: e.target.value})} />
                </div>
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
