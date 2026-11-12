'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, BarChart3, ChevronLeft, ChevronRight, HeartHandshake,
  LogOut, RefreshCw, UserRound,
} from 'lucide-react';
import KassirShell from '@/components/kassir/KassirShell';
import CancelSheet from '@/components/kassir/CancelSheet';
import { useAuth } from '@/context/AuthContext';
import {
  KAccount, KDay, TxnRow, rpc, fmtMoney, fmtParts, buildRows, tashkentToday, shiftDate, dateLabel, timeHM,
  clearEdit, stashEdit, editPayloadOf, routeForKind, parsePrefixedComment, MONTHS,
} from '@/lib/kassir';

type Filter = 'all' | 'in' | 'out' | 'personal' | 'salary' | 'exchange';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Hammasi' },
  { key: 'in', label: 'Kirim' },
  { key: 'out', label: 'Chiqim' },
  { key: 'personal', label: 'Shaxsiy' },
  { key: 'salary', label: 'Oylik' },
  { key: 'exchange', label: 'Almashuv' },
];

function rowTitle(r: TxnRow): string {
  if (r.kind === 'exchange') return 'Almashuv';
  const t = r.t;
  if (t.kind === 'salary') {
    const pc = parsePrefixedComment(t.comment);
    return `Oylik — ${pc?.name ?? t.category_name}`;
  }
  return t.category_name;
}

function rowSub(r: TxnRow): string {
  const t = r.t;
  const acc = r.kind === 'exchange' ? `${r.from.account_name} → ${r.to.account_name}` : t.account_name;
  let extra = '';
  if (r.kind === 'txn' && t.kind === 'salary') {
    const pc = parsePrefixedComment(t.comment);
    if (pc) extra = ` · ${MONTHS[pc.month - 1]} oyi uchun`;
  }
  if (r.kind === 'txn' && t.kind === 'personal') extra = ' · shaxsiy';
  return `${acc}${extra} · ${timeHM(t.created_at)}${t.is_mine ? '' : ` · ${t.author_name}`}`;
}

function rowSummary(r: TxnRow): string {
  if (r.kind === 'exchange') {
    return `${fmtMoney(r.from.expense, r.from.currency)} (${r.from.account_name}) → ${fmtMoney(r.to.income, r.to.currency)} (${r.to.account_name})`;
  }
  const t = r.t;
  const amt = t.income > 0 ? fmtMoney(t.income, t.currency, true) : fmtMoney(-t.expense, t.currency);
  return `${amt} · ${t.account_name} · ${rowTitle(r)}`;
}

function matches(r: TxnRow, f: Filter): boolean {
  if (f === 'all') return true;
  if (f === 'exchange') return r.kind === 'exchange';
  if (r.kind === 'exchange') return false;
  if (f === 'in') return r.t.income > 0;
  if (f === 'out') return r.t.expense > 0;
  return r.t.kind === f;
}

