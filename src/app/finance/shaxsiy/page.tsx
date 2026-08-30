'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, ChevronRight, Wallet, PiggyBank, AlertTriangle } from 'lucide-react';

type CategoryRow = { code: string; name: string; sort_order: number };

const MONTH_NAMES = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

export default function ShaxsiyMoliyaPage() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [limits, setLimits] = useState<Record<string, string>>({});
  const [spent, setSpent] = useState<Record<string, number>>({});
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: cats } = await supabase
        .from('chart_of_accounts')
        .select('code, name, sort_order')
        .gte('code', '19004')
        .lte('code', '19016')
        .order('sort_order');
      setCategories(cats || []);

      const { data: budgets } = await supabase.from('personal_budgets').select('category_code, monthly_limit_uzs');
      const limitMap: Record<string, string> = {};
      (budgets || []).forEach((b: any) => { limitMap[b.category_code] = String(b.monthly_limit_uzs || 0); });
      setLimits(limitMap);

      const from = new Date(cursor.year, cursor.month, 1).toISOString().slice(0, 10);
      const to = new Date(cursor.year, cursor.month + 1, 0).toISOString().slice(0, 10);
      const { data: txns } = await supabase
        .from('cash_transactions')
        .select('personal_category_code, expense_uzs')
        .not('personal_category_code', 'is', null)
        .gte('txn_date', from)
        .lte('txn_date', to);

      const spentMap: Record<string, number> = {};
      (txns || []).forEach((t: any) => {
        const code = t.personal_category_code;
        spentMap[code] = (spentMap[code] || 0) + (Number(t.expense_uzs) || 0);
      });
      setSpent(spentMap);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveLimits = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const upserts = categories.map(c => ({
        category_code: c.code,
        monthly_limit_uzs: Number(limits[c.code]) || 0,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('personal_budgets').upsert(upserts, { onConflict: 'category_code' });
      if (error) throw error;
      setSaveMsg('Limitlar saqlandi ✓');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (error: any) {
      setSaveMsg('Xatolik: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const formatUzs = (val: number) => Math.round(val).toLocaleString('uz-UZ');

  const totalSpent = categories.reduce((sum, c) => sum + (spent[c.code] || 0), 0);
  const totalLimit = categories.reduce((sum, c) => sum + (Number(limits[c.code]) || 0), 0);
  const overLimitCount = categories.filter(c => Number(limits[c.code]) > 0 && (spent[c.code] || 0) > Number(limits[c.code])).length;

  if (role && role !== 'admin') {
    return (
      <div style={{ maxWidth: 480, margin: '48px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ marginTop: 0 }}>Bu sahifa sizga ochiq emas</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Shaxsiy moliya faqat admin uchun ko'rinadi.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Yuklanmoqda...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Shaxsiy moliya (Abdulaziz)</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Har bir kategoriyaga oylik limit qo'ying — kassada oylik kiritganda tanlagan manbangiz shu yerda avtomatik hisoblanadi.
        Bu ma'lumot kompaniya P&L'iga ta'sir qilmaydi, faqat sizning shaxsiy nazoratingiz uchun.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn" style={{ border: '1px solid var(--border)', padding: '6px 10px' }}
            onClick={() => setCursor(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 })}>
            <ChevronLeft size={16} />
          </button>
          <h2 style={{ fontSize: '1.2rem', margin: 0, minWidth: 160, textAlign: 'center' }}>{MONTH_NAMES[cursor.month]} {cursor.year}</h2>
          <button className="btn" style={{ border: '1px solid var(--border)', padding: '6px 10px' }}
            onClick={() => setCursor(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 })}>
            <ChevronRight size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {saveMsg && <span style={{ color: saveMsg.startsWith('Xatolik') ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{saveMsg}</span>}
          <button className="btn btn-primary" onClick={saveLimits} disabled={saving}>
            {saving ? 'Saqlanmoqda...' : 'Limitlarni saqlash'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wallet size={20} color="#2563eb" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bu oy olingan oylik</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{formatUzs(totalSpent)} so'm</div>
          </div>
        </div>
        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PiggyBank size={20} color="#16a34a" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Jami belgilangan limit</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{formatUzs(totalLimit)} so'm</div>
          </div>
        </div>
        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: overLimitCount > 0 ? '#fef2f2' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={20} color={overLimitCount > 0 ? '#ef4444' : '#16a34a'} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Limitdan oshgan kategoriya</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: overLimitCount > 0 ? '#ef4444' : 'inherit' }}>{overLimitCount} ta</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px' }}>Kategoriya</th>
                <th style={{ padding: '12px' }}>Oylik limit (so'm)</th>
                <th style={{ padding: '12px' }}>Sarflangan</th>
                <th style={{ padding: '12px', minWidth: 160 }}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => {
                const limit = Number(limits[cat.code]) || 0;
                const used = spent[cat.code] || 0;
                const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
                const over = limit > 0 && used > limit;
                const barColor = over ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';

                return (
                  <tr key={cat.code} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{cat.name}</td>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="number"
                        className="input-field"
                        style={{ margin: 0, maxWidth: 160 }}
                        value={limits[cat.code] ?? ''}
                        onChange={e => setLimits(prev => ({ ...prev, [cat.code]: e.target.value }))}
                        placeholder="0"
                      />
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700, color: over ? '#ef4444' : 'inherit' }}>
                      {formatUzs(used)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${limit > 0 ? pct : 0}%`, background: barColor, borderRadius: 4, transition: 'width 0.2s' }} />
                      </div>
                      {limit > 0 && (
                        <div style={{ fontSize: '0.72rem', color: over ? '#ef4444' : 'var(--text-secondary)', marginTop: 4 }}>
                          {over ? `${formatUzs(used - limit)} so'm oshib ketdi` : `${Math.round(pct)}%`}
                        </div>
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
