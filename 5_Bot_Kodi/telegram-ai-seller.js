#!/usr/bin/env node
'use strict';
require('dotenv').config();
const path = require('path');
const { TelegramClient, Api } = require('teleproto');
const { StringSession } = require('teleproto/sessions');
const { NewMessage } = require('teleproto/events');
const Anthropic = require('@anthropic-ai/sdk');

const { sb } = require('./src/db');
const { buildSystemPrompt, readPricesText } = require('./src/prompt');
const { parsePrices, runHisobla, HISOBLA_TOOL } = require('./src/tools/hisobla');
const { nasiyaHisobla, NASIYA_TOOL } = require('./src/tools/nasiya');
const { upsertLead } = require('./src/krayin');
const {
  checkHardEscalation,
  extractAiEscalationMarker,
  isPaused,
  setPaused,
  checkDailyLimit,
  incrementDailyUsage,
} = require('./src/guardrails');

const TG_API_ID = Number(process.env.TG_API_ID);
const TG_API_HASH = process.env.TG_API_HASH;
const TG_SESSION = process.env.TG_SESSION;
const OPERATOR_GROUP_ID = process.env.OPERATOR_GROUP_ID ? BigInt(process.env.OPERATOR_GROUP_ID) : null;
const TRIAL_MODE = (process.env.TRIAL_MODE || 'true') !== 'false';
const DOCS_DIR = process.env.DOCS_DIR || path.join(__dirname, 'ai-sotuvchi-docs');
const DAILY_LIMIT = Number(process.env.DAILY_LIMIT || 50);

for (const [k, v] of Object.entries({ TG_API_ID, TG_API_HASH, TG_SESSION, ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY })) {
  if (!v) {
    console.error(`XATO: ${k} .env da yo'q.`);
    process.exit(1);
  }
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const pendingDrafts = new Map(); // draftMessageId -> { conversationId, telegramUserId, draftText, escalate, conversation }

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

function extractPhone(text) {
  const m = String(text || '').match(/(\+?998[\s\-]?\d{2}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})|(\b\d{9}\b)/);
  return m ? m[0].replace(/[\s\-]/g, '') : null;
}

async function getOrCreateConversation(telegramUserId, username, firstName) {
  const existing = await sb(`telegram_conversations?telegram_user_id=eq.${telegramUserId}&select=*`);
  if (existing && existing[0]) return { conversation: existing[0], isNew: false };

  const created = await sb('telegram_conversations', {
    method: 'POST',
    body: {
      telegram_user_id: telegramUserId,
      telegram_username: username || null,
      telegram_first_name: firstName || null,
      status: 'active',
    },
  });
  return { conversation: created[0], isNew: true };
}

async function logMessage(conversationId, direction, text, isAiDraft = false) {
  await sb('telegram_messages', {
    method: 'POST',
    body: { conversation_id: conversationId, direction, text, is_ai_draft: isAiDraft },
  });
}

async function updateConversation(id, patch) {
  await sb(`telegram_conversations?id=eq.${id}`, { method: 'PATCH', body: patch });
}

// Claude'ni tool-use tsikli bilan chaqiradi: model hisobla/nasiya_hisobla
// so'rasa kod bajaradi, natijani qaytaradi; oxirgi aylanishda tool o'chirilib
// model majburan yakuniy xabarni yozadi (bot.py dagi naqsh bilan bir xil).
async function callClaude(history, docsDir) {
  const pricesText = readPricesText(docsDir);
  const { prices, margin } = parsePrices(pricesText);
  const systemPrompt = buildSystemPrompt(docsDir);

  const msgs = history.map((m) => ({
    role: m.direction === 'in' ? 'user' : 'assistant',
    content: m.text,
  }));

  const MAX_TOOL_ROUNDS = 3;
  let answer = '';
  for (let i = 0; i <= MAX_TOOL_ROUNDS; i++) {
    const allowTools = i < MAX_TOOL_ROUNDS;
    if (!allowTools) {
      msgs.push({
        role: 'user',
        content:
          "Yetarli hisobladingiz. Endi shu eng yaqin variantlar bilan mijozga TAYYOR " +
          "to'liq xabarni yoz. Boshqa hisoblama, ichki fikringni yozma.",
      });
    }
    const resp = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 2000,
      system: systemPrompt,
      tools: allowTools ? [HISOBLA_TOOL, NASIYA_TOOL] : undefined,
      messages: msgs,
    });

    if (allowTools && resp.stop_reason === 'tool_use') {
      msgs.push({ role: 'assistant', content: resp.content });
      const toolResults = [];
      for (const block of resp.content) {
        if (block.type !== 'tool_use') continue;
        let out;
        if (block.name === 'hisobla') {
          out = runHisobla(block.input.variantlar || {}, prices, margin);
        } else if (block.name === 'nasiya_hisobla') {
          out = nasiyaHisobla(Number(block.input.narx_usd), pricesText);
        } else {
          out = { error: 'nomalum tool' };
        }
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(out) });
      }
      msgs.push({ role: 'user', content: toolResults });
      continue;
    }

    answer = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
    break;
  }
  return answer || "Kechirasiz, hozir javob bera olmadim, operatorimiz tez orada yozadi.";
}

