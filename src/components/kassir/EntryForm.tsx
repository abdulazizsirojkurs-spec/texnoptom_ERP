'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown } from 'lucide-react';
import KassirShell from '@/components/kassir/KassirShell';
import {
  Flow, KAccount, KCategory, rpc, fmtMoney, formatAmountInput, parseAmount,
  sortCategories, bumpCategory, lastAccount, lastRate, BIG_UZS, BIG_USD, RATE_MIN, RATE_MAX,
} from '@/lib/kassir';

const TOP_CATS = 8;

type Saved = { id: string; text: string };

// Kirim va Chiqim uchun bitta umumiy forma (flow bilan farqlanadi).
export default function EntryForm({ flow }: { flow: Flow }) {
  const router = useRouter();
  const isIncome = flow === 'income';

  const [accounts, setAccounts] = useState<KAccount[]>([]);
  const [cats, setCats] = useState<KCategory[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const [accountId, setAccountId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [rateStr, setRateStr] = useState('');
  const [category, setCategory] = useState('');
  const [showAllCats, setShowAllCats] = useState(false);
  const [comment, setComment] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<Saved | null>(null);
  const [undoArmed, setUndoArmed] = useState(false);
  const [undone, setUndone] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      rpc<KAccount[]>('kassir_accounts'),
      rpc<KCategory[]>('kassir_categories', { p_flow: flow }),
    ])
      .then(([a, c]) => {
        if (!alive) return;
        setAccounts(a);
        setCats(sortCategories(flow, c));
        const last = lastAccount.get(flow);
        setAccountId(a.find((x) => x.id === last)?.id || a[0]?.id || '');
        setRateStr(lastRate.get() || '');
      })
      .catch((e: Error) => alive && setLoadError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [flow]);

  const account = accounts.find((a) => a.id === accountId);
  const isUsd = account?.currency === 'USD';
  const amount = parseAmount(amountStr);
  const rate = parseAmount(rateStr);
  const rateOk = !isUsd || (rate >= RATE_MIN && rate <= RATE_MAX);
  const valid = !!account && amount > 0 && !!category && rateOk;
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
      const id = await rpc<string>('kassir_add_txn', {
        p_flow: flow,
        p_amount: amount,
        p_account_id: account.id,
        p_category: category,
        p_rate: isUsd ? rate : null,
        p_comment: comment.trim() || null,
      });
      lastAccount.set(flow, account.id);
      if (isUsd) lastRate.set(rateStr);
      bumpCategory(flow, category);
      const catName = cats.find((c) => c.code === category)?.name || '';
      setSaved({
        id,
        text: `${fmtMoney(amount, account.currency, true).replace(/^[+−]/, isIncome ? '+' : '−')} · ${account.name} · ${catName}`,
      });
    } catch (e) {
      const m = (e as Error).message;
      setError(/Aloqa xatosi/.test(m) ? m + ". Saqlanganini bosh sahifadagi ro'yxatdan tekshiring, keyin qayta urining." : m);
    } finally {
      setSubmitting(false);
    }
  };

  const undo = async () => {
    if (!saved) return;
    if (!undoArmed) { setUndoArmed(true); setTimeout(() => setUndoArmed(false), 5000); return; }
    setSubmitting(true);
    setError('');
    try {
      await rpc('kassir_cancel_txn', { p_id: saved.id, p_reason: 'Xato kiritildi (darhol bekor qilindi)' });
      setUndone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
      setUndoArmed(false);
    }
  };

  const again = () => {
    setSaved(null); setUndone(false); setUndoArmed(false); setError('');
    setAmountStr(''); setComment(''); setCategory('');
    // Saqlangan kategoriya tartibini yangilash
    setCats((c) => sortCategories(flow, c));
  };

  const title = isIncome ? 'Kirim' : 'Chiqim';

  if (saved) {
    return (
      <KassirShell title={title}>
        <div className="ks-done">
          <div className={`ks-done-icon ${undone ? 'undone' : ''}`}>{undone ? '↩' : <Check size={40} strokeWidth={3} />}</div>
          <div className="ks-done-title">{undone ? 'Bekor qilindi' : 'Saqlandi'}</div>
          <div className="ks-done-sum">{saved.text}</div>
          {error && <div className="ks-error">{error}</div>}
          <div className="ks-done-actions">
            <button className={`ks-btn ks-btn-big ${isIncome ? 'ks-btn-in' : 'ks-btn-out'}`} onClick={again}>
              Yana kiritish
            </button>
            <button className="ks-btn ks-btn-big ks-btn-ghost" onClick={() => router.push('/kassir')}>
              Bosh sahifa
            </button>
            {!undone && (
              <button className="ks-btn ks-btn-link" onClick={undo} disabled={submitting}>
                {undoArmed ? 'Ha, bekor qilinsin' : '↩ Xato kiritdim — bekor qilish'}
              </button>
            )}
          </div>
        </div>
      </KassirShell>
    );
  }

  return (
    <KassirShell title={isIncome ? 'Kirim (pul tushdi)' : 'Chiqim (pul chiqdi)'} backHref="/kassir">
      {loading && <div className="ks-empty">Yuklanmoqda...</div>}
      {loadError && <div className="ks-error">{loadError}</div>}
      {!loading && !loadError && (
        <div className="ks-form">
          <div className="ks-field">
            <label className="ks-label">Qaysi hisob</label>
            <div className="ks-chips">
              {accounts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`ks-chip ${a.id === accountId ? 'on' : ''}`}
                  onClick={() => {
                    // Valyuta o'zgarsa summani tozalaymiz (1 200 000 so'm tasodifan $1 200 000 bo'lib qolmasin)
                    if (account && a.currency !== account.currency) setAmountStr('');
                    setAccountId(a.id);
                  }}
                >
                  {a.name}
                  <small>{a.currency === 'USD' ? '$' : "so'm"}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="ks-field">
            <label className="ks-label">Summa {account ? `(${account.currency === 'USD' ? 'dollar' : "so'm"})` : ''}</label>
            <input
              className={`ks-amount ${isIncome ? 'in' : 'out'}`}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={amountStr}
              onChange={(e) => setAmountStr(formatAmountInput(e.target.value, isUsd))}
            />
          </div>

          {isUsd && (
            <div className="ks-field">
              <label className="ks-label">Kurs (1 dollar necha so&apos;m)</label>
              <input
                className="ks-input"
                inputMode="decimal"
                autoComplete="off"
                placeholder="12100"
                value={rateStr}
                onChange={(e) => setRateStr(formatAmountInput(e.target.value, false))}
              />
              {rateStr && !rateOk && <div className="ks-error-inline">Kurs {RATE_MIN}–{RATE_MAX} orasida bo&apos;lishi kerak (masalan 12 100)</div>}
              {rateOk && amount > 0 && <div className="ks-hint">≈ {fmtMoney(amount * rate, 'UZS')}</div>}
            </div>
          )}

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

          <div className="ks-field">
            <label className="ks-label">Izoh (ixtiyoriy)</label>
            <input
              className="ks-input"
              maxLength={300}
              placeholder="Masalan: ofis uchun suv"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {isBig && <div className="ks-warn">Bu katta summa — admin&apos;ga darhol xabar boradi.</div>}
          {error && <div className="ks-error">{error}</div>}

          <div className="ks-actions-bar">
            <button
              className={`ks-btn ks-btn-big ${isIncome ? 'ks-btn-in' : 'ks-btn-out'}`}
              disabled={!valid || submitting}
              onClick={submit}
            >
              {submitting
                ? 'Saqlanmoqda...'
                : valid
                  ? `${isIncome ? 'Kirimni' : 'Chiqimni'} saqlash · ${fmtMoney(amount, account!.currency)}`
                  : isIncome ? 'Kirimni saqlash' : 'Chiqimni saqlash'}
            </button>
          </div>
        </div>
      )}
    </KassirShell>
  );
}
