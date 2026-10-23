// MyFridge service worker: rete prima, cache come riserva (l'app si apre anche offline)
const CACHE = "myfridge-v3";
const CDN_CACHE = "myfridge-cdn-v1"; // librerie e font esterni: URL con versione fissa, quindi non cambiano
const SHELL = ["./", "./index.html", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];
const CDN_HOSTS = ["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== CDN_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const keep = r => r && (r.ok || r.type === "opaque");
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (CDN_HOSTS.includes(u.hostname)){
    // jsDelivr e font: prima la cache (Firebase deve caricarsi anche offline); il CSS dei font si riaggiorna in background
    e.respondWith(caches.open(CDN_CACHE).then(c => c.match(e.request).then(m => {
      const net = () => fetch(e.request).then(r => { if (keep(r)) c.put(e.request, r.clone()); return r; });
      if (!m) return net();
      if (u.hostname === "fonts.googleapis.com") e.waitUntil(net().catch(() => {}));
      return m;
    })));
    return;
  }
  if (u.origin !== location.origin) return; // Firebase (rete) e Open Food Facts gestiti dal browser
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then(m => m || caches.match("./index.html"))));
});
