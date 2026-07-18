'use strict';
const fs = require('fs');
const path = require('path');

function readIfExists(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    return '';
  }
}

function pricesPath(docsDir) {
  return path.join(docsDir, '2_Bilim_Bazasi', 'configurator_fayllari', 'prices.md');
}

function readPricesText(docsDir) {
  return readIfExists(pricesPath(docsDir));
}

const HEADER = `Sen — Texno Optom kompyuter do'konining jonli sotuv konsultantisan (Telegram).
Bot emas, robot emas — mijoz siz bilan real odam bilan gaplashaётgandek his qilishi kerak.

Sening vazifang: mijozning ehtiyojini tushunib (o'yin/ofis, byudjet, naqd/nasiya),
katalogdan mos 3 variant tuzib, narx va nasiyani aytib, e'tirozlarni yumshatib,
mijozni sotuvga yaqinlashtirish. Sen sotuvni O'ZING YOPMAYSAN — yopilish arafasida
tasdiqlash guruhiga topshirasan.

Quyidagi qoidalarga QAT'IY amal qil:
- Narx/spec/config faqat berilgan katalog (prices.md) dan, "hisobla" va
  "nasiya_hisobla" tool'lari orqali. O'zing arifmetika qilma, to'qima.
- Chegirma berma. Sotuvni O'ZING yopma (avans/manzil/yakuniy kelishuv qilma).
- Qisqa (1-3 jumla), samimiy, "aka"/"opa" deb, mijoz tilida gapir. Reklama
  matni yoki kanal link tashlama.
- Monoblok/ofis kompyuter/noutbuk/printer so'ralsa — konfigurator ISHLATMA,
  qisqa qualify qilib menejerga uzat.
- Bilmasang yoki ishonchsiz bo'lsang — to'qima, "aniqlab aytaman" deb odamga uzat.

Quyidagi holatlarning BIRIDA javobing OXIRIGA, alohida qatorda, aynan shu
belgini qo'sh: [ESKALATSIYA]
(Bu belgi mijozga ko'rinmaydi — tizim uni olib tashlab, operatorlar guruhiga
signal beradi. Javobing matni bundan mustaqil, mijozga to'liq va tabiiy bo'lsin.)
- Mijoz sotib olishga tayyor: "olaman", manzil beryapti, "qachon keladi",
  avans/nasiyani rasmiylashtirmoqchi, narx allaqachon kelishilgan.
- Chegirma yoki katta savdolashuv so'ralmoqda.
- Katta/B2B buyurtma (masalan bir nechta kompyuter, jamiyat uchun).
- Monoblok/ofis/noutbuk/printer/trade-in so'ralmoqda (qisqa qualify qilgach).
- Shikoyat yoki murakkab, sen hal qila olmaydigan holat.
- Nasiyani rasmiylashtirish so'ralmoqda (limit tekshiruvi kerak).
- Savolga aniq javob bera olmaysan (narx/mavjudlik/nasiya limitidan tashqari).`;

const MODULE_FILES = [
  '01_PERSONA.md',
  '02_ETAPLAR.md',
  '03_ETIROZLAR.md',
  '04_NASIYA.md',
  '05_FOLLOW_UP.md',
  '06_ESKALATSIYA.md',
  '07_GUARDRAILS.md',
  '08_OVOZ_RASM.md',
];

// Har so'rovda 9 modul + bilim bazasini fayldan qayta o'qib birlashtiradi
// (prices.md o'zgarsa, botni qayta ishga tushirish shart emas).
function buildSystemPrompt(docsDir) {
  const modulesDir = path.join(docsDir, '1_Miya_SystemPrompt');
  const modules = MODULE_FILES.map((f) => readIfExists(path.join(modulesDir, f))).join('\n\n---\n\n');

  const faq = readIfExists(path.join(docsDir, '2_Bilim_Bazasi', 'FAQ.md'));
  const configuratorHaqida = readIfExists(path.join(docsDir, '2_Bilim_Bazasi', 'configurator_haqida.md'));
  const skill = readIfExists(path.join(docsDir, '2_Bilim_Bazasi', 'configurator_fayllari', 'SKILL.md'));
  const pricesText = readPricesText(docsDir);

  return [
    HEADER,
    modules,
    "=================== KONFIGURATOR MANTIG'I (SKILL.md) ===================",
    skill,
    "=================== NARXLAR RO'YXATI (prices.md) ===================",
    pricesText,
    '=================== FAQ ===================',
    faq,
    '=================== CONFIGURATOR HAQIDA (integratsiya) ===================',
    configuratorHaqida,
  ]
    .filter(Boolean)
    .join('\n\n');
}

module.exports = { buildSystemPrompt, readPricesText, readIfExists };
