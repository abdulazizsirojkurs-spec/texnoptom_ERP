'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';
import { ArrowDownCircle, ArrowUpCircle, Download, Edit, Trash2, X, Check, ArrowLeftRight } from 'lucide-react';

type CashAccount = { id: string; name: string; currency: string };
type ChartAccount = { id: string; code: string; name: string; flow_sign: '+' | '-'; group_name: string };
type Supplier = { id: string; name: string; balance: number; legacy_debt_usd?: number | null };
type Employee = { id: string; full_name: string; department: string };

const SALARY_ACCOUNT_CODES = ['13001', '14003', '15007']; // Nakladnoy/Adminstrativ/Tijoriy ish haqi

// Abdulazizning shaxsiy/oilaviy moliya kategoriyalari — faqat u o'ziga oylik
// kiritganda ko'rinadigan alohida (majburiy) tanlov. Umumiy toifa ro'yxatida
// KO'RINMASLIGI kerak (aks holda har qanday xarajatga tasodifan tanlanib
// qolishi mumkin edi) — shu sabab asosiy ro'yxatdan olib tashlanadi.
const PERSONAL_ACCOUNT_CODES = [
  '19004', '19005', '19006', '19007', '19008', '19009',
  '19010', '19011', '19012', '19013', '19014', '19015', '19016', '19017',
];

const MONTH_NAMES = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