async function sendHuman(client, peer, text) {
  try {
    const inputPeer = await client.getInputEntity(peer);
    await client.invoke(new Api.messages.SetTyping({ peer: inputPeer, action: new Api.SendMessageTypingAction() }));
  } catch (err) {
    log('typing xato:', err.message);
  }
  await new Promise((r) => setTimeout(r, 3000 + Math.random() * 3000)); // 3-6s "o'qildi"+"yozyapti"
  await client.sendMessage(peer, { message: text });
}

function escalationLabel(reason) {
  return (
    {
      sotuv_signali: 'Sotuv signali',
      shikoyat: 'Shikoyat',
      ai_marker: 'AI eskalatsiya belgisi',
    }[reason] || reason
  );
}

// 06_ESKALATSIYA formatidagi xabarni tasdiqlash guruhiga yuboradi va
// shu suhbatni ai_muted=true qilib qo'yadi (KOD majburiy — 07_GUARDRAILS #2,#4).
async function escalateToOperator(client, conversation, reason, lastCustomerText) {
  await updateConversation(conversation.id, { ai_muted: true, status: 'handed_off' });
  const label = escalationLabel(reason);
  const leadLine = conversation.krayin_lead_id
    ? `\n🔗 CRM lid: ${process.env.KRAYIN_PUBLIC_URL || 'https://texnocrm.duckdns.org'}/admin/leads/${conversation.krayin_lead_id}`
    : '';
  const who = conversation.telegram_username ? '@' + conversation.telegram_username : conversation.telegram_first_name || conversation.telegram_user_id;
  const message =
    `🔥 ISSIQ LID — ${label}\n` +
    `👤 Mijoz: ${who}\n` +
    `📌 Sabab: ${label}\n` +
    `📝 Oxirgi xabar: "${lastCustomerText}"${leadLine}\n\n` +
    `AI shu chatda endi jim (odam davom ettiradi).`;
  await client.sendMessage(OPERATOR_GROUP_ID, { message });
}

