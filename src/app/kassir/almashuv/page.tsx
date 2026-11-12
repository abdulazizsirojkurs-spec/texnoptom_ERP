'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowDownUp } from 'lucide-react';
import KassirShell from '@/components/kassir/KassirShell';
import { DateField } from '@/components/kassir/parts';
import { KAccount, rpc, fmtMoney, formatAmountInput, parseAmount, tashkentToday, dateLabel, BIG_UZS, BIG_USD, RATE_MIN, RATE_MAX } from '@/lib/kassir';

// Hisoblar orasida pul o'tkazish / valyuta almashtirish (masalan Naqd → USD).
export default function KassirAlmashuvPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<KAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [fromStr, setFromStr] = useState('');
  const [toStr, setToStr] = useState('');
  const [comment, setComment] = useState('');
  const [date, setDate] = useState(tashkentToday());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  useEffect(() => {
    let alive = true;
    rpc<KAccount[]>('kassir_accounts')
      .then((a) => {
        if (!alive) return;
        setAccounts(a);
        setFromId(a[0]?.id || '');
        setToId(a[1]?.id || '');
      })
      .catch((e: Error) => alive && setLoadError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const from = accounts.find((a) => a.id === fromId);
  const to = accounts.find((a) => a.id === toId);
  const sameCur = !!from && !!to && from.currency === to.currency;
  const fromAmt = parseAmount(fromStr);
  const toAmt = sameCur ? fromAmt : parseAmount(toStr);

  let rate = 0;
  if (from && to && !sameCur && fromAmt > 0 && toAmt > 0) {
    rate = from.currency === 'USD' ? toAmt / fromAmt : fromAmt / toAmt;
  }
  const rateOk = sameCur || (rate >= RATE_MIN && rate <= RATE_MAX);
  const valid = !!from && !!to && fromId !== toId && fromAmt > 0 && toAmt > 0 && rateOk;
  const isBig = !!from && ((from.currency === 'USD' && fromAmt >= BIG_USD) || (from.currency !== 'USD' && fromAmt >= BIG_UZS));

  const swap = () => {
    setFromId(toId); setToId(fromId); setFromStr(toStr); setToStr(fromStr);
  };

  const submit = async () => {
    if (!valid || !from || !to || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await rpc('kassir_save_exchange', {
        p_from: from.id,
        p_to: to.id,
        p_from_amount: fromAmt,
        p_to_amount: toAmt,
        p_comment: comment.trim() || null,
        p_date: date,
      });
      setDone(`${fmtMoney(fromAmt, from.currency)} (${from.name}) → ${fmtMoney(toAmt, to.currency)} (${to.name})${date !== tashkentToday() ? ` · ${dateLabel(date, tashkentToday())}` : ''}`);
    } catch (e) {
      const m = (e as Error).message;
      setError(/Aloqa xatosi/.test(m) ? m + ". Saqlanganini bosh sahifadagi ro'yxatdan tekshiring, keyin qayta urining." : m);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <KassirShell title="Almashuv">
        <div className="ks-done">
          <div className="ks-done-icon"><Check size={40} strokeWidth={3} /></div>
          <div className="ks-done-title">Saqlandi</div>
          <div className="ks-done-sum">{done}</div>
          <div className="ks-done-actions">
            <button className="ks-btn ks-btn-big ks-btn-ex" onClick={() => router.push('/kassir')}>Bosh sahifa</button>
          </div>
        </div>
      </KassirShell>
    );
  }

  const chips = (selected: string, set: (id: string) => void, exclude: string) => (
    <div className="ks-chips">
      {accounts.map((a) => (
        <button
          key={a.id}
          type="button"
          disabled={a.id === exclude}
          className={`ks-chip ${a.id === selected ? 'on' : ''}`}
          onClick={() => {
            // Valyuta o'zgarsa summalar eskirib qoladi — tozalaymiz
            if (accounts.find((x) => x.id === selected)?.currency !== a.currency) { setFromStr(''); setToStr(''); }
            set(a.id);
          }}
        >
          {a.name}
          <small>{a.currency === 'USD' ? '$' : "so'm"}</small>
        </button>
      ))}
    </div>
  );

  return (
    <KassirShell title="Almashuv (hisoblar orasida)" backHref="/kassir">
      {loading && <div className="ks-empty">Yuklanmoqda...</div>}
      {loadError && <div className="ks-error">{loadError}</div>}
      {!loading && !loadError && (
        <div className="ks-form">
          <div className="ks-field">
            <label className="ks-label">Qaysi hisobdan (pul chiqadi)</label>
            {chips(fromId, setFromId, toId)}
          </div>

          <button type="button" className="ks-swap" onClick={swap} aria-label="Almashtirish">
            <ArrowDownUp size={18} />
          </button>

          <div className="ks-field">
            <label className="ks-label">Qaysi hisobga (pul tushadi)</label>
            {chips(toId, setToId, fromId)}
          </div>

          <div className="ks-field">
            <label className="ks-label">
              {sameCur ? `Summa (${from?.currency === 'USD' ? 'dollar' : "so'm"})` : `Beriladi${from ? ` (${from.currency === 'USD' ? 'dollar' : "so'm"})` : ''}`}
            </label>
            <input
              className="ks-amount ex"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={fromStr}
              onChange={(e) => setFromStr(formatAmountInput(e.target.value, from?.currency === 'USD'))}
            />
          </div>

          {!sameCur && to && (
            <div className="ks-field">
              <label className="ks-label">Olinadi ({to.currency === 'USD' ? 'dollar' : "so'm"})</label>
              <input
                className="ks-amount ex"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                value={toStr}
                onChange={(e) => setToStr(formatAmountInput(e.target.value, to.currency === 'USD'))}
              />
              {fromAmt > 0 && toAmt > 0 && (
                rateOk
                  ? <div className="ks-hint">Kurs: 1 $ = {fmtMoney(rate, 'UZS')}</div>
                  : <div className="ks-error-inline">Kurs {fmtMoney(rate, 'UZS')} chiqdi — summalarni tekshiring (1 $ ≈ {RATE_MIN}–{RATE_MAX} so&apos;m bo&apos;lishi kerak)</div>
              )}
            </div>
          )}

          <DateField value={date} onChange={setDate} />

          <div className="ks-field">
            <label className="ks-label">Izoh (ixtiyoriy)</label>
            <input
              className="ks-input"
              maxLength={300}
              placeholder="Masalan: bankdan dollar oldik"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {isBig && <div className="ks-warn">Bu katta summa — admin&apos;ga darhol xabar boradi.</div>}
          {error && <div className="ks-error">{error}</div>}

          <div className="ks-actions-bar">
            <button className="ks-btn ks-btn-big ks-btn-ex" disabled={!valid || submitting} onClick={submit}>
              {submitting ? 'Saqlanmoqda...' : 'Almashuvni saqlash'}
            </button>
          </div>
        </div>
      )}
    </KassirShell>
  );
}
