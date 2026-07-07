import {
  Wallet, TrendingUp, Landmark, Boxes, ArrowDownToLine, ArrowUpFromLine,
  PackageX, Clock, AlertTriangle,
} from 'lucide-react';

// ESLATMA: quyidagi qiymatlar hozircha ko'rgazmali (placeholder).
// Bu — faqat dizayn/joylashuv bosqichi. Keyingi bosqichda (ma'lumot ulash)
// har bir karta haqiqiy Supabase so'roviga ulanadi — struktura shunga tayyor.
const mock = {
  todaySales: 12_500_000,
  todayProfit: 3_180_000,
  cashTotal: 84_200_000,
  bankTotal: 26_400_000,
  inventoryValue: 412_600_000,
  receivable: 18_900_000, // Bizga qarzdorlar
  payable: 34_100_000,    // Biz qarzdor bo'lganlar
  pendingOrders: 8,
  lowStock: 5,
};

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

const fmt = (n: number) => n.toLocaleString('uz-UZ') + " so'm";

export default function Home() {
  const today = new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">{today} — kompaniya holatiga umumiy nazar</p>

      {/* Asosiy ko'rsatkichlar */}
      <div className="stat-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard label="Bugungi savdo" value={fmt(mock.todaySales)} icon={TrendingUp} tint="icon-tint-blue" />
        <StatCard label="Bugungi foyda" value={fmt(mock.todayProfit)} icon={Wallet} tint="icon-tint-green" sub="Taxminiy, tannarx asosida" />
        <StatCard label="Kassa (naqd + karta)" value={fmt(mock.cashTotal)} icon={Landmark} tint="icon-tint-purple" />
        <StatCard label="Bank / valyuta zaxirasi" value={fmt(mock.bankTotal)} icon={Landmark} tint="icon-tint-purple" />
      </div>

      <div className="stat-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard label="Ombor qiymati" value={fmt(mock.inventoryValue)} icon={Boxes} tint="icon-tint-blue" />
        <StatCard label="Bizga qarzdorlar (AR)" value={fmt(mock.receivable)} icon={ArrowDownToLine} tint="icon-tint-green" />
        <StatCard label="Biz qarzdormiz (AP)" value={fmt(mock.payable)} icon={ArrowUpFromLine} tint="icon-tint-red" />
        <StatCard label="Kutilayotgan buyurtmalar" value={`${mock.pendingOrders} ta`} icon={Clock} tint="icon-tint-orange" />
      </div>

      {/* Diqqat talab qiladigan narsalar */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color="var(--warning-500)" /> Bugun diqqat talab qiladi
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--warning-50)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <PackageX size={16} color="var(--warning-700)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--gray-800)' }}>{mock.lowStock} ta tovar omborda tugab qolmoqda</span>
            </div>
            <span className="badge badge-warning"><span className="badge-dot" />Ombor</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--danger-50)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={16} color="var(--danger-700)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--gray-800)' }}>Muddati o'tgan majburiyatlar mavjud</span>
            </div>
            <span className="badge badge-danger"><span className="badge-dot" />Moliya</span>
          </div>
        </div>
      </div>
    </div>
  );
}
