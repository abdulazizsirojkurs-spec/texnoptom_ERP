'use client';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import {
  KAccount, rpc, fmtMoney, formatAmountInput, parseAmount, RATE_MIN, RATE_MAX,
  tashkentToday, shiftDate, BACK_DAYS, clearEdit,
} from '@/lib/kassir';

export type Tone = 'in' | 'out' | 'ex' | 'amber' | 'violet';

// Hisoblar ro'yxatini yuklaydi (qoldiq bilan) — barcha formalarda bir xil.
export function useAccounts() {
  const [accounts, setAccounts] = useState<KAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    rpc<KAccount[]>('kassir_accounts')
      .then((a) => alive && setAccounts(a))
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);
  return { accounts, loading, error };
}

export function AccountPicker({
  accounts, value, onChange, label = 'Qaysi hisob', exclude,
}: { accounts: KAccount[]; value: string; onChange: (a: KAccount) => void; label?: string; exclude?: string }) {
  return (
    <div className="ks-field">
      <label className="ks-label">{label}</label>
      <div className="ks-chips">
        {accounts.map((a) => (
          <button
            key={a.id}
            type="button"
            disabled={a.id === exclude}
            className={`ks-chip ${a.id === value ? 'on' : ''}`}
            onClick={() => onChange(a)}
          >
            {a.name}
            <small>{a.currency === 'USD' ? '$' : "so'm"}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

// Summa (+ dollar hisobda kurs). Tekshiruv natijasi tashqarida `readAmount` bilan olinadi.
export function readAmount(account: KAccount | undefined, amountStr: string, rateStr: string) {
  const isUsd = account?.currency === 'USD';
  const amount = parseAmount(amountStr);
  const rate = parseAmount(rateStr);
  const rateOk = !isUsd || (rate >= RATE_MIN && rate <= RATE_MAX);
  return { isUsd, amount, rate, rateOk, ok: !!account && amount > 0 && rateOk };
}

export function AmountBlock({
  account, amountStr, onAmount, rateStr, onRate, tone, label,
}: {
  account: KAccount | undefined; amountStr: string; onAmount: (v: string) => void;
  rateStr: string; onRate: (v: string) => void; tone: Tone; label?: string;
}) {
  const { isUsd, amount, rate, rateOk } = readAmount(account, amountStr, rateStr);
  return (
    <>
      <div className="ks-field">
        <label className="ks-label">{label || `Summa ${account ? `(${isUsd ? 'dollar' : "so'm"})` : ''}`}</label>
        <input
          className={`ks-amount ${tone}`}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={amountStr}
          onChange={(e) => onAmount(formatAmountInput(e.target.value, isUsd))}
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
            onChange={(e) => onRate(formatAmountInput(e.target.value, false))}
          />
          {rateStr && !rateOk && <div className="ks-error-inline">Kurs {RATE_MIN}–{RATE_MAX} orasida bo&apos;lishi kerak (masalan 12 100)</div>}
          {rateOk && amount > 0 && <div className="ks-hint">≈ {fmtMoney(amount * rate, 'UZS')}</div>}
        </div>
      )}
    </>
  );
}

// Sana: bugun / kecha / boshqa (oxirgi 7 kun ichida).
export function DateField({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const [today, setToday] = useState(tashkentToday());
  useEffect(() => { setToday(tashkentToday()); }, []);
  const yesterday = shiftDate(today, -1);
  return (
    <div className="ks-field">
      <label className="ks-label">Sana</label>
      <div className="ks-datefield">
        <button type="button" className={`ks-chip ${value === today ? 'on' : ''}`} onClick={() => onChange(today)}>Bugun</button>
        <button type="button" className={`ks-chip ${value === yesterday ? 'on' : ''}`} onClick={() => onChange(yesterday)}>Kecha</button>
        <input
          type="date"
          className={`ks-input ks-date-input ${value !== today && value !== yesterday ? 'picked' : ''}`}
          value={value}
          min={shiftDate(today, -BACK_DAYS)}
          max={today}
          onChange={(e) => e.target.value && onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

export function NoteField({
  value, onChange, placeholder = 'Masalan: ofis uchun suv', label = 'Izoh (ixtiyoriy)',
}: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string }) {
  return (
    <div className="ks-field">
      <label className="ks-label">{label}</label>
      <input className="ks-input" maxLength={300} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function EditBanner({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="ks-edit-banner">
      <div>
        <b>Tahrirlash rejimi</b>
        <div>Saqlasangiz, eski yozuv yangisi bilan almashtiriladi.</div>
      </div>
      <button type="button" className="ks-btn ks-btn-ghost" onClick={onCancel}>Bekor</button>
    </div>
  );
}

export function SaveBar({
  tone, disabled, busy, label, onClick,
}: { tone: Tone; disabled: boolean; busy: boolean; label: string; onClick: () => void }) {
  return (
    <div className="ks-actions-bar">
      <button className={`ks-btn ks-btn-big ks-btn-${tone}`} disabled={disabled || busy} onClick={onClick}>
        {busy ? 'Saqlanmoqda...' : label}
      </button>
    </div>
  );
}

// Saqlandi ekrani: "yana kiritish", "bosh sahifa" va xato bo'lsa darhol bekor qilish.
export function DoneScreen({
  id, summary, tone, againLabel, updated, onAgain,
}: { id: string; summary: ReactNode; tone: Tone; againLabel: string; updated?: boolean; onAgain: () => void }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [undone, setUndone] = useState(false);
  const [error, setError] = useState('');

  const undo = async () => {
    if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 5000); return; }
    setBusy(true);
    setError('');
    try {
      await rpc('kassir_cancel_txn', { p_id: id, p_reason: 'Xato kiritildi (darhol bekor qilindi)' });
      setUndone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setArmed(false);
    }
  };

  return (
    <div className="ks-done">
      <div className={`ks-done-icon ${undone ? 'undone' : ''}`}>{undone ? '↩' : <Check size={40} strokeWidth={3} />}</div>
      <div className="ks-done-title">{undone ? 'Bekor qilindi' : updated ? 'Yangilandi' : 'Saqlandi'}</div>
      <div className="ks-done-sum">{summary}</div>
      {error && <div className="ks-error">{error}</div>}
      <div className="ks-done-actions">
        <button className={`ks-btn ks-btn-big ks-btn-${tone}`} onClick={() => { clearEdit(); onAgain(); }}>{againLabel}</button>
        <button className="ks-btn ks-btn-big ks-btn-ghost" onClick={() => { clearEdit(); router.push('/kassir'); }}>Bosh sahifa</button>
        {!undone && (
          <button className="ks-btn ks-btn-link" onClick={undo} disabled={busy}>
            {armed ? 'Ha, bekor qilinsin' : '↩ Xato kiritdim — bekor qilish'}
          </button>
        )}
      </div>
    </div>
  );
}