export default function KassaPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [chartAccounts, setChartAccounts] = useState<ChartAccount[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Tezkor kiritish formasi
  const [direction, setDirection] = useState<'income' | 'expense' | 'exchange'>('expense');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [txnDate, setTxnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [cashAccountId, setCashAccountId] = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [note, setNote] = useState('');
  const [supplierId, setSupplierId] = useState('');
  // Avval "Balansdan yechiladigan summa ($)" deb operatordan alohida, hech
  // narsaga bog'liq bo'lmagan dollar summasini qo'lda so'rardik — bu operator
  // xato qilib to'g'ridan-to'g'ri so'm summasini yozib qo'yishiga olib kelardi
  // (masalan Daryan balansida 7,102,500 "$" bo'lib yozilib qolgan edi, aslida
  // ~$580 bo'lishi kerak edi). Endi kurs narxini so'raymiz va USD summani
  // to'lov summasidan (agar hisob so'mda bo'lsa) avtomatik hisoblaymiz.
  const [supplierExchangeRate, setSupplierExchangeRate] = useState('');
  // Eski qarz (legacy_debt_usd) bo'lgan hamkorlar uchun — bu to'lov "tovar
  // balansi"gami yoki "eski qarz"gami degan aniq tanlov (matn yozish o'rniga,
  // xato/unutish ehtimolini yo'qotish uchun). Faqat legacy_debt_usd o'rnatilgan
  // hamkor tanlanganda ko'rinadi, boshqalarda hech narsaga ta'sir qilmaydi.
  const [isLegacyPayment, setIsLegacyPayment] = useState(false);
  const [salaryEmployeeId, setSalaryEmployeeId] = useState('');
  const [salaryMonth, setSalaryMonth] = useState(() => new Date().getMonth());
  const [personalCategoryCode, setPersonalCategoryCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');
  const amountRef = useRef<HTMLInputElement>(null);

  // Hisob/valyuta almashish (masalan: naqd so'mga dollar sotib olish)
  const [exchFromAccount, setExchFromAccount] = useState('');
  const [exchToAccount, setExchToAccount] = useState('');
  const [exchFromAmount, setExchFromAmount] = useState('');
  const [exchToAmount, setExchToAmount] = useState('');
  const [exchNote, setExchNote] = useState('');
  const [exchSaving, setExchSaving] = useState(false);
  const [exchFlash, setExchFlash] = useState('');

  useEffect(() => {
    fetchRefData();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate, typeFilter]);

  const fetchRefData = async () => {
    const { data: ca } = await supabase.from('cash_accounts').select('id, name, currency').eq('is_active', true).eq('is_virtual', false).order('sort_order');
    const { data: coa } = await supabase.from('chart_of_accounts').select('id, code, name, flow_sign, group_name').eq('is_active', true).order('sort_order');
    const { data: sup } = await supabase.from('suppliers').select('id, name, balance, legacy_debt_usd').order('name');
    const { data: emp } = await supabase.from('employees').select('id, full_name, department').eq('is_active', true).order('full_name');
    if (emp) setEmployees(emp);
    if (ca) {
      setCashAccounts(ca);
      const savedCash = localStorage.getItem('kassa_last_account');
      setCashAccountId(savedCash && ca.find(c => c.id === savedCash) ? savedCash : (ca[0]?.id || ''));
    }
    if (coa) setChartAccounts(coa);
    if (sup) setSuppliers(sup);
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // cash_accounts!inner + is_virtual=false — faqat HAQIQIY pul harakatlari (Naqd/Karta/USD va h.k.).
      // Otgruzka'da avtomatik yaraladigan "Buxgalteriya (P&L, naqd emas)" virtual hisobidagi
      // yozuvlar (sotuv daromadi / tan narx COGS) bu yerda ko'rsatilmaydi — ular P&L hisobotida
      // (Moliya -> P&L) ko'rinadi, chunki ular real pul harakati emas.
      let query = supabase
        .from('cash_transactions')
        .select(`*, cash_accounts!inner(name, currency, is_virtual), chart_of_accounts!cash_transactions_account_code_fkey(name), suppliers(name)`)
        .eq('cash_accounts.is_virtual', false)
        .order('txn_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (startDate) query = query.gte('txn_date', startDate);
      if (endDate) query = query.lte('txn_date', endDate);
      if (typeFilter === 'income') query = query.gt('income', 0).neq('account_code', '99999');
      else if (typeFilter === 'expense') query = query.gt('expense', 0).neq('account_code', '99999');
      else if (typeFilter === 'exchange') query = query.eq('account_code', '99999');

      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);

      // cash_transactions.created_by -> auth.users (profiles'ga emas), shu sabab
      // PostgREST orqali to'g'ridan-to'g'ri "embed" qilib bo'lmaydi (bu ustundan
      // profiles(full_name)ga bog'lashga urinish butun so'rovni buzib qo'ygan edi,
      // 2026-08-29'da topildi). Endi ism alohida so'rov bilan qo'lda bog'lanadi.
      const creatorIds = Array.from(new Set((data || []).map((t: any) => t.created_by).filter(Boolean)));
      if (creatorIds.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', creatorIds);
        const map: Record<string, string> = {};
        (profs || []).forEach((p: any) => { map[p.id] = p.full_name; });
        setProfileNames(map);
      } else {
        setProfileNames({});
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatUzs = (val: number) => val?.toLocaleString('uz-UZ');

  const selectedCashAccount = cashAccounts.find(c => c.id === cashAccountId);
  const needsExchangeRate = selectedCashAccount?.currency === 'USD';
  // Shaxsiy kategoriyalar umumiy toifa ro'yxatida ko'rinmaydi — ular faqat
  // Abdulazizning o'z oyligi tanlanganda pastdagi alohida maydonda chiqadi.
  const filteredChartAccounts = chartAccounts.filter(c => c.flow_sign === (direction === 'income' ? '+' : '-') && !PERSONAL_ACCOUNT_CODES.includes(c.code));
  const personalChartAccounts = chartAccounts.filter(c => PERSONAL_ACCOUNT_CODES.includes(c.code));
  const isSalaryPayment = direction === 'expense' && SALARY_ACCOUNT_CODES.includes(accountCode);
  // Xodim sifatida aynan Abdulaziz tanlansa — bu uning shaxsiy oyligi, shuning
  // uchun qaysi shaxsiy/oilaviy manbaga ketayotgani majburiy tanlanishi kerak.
  const isAbdulazizSalary = isSalaryPayment && employees.find(e => e.id === salaryEmployeeId)?.full_name === 'Abdulaziz';

  // Postavshik balansidan yechiladigan USD summa: agar kassa hisobi USD bo'lsa,
  // to'lov summasi allaqachon dollarda (kurs kerak emas). Agar so'mda bo'lsa —
  // kiritilgan kurs narxiga bo'lib hisoblanadi.
  const selectedSupplier = suppliers.find(s => s.id === supplierId);
  const supplierHasLegacyDebt = !!selectedSupplier?.legacy_debt_usd;
  const supplierPaymentIsUsdAccount = selectedCashAccount?.currency === 'USD';
  const supplierNeedsRate = !!supplierId && direction === 'expense' && !supplierPaymentIsUsdAccount;
  const computedSupplierUsd = !supplierId || direction !== 'expense'
    ? 0
    : supplierPaymentIsUsdAccount
      ? Number(amount || 0)
      : (supplierExchangeRate ? Number(amount || 0) / Number(supplierExchangeRate) : 0);

  const resetForm = (keepContext: boolean) => {
    setEditingId(null);
    setAmount('');
    setNote('');
    setSupplierId('');
    setSupplierExchangeRate('');
    setIsLegacyPayment(false);
    setSalaryEmployeeId('');
    setSalaryMonth(new Date().getMonth());
    setPersonalCategoryCode('');
    if (!keepContext) {
      setDirection('expense');
      setAccountCode('');
      setExchangeRate('');
    }
    setTimeout(() => amountRef.current?.focus(), 50);
  };

  // Xatolar tahlili (2026-07-23): postavshikka to'lov o'chirilganda/tahrirlanganda
  // balans avtomatik qaytarilmasdi (masalan Daryan balansi shu sababli buzilib
  // qolgan edi — 2 ta xato yozuv o'chirilgan, lekin balans qaytmagan). Bu
  // funksiya bitta tranzaksiyaning postavshik balansiga qancha ta'sir qilganini
  // saqlangan maydonlardan (expense, exchange_rate, hisob valyutasi) qayta
  // hisoblaydi — shu orqali o'chirish/tahrirlashda aniq qaytarish mumkin.
  const getSupplierUsdImpact = (t: any) => {
    if (!t?.supplier_id) return 0;
    const expenseAmt = Number(t.expense || 0);
    if (expenseAmt <= 0) return 0;
    const acc = cashAccounts.find(c => c.id === t.cash_account_id);
    if (acc?.currency === 'USD') return expenseAmt;
    // supplier_rate — hamkor balansi ($) uchun alohida saqlangan kurs (2026-08-27'da
    // ajratildi: avval shu maqsadda exchange_rate ishlatilar edi, lekin bu ustun
    // ayni paytda expense_uzs'ni (so'm) ham boshqarardi — UZS hisobdan to'lansa,
    // exchange_rate yozilishi expense_uzs'ni milliard martalab shishirib yuborardi).
    if (t.supplier_rate) return expenseAmt / Number(t.supplier_rate);
    if (t.exchange_rate) return expenseAmt / Number(t.exchange_rate); // eski, tuzatilmagan yozuvlar uchun orqaga moslik
    return 0;
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setDirection(t.income > 0 ? 'income' : 'expense');
    setTxnDate(t.txn_date);
    setAmount(String(t.income > 0 ? t.income : t.expense));
    setCashAccountId(t.cash_account_id);
    setAccountCode(t.account_code);
    setExchangeRate(t.exchange_rate ? String(t.exchange_rate) : '');
    setNote(t.comment || t.customer_name || '');
    // Postavshik bog'lanishini ham tiklaymiz — aks holda tahrirlab saqlaganda
    // supplier_id yo'qolib, balans hisob-kitobi buzilib qolardi.
    setSupplierId(t.supplier_id || '');
    setSupplierExchangeRate(t.supplier_id && (t.supplier_rate || t.exchange_rate) ? String(t.supplier_rate || t.exchange_rate) : '');
    setIsLegacyPayment(!!t.is_legacy_payment);
    setPersonalCategoryCode(t.personal_category_code || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => amountRef.current?.focus(), 300);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu tranzaksiyani o'chirasizmi? Bu amalni orqaga qaytarib bo'lmaydi!")) return;
    const txn = transactions.find(t => t.id === id);
    const { error } = await supabase.from('cash_transactions').delete().eq('id', id);
    if (error) {
      alert('Xatolik: ' + error.message);
      return;
    }
    if (txn?.supplier_id) {
      const usdImpact = getSupplierUsdImpact(txn);
      if (usdImpact > 0) {
        // Atomik (nisbiy) o'zgartirish — sahifadagi eskirgan balansni yozib
        // yubormaydi, shu sabab oradan o'tgan boshqa amallar yo'qolmaydi.
        await supabase.rpc('adjust_supplier_balance', { p_supplier_id: txn.supplier_id, p_delta: usdImpact });
      }
    }
    fetchTransactions();
    fetchRefData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      amountRef.current?.focus();
      return;
    }
    if (!cashAccountId || !accountCode) {
      alert("Hisob va toifani tanlang!");
      return;
    }
    if (needsExchangeRate && !exchangeRate) {
      alert("USD hisob uchun kurs kiritilishi shart!");
      return;
    }
    if (supplierNeedsRate && !supplierExchangeRate) {
      alert("Postavshikka to'lov uchun kurs narxini kiriting!");
      return;
    }
    if (supplierId && direction === 'expense' && computedSupplierUsd <= 0) {
      alert("Postavshik balansidan yechiladigan summa 0 dan katta bo'lishi kerak!");
      return;
    }
    if (isSalaryPayment && !salaryEmployeeId) {
      alert("Ish haqi to'lovi uchun xodimni tanlang!");
      return;
    }
    if (isAbdulazizSalary && !personalCategoryCode) {
      alert("Bu — shaxsiy oylik. Shaxsiy/oilaviy manbani tanlang!");
      return;
    }

    setSaving(true);
    try {
      const salaryEmployee = employees.find(e => e.id === salaryEmployeeId);
      const salaryNote = isSalaryPayment && salaryEmployee
        ? `${salaryEmployee.full_name} — ${MONTH_NAMES[salaryMonth]} oyi uchun${note ? ' — ' + note : ''}`
        : note;

      const payload: any = {
        txn_date: txnDate,
        income: direction === 'income' ? Number(amount) : 0,
        expense: direction === 'expense' ? Number(amount) : 0,
        cash_account_id: cashAccountId,
        account_code: accountCode,
        // exchange_rate faqat hisobning o'zi USD bo'lsa yoziladi (expense_uzs generated
        // columnni boshqaradi). Hamkorga to'lov kursi (UZS hisobdan bo'lsa ham) alohida
        // supplier_rate'ga yoziladi — ikkalasini aralashtirish expense_uzs'ni buzib
        // yuborgan edi (2026-08-27'da topilgan xato, 31 ta eski yozuv tuzatildi).
        exchange_rate: needsExchangeRate ? Number(exchangeRate) : null,
        supplier_rate: supplierNeedsRate ? Number(supplierExchangeRate) : null,
        comment: salaryNote || null,
        supplier_id: supplierId || null,
        is_legacy_payment: supplierId && direction === 'expense' && supplierHasLegacyDebt ? isLegacyPayment : false,
        personal_category_code: isAbdulazizSalary ? personalCategoryCode : null,
        created_by: user?.id || null,
      };

      if (editingId) {
        const orig = transactions.find(t => t.id === editingId);
        const { error } = await supabase.from('cash_transactions').update(payload).eq('id', editingId);
        if (error) throw error;

        // Postavshik balansini eski qiymatga qaytarib, yangisini qo'llaymiz
        // (xatolar tahlili — avval tahrirlashda balans umuman qayta hisoblanmasdi).
        const oldSupplierId = orig?.supplier_id || null;
        const oldImpact = orig ? getSupplierUsdImpact(orig) : 0;
        const newImpact = supplierId && direction === 'expense' ? computedSupplierUsd : 0;
        // Atomik (nisbiy) o'zgartirish — eskirgan sahifa qiymati yozilmaydi.
        if (oldSupplierId && oldSupplierId === supplierId) {
          const delta = oldImpact - newImpact;
          if (delta !== 0) {
            await supabase.rpc('adjust_supplier_balance', { p_supplier_id: supplierId, p_delta: delta });
          }
        } else {
          if (oldSupplierId && oldImpact > 0) {
            await supabase.rpc('adjust_supplier_balance', { p_supplier_id: oldSupplierId, p_delta: oldImpact });
          }
          if (supplierId && newImpact > 0) {
            await supabase.rpc('adjust_supplier_balance', { p_supplier_id: supplierId, p_delta: -newImpact });
          }
        }

        setFlash("Tranzaksiya yangilandi ✓");
      } else {
        const { error } = await supabase.from('cash_transactions').insert(payload);
        if (error) throw error;

        // Postavshikka to'lov qilingan bo'lsa, uning USD balansini kamaytiramiz
        // (faqat yangi yozuvda — tahrirlashda balans avtomatik qayta hisoblanmaydi).
        // computedSupplierUsd — to'lov summasidan (agar hisob so'mda bo'lsa, kurs
        // narxiga bo'lib) avtomatik hisoblangan, qo'lda xato kiritish xavfi yo'q.
        if (supplierId && direction === 'expense' && computedSupplierUsd > 0) {
          // Atomik (nisbiy) — sahifa uzoq ochiq turgan bo'lsa ham, oradan
          // o'tgan kirim/to'lovlar yo'qolmaydi.
          await supabase.rpc('adjust_supplier_balance', { p_supplier_id: supplierId, p_delta: -computedSupplierUsd });
        }

        setFlash(direction === 'income' ? "Kirim saqlandi ✓" : "Chiqim saqlandi ✓");
      }

      localStorage.setItem('kassa_last_account', cashAccountId);
      resetForm(true);
      fetchTransactions();
      fetchRefData(); // postavshik balansi yangilangan bo'lishi mumkin
      setTimeout(() => setFlash(''), 2000);
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exchFromAccount || !exchToAccount) {
      alert("Ikkala hisobni ham tanlang!");
      return;
    }
    if (exchFromAccount === exchToAccount) {
      alert("Bir xil hisobga almashtirib bo'lmaydi!");
      return;
    }
    if (!exchFromAmount || Number(exchFromAmount) <= 0 || !exchToAmount || Number(exchToAmount) <= 0) {
      alert("Ikkala summani ham kiriting!");
      return;
    }

    setExchSaving(true);
    try {
      const { error } = await supabase.rpc('exchange_currency', {
        p_txn_date: txnDate,
        p_from_account: exchFromAccount,
        p_to_account: exchToAccount,
        p_from_amount: Number(exchFromAmount),
        p_to_amount: Number(exchToAmount),
        p_comment: exchNote || null,
        p_created_by: user?.id || null,
      });
      if (error) throw error;

      setExchFlash("Almashtirildi ✓");
      setExchFromAccount(''); setExchToAccount(''); setExchFromAmount(''); setExchToAmount(''); setExchNote('');
      fetchTransactions();
      setTimeout(() => setExchFlash(''), 2000);
    } catch (err: any) {
      alert('Xatolik: ' + err.message);
    } finally {
      setExchSaving(false);
    }
  };

  const impliedRate = exchFromAmount && exchToAmount ? (() => {
    const fromAcc = cashAccounts.find(a => a.id === exchFromAccount);
    const toAcc = cashAccounts.find(a => a.id === exchToAccount);
    if (!fromAcc || !toAcc || fromAcc.currency === toAcc.currency) return null;
    const usdAmount = fromAcc.currency === 'USD' ? Number(exchFromAmount) : Number(exchToAmount);
    const uzsAmount = fromAcc.currency === 'USD' ? Number(exchToAmount) : Number(exchFromAmount);
    if (!usdAmount) return null;
    return uzsAmount / usdAmount;
  })() : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Kassa (Pul harakatlari)</h1>
        <button className="btn btn-secondary">
          <Download size={18} style={{ marginRight: '6px' }} /> Eksport
        </button>
      </div>

      {/* TEZKOR KIRITISH PANELI */}
      <div
        className="card"
        style={{
          padding: '20px', marginBottom: '20px',
          border: `2px solid ${direction === 'income' ? 'var(--success-200, #bbf7d0)' : direction === 'expense' ? 'var(--danger-200, #fecaca)' : '#fde68a'}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => { setDirection('income'); setAccountCode(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px',
                border: direction === 'income' ? '2px solid #10b981' : '1px solid var(--border)',
                background: direction === 'income' ? '#dcfce7' : 'transparent',
                color: direction === 'income' ? '#15803d' : 'var(--text-secondary)',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
              }}
            >
              <ArrowDownCircle size={20} /> Kirim
            </button>
            <button
              type="button"
              onClick={() => { setDirection('expense'); setAccountCode(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px',
                border: direction === 'expense' ? '2px solid #ef4444' : '1px solid var(--border)',
                background: direction === 'expense' ? '#fee2e2' : 'transparent',
                color: direction === 'expense' ? '#991b1b' : 'var(--text-secondary)',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
              }}
            >
              <ArrowUpCircle size={20} /> Chiqim
            </button>
            <button
              type="button"
              onClick={() => { resetForm(false); setDirection('exchange'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px',
                border: direction === 'exchange' ? '2px solid #d97706' : '1px solid var(--border)',
                background: direction === 'exchange' ? '#fef3c7' : 'transparent',
                color: direction === 'exchange' ? '#92400e' : 'var(--text-secondary)',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
              }}
            >
              <ArrowLeftRight size={20} /> Hisob Almashuv
            </button>
            <button
              type="button"
              onClick={() => {
                const abdulaziz = employees.find(e => e.full_name === 'Abdulaziz');
                setDirection('expense');
                setAccountCode('14003');
                if (abdulaziz) setSalaryEmployeeId(abdulaziz.id);
                setTimeout(() => amountRef.current?.focus(), 50);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px',
                border: '1px dashed #f59e0b', background: '#fffbeb', color: '#92400e',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
              }}
            >
              ⚡ Shaxsiy oylik
            </button>
          </div>

          {(flash || exchFlash) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: 600, fontSize: '0.9rem' }}>
              <Check size={16} /> {flash || exchFlash}
            </span>
          )}

          {editingId && direction !== 'exchange' && (
            <button type="button" onClick={() => resetForm(true)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              <X size={14} style={{ marginRight: '4px' }} /> Tahrirlashni bekor qilish
            </button>
          )}
        </div>

        {direction === 'exchange' ? (
          <form onSubmit={handleExchange}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 0, marginBottom: '16px' }}>
              Masalan: naqd so'mga dollar sotib olish, yoki kartadagi pulni naqdga/dollarga o'tkazish. P&L (foyda-zarar)ga ta'sir qilmaydi — bu shunchaki pulning shaklini/joyini o'zgartiradi.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
              <div>
                <label className="field-label">Sana</label>
                <input type="date" className="input-field" value={txnDate} onChange={e => setTxnDate(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Qaysi hisobdan</label>
                <select className="input-field" value={exchFromAccount} onChange={e => setExchFromAccount(e.target.value)} style={{ borderColor: '#f59e0b' }}>
                  <option value="">Tanlang...</option>
                  {cashAccounts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.currency})</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Berilgan summa</label>
                <input type="number" className="input-field" placeholder="0" value={exchFromAmount} onChange={e => setExchFromAmount(e.target.value)} style={{ fontSize: '1.1rem', fontWeight: 700 }} autoFocus />
              </div>
              <div>
                <label className="field-label">Qaysi hisobga</label>
                <select className="input-field" value={exchToAccount} onChange={e => setExchToAccount(e.target.value)} style={{ borderColor: '#f59e0b' }}>
                  <option value="">Tanlang...</option>
                  {cashAccounts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.currency})</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Olingan summa</label>
                <input type="number" className="input-field" placeholder="0" value={exchToAmount} onChange={e => setExchToAmount(e.target.value)} style={{ fontSize: '1.1rem', fontWeight: 700 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'end' }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">Izoh (ixtiyoriy)</label>
                <input type="text" className="input-field" placeholder="Masalan: Dollar sotib olindi" value={exchNote} onChange={e => setExchNote(e.target.value)} />
              </div>
              {impliedRate && (
                <div style={{ fontSize: '0.85rem', color: '#92400e', whiteSpace: 'nowrap', paddingBottom: '10px', fontWeight: 600 }}>
                  Kurs: 1$ = {Math.round(impliedRate).toLocaleString('uz-UZ')} so'm
                </div>
              )}
              <button type="submit" disabled={exchSaving} className="btn btn-primary" style={{ padding: '10px 28px', fontWeight: 700, whiteSpace: 'nowrap', background: '#d97706' }}>
                {exchSaving ? 'Saqlanmoqda...' : 'Almashtirish'}
              </button>
            </div>
          </form>
        ) : (
        <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: needsExchangeRate ? '140px 1fr 1fr 1fr 120px' : '140px 1fr 1fr 1fr', gap: '12px', alignItems: 'end' }}>
          <div>
            <label className="field-label">Sana</label>
            <input type="date" className="input-field" value={txnDate} onChange={e => setTxnDate(e.target.value)} />
          </div>

          <div>
            <label className="field-label">Summa {selectedCashAccount ? `(${selectedCashAccount.currency})` : ''}</label>
            <input
              ref={amountRef}
              type="number"
              className="input-field"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ fontSize: '1.15rem', fontWeight: 700 }}
              autoFocus
            />
          </div>

          <div>
            <label className="field-label">Hisob</label>
            <select className="input-field" value={cashAccountId} onChange={e => setCashAccountId(e.target.value)}>
              {cashAccounts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="field-label">Toifa</label>
            <select className="input-field" value={accountCode} onChange={e => setAccountCode(e.target.value)}>
              <option value="">Tanlang...</option>
              {filteredChartAccounts.map(c => <option key={c.id} value={c.code}>{c.name}</option>)}
            </select>
          </div>

          {needsExchangeRate && (
            <div>
              <label className="field-label">Kurs <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                type="number"
                className="input-field"
                placeholder="12700"
                value={exchangeRate}
                onChange={e => setExchangeRate(e.target.value)}
                required
                style={!exchangeRate ? { borderColor: '#dc2626', background: '#fef2f2' } : undefined}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'end' }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">Izoh (ixtiyoriy)</label>
            <input type="text" className="input-field" placeholder="Masalan: Arenda to'lovi, iyul oyi" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <button
            type="submit"
            disabled={saving || (needsExchangeRate && !exchangeRate) || (supplierNeedsRate && !supplierExchangeRate)}
            className="btn btn-primary"
            style={{ padding: '10px 28px', fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            {saving ? 'Saqlanmoqda...' : editingId ? 'Yangilash' : 'Saqlash'}
          </button>
        </div>

        {isSalaryPayment && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '12px', marginTop: '12px' }}>
            <div>
              <label className="field-label">Xodim</label>
              <select className="input-field" value={salaryEmployeeId} onChange={e => setSalaryEmployeeId(e.target.value)} style={{ borderColor: '#f59e0b', background: '#fffbeb' }}>
                <option value="">Tanlang...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.department})</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Qaysi oy uchun</label>
              <select className="input-field" value={salaryMonth} onChange={e => setSalaryMonth(Number(e.target.value))} style={{ borderColor: '#f59e0b', background: '#fffbeb' }}>
                {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
          </div>
        )}

        {isAbdulazizSalary && (
          <div style={{ marginTop: '12px' }}>
            <label className="field-label">Shaxsiy/oilaviy manba * (bu — sizning shaxsiy oyligingiz)</label>
            <select className="input-field" value={personalCategoryCode} onChange={e => setPersonalCategoryCode(e.target.value)} style={{ borderColor: '#f59e0b', background: '#fffbeb' }}>
              <option value="">Tanlang...</option>
              {personalChartAccounts.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
        )}

        {direction === 'expense' && (
          <div style={{ display: 'grid', gridTemplateColumns: supplierId ? '1fr 220px' : '1fr', gap: '12px', marginTop: '12px' }}>
            <div>
              <label className="field-label">Postavshikka to'lovmi? (ixtiyoriy)</label>
              <select
                className="input-field"
                value={supplierId}
                onChange={e => {
                  setSupplierId(e.target.value);
                  // Postavshik tanlanganda toifa avtomatik "Postavshikka to'lov (qarz yopish)"ga
                  // o'rnatiladi — bu P&L'da tan narx (COGS) bilan aralashib ketmasligi uchun muhim
                  // (COGS allaqachon otgruzka paytida avtomatik hisoblanadi, real to'lov qayta hisoblanmasligi kerak).
                  if (e.target.value) setAccountCode('12002');
                }}
              >
                <option value="">Yo'q — oddiy xarajat</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (joriy qarz: ${Number(s.balance).toLocaleString('uz-UZ')})</option>
                ))}
              </select>
            </div>
            {supplierId && direction === 'expense' && supplierHasLegacyDebt && (
              <div>
                <label className="field-label">To'lov turi</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setIsLegacyPayment(false)}
                    className="btn"
                    style={{
                      flex: 1, padding: '8px 10px', fontSize: '0.85rem',
                      background: !isLegacyPayment ? 'var(--accent-600)' : 'var(--gray-100)',
                      color: !isLegacyPayment ? '#fff' : 'var(--text-primary)',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    📦 Tovar balansi
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLegacyPayment(true)}
                    className="btn"
                    style={{
                      flex: 1, padding: '8px 10px', fontSize: '0.85rem',
                      background: isLegacyPayment ? 'var(--accent-600)' : 'var(--gray-100)',
                      color: isLegacyPayment ? '#fff' : 'var(--text-primary)',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    📌 Eski qarz
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Bu hamkorda eski qarz ($
                  {Number(selectedSupplier?.legacy_debt_usd).toLocaleString('uz-UZ')}) bor — to'lov qaysi qismga
                  tegishli ekanini tanlang, ikkisi aralashib ketmasligi uchun.
                </div>
              </div>
            )}
            {supplierId && supplierPaymentIsUsdAccount && (
              <div>
                <label className="field-label">Balansdan yechiladi</label>
                <div className="input-field" style={{ borderColor: '#f59e0b', background: '#fffbeb', display: 'flex', alignItems: 'center' }}>
                  ${computedSupplierUsd.toLocaleString('uz-UZ', { maximumFractionDigits: 2 })}
                </div>
              </div>
            )}
            {supplierId && !supplierPaymentIsUsdAccount && (
              <div>
                <label className="field-label">Kurs narxi <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="masalan 12600"
                  value={supplierExchangeRate}
                  onChange={e => setSupplierExchangeRate(e.target.value)}
                  required
                  style={supplierExchangeRate ? { borderColor: '#f59e0b', background: '#fffbeb' } : { borderColor: '#dc2626', background: '#fef2f2' }}
                />
                {supplierExchangeRate && amount && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    ≈ ${computedSupplierUsd.toLocaleString('uz-UZ', { maximumFractionDigits: 2 })} balansdan yechiladi
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </form>
        )}
      </div>

      {/* Filters */}
      <div className="card flex-mobile-col" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Dan</label>
          <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Gacha</label>
          <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Tipi</label>
          <select className="input-field" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Barchasi</option>
            <option value="income">Kirim</option>
            <option value="expense">Chiqim</option>
            <option value="exchange">Almashuv</option>
          </select>
        </div>
        <div>
          <button className="btn btn-secondary" onClick={() => { setStartDate(''); setEndDate(''); setTypeFilter(''); }}>
            Tozalash
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
                <th style={{ padding: '12px' }}>Kim/Vaqt</th>
                <th style={{ padding: '12px' }}>Hisob</th>
                <th style={{ padding: '12px' }}>Toifa</th>
                <th style={{ padding: '12px' }}>Izoh</th>
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
                  <td colSpan={10} style={{ padding: '20px', textAlign: 'center' }}>Ma'lumot topilmadi.</td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.95rem', background: editingId === t.id ? '#fffbeb' : 'transparent' }}>
                    <td style={{ padding: '12px' }}>{new Date(t.txn_date).toLocaleDateString('uz-UZ')}</td>
                    <td style={{ padding: '12px', fontSize: '0.8rem', color: '#64748b' }}>
                      {t.created_by ? (
                        <>
                          {profileNames[t.created_by] || 'noma\'lum'}<br />
                          {t.created_at && new Date(t.created_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Avtomatik</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>{t.cash_accounts?.name}</td>
                    <td style={{ padding: '12px' }}>{Array.isArray(t.chart_of_accounts) ? t.chart_of_accounts[0]?.name : (t.chart_of_accounts as any)?.name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{t.comment || t.suppliers?.name || t.customer_name || '-'}</td>

                    <td style={{ padding: '12px', color: '#10b981', fontWeight: t.income > 0 ? 'bold' : 'normal' }}>
                      {t.income > 0 ? `${formatUzs(t.income)} ${t.cash_accounts?.currency}` : '-'}
                    </td>
                    <td style={{ padding: '12px', color: '#ef4444', fontWeight: t.expense > 0 ? 'bold' : 'normal' }}>
                      {t.expense > 0 ? `${formatUzs(t.expense)} ${t.cash_accounts?.currency}` : '-'}
                    </td>

                    <td style={{ padding: '12px', color: '#10b981' }}>{t.income_uzs > 0 ? formatUzs(t.income_uzs) : '-'}</td>
                    <td style={{ padding: '12px', color: '#ef4444' }}>{t.expense_uzs > 0 ? formatUzs(t.expense_uzs) : '-'}</td>

                    <td style={{ padding: '12px' }}>
                      <button onClick={() => handleEdit(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', marginRight: '10px' }}>
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
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