export default function KassirHome() {
  const router = useRouter();
  const { role, signOut } = useAuth();
  const allowed = role === 'kassir' || role === 'admin';

  const [today, setToday] = useState(tashkentToday());
  const [date, setDate] = useState(today);
  const [accounts, setAccounts] = useState<KAccount[]>([]);
  const [txns, setTxns] = useState<KDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<TxnRow | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const load = useCallback(async (d: string) => {
    setError('');
    try {
      const [a, t] = await Promise.all([
        rpc<KAccount[]>('kassir_accounts'),
        rpc<KDay[]>('kassir_day', { p_date: d }),
      ]);
      setAccounts(a);
      setTxns(t);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) { setLoading(true); load(date); }
  }, [allowed, date, load]);

  // Ilova ochiq qolib, boshqa ilovadan qaytilganda yangilab turish (sana ham yangilanadi).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || !allowed) return;
      const t = tashkentToday();
      setToday((prev) => (prev === t ? prev : t));
      load(date);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [allowed, date, load]);

  const rows = useMemo(() => buildRows(txns), [txns]);
  const shown = useMemo(() => rows.filter((r) => matches(r, filter)), [rows, filter]);

  // Kun jami (almashuv hisobga olinmaydi — u pul kirimi/chiqimi emas, ichki o'tkazma)
  const dayTotals = useMemo(() => {
    const m: Record<string, { in: number; out: number }> = {};
    for (const t of txns) {
      if (t.category_code === '99999') continue;
      const e = (m[t.currency] ||= { in: 0, out: 0 });
      e.in += t.income;
      e.out += t.expense;
    }
    return m;
  }, [txns]);

  const go = (path: string) => { clearEdit(); router.push(path); };

  const doEdit = (r: TxnRow) => {
    const p = editPayloadOf(r.t);
    if (!p) return;
    stashEdit(p);
    router.push(routeForKind(p.kind));
  };

  const doCancel = async (reason: string) => {
    if (!cancelTarget) return;
    setCancelBusy(true);
    setCancelError('');
    try {
      await rpc('kassir_cancel_txn', { p_id: cancelTarget.t.id, p_reason: reason });
      setCancelTarget(null);
      setOpenKey(null);
      await load(date);
    } catch (e) {
      setCancelError((e as Error).message);
    } finally {
      setCancelBusy(false);
    }
  };

  const fmtTotals = (key: 'in' | 'out') => {
    const parts = Object.entries(dayTotals)
      .filter(([, v]) => v[key] > 0)
      .map(([cur, v]) => fmtMoney(v[key], cur));
    return parts.length ? parts.join(' + ') : '—';
  };

  const headerRight = (
    <>
      <button className="ks-iconbtn" onClick={() => go('/kassir/hisobot')} aria-label="Oylik hisobot">
        <BarChart3 size={20} />
      </button>
      <button className="ks-iconbtn" onClick={() => { setLoading(true); load(date); }} aria-label="Yangilash">
        <RefreshCw size={19} />
      </button>
      {role === 'kassir' && (
        <button className="ks-iconbtn" onClick={signOut} aria-label="Chiqish">
          <LogOut size={19} />
        </button>
      )}
    </>
  );

  return (
    <KassirShell title="Kassa" backHref={role === 'admin' ? '/warehouse' : undefined} right={headerRight}>
      {error && <div className="ks-error">{error}</div>}

      <div className="ks-accounts">
        {accounts.map((a) => (
          <div key={a.id} className="ks-acc">
            <div className="ks-acc-name">{a.name}</div>
            <div className={`ks-acc-bal ${a.balance < 0 ? 'neg' : ''}`}>
              {fmtParts(a.balance, a.currency).num}
              {fmtParts(a.balance, a.currency).unit && <span className="ks-acc-unit"> {fmtParts(a.balance, a.currency).unit}</span>}
            </div>
            <div className="ks-acc-today">
              {a.today_in > 0 || a.today_out > 0 ? (
                <>
                  Bugun:{' '}
                  {a.today_in > 0 && <span className="ks-pos">{fmtMoney(a.today_in, a.currency, true)}</span>}{' '}
                  {a.today_out > 0 && <span className="ks-neg">{fmtMoney(-a.today_out, a.currency)}</span>}
                </>
              ) : (
                'Bugun harakat yo\'q'
              )}
            </div>
          </div>
        ))}
        {!loading && accounts.length === 0 && !error && <div className="ks-empty" style={{ gridColumn: '1 / -1' }}>Hisoblar topilmadi</div>}
      </div>

      <div className="ks-actions3">
        <button className="ks-big in" onClick={() => go('/kassir/kirim')}>
          <ArrowDownCircle size={26} /> Kirim
        </button>
        <button className="ks-big out" onClick={() => go('/kassir/chiqim')}>
          <ArrowUpCircle size={26} /> Chiqim
        </button>
        <button className="ks-big amber" onClick={() => go('/kassir/shaxsiy')}>
          <HeartHandshake size={22} /> Shaxsiy
        </button>
        <button className="ks-big violet" onClick={() => go('/kassir/oylik')}>
          <UserRound size={22} /> Xodim oyligi
        </button>
        <button className="ks-big ex" onClick={() => go('/kassir/almashuv')}>
          <ArrowRightLeft size={24} /> Almashuv
        </button>
      </div>

      <div className="ks-datenav">
        <button className="ks-iconbtn" onClick={() => setDate(shiftDate(date, -1))} aria-label="Oldingi kun">
          <ChevronLeft size={22} />
        </button>
        <button
          className="ks-datelabel"
          onClick={() => setDate(today)}
          disabled={date === today}
          aria-label="Bugunga qaytish"
        >
          {dateLabel(date, today)}
        </button>
        <button className="ks-iconbtn" onClick={() => setDate(shiftDate(date, 1))} disabled={date >= today} aria-label="Keyingi kun">
          <ChevronRight size={22} />
        </button>
      </div>

      {txns.length > 0 && (
        <>
          <div className="ks-daysum">
            <div><span className="ks-daysum-l">Kirim</span><b className="ks-pos">{fmtTotals('in')}</b></div>
            <div><span className="ks-daysum-l">Chiqim</span><b className="ks-neg">{fmtTotals('out')}</b></div>
          </div>
          <div className="ks-seg">
            {FILTERS.map((f) => (
              <button key={f.key} className={`ks-segbtn ${filter === f.key ? 'on' : ''}`} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="ks-list">
        {loading && <div className="ks-empty">Yuklanmoqda...</div>}
        {!loading && rows.length === 0 && !error && <div className="ks-empty">Bu kunda yozuv yo&apos;q</div>}
        {!loading && rows.length > 0 && shown.length === 0 && <div className="ks-empty">Bu turdagi yozuv yo&apos;q</div>}
        {shown.map((r) => {
          const open = openKey === r.key;
          const t = r.t;
          const isEx = r.kind === 'exchange';
          const incomeRow = !isEx && t.income > 0;
          return (
            <div key={r.key} className={`ks-txn ${open ? 'open' : ''}`}>
              <button className="ks-txn-main" onClick={() => setOpenKey(open ? null : r.key)}>
                <div className="ks-txn-left">
                  <div className="ks-txn-cat">{rowTitle(r)}</div>
                  <div className="ks-txn-sub">{rowSub(r)}</div>
                </div>
                <div className={`ks-txn-amt ${isEx ? 'ex' : incomeRow ? 'in' : 'out'}`}>
                  {isEx
                    ? <>{fmtMoney(r.from.expense, r.from.currency)}<span className="ks-arrow">→</span>{fmtMoney(r.to.income, r.to.currency)}</>
                    : incomeRow ? fmtMoney(t.income, t.currency, true) : fmtMoney(-t.expense, t.currency)}
                </div>
              </button>
              {open && (
                <div className="ks-txn-detail">
                  {t.comment && <div className="ks-txn-comment">{t.comment}</div>}
                  <div className="ks-txn-meta">
                    {t.author_name} · {timeHM(t.created_at)}
                    {!isEx && t.exchange_rate ? ` · kurs ${fmtMoney(t.exchange_rate, 'UZS')} → ${fmtMoney((t.income || t.expense) * t.exchange_rate, 'UZS')}` : ''}
                  </div>
                  {t.can_cancel ? (
                    <div className="ks-txn-actions">
                      {t.can_edit && (
                        <button className="ks-btn ks-btn-ghost" onClick={() => doEdit(r)}>Tahrirlash</button>
                      )}
                      <button className="ks-btn ks-btn-danger-soft" onClick={() => { setCancelError(''); setCancelTarget(r); }}>
                        Bekor qilish
                      </button>
                    </div>
                  ) : t.is_mine ? (
                    <div className="ks-hint">Bu yozuvni faqat admin o&apos;zgartira oladi.</div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {cancelTarget && (
        <CancelSheet
          summary={rowSummary(cancelTarget)}
          busy={cancelBusy}
          error={cancelError}
          onConfirm={doCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </KassirShell>
  );
}
