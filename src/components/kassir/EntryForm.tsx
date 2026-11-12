'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import KassirShell from '@/components/kassir/KassirShell';
import {
  AccountPicker, AmountBlock, DateField, DoneScreen, EditBanner, NoteField, SaveBar, readAmount, useAccounts,
} from '@/components/kassir/parts';
import {
  Flow, KCategory, EditPayload, rpc, fmtMoney, amountToInput, formatAmountInput, sortCategories, bumpCategory,
  lastAccount, lastRate, peekEdit, clearEdit, tashkentToday, dateLabel, BIG_UZS, BIG_USD,
} from '@/lib/kassir';

const TOP_CATS = 8;

// Kirim va Chiqim uchun bitta umumiy forma (flow bilan farqlanadi).
export default function EntryForm({ flow }: { flow: Flow }) {
  const router = useRouter();
  const isIncome = flow === 'income';
  const tone = isIncome ? 'in' : 'out';

  const { accounts, loading: accLoading, error: accError } = useAccounts();
  const [cats, setCats] = useState<KCategory[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState('');

  const [accountId, setAccountId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [rateStr, setRateStr] = useState('');
  const [category, setCategory] = useState('');
  const [showAllCats, setShowAllCats] = useState(false);
  const [comment, setComment] = useState('');
  const [date, setDate] = useState(tashkentToday());

  const [edit, setEdit] = useState<EditPayload | null>(null);
  const [editApplied, setEditApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<{ id: string; text: string; updated: boolean } | null>(null);

  useEffect(() => {
    let alive = true;
    rpc<KCategory[]>('kassir_categories', { p_flow: flow })
      .then((c) => alive && setCats(sortCategories(flow, c)))
      .catch((e: Error) => alive && setCatError(e.message))
      .finally(() => alive && setCatLoading(false));
    setEdit(peekEdit([flow]));
    return () => { alive = false; };
  }, [flow]);

  // Boshlang'ich hisob (oxirgi ishlatilgan) yoki tahrirlanayotgan yozuv ma'lumoti
  useEffect(() => {
    if (accLoading || catLoading || accounts.length === 0 || editApplied) return;
    if (edit) {
      const acc = accounts.find((a) => a.id === edit.accountId);
      setAccountId(acc?.id || accounts[0].id);
      setAmountStr(amountToInput(edit.amount, acc?.currency === 'USD'));
      setRateStr(edit.rate ? formatAmountInput(String(Math.round(edit.rate)), false) : '');
      setCategory(cats.some((c) => c.code === edit.category) ? edit.category : '');
      setComment(edit.note);
      setDate(edit.date);
    } else {
      const last = lastAccount.get(flow);
      setAccountId(accounts.find((x) => x.id === last)?.id || accounts[0].id);
      setRateStr(lastRate.get() || '');
    }
    setEditApplied(true);
  }, [accLoading, catLoading, accounts, cats, edit, editApplied, flow]);

  const account = accounts.find((a) => a.id === accountId);
  const { isUsd, amount, rate, ok } = readAmount(account, amountStr, rateStr);
  const valid = ok && !!category;
  const isBig = !isIncome && !!account && ((isUsd && amount >= BIG_USD) || (!isUsd && amount >= BIG_UZS));

  const visibleCats = useMemo(() => {
    if (showAllCats || cats.length <= TOP_CATS + 1) return cats;
    const top = cats.slice(0, TOP_CATS);
    const sel = cats.find((c) => c.code === category);
    return sel && !top.some((c) => c.code === sel.code) ? [...top, sel] : top;
  }, [cats, showAllCats, category]);

  const submit = async () => {
    if (!valid || !account || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const id = await rpc<string>('kassir_save', {
        p_kind: flow,
        p_amount: amount,
        p_account_id: account.id,
        p_category: category,
        p_rate: isUsd ? rate : null,
        p_comment: comment.trim() || null,
        p_date: date,
        p_replace_id: edit?.id ?? null,
      });
      lastAccount.set(flow, account.id);
      if (isUsd) lastRate.set(rateStr);
      bumpCategory(flow, category);
      clearEdit();
      const catName = cats.find((c) => c.code === category)?.name || '';
      const sign = isIncome ? '+' : '−';
      setSaved({
        id,
        updated: !!edit,
        text: `${sign}${fmtMoney(amount, account.currency)} · ${account.name} · ${catName}${date !== tashkentToday() ? ` · ${dateLabel(date, tashkentToday())}` : ''}`,
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
    setCats((c) => sortCategories(flow, c));
  };

  const cancelEdit = () => { clearEdit(); router.push('/kassir'); };

  if (saved) {
    return (
      <KassirShell title={isIncome ? 'Kirim' : 'Chiqim'}>
        <DoneScreen id={saved.id} summary={saved.text} tone={tone} updated={saved.updated} againLabel="Yana kiritish" onAgain={again} />
      </KassirShell>
    );
  }

  const loading = accLoading || catLoading;
  const loadError = accError || catError;

  return (
    <KassirShell title={isIncome ? 'Kirim (pul tushdi)' : 'Chiqim (pul chiqdi)'} backHref="/kassir">
      {loading && <div className="ks-empty">Yuklanmoqda...</div>}
      {loadError && <div className="ks-error">{loadError}</div>}
      {!loading && !loadError && (
        <div className="ks-form">
          {edit && <EditBanner onCancel={cancelEdit} />}

          <AccountPicker
            accounts={accounts}
            value={accountId}
            onChange={(a) => {
              // Valyuta o'zgarsa summani tozalaymiz (1 200 000 so'm tasodifan $1 200 000 bo'lib qolmasin)
              if (account && a.currency !== account.currency) setAmountStr('');
              setAccountId(a.id);
            }}
          />

          <AmountBlock account={account} amountStr={amountStr} onAmount={setAmountStr} rateStr={rateStr} onRate={setRateStr} tone={tone} />

          <div className="ks-field">
            <label className="ks-label">Nima uchun (toifa)</label>
            <div className="ks-chips">
              {visibleCats.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className={`ks-chip ${c.code === category ? 'on' : ''}`}
                  onClick={() => setCategory(c.code)}
                >
                  {c.name}
                </button>
              ))}
              {!showAllCats && cats.length > TOP_CATS + 1 && (
                <button type="button" className="ks-chip more" onClick={() => setShowAllCats(true)}>
                  Yana {cats.length - TOP_CATS} ta <ChevronDown size={15} />
                </button>
              )}
            </div>
          </div>

          <DateField value={date} onChange={setDate} />
          <NoteField value={comment} onChange={setComment} />

          {isBig && <div className="ks-warn">Bu katta summa — admin&apos;ga darhol xabar boradi.</div>}
          {error && <div className="ks-error">{error}</div>}

          <SaveBar
            tone={tone}
            disabled={!valid}
            busy={submitting}
            onClick={submit}
            label={valid
              ? `${edit ? 'Yangilash' : isIncome ? 'Kirimni saqlash' : 'Chiqimni saqlash'} · ${fmtMoney(amount, account!.currency)}`
              : edit ? 'Yangilash' : isIncome ? 'Kirimni saqlash' : 'Chiqimni saqlash'}
          />
        </div>
      )}
    </KassirShell>
  );
}
