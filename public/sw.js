/* Texno Optom ERP — service worker
   Ehtiyotkor strategiya (moliyaviy ilova):
   - Supabase / API / boshqa origin so'rovlariga UMUMAN tegmaydi (eski ma'lumot xavfi yo'q)
   - Faqat Next.js content-hashed static asset'lar keshlanadi (ular o'zgarmas)
   - Sahifalar (HTML) har doim network-first
   Vazifasi: ilovani "o'rnatiladigan" (installable) qilish, offline'da statik yuklanishi. */
const CACHE = 'to-erp-static-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // Faqat o'z originimiz — Supabase va boshqa tashqi API'lar tegilmaydi
  if (url.origin !== self.location.origin) return;

  // Next.js immutable static chunk'lari — cache-first (xavfsiz, chunki nom hashli)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => fetch(req))
    );
    return;
  }

  // API — hech qachon keshlamaymiz (brauzerning odatiy yo'li)
  if (url.pathname.startsWith('/api')) return;

  // Navigatsiya (HTML) — network-first
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
});
