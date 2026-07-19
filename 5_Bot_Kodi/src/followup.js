'use strict';
const { sb } = require('./db');
const { buildSystemPrompt } = require('./prompt');

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
const MAX_TOKENS = /sonnet|opus/i.test(CLAUDE_MODEL) ? 16000 : 4096;

// 05_FOLLOW_UP — 3 bosqichli ketma-ketlik: jimlikdan +2-3s (shu kun),
// +1 kun, +3 kun, keyin to'xtaydi. Vaqtlar millisekundda, ozgina tasodifiy
// oraliq bilan (masalan 2-3 soat -> 2.5 soat o'rtacha nuqta sifatida olinadi,
// cron har ~25 daqiqada tekshirgani uchun aniq soniya farq qilmaydi).
const STAGE_THRESHOLDS_MS = [
  2.5 * 3600 * 1000, // bosqich 0 -> 1: ~2-3 soat
  24 * 3600 * 1000, // bosqich 1 -> 2: +1 kun
  72 * 3600 * 1000, // bosqich 2 -> 3 (oxirgi): +3 kun
];

function isWorkingHours(tz) {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).format(new Date())
  );
  return hour >= 9 && hour < 21; // tunda yozmaslik (05_FOLLOW_UP qoidasi)
}

// Mijoz javob bermay ketgan suhbat uchun, tarixga bog'liq qisqa follow-up
// xabar yozdiradi. Anthropic API oxirgi xabar "user" bo'lishini talab qiladi
// (assistant bilan tugagan suhbatni davom ettira olmaydi) — shuning uchun
// mijozga ko'rinmaydigan, faqat shu chaqiruv uchun ichki "tizim" signalini
// oxiriga sun'iy user-xabar sifatida qo'shamiz.
async function generateFollowup(anthropic, history, stage, docsDir) {
  const basePrompt = buildSystemPrompt(docsDir);
  const stageNote = {
    1: 'Bu 1-follow-up (yumshoq eslatma, jimlikdan 2-3 soat o\'tgan).',
    2: 'Bu 2-follow-up (qiymat + turtki, jimlikdan 1 kun o\'tgan).',
    3: 'Bu 3-follow-up (oxirgi imkoniyat, jimlikdan 3 kun o\'tgan) — shundan keyin boshqa yozmaysiz.',
  }[stage];
  const systemPrompt =
    basePrompt +
    `\n\nMUHIM (follow-up rejimi): Mijoz oxirgi xabaringizdan keyin javob bermadi. ${stageNote} ` +
    "05_FOLLOW_UP jadvali bo'yicha, suhbat tarixiga bog'liq (mijoz nima so'ragan bo'lsa o'shanga ishora " +
    "qiluvchi), QISQA va shaxsiy follow-up xabar yoz. Savol bilan tugat. Faqat mijozga yuboriladigan " +
    'tayyor matnni yoz, boshqa hech narsa yozma.';

  const msgs = [];
  for (const m of history) {
    const role = m.direction === 'in' ? 'user' : 'assistant';
    const last = msgs[msgs.length - 1];
    if (last && last.role === role) last.content += '\n' + m.text;
    else msgs.push({ role, content: m.text });
  }
  msgs.push({ role: 'user', content: '[TIZIM: mijoz javob bermadi, follow-up yozish kerak]' });

  const resp = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
    messages: msgs,
  });
  return resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
}

// Bitta follow-up tsiklini bajaradi: barcha nomzod suhbatlarni topib, kerak
// bo'lganlariga navbatdagi bosqich follow-upini yozadi.
async function runFollowupCycle({ client, anthropic, docsDir, sendHuman, logMessage, updateConversation, incrementDailyUsage, checkDailyLimit, dailyLimit, log }) {
  if (!isWorkingHours('Asia/Tashkent')) return;

  const candidates = await sb(
    'telegram_conversations?status=eq.active&ai_muted=eq.false&followup_stage=lt.3&select=*'
  );
  for (const conv of candidates || []) {
    if (!conv.last_ai_message_at || !conv.last_customer_message_at) continue;
    // Mijoz oxirgi yozgan bo'lsa (AI hali javob bermagan) — follow-up kerak emas.
    if (new Date(conv.last_ai_message_at) <= new Date(conv.last_customer_message_at)) continue;

    const elapsedMs = Date.now() - new Date(conv.last_ai_message_at).getTime();
    const threshold = STAGE_THRESHOLDS_MS[conv.followup_stage];
    if (elapsedMs < threshold) continue;

    const { ok } = await checkDailyLimit(dailyLimit);
    if (!ok) {
      log('Follow-up: kunlik limit tugadi, to\'xtatildi');
      break;
    }

    try {
      const history = await sb(
        `telegram_messages?conversation_id=eq.${conv.id}&select=direction,text&order=sent_at.asc&limit=30`
      );
      const nextStage = conv.followup_stage + 1;
      const text = await generateFollowup(anthropic, history || [], nextStage, docsDir);
      if (!text) continue;

      await sendHuman(client, BigInt(conv.telegram_user_id), text);
      await logMessage(conv.id, 'out', text);
      await updateConversation(conv.id, { followup_stage: nextStage, last_ai_message_at: new Date().toISOString() });
      await incrementDailyUsage('followups_sent');
      log('Follow-up yuborildi:', conv.telegram_user_id, '| bosqich:', nextStage);
    } catch (err) {
      log('Follow-up xato (' + conv.id + '):', err.message);
    }
  }
}

module.exports = { runFollowupCycle, generateFollowup, isWorkingHours };
