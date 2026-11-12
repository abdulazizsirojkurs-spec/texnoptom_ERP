'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import KassirShell from '@/components/kassir/KassirShell';
import {
  AccountPicker, AmountBlock, DateField, DoneScreen, EditBanner, NoteField, SaveBar, readAmount, useAccounts,
} from '@/components/kassir/parts';
import {
  PersonalCat, EditPayload, rpc, fmtMoney, amountToInput, formatAmountInput, lastAccount, lastRate,
  peekEdit, clearEdit, tashkentToday, dateLabel, ymOf, MONTHS,
} from '@/lib/kassir';

// Shaxsiy/oilaviy xarajat: kompyuterdagi "Shaxsiy oylik" bilan bir xil yoziladi —
// Abdulaziz oyligi hisobiga (xodim oyligi toifasi + shaxsiy toifa), shaxsiy moliya
// hisobotida oylik limit bilan hisoblanadi.
export default function KassirShaxsiyPage() {
  const router = useRouter();
  const { accounts, loading: accLoading, error: accError } = useAccounts();
  const [cats, setCats] = useState<PersonalCat[]>([]);
  const [catError, setCatError] = useState('');
  const [catLoaded, setCatLoaded] = useState(false);

  const [accountId, setAccountId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [rateStr, setRateStr] = useState('');
  const [category, setCategory] = useState('');
  const [comment, setComment] = useState('');
  const [date, setDate] = useState(tashkentToday());

  const [edit, setEdit] = useState<EditPayload | null>(null);
  const [editApplied, setEditApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<{ id: string; text: string; updated: boolean } | null>(null);

  const { year, month } = ymOf(date);

  useEffect(() => { setEdit(peekEdit(['personal'])); }, []);

  // Tanlangan sananing oyi bo'yicha limit va sarflangan summa
  useEffect(() => {
    let alive = true;
    rpc<PersonalCat[]>('kassir_personal_summary', { p_year: year, p_month: month })
      .then((c) => { if (alive) { setCats(c); setCatError(''); } })
      .catch((e: Error) => alive && setCatError(e.message))
      .finally(() => alive && setCatLoaded(true));
    return () => { alive = false; };
  }, [year, month]);

  useEffect(() => {
    if (accLoading || !catLoaded || accounts.length === 0 || editApplied) return;
    if (edit) {
      const acc = accounts.find((a) => a.id === edit.accountId);
      setAccountId(acc?.id || accounts[0].id);
      setAmountStr(amountToInput(edit.amount, acc?.currency === 'USD'));
      setRateStr(edit.rate ? formatAmountInput(String(Math.round(edit.rate)), false) : '');
      setCategory(edit.category);
      setComment(edit.note);
      setDate(edit.date);
    } else {
      const last = lastAccount.get('personal');
      setAccountId(accounts.find((x) => x.id === last)?.id || accounts[0].id);
      setRateStr(lastRate.get() || '');
    }
    setEditApplied(true);
  }, [accLoading, catLoaded, accounts, edit, editApplied]);

  const account = accounts.find((a) => a.id === accountId);
  const { isUsd, amount, rate, ok } = readAmount(account, amountStr, rateStr);
  const valid = ok && !!category;
  const selected = cats.find((c) => c.code === category);
  const amountUzs = isUsd ? amount * rate : amount;
  const after = selected ? selected.spent + amountUzs : 0;
  const over = !!selected && selected.monthly_limit > 0 && amountUzs > 0 && after > selected.monthly_limit;

  const submit = async () => {
    if (!valid || !account || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const id = await rpc<string>('kassir_save', {
        p_kind: 'personal',
        p_amount: amount,
        p_account_id: account.id,
        p_category: category,
        p_rate: isUsd ? rate : null,
        p_comment: comment.trim() || null,
        p_date: date,
        p_replace_id: edit?.id ?? null,
      });
      lastAccount.set('personal', account.id);
      if (isUsd) lastRate.set(rateStr);
      clearEdit();
      setSaved({
        id,
        updated: !!edit,
        text: `−${fmtMoney(amount, account.currency)} · ${account.name} · ${selected?.name || ''}${date !== tashkentToday() ? ` · ${dateLabel(date, tashkentToday())}` : ''}`,
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
    setAmountStr(''); setComment(''); setCategory(''); setDate(tashkentToday());
    // Sarflangan summalar yangilansin
    setCatLoaded(false);
    rpc<PersonalCat[]>('kassir_personal_summary', { p_year: ymOf(tashkentToday()).year, p_month: ymOf(tashkentToday()).month })
      .then(setCats).catch(() => {}).finally(() => setCatLoaded(true));
  };

  if (saved) {
    return (
      <KassirShell title="Shaxsiy xarajat">
        <DoneScreen id={saved.id} summary={saved.text} tone="amber" updated={saved.updated} againLabel="Yana kiritish" onAgain={again} />
      </KassirShell>
    );
  }

  const loading = accLoading || !catLoaded;
  const loadError = accError || catError;

  return (
    <KassirShell title="Shaxsiy xarajat" backHref="/kassir">
      {loading && <div className="ks-empty">Yuklanmoqda...</div>}
      {loadError && <div className="ks-error">{loadError}</div>}
      {!loading && !loadError && (
        <div className="ks-form">
          {edit && <EditBanner onCancel={() => { clearEdit(); router.push('/kassir'); }} />}
          <div className="ks-hint" style={{ marginTop: -6 }}>
            Oila va shaxsiy xarajatlar. Abdulaziz oyligi hisobiga yoziladi — {MONTHS[month - 1]} oyi limiti bilan hisoblanadi.
          </div>

          <div className="ks-field">
            <label className="ks-label">Nima uchun</label>
            <div className="ks-pgrid">
              {cats.map((c) => {
                const pct = c.monthly_limit > 0 ? Math.min(100, (c.spent / c.monthly_limit) * 100) : 0;
                const full = c.monthly_limit > 0 && c.spent > c.monthly_limit;
                return (
                  <button
                    key={c.code}
                    type="button"
                    className={`ks-pcard ${c.code === category ? 'on' : ''}`}
                    onClick={() => setCategory(c.code)}
                  >
                    <span className="ks-pcard-name">{c.name}</span>
                    <span className="ks-bar"><span className={`ks-bar-fill ${full ? 'over' : pct >= 80 ? 'warn' : ''}`} style={{ width: `${pct}%` }} /></span>
                    <span className={`ks-pcard-sub ${full ? 'over' : ''}`}>
                      {c.monthly_limit > 0
                        ? full ? `${fmtMoney(c.spent - c.monthly_limit, 'UZS')} oshgan` : `Qoldi ${fmtMoney(c.monthly_limit - c.spent, 'UZS')}`
                        : c.spent > 0 ? `Sarflandi ${fmtMoney(c.spent, 'UZS')}` : 'Limit yo\'q'}
                    </span>
                  </button>
                );
              })}
            </div>
            {selected && selected.monthly_limit > 0 && amountUzs > 0 && (
              <div className={over ? 'ks-warn' : 'ks-hint'} style={{ marginTop: 10 }}>
                {over ? 'Limitdan oshadi: ' : 'Shu bilan: '}
                {fmtMoney(after, 'UZS')} / {fmtMoney(selected.monthly_limit, 'UZS')} ({Math.round((after / selected.monthly_limit) * 100)}%)
              </div>
            )}
          </div>

          <AccountPicker
            accounts={accounts}
            value={accountId}
            onChange={(a) => {
              if (account && a.currency !== account.currency) setAmountStr('');
              setAccountId(a.id);
            }}
          />
          <AmountBlock account={account} amountStr={amountStr} onAmount={setAmountStr} rateStr={rateStr} onRate={setRateStr} tone="amber" />
          <DateField value={date} onChange={setDate} />
          <NoteField value={comment} onChange={setComment} placeholder="Masalan: korzinka, dori, bolaga kiyim" />

          {error && <div className="ks-error">{error}</div>}
          <SaveBar
            tone="amber"
            disabled={!valid}
            busy={submitting}
            onClick={submit}
            label={valid ? `${edit ? 'Yangilash' : 'Saqlash'} · ${fmtMoney(amount, account!.currency)}` : edit ? 'Yangilash' : 'Saqlash'}
          />
        </div>
      )}
    </KassirShell>
  );
}
