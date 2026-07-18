'use strict';

const KRAYIN_PUBLIC_URL = process.env.KRAYIN_PUBLIC_URL || 'https://texnocrm.duckdns.org';
const FB_INTAKE_SECRET = process.env.FB_INTAKE_SECRET; // mavjud storage/fb_intake_secret.txt qiymati

// Krayin CRM'da telefon bo'yicha lid ochadi/yangilaydi. Mavjud "api/fb-lead"
// intake endpointini qayta ishlatamiz (routes/api.php da allaqachon bor,
// telefon bo'yicha topib-yangilaydigan/yaratadigan mantiq shu yerda) —
// Telegram manbasini ажratish uchun campaign/form_name orqali belgilaymiz.
async function upsertLead({ name, phone, note, stage }) {
  if (!FB_INTAKE_SECRET) throw new Error('FB_INTAKE_SECRET sozlanmagan (.env)');
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length < 9) return null;

  const res = await fetch(`${KRAYIN_PUBLIC_URL}/api/fb-lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Intake-Secret': FB_INTAKE_SECRET },
    body: JSON.stringify({
      name: name || 'Telegram mijoz',
      phone: cleanPhone,
      form_name: 'Telegram AI Sotuvchi' + (stage ? ` — ${stage}` : ''),
      note: note || '',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) return null;
  return data.lead_id || null;
}

module.exports = { upsertLead };
