'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import KassirShell from '@/components/kassir/KassirShell';
import {
  AccountPicker, AmountBlock, DateField, DoneScreen, EditBanner, NoteField, SaveBar, readAmount, useAccounts,
} from '@/components/kassir/parts';
import {
  Employee, KCategory, EditPayload, rpc, fmtMoney, amountToInput, formatAmountInput, lastAccount, lastRate,
  peekEdit, clearEdit, tashkentToday, dateLabel, ymOf, MONTHS,
} from '@/lib/kassir';

// Bo'limga qarab odatdagi oylik toifasi (oldingi oylik bo'lsa — o'sha toifa ishlatiladi)
const DEPT_DEFAULT: Record<string, string> = { Sotuv: '15007', Marketing: '15003', Sklad: '13001', Admin: '14003', Boshqaruv: '14003' };

// Xodimga oylik/avans — kompyuterdagi kassa bilan bir xil yoziladi:
// izoh "Ism — Oy oyi uchun — izoh", toifa: oylik toifasi.
export default function KassirOylikPage() {
  const router = useRouter();
  const { accounts, loading: accLoading, error: accError } = useAccounts();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cats, setCats] = useState<KCategory[]>([]);
  const [refLoaded, setRefLoaded] = useState(false);
  const [refError, setRefError] = useState('');

  const [employeeId, setEmployeeId] = useState('');
  const [category, setCategory] = useState('');
  const [month, setMonth] = useState(() => ymOf(tashkentToday()).month);
  const [accountId, setAccountId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [rateStr, setRateStr] = useState('');
  const [comment, setComment] = useState('');
  const [date, setDate] = useState(tashkentToday());

  const [edit, setEdit] = useState<EditPayload | null>(null);
  const [editApplied, setEditApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<{ id: string; text: string; updated: boolean } | null>(null);

  useEffect(() => {
    let alive = true;
    setEdit(peekEdit(['salary']));
    Promise.all([rpc<Employee[]>('kassir_employees'), rpc<KCategory[]>('kassir_salary_categories')])
      .then(([e, c]) => { if (alive) { setEmployees(e); setCats(c); } })
      .catch((e: Error) => alive && setRefError(e.message))
      .finally(() => alive && setRefLoaded(true));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (accLoading || !refLoaded || accounts.length === 0 || editApplied) return;
    if (edit) {
      const acc = accounts.find((a) => a.id === edit.accountId);
      setAccountId(acc?.id || accounts[0].id);
      setAmountStr(amountToInput(edit.amount, acc?.currency === 'USD'));
      setRateStr(edit.rate ? formatAmountInput(String(Math.round(edit.rate)), false) : '');
      setEmployeeId(employees.find((e) => e.full_name === edit.employeeName)?.id || '');
      setCategory(edit.category);
      if (edit.month) setMonth(edit.month);
      setComment(edit.note);
      setDate(edit.date);
    } else {
      const last = lastAccount.get('salary');
      setAccountId(accounts.find((x) => x.id === last)?.id || accounts[0].id);
      setRateStr(lastRate.get() || '');
    }
    setEditApplied(true);
  }, [accLoading, refLoaded, accounts, employees, edit, editApplied]);

  const pickEmployee = (e: Employee) => {
    setEmployeeId(e.id);
    const guess = e.last_code || DEPT_DEFAULT[e.department] || '';
    if (cats.some((c) => c.code === guess)) setCategory(guess);
  };

  const account = accounts.find((a) => a.id === accountId);
  const { isUsd, amount, rate, ok } = readAmount(account, amountStr, rateStr);
  const employee = employees.find((e) => e.id === employeeId);
  const valid = ok && !!employee && !!category && month >= 1 && month <= 12;
  const thisMonth = ymOf(tashkentToday()).month;
  const prevMonth = thisMonth === 1 ? 12 : thisMonth - 1;

  const submit = async () => {
    if (!valid || !account || !employee || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const id = await rpc<string>('kassir_save', {
        p_kind: 'salary',
        p_amount: amount,
        p_account_id: account.id,
        p_category: category,
        p_rate: isUsd ? rate : null,
        p_comment: comment.trim() || null,
        p_date: date,
        p_employee_id: employee.id,
        p_month: month,
        p_replace_id: edit?.id ?? null,
      });
      lastAccount.set('salary', account.id);
      if (isUsd) lastRate.set(rateStr);
      clearEdit();
      setSaved({
        id,
        updated: !!edit,
        text: `−${fmtMoney(amount, account.currency)} · ${account.name} · ${employee.full_name} — ${MONTHS[month - 1]} oyi uchun${date !== tashkentToday() ? ` · ${dateLabel(date, tashkentToday())}` : ''}`,
      });
    } catch (e) {
      const m = (e as Error).message;
      setError(/Aloqa xatosi/.test(m) ? m + ". Saqlanganini bosh sahifadagi ro'yxatdan tekshiring, keyin qayta urining." : m);
    } finally {
      setSubmitting(false);
    }
  };

  const again = () => {
    setSaved(null); setError(''); setEdit(null); setEditApplied(true);
    setAmountStr(''); setComment(''); setEmployeeId(''); setCategory(''); setDate(tashkentToday());
    setMonth(ymOf(tashkentToday()).month);
  };

  if (saved) {
    return (
      <KassirShell title="Xodim oyligi">
        <DoneScreen id={saved.id} summary={saved.text} tone="violet" updated={saved.updated} againLabel="Yana kiritish" onAgain={again} />
      </KassirShell>
    );
  }

  const loading = accLoading || !refLoaded;
  const loadError = accError || refError;

  return (
    <KassirShell title="Xodim oyligi" backHref="/kassir">
      {loading && <div className="ks-empty">Yuklanmoqda...</div>}
      {loadError && <div className="ks-error">{loadError}</div>}
      {!loading && !loadError && (
        <div className="ks-form">
          {edit && <EditBanner onCancel={() => { clearEdit(); router.push('/kassir'); }} />}

          <div className="ks-field">
            <label className="ks-label">Kimga</label>
            <div className="ks-chips">
              {employees.map((e) => (
                <button key={e.id} type="button" className={`ks-chip ${e.id === employeeId ? 'on' : ''}`} onClick={() => pickEmployee(e)}>
                  {e.full_name}
                  <small>{e.department}</small>
                </button>
              ))}
            </div>
            <div className="ks-hint">Abdulaziz oyligi — &quot;Shaxsiy xarajat&quot; bo&apos;limida.</div>
          </div>

          <div className="ks-field">
            <label className="ks-label">Qaysi oy uchun</label>
            <div className="ks-datefield">
              <button type="button" className={`ks-chip ${month === prevMonth ? 'on' : ''}`} onClick={() => setMonth(prevMonth)}>O&apos;tgan oy</button>
              <button type="button" className={`ks-chip ${month === thisMonth ? 'on' : ''}`} onClick={() => setMonth(thisMonth)}>Shu oy</button>
              <select className={`ks-input ks-date-input ${month !== thisMonth && month !== prevMonth ? 'picked' : ''}`} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="ks-field">
            <label className="ks-label">Toifa (qaysi bo&apos;lim oyligi)</label>
            <div className="ks-chips">
              {cats.map((c) => (
                <button key={c.code} type="button" className={`ks-chip ${c.code === category ? 'on' : ''}`} onClick={() => setCategory(c.code)}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <AccountPicker
            accounts={accounts}
            value={accountId}
            onChange={(a) => {
              if (account && a.currency !== account.currency) setAmountStr('');
              setAccountId(a.id);
            }}
          />
          <AmountBlock account={account} amountStr={amountStr} onAmount={setAmountStr} rateStr={rateStr} onRate={setRateStr} tone="violet" />
          <DateField value={date} onChange={setDate} />
          <NoteField value={comment} onChange={setComment} placeholder="Masalan: avans, oylik, bonus" />

          <div className="ks-warn">Oylik kiritilganda admin&apos;ga darhol xabar boradi.</div>
          {error && <div className="ks-error">{error}</div>}
          <SaveBar
            tone="violet"
            disabled={!valid}
            busy={submitting}
            onClick={submit}
            label={valid ? `${edit ? 'Yangilash' : 'Oylikni saqlash'} · ${fmtMoney(amount, account!.currency)}` : edit ? 'Yangilash' : 'Oylikni saqlash'}
          />
        </div>
      )}
    </KassirShell>
  );
}
