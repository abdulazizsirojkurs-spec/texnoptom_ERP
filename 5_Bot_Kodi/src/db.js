'use strict';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase REST (PostgREST) wrapper — mavjud loyihadagi boshqa skriptlar
// bilan bir xil naqsh (@supabase/supabase-js emas, xom fetch — Node 20 da
// realtime-js WebSocket talabidan qochish uchun).
async function sb(path, options = {}) {
  const method = options.method || 'GET';
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    Prefer: options.prefer || 'return=representation',
  };
  if (method === 'GET') headers['Accept-Profile'] = 'public';
  else headers['Content-Profile'] = 'public';

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path} -> ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

module.exports = { sb };
