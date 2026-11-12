// /kassir bo'limi (xotin/kassir uchun mobil kassa) umumiy yordamchilari.
// Hamma ma'lumot FAQAT kassir_* RPC'lar orqali o'qiladi/yoziladi — jadvallarga
// to'g'ridan-to'g'ri murojaat yo'q (ruxsat bazaning o'zida cheklangan).
import { supabase } from '@/utils/supabase';

export type Flow = 'income' | 'expense';

export type KAccount = {
  id: string; name: string; currency: string;
  balance: number; today_in: number; today_out: number;
};
export type KCategory = { code: string; name: string };
export type KTxn = {
  id: string; txn_date: string; created_at: string; account_name: string; currency: string;
  income: number; expense: number; exchange_rate: number | null;
  category_code: string; category_name: string; comment: string | null;
  author_name: string; is_mine: boolean; can_cancel: boolean;
};

// Katta chiqim chegarasi (bazadagi qiymat bilan bir xil) — faqat ogohlantirish uchun.
export const BIG_UZS = 5_000_000;
export const BIG_USD = 500;
export const RATE_MIN = 5000;
export const RATE_MAX = 50000;

export async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    const m = error.message || 'Xatolik';
    throw new Error(/Failed to fetch|NetworkError|Load failed|network/i.test(m) ? 'Aloqa xatosi — internetni tekshiring' : m);
  }
  return data as T;
}

// ---------- Pul formati (deterministik: SSR/brauzer farq qilmaydi) ----------
function group(intStr: string): string {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function fmtMoney(n: number, cur: string, withSign = false): string {
  const neg = n < 0;
  const abs = Math.abs(n);
  let s: string;
  if (cur === 'USD') {
    const [i, f] = abs.toFixed(2).split('.');
    s = '$' + group(i) + (f === '00' ? '' : '.' + f);
  } else {
    s = group(String(Math.round(abs))) + " so'm";
  }
  return (neg ? '−' : withSign ? '+' : '') + s;
}

// Karta uchun: raqam va birlikni alohida qaytaradi (birlik kichikroq chiqarilishi uchun).
export function fmtParts(n: number, cur: string): { num: string; unit: string } {
  const full = fmtMoney(n, cur);
  return cur === 'USD' ? { num: full, unit: '' } : { num: full.replace(/ so'm$/, ''), unit: "so'm" };
}

// Yozilayotgan summani "1 200 000" ko'rinishida chiqaradi.
export function formatAmountInput(raw: string, allowDecimal: boolean): string {
  let s = raw.replace(',', '.').replace(/[^\d.]/g, '');
  if (!allowDecimal) {
    s = s.replace(/\./g, '');
  } else {
    const i = s.indexOf('.');
    if (i >= 0) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '').slice(0, 2);
  }
  const parts = s.split('.');
  const int = parts[0].replace(/^0+(?=\d)/, '');
  return parts.length > 1 ? group(int) + '.' + parts[1] : group(int);
}

export function parseAmount(s: string): number {
  const n = Number(s.replace(/\s/g, ''));
  return Number.isFinite(n) ? n : 0;
}

// ---------- Sana/vaqt (Toshkent) ----------
export function tashkentToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tashkent' });
}

export function shiftDate(d: string, days: number): string {
  const [y, m, dd] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, dd + days)).toISOString().slice(0, 10);
}

export function dateLabel(d: string, today: string): string {
  const [y, m, dd] = d.split('-');
  const full = `${dd}.${m}.${y}`;
  if (d === today) return `Bugun, ${full}`;
  if (d === shiftDate(today, -1)) return `Kecha, ${full}`;
  return full;
}

export function timeHM(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit' });
}

// ---------- Brauzer xotirasi (faqat qulaylik; ishlamasa ham sahifa ishlaydi) ----------
function lsGet(k: string): string | null {
  try { return localStorage.getItem(k); } catch { return null; }
}
function lsSet(k: string, v: string) {
  try { localStorage.setItem(k, v); } catch { /* private rejim */ }
}

export const lastAccount = {
  get: (flow: string) => lsGet(`ks_acc_${flow}`),
  set: (flow: string, id: string) => lsSet(`ks_acc_${flow}`, id),
};
export const lastRate = {
  get: () => lsGet('ks_rate'),
  set: (r: string) => lsSet('ks_rate', r),
};

// Toifalar: ko'p ishlatilganlari tepada.
export function sortCategories(flow: Flow, cats: KCategory[]): KCategory[] {
  let counts: Record<string, number> = {};
  try { counts = JSON.parse(lsGet(`ks_cat_${flow}`) || '{}'); } catch { counts = {}; }
  return [...cats].sort((a, b) => (counts[b.code] || 0) - (counts[a.code] || 0));
}
export function bumpCategory(flow: Flow, code: string) {
  let counts: Record<string, number> = {};
  try { counts = JSON.parse(lsGet(`ks_cat_${flow}`) || '{}'); } catch { counts = {}; }
  counts[code] = (counts[code] || 0) + 1;
  lsSet(`ks_cat_${flow}`, JSON.stringify(counts));
}

// ---------- Ro'yxat uchun: almashuv (99999) ikki oyog'ini bitta qatorga birlashtirish ----------
export type TxnRow =
  | { kind: 'txn'; key: string; t: KTxn }
  | { kind: 'exchange'; key: string; from: KTxn; to: KTxn; t: KTxn };

export function buildRows(txns: KTxn[]): TxnRow[] {
  const rows: TxnRow[] = [];
  const pending = new Map<string, KTxn>();
  for (const t of txns) {
    if (t.category_code !== '99999') {
      rows.push({ kind: 'txn', key: t.id, t });
      continue;
    }
    const gk = `${t.created_at}|${t.author_name}`;
    const other = pending.get(gk);
    if (other && ((other.expense > 0) !== (t.expense > 0))) {
      pending.delete(gk);
      const from = t.expense > 0 ? t : other;
      const to = t.expense > 0 ? other : t;
      rows.push({ kind: 'exchange', key: from.id, from, to, t: from });
    } else {
      pending.set(gk, t);
    }
  }
  // Jufti topilmagan oyoqlar (nazariy) — oddiy qator sifatida ko'rsatiladi.
  pending.forEach((t) => rows.push({ kind: 'txn', key: t.id, t }));
  return rows.sort((a, b) => (a.t.created_at < b.t.created_at ? 1 : -1));
}
