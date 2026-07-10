'use client';
import { useEffect, useState } from 'react';
import {
  Wallet, TrendingUp, Landmark, Boxes, ArrowDownToLine, ArrowUpFromLine,
  PackageX, Clock, AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';

function StatCard({
  label, value, icon: Icon, tint, sub,
}: { label: string; value: string; icon: any; tint: string; sub?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <div className={`stat-icon ${tint}`}>
          <Icon size={17} strokeWidth={2} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

const fmt = (n: number) => Math.round(n).toLocaleString('uz-UZ') + " so'm";

export default function Home() {
  const { role } = useAuth();
  const canSeeFinance = role === 'admin' || role === 'buxgalter';
  const today = new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    todaySales: 0,
    todayProfit: 0,
    cashTotal: 0,
    bankTotalUsd: 0,
    inventoryValueUzs: 0,
    receivable: 0,
    payable: 0,
    pendingOrders: 0,
    lowStock: 0,
  });

  useEffect(() => {
    fetchDashboard();
  }, [role]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Bugungi sotuv va foyda (marja)
      const { data: todayOrders } = await supabase
        .from('sales_orders')
        .select('total_uzs_price, exchange_rate, sales_order_items(unit_cost_usd, quantity)')
        .gte('created_at', todayStart.toISOString());

      let todaySales = 0;
      let todayProfit = 0;
      (todayOrders || []).forEach((o: any) => {
        todaySales += Number(o.total_uzs_price) || 0;
        const costUsd = (o.sales_order_items || []).reduce(
          (s: number, it: any) => s + (Number(it.unit_cost_usd) || 0) * (Number(it.quantity) || 0), 0
        );
        todayProfit += (Number(o.total_uzs_price) || 0) - costUsd * (Number(o.exchange_rate) || 0);
      });

      // Kutilayotgan buyurtmalar (hali jo'natilmagan, yopilmagan/rad etilmagan/vozvrat qilinmagan)
      const { count: pendingOrders } = await supabase
        .from('sales_orders')
        .select('id', { count: 'exact', head: true })
        .eq('is_shipped', false)
        .not('status', 'in', '("Yopildi","Vozvrat qilindi","Rad etildi")');

      // Ombor qiymati (tan narx bo'yicha, USD) + eng so'nggi ma'lum kurs
      const { data: inv } = await supabase.from('inventory_balances').select('quantity, average_price');
      const inventoryValueUsd = (inv || []).reduce((s, r: any) => s + Number(r.quantity) * Number(r.average_price), 0);
      const lowStock = (inv || []).filter((r: any) => Number(r.quantity) <= 2).length;

      const { data: lastRate } = await supabase
        .from('sales_orders').select('exchange_rate').order('created_at', { ascending: false }).limit(1);
      const rate = lastRate?.[0]?.exchange_rate ? Number(lastRate[0].exchange_rate) : 0;

      let cashTotal = 0, bankTotalUsd = 0, receivable = 0, payable = 0;

      if (canSeeFinance) {
        // Kassa (UZS hisoblar) va Bank/valyuta (USD hisoblar) joriy qoldig'i
        const { data: txns } = await supabase
          .from('cash_transactions')
          .select('income, expense, income_uzs, expense_uzs, cash_accounts(currency, is_virtual)');
        (txns || []).forEach((t: any) => {
          if (t.cash_accounts?.is_virtual) return; // P&L uchun avtomatik yozuv — haqiqiy kassa emas
          const currency = t.cash_accounts?.currency;
          if (currency === 'USD') {
            bankTotalUsd += (Number(t.income) || 0) - (Number(t.expense) || 0);
          } else {
            cashTotal += (Number(t.income_uzs) || 0) - (Number(t.expense_uzs) || 0);
          }
        });

        // Biz qarzdormiz (AP) — ta'minotchilarga musbat balans
        const { data: sup } = await supabase.from('suppliers').select('balance');
        payable = (sup || []).reduce((s, r: any) => s + Math.max(0, Number(r.balance) || 0), 0);
      }

      // Bizga qarzdorlar (AR) — v_order_payment_status'dagi har bir buyurtmaning
      // haqiqiy qoldig'i (qisman to'lovlarni ham hisobga oladi)
      const { data: paymentRows } = await supabase.from('v_order_payment_status').select('remaining_uzs');
      receivable = (paymentRows || []).reduce((s, r: any) => s + (Number(r.remaining_uzs) || 0), 0);

      setData({
        todaySales, todayProfit, cashTotal, bankTotalUsd,
        inventoryValueUzs: inventoryValueUsd * rate,
        receivable, payable,
        pendingOrders: pendingOrders || 0,
        lowStock,
      });
    } catch (e) {
      console.error('Dashboard xatosi:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">{today} — kompaniya holatiga umumiy nazar</p>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Yuklanmoqda...</div>
      ) : (
        <>
          <div className="stat-grid" style={{ marginBottom: 'var(--space-6)' }}>
            <StatCard label="Bugungi savdo" value={fmt(data.todaySales)} icon={TrendingUp} tint="icon-tint-blue" />
            <StatCard label="Bugungi foyda" value={fmt(data.todayProfit)} icon={Wallet} tint="icon-tint-green" sub="Taxminiy, tan narx asosida" />
            {canSeeFinance ? (
              <>
                <StatCard label="Kassa (naqd + karta)" value={fmt(data.cashTotal)} icon={Landmark} tint="icon-tint-purple" />
                <StatCard label="Bank / valyuta zaxirasi" value={`${data.bankTotalUsd.toLocaleString('uz-UZ')} $`} icon={Landmark} tint="icon-tint-purple" />
              </>
            ) : (
              <>
                <StatCard label="Kassa (naqd + karta)" value="—" icon={Landmark} tint="icon-tint-purple" sub="Faqat moliya xodimlariga" />
                <StatCard label="Bank / valyuta zaxirasi" value="—" icon={Landmark} tint="icon-tint-purple" sub="Faqat moliya xodimlariga" />
              </>
            )}
          </div>

          <div className="stat-grid" style={{ marginBottom: 'var(--space-6)' }}>
            <StatCard label="Ombor qiymati" value={fmt(data.inventoryValueUzs)} icon={Boxes} tint="icon-tint-blue" sub="Tan narx bo'yicha, taxminiy kursda" />
            <StatCard label="Bizga qarzdorlar (AR)" value={fmt(data.receivable)} icon={ArrowDownToLine} tint="icon-tint-green" sub="Buyurtmalar qoldig'i bo'yicha" />
            {canSeeFinance ? (
              <StatCard label="Biz qarzdormiz (AP)" value={fmt(data.payable)} icon={ArrowUpFromLine} tint="icon-tint-red" />
            ) : (
              <StatCard label="Biz qarzdormiz (AP)" value="—" icon={ArrowUpFromLine} tint="icon-tint-red" sub="Faqat moliya xodimlariga" />
            )}
            <StatCard label="Kutilayotgan buyurtmalar" value={`${data.pendingOrders} ta`} icon={Clock} tint="icon-tint-orange" />
          </div>

          {/* Diqqat talab qiladigan narsalar */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} color="var(--warning-500)" /> Bugun diqqat talab qiladi
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.lowStock > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--warning-50)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PackageX size={16} color="var(--warning-700)" />
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-800)' }}>{data.lowStock} ta tovar omborda tugab qolmoqda (2 tadan kam)</span>
                  </div>
                  <span className="badge badge-warning"><span className="badge-dot" />Ombor</span>
                </div>
              ) : (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '10px 14px' }}>Hozircha diqqat talab qiladigan narsa yo'q.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
