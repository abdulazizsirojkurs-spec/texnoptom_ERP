'use client';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import KassirShell from '@/components/kassir/KassirShell';
import { MonthRow, PersonalCat, rpc, fmtMoney, tashkentToday, ymOf, MONTHS } from '@/lib/kassir';

function Bar({ pct, tone }: { pct: number; tone?: 'in' | 'out' | 'over' | 'warn' | '' }) {
  return <span className="ks-bar"><span className={`ks-bar-fill ${tone || ''}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></span>;
}

// Oy hisoboti: kirim/chiqim toifalar bo'yicha + shaxsiy xarajatlar (oylik limit bilan).
export default function KassirHisobotPage() {
  const now = ymOf(tashkentToday());
  const [ym, setYm] = useState(now);
  const [rows, setRows] = useState<MonthRow[]>([]);
  const [pers, setPers] = useState<PersonalCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    Promise.all([
      rpc<MonthRow[]>('kassir_month_summary', { p_year: ym.year, p_month: ym.month }),
      rpc<PersonalCat[]>('kassir_personal_summary', { p_year: ym.year, p_month: ym.month }),
    ])
      .then(([r, p]) => { if (alive) { setRows(r); setPers(p); } })
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [ym.year, ym.month]);

  const prev = () => setYm((c) => (c.month === 1 ? { year: c.year - 1, month: 12 } : { year: c.year, month: c.month - 1 }));
  const next = () => setYm((c) => (c.month === 12 ? { year: c.year + 1, month: 1 } : { year: c.year, month: c.month + 1 }));
  const isCurrent = ym.year === now.year && ym.month === now.month;

  const currencies = useMemo(() => Array.from(new Set(rows.map((r) => r.currency))), [rows]);
  const persTotal = pers.reduce((s, c) => s + c.spent, 0);
  const persLimit = pers.reduce((s, c) => s + c.monthly_limit, 0);

  return (
    <KassirShell title="Oylik hisobot" backHref="/kassir">
      <div className="ks-datenav">
        <button className="ks-iconbtn" onClick={prev} aria-label="Oldingi oy"><ChevronLeft size={22} /></button>
        <div className="ks-datelabel" style={{ cursor: 'default' }}>{MONTHS[ym.month - 1]} {ym.year}</div>
        <button className="ks-iconbtn" onClick={next} disabled={isCurrent} aria-label="Keyingi oy"><ChevronRight size={22} /></button>
      </div>

      {error && <div className="ks-error">{error}</div>}
      {loading && <div className="ks-empty">Yuklanmoqda...</div>}

      {!loading && !error && (
        <div className="ks-form">
          {currencies.length === 0 && <div className="ks-empty">Bu oyda yozuv yo&apos;q</div>}

          {currencies.map((cur) => {
            const mine = rows.filter((r) => r.currency === cur);
            const ins = mine.filter((r) => r.flow === 'in');
            const outs = mine.filter((r) => r.flow === 'out');
            const inTotal = ins.reduce((s, r) => s + r.total, 0);
            const outTotal = outs.reduce((s, r) => s + r.total, 0);
            const diff = inTotal - outTotal;
            return (
              <div key={cur} className="ks-rep-card">
                <div className="ks-rep-title">{cur === 'USD' ? 'Dollar hisoblari' : "So'm hisoblari"}</div>
                <div className="ks-rep-sum">
                  <div><span className="ks-daysum-l">Kirim</span><b className="ks-pos">{fmtMoney(inTotal, cur)}</b></div>
                  <div><span className="ks-daysum-l">Chiqim</span><b className="ks-neg">{fmtMoney(outTotal, cur)}</b></div>
                  <div><span className="ks-daysum-l">Farq</span><b className={diff < 0 ? 'ks-neg' : 'ks-pos'}>{fmtMoney(diff, cur, true)}</b></div>
                </div>

                {outs.length > 0 && (
                  <>
                    <div className="ks-rep-sub">Chiqim toifalari</div>
                    {outs.map((r) => (
                      <div key={`o-${r.label}`} className="ks-rep-row">
                        <div className="ks-rep-row-top"><span>{r.label}</span><b>{fmtMoney(r.total, cur)}</b></div>
                        <Bar pct={outTotal > 0 ? (r.total / outTotal) * 100 : 0} tone="out" />
                      </div>
                    ))}
                  </>
                )}
                {ins.length > 0 && (
                  <>
                    <div className="ks-rep-sub">Kirim toifalari</div>
                    {ins.map((r) => (
                      <div key={`i-${r.label}`} className="ks-rep-row">
                        <div className="ks-rep-row-top"><span>{r.label}</span><b>{fmtMoney(r.total, cur)}</b></div>
                        <Bar pct={inTotal > 0 ? (r.total / inTotal) * 100 : 0} tone="in" />
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}

          <div className="ks-rep-card">
            <div className="ks-rep-title">Shaxsiy xarajatlar</div>
            <div className="ks-rep-sum two">
              <div><span className="ks-daysum-l">Sarflandi</span><b className="ks-neg">{fmtMoney(persTotal, 'UZS')}</b></div>
              <div><span className="ks-daysum-l">Jami limit</span><b>{fmtMoney(persLimit, 'UZS')}</b></div>
            </div>
            {pers.map((c) => {
              const pct = c.monthly_limit > 0 ? (c.spent / c.monthly_limit) * 100 : 0;
              const over = c.monthly_limit > 0 && c.spent > c.monthly_limit;
              return (
                <div key={c.code} className="ks-rep-row">
                  <div className="ks-rep-row-top">
                    <span>{c.name}</span>
                    <b className={over ? 'ks-neg' : ''}>
                      {fmtMoney(c.spent, 'UZS')}{c.monthly_limit > 0 ? ` / ${fmtMoney(c.monthly_limit, 'UZS')}` : ''}
                    </b>
                  </div>
                  <Bar pct={pct} tone={over ? 'over' : pct >= 80 ? 'warn' : ''} />
                </div>
              );
            })}
            <div className="ks-hint">Limitlarni admin kompyuterdan belgilaydi.</div>
          </div>
        </div>
      )}
    </KassirShell>
  );
}
