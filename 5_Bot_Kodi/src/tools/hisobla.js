'use strict';

// prices.md dagi jadval qatorlaridan {nom: narx} lug'atini va marjani o'qiydi.
// bot.py dagi parse_prices() ning JS portlanmasi.
function parsePrices(mdText) {
  const prices = {};
  let margin = 90;
  const marginMatch = mdText.match(/MARJA[^:]*:\s*(\d+)/);
  if (marginMatch) margin = Number(marginMatch[1]);

  for (const rawLine of mdText.split('\n')) {
    const line = rawLine.trim();
    if (!line.startsWith('|')) continue;
    const cells = line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    if (cells.length < 2) continue;
    const [name, priceStr] = cells;
    if (!name || name.toLowerCase() === 'nomi') continue;
    if (/^-+$/.test(priceStr)) continue;
    if (name.startsWith('(')) continue; // namuna qatorlar
    const price = Number(priceStr);
    if (!Number.isFinite(price)) continue;
    prices[name] = price;
  }
  return { prices, margin };
}

function normalize(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, ' ');
}

// Har bir variant uchun aniq narxni hisoblaydi (tannarx + marja).
// bot.py dagi run_hisobla() ning JS portlanmasi.
function runHisobla(variantlar, prices, margin) {
  const lookup = new Map();
  for (const [k, v] of Object.entries(prices)) lookup.set(normalize(k), { nom: k, narx: v });

  const result = {};
  for (const [vname, comps] of Object.entries(variantlar || {})) {
    const items = [];
    const notfound = [];
    let total = 0;
    for (const c of comps || []) {
      const hit = lookup.get(normalize(c));
      if (hit) {
        items.push({ nom: hit.nom, narx: hit.narx });
        total += hit.narx;
      } else {
        notfound.push(c);
      }
    }
    result[vname] = {
      komponentlar: items,
      topilmagan: notfound,
      tannarx_jami: Math.round(total * 100) / 100,
      marja: margin,
      yakuniy_narx: notfound.length === 0 ? Math.round((total + margin) * 100) / 100 : null,
    };
  }
  return result;
}

// Claude tool-use ta'rifi (bot.py dagi HISOBLA_TOOL bilan bir xil).
const HISOBLA_TOOL = {
  name: 'hisobla',
  description:
    "Yig'ilma variantlari uchun ANIQ narxni hisoblaydi. Har variant komponent " +
    "nomlari ro'yxati sifatida beriladi. Narxlar prices.md dan olinadi, ustiga " +
    "marja qo'shiladi. Narxni o'zing hisoblama — har doim shu toolni chaqir. " +
    "Faqat prices.md dagi ANIQ nomlarni ishlat. Agar 'topilmagan' bo'sh bo'lmasa, " +
    "o'sha nomni to'g'rilab qayta chaqir.",
  input_schema: {
    type: 'object',
    properties: {
      variantlar: {
        type: 'object',
        description:
          "Kalit = variant nomi (masalan Arzon/O'rtacha/Kuchli), qiymat = shu " +
          'variant komponentlari nomlari ro\'yxati.',
        additionalProperties: { type: 'array', items: { type: 'string' } },
      },
    },
    required: ['variantlar'],
  },
};

module.exports = { parsePrices, runHisobla, normalize, HISOBLA_TOOL };
