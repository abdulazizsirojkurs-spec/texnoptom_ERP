'use strict';

// prices.md "Global sozlamalar" bo'limidan bitta sonli sozlamani o'qiydi
// (masalan "KURS (1 USD = ... so'm): 12600" -> 12600).
function parseGlobalSetting(mdText, key, fallback) {
  const re = new RegExp(key + '[^:]*:\\s*([\\d.]+)');
  const m = mdText.match(re);
  return m ? Number(m[1]) : fallback;
}

// 04_NASIYA.md formulasi: oylik nasiya to'lovini hisoblaydi.
// AI (Claude) BU HISOBNI O'ZI QILMAYDI — faqat shu funksiya natijasini gapiradi.
function nasiyaHisobla(narxUsd, pricesText) {
  const kurs = parseGlobalSetting(pricesText, 'KURS', 12600);
  const nasiya12Oy = parseGlobalSetting(pricesText, 'NASIYA_12OY', 1.46);
  const nasiya6Oy = parseGlobalSetting(pricesText, 'NASIYA_6OY', 1.32);

  const narxSom = narxUsd * kurs;
  const oylik12 = Math.round((narxSom * nasiya12Oy) / 12 / 1000) * 1000;
  const oylik6 = Math.round((narxSom * nasiya6Oy) / 6 / 1000) * 1000;
  return { oylik_12: oylik12, oylik_6: oylik6, kurs, narx_som: Math.round(narxSom) };
}

const NASIYA_TOOL = {
  name: 'nasiya_hisobla',
  description:
    "Berilgan yakuniy narx (dollarda) uchun Uzum nasiya oylik to'lovini " +
    '(6 va 12 oyga) hisoblaydi. AI o\'zi arifmetika QILMAYDI — nasiya so\'ralganda ' +
    'har doim shu toolni chaqir va natijadagi oylik_12/oylik_6 ni ayt.',
  input_schema: {
    type: 'object',
    properties: {
      narx_usd: { type: 'number', description: "Config/mahsulotning yakuniy narxi, dollarda" },
    },
    required: ['narx_usd'],
  },
};

module.exports = { nasiyaHisobla, parseGlobalSetting, NASIYA_TOOL };
