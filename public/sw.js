// SPORO service worker — cache vỏ ứng dụng, luôn lấy dữ liệu API mới
const CACHE = "sporo-v1";
const ASSETS = ["/", "/icon-192.png", "/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Không cache API và login — luôn cần dữ liệu/tài khoản mới nhất
  if (url.pathname.startsWith("/api/") || url.pathname.endsWith(".html")) return;
  e.respondWith(
    fetch(req).then(res => {
      const cp = res.clone();
      caches.open(CACHE).then(c => c.put(req, cp));
      return res;
    }).catch(() => caches.match(req).then(m => m || caches.match("/")))
  );
});
