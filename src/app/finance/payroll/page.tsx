'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { PlayCircle, CheckCircle, Edit } from 'lucide-react';

export default function PayrollPage() {
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetchBaseData();
  }, []);

  const fetchBaseData = async () => {
    setLoading(true);
    try {
      const { data: empData } = await supabase.from('employees').select('*').eq('is_active', true);
      setEmployees(empData || []);

      const { data: perData } = await supabase.from('payroll_periods').select('*').order('year', { ascending: false }).order('month', { ascending: false });
      setPeriods(perData || []);

      if (perData && perData.length > 0) {
        setSelectedPeriod(perData[0]);
        await fetchLines(perData[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLines = async (periodId: string) => {
    const { data } = await supabase.from('payroll_lines').select('*, employees(full_name, department)').eq('period_id', periodId);
    setLines(data || []);
  };

  const handlePeriodChange = async (e: any) => {
    const pId = e.target.value;
    const p = periods.find(x => x.id === pId);
    setSelectedPeriod(p);
    if (p) await fetchLines(p.id);
  };

  const createNewPeriod = async () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    try {
      // Create period
      const { data: pData, error: pErr } = await supabase.from('payroll_periods').insert([{
        year, month, workdays: 26, status: 'draft'
      }]).select().single();
      
      if (pErr) throw pErr;

      // Create lines for all active employees
      const newLines = employees.map(emp => {
        const dailyRate = emp.base_salary / 26;
        return {
          period_id: pData.id,
          employee_id: emp.id,
          base_salary: emp.base_salary,
          workdays: 26,
          absent_days: 0,
          daily_rate: dailyRate,
          calculated_pay: emp.base_salary, // default 26/26 days
          kpi_bonus: 0,
          paid_amount: 0
        };
      });

      await supabase.from('payroll_lines').insert(newLines);
      
      alert('Yangi oy hisoboti ochildi!');
      fetchBaseData();
    } catch (error: any) {
      console.error(error);
      alert('Xatolik: Bunday oy uchun allaqachon hisobot ochilgan bo\'lishi mumkin.');
    }
  };

  const formatUzs = (val: number) => val?.toLocaleString('uz-UZ');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Ish Haqi Hisobi (Payroll)</h1>
        
        <button 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', background: 'var(--primary)', color: 'white' }}
          onClick={createNewPeriod}
        >
          <PlayCircle size={18} style={{ marginRight: '6px' }} /> Yangi Oyni Boshlash
        </button>
      </div>

      <div className="card" style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Hisobot Oyi (Davri)</label>
          <select className="input-field" value={selectedPeriod?.id || ''} onChange={handlePeriodChange} style={{ minWidth: '200px' }}>
            {periods.length === 0 && <option value="">Ochilgan oylar yo'q</option>}
            {periods.map(p => (
              <option key={p.id} value={p.id}>
                {p.year} - y. {p.month} - oy (Holati: {p.status})
              </option>
            ))}
          </select>
        </div>

        {selectedPeriod && (
          <div style={{ display: 'flex', gap: '20px', padding: '10px 20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ish kunlari plani:</div>
              <div style={{ fontWeight: 'bold' }}>{selectedPeriod.workdays} kun</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Holati:</div>
              <div style={{ fontWeight: 'bold', color: selectedPeriod.status === 'draft' ? '#f59e0b' : '#10b981' }}>
                {selectedPeriod.status === 'draft' ? 'Qoralama (Ochiq)' : 'Yopilgan'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Yuklanmoqda...</div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px' }}>Xodim</th>
                <th style={{ padding: '12px' }}>Bo'lim</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Asosiy Oylik</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Ishlagan (Plan)</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Oylik summa</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>KPI/Bonus</th>
                <th style={{ padding: '12px', textAlign: 'right', backgroundColor: '#e0f2fe' }}>Jami to'lanishi kerak</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#10b981' }}>To'langan</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#ef4444' }}>Qoldiq qarz</th>
                <th style={{ padding: '12px' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '20px', textAlign: 'center' }}>Ma'lumot topilmadi. Avval oylik davrni boshlang.</td>
                </tr>
              ) : (
                lines.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.95rem' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{l.employees?.full_name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{l.employees?.department}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formatUzs(l.base_salary)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{l.worked_days} / {l.workdays}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formatUzs(l.calculated_pay)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#2563eb' }}>{formatUzs(l.kpi_bonus)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#e0f2fe' }}>{formatUzs(l.total_payable)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>{formatUzs(l.paid_amount)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444', fontWeight: 'bold' }}>{formatUzs(l.outstanding)}</td>
                    <td style={{ padding: '12px' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }} title="Tahrirlash">
                        <Edit size={16} />
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
