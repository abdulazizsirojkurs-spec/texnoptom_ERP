#!/usr/bin/env node
/* ============================================================
 * ERP kunlik qarzdorlik hisoboti — Telegram'ga
 * Har kuni ertalab (09:00 Toshkent) ishga tushadi.
 * v_order_payment_status'dagi remaining_uzs > 0 bo'lgan
 * buyurtmalarni ro'yxat qilib yuboradi.
 * Maxfiy kalitlar: /opt/webrtc-softphone/erp-debt-reminder.env faylidan o'qiladi.
 * ============================================================ */
'use strict';
const https = require('https');
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const env = {};
  const content = fs.readFileSync(file, 'utf8');
  content.split('\n').forEach(line => {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  });
  return env;
}

const env = loadEnv(path.join(__dirname, 'erp-debt-reminder.env'));
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const TG_TOKEN = env.TG_TOKEN;
const TG_CHAT = env.TG_CHAT;

function fmt(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function supabaseGet(pathname) {
  return new Promise((resolve, reject) => {
    https.get(SUPABASE_URL + pathname, {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Accept-Profile': 'public' },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

function sendTelegram(text) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ chat_id: TG_CHAT, parse_mode: 'HTML', text });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TG_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async () => {
  try {
    const ps = await supabaseGet('/rest/v1/v_order_payment_status?select=order_id,remaining_uzs&remaining_uzs=gt.0');
    if (!Array.isArray(ps)) throw new Error('Kutilmagan javob: ' + JSON.stringify(ps));

    if (ps.length === 0) {
      await sendTelegram("✅ <b>Bugungi qarzdorlik hisoboti</b>\n\nHozircha qarzdor buyurtma yo'q — barchasi to'langan.");
      console.log(`[${new Date().toISOString()}] Qarz yo'q, xabar yuborildi`);
      return;
    }

    const ids = ps.map(p => p.order_id);
    const orders = await supabaseGet('/rest/v1/sales_orders?select=id,order_code,client_name,client_phone&id=in.(' + ids.join(',') + ')');

    const remainingById = {};
    ps.forEach(p => { remainingById[p.order_id] = Number(p.remaining_uzs); });

    const rows = orders
      .map(o => ({ ...o, remaining: remainingById[o.id] || 0 }))
      .sort((a, b) => b.remaining - a.remaining);

    const total = rows.reduce((s, r) => s + r.remaining, 0);

    const lines = [];
    lines.push('📋 <b>Bugungi qarzdorlik hisoboti</b>');
    lines.push('');
    lines.push(`${rows.length} ta buyurtmada qarz bor, jami <b>${fmt(total)} so'm</b>`);
    lines.push('');
    rows.forEach(r => {
      lines.push(`• <b>${r.order_code}</b> — ${r.client_name} (${r.client_phone}) — ${fmt(r.remaining)} so'm`);
    });

    await sendTelegram(lines.join('\n'));
    console.log(`[${new Date().toISOString()}] ERP qarzdorlik hisoboti yuborildi (${rows.length} ta buyurtma)`);
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Xato:`, e.message);
  }
})();
