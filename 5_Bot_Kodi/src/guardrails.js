'use strict';
const { sb } = require('./db');

// 07_GUARDRAILS — kod darajasida majburiy qoidalar (promptga ishonilmaydi).
// Bu yerdagi tekshiruvlar AI qaror qilishidan MUSTAQIL: mijoz xabaridagi
// so'zlarga qarab ham eskalatsiya qilinishi mumkin (AI sezmasa ham).
const HARD_ESCALATION_KEYWORDS = {
  sotuv_signali: ['olaman', "olib qolaman", 'avans', 'manzil', 'qachon keladi', 'qachon yetkazasiz', 'rasmiylashtiraylik'],
  shikoyat: ['shikoyat', 'buzuq', 'ishlamayapti', 'nosoz', 'qaytarib', 'aldadingiz', 'firibgar'],
};

function checkHardEscalation(text) {
  const lower = String(text || '').toLowerCase();
  for (const [reason, words] of Object.entries(HARD_ESCALATION_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return reason;
  }
  return null;
}

// AI javobi oxiridagi "[ESKALATSIYA]" belgisini olib tashlaydi va borligini qaytaradi.
function extractAiEscalationMarker(aiText) {
  const marker = '[ESKALATSIYA]';
  const idx = aiText.lastIndexOf(marker);
  if (idx === -1) return { text: aiText.trim(), escalate: false };
  const cleaned = (aiText.slice(0, idx) + aiText.slice(idx + marker.length)).trim();
  return { text: cleaned, escalate: true };
}

// Kill switch: operator guruhida "STOP"/"START" yozib bot_settings.paused ni
// o'zgartiradi. Bot har javobdan oldin shu holatni tekshiradi.
async function isPaused() {
  const rows = await sb('bot_settings?id=eq.1&select=paused');
  return !!(rows && rows[0] && rows[0].paused);
}

async function setPaused(paused) {
  await sb('bot_settings?id=eq.1', { method: 'PATCH', body: { paused } });
}

// Kunlik xavfsizlik limiti — yangi suhbat/follow-up soniga cheklov (bloklanmaslik uchun).
async function checkDailyLimit(limit) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await sb(`ai_daily_usage?day=eq.${today}&select=*`);
  const row = rows && rows[0];
  const used = row ? row.new_conversations + row.followups_sent : 0;
  return { ok: used < limit, used, today, row };
}

async function incrementDailyUsage(field) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await sb(`ai_daily_usage?day=eq.${today}&select=*`);
  if (rows && rows[0]) {
    await sb(`ai_daily_usage?day=eq.${today}`, {
      method: 'PATCH',
      body: { [field]: rows[0][field] + 1 },
    });
  } else {
    await sb('ai_daily_usage', {
      method: 'POST',
      body: { day: today, new_conversations: field === 'new_conversations' ? 1 : 0, followups_sent: field === 'followups_sent' ? 1 : 0 },
    });
  }
}

module.exports = {
  checkHardEscalation,
  extractAiEscalationMarker,
  isPaused,
  setPaused,
  checkDailyLimit,
  incrementDailyUsage,
};