async function main() {
  const client = new TelegramClient(new StringSession(TG_SESSION), TG_API_ID, TG_API_HASH, { connectionRetries: 5 });
  await client.connect();
  const me = await client.getMe();
  log('Telegram AI Sotuvchi (v2) ishga tushdi:', me.username, '| TRIAL_MODE =', TRIAL_MODE, '| DOCS_DIR =', DOCS_DIR);

  client.addEventHandler(async (event) => {
    try {
      const message = event.message;
      if (!message || message.out) return;
      const sender = await message.getSender();
      const chat = await message.getChat();

      // ── Operator guruhi: kill switch buyruqlari + tasdiqlash oqimi ──
      if (OPERATOR_GROUP_ID && chat?.id && BigInt(chat.id.toString()) === OPERATOR_GROUP_ID) {
        const text = (message.text || '').trim();
        if (/^stop$/i.test(text)) {
          await setPaused(true);
          await client.sendMessage(OPERATOR_GROUP_ID, { message: '⏸ AI to\'xtatildi (kill switch). Qayta yoqish uchun: START' });
          return;
        }
        if (/^start$/i.test(text)) {
          await setPaused(false);
          await client.sendMessage(OPERATOR_GROUP_ID, { message: '▶️ AI qayta yoqildi.' });
          return;
        }

        const replyToId = message.replyTo?.replyToMsgId;
        if (!replyToId || !pendingDrafts.has(replyToId)) return;
        const draft = pendingDrafts.get(replyToId);
        pendingDrafts.delete(replyToId);
        const operatorText = text;
        const isApproval = ['✅', 'ok', 'tasdiqla', 'yubor'].includes(operatorText.toLowerCase());
        const finalText = isApproval ? draft.draftText : operatorText;
        await sendHuman(client, draft.telegramUserId, finalText);
        await logMessage(draft.conversationId, 'out', finalText, false);
        if (draft.escalate) await escalateToOperator(client, draft.conversation, draft.escalateReason, draft.lastCustomerText);
        return;
      }

      // ── Shaxsiy chatdan kiruvchi xabar ──
      if (!sender || sender.className !== 'User' || sender.bot) return;
      if (chat?.className !== 'User') return;
      const text = (message.text || '').trim();
      if (!text) return;

      if (await isPaused()) {
        log('Bot to\'xtatilgan (kill switch) — xabar e\'tiborsiz qoldiriladi:', sender.id.toString());
        return;
      }

      try {
        await client.markAsRead(sender.id);
      } catch (err) {
        log('markAsRead xato:', err.message);
      }

      const { conversation, isNew } = await getOrCreateConversation(sender.id.toString(), sender.username, sender.firstName);
      if (conversation.ai_muted) return; // odam ushlagan — AI jim (07_GUARDRAILS #4)

      await logMessage(conversation.id, 'in', text);
      await updateConversation(conversation.id, { last_customer_message_at: new Date().toISOString(), followup_stage: 0 });

      if (isNew) {
        const { ok } = await checkDailyLimit(DAILY_LIMIT);
        if (!ok) {
          await escalateToOperator(client, conversation, 'kunlik_limit', text);
          await client.sendMessage(sender.id, { message: 'Assalomu alaykum! Menejerimiz tez orada siz bilan bog\'lanadi 👍' });
          return;
        }
        await incrementDailyUsage('new_conversations');
      }

      const phone = extractPhone(text);
      if (phone && !conversation.phone) {
        await updateConversation(conversation.id, { phone });
        const leadId = await upsertLead({ name: sender.firstName, phone, note: 'Telegram AI Sotuvchi orqali', stage: 'telefon oldi' }).catch(() => null);
        if (leadId) await updateConversation(conversation.id, { krayin_lead_id: leadId });
      }

      const history = await sb(
        `telegram_messages?conversation_id=eq.${conversation.id}&select=direction,text&order=sent_at.asc&limit=30`
      );
      const rawAnswer = await callClaude(history || [], DOCS_DIR);
      const { text: draftText, escalate: aiEscalate } = extractAiEscalationMarker(rawAnswer);
      const hardReason = checkHardEscalation(text);
      const escalate = aiEscalate || !!hardReason;
      const escalateReason = hardReason || (aiEscalate ? 'ai_marker' : null);

      if (TRIAL_MODE) {
        const who = sender.username ? '@' + sender.username : sender.firstName;
        const sentDraft = await client.sendMessage(OPERATOR_GROUP_ID, {
          message:
            `🆕 Mijoz: ${who} (ID: ${sender.id})${escalate ? '  ⚠️ ESKALATSIYA' : ''}\n\n` +
            `Mijoz yozdi: "${text}"\n\nAI javobi:\n${draftText}\n\n` +
            `✅ deb javob bering — shu matn ketadi. Boshqa matn yozsangiz — o'sha matn ketadi.`,
        });
        pendingDrafts.set(sentDraft.id, {
          conversationId: conversation.id,
          telegramUserId: sender.id,
          draftText,
          escalate,
          escalateReason,
          conversation,
          lastCustomerText: text,
        });
        await logMessage(conversation.id, 'out', draftText, true);
      } else {
        await sendHuman(client, sender.id, draftText);
        await logMessage(conversation.id, 'out', draftText);
        await updateConversation(conversation.id, { last_ai_message_at: new Date().toISOString() });
        if (escalate) await escalateToOperator(client, conversation, escalateReason, text);
      }
    } catch (err) {
      console.error('Xabar qayta ishlashda xato:', err);
    }
  }, new NewMessage({}));
}

main().catch((err) => {
  console.error('Fatal xato:', err);
  process.exit(1);
});
