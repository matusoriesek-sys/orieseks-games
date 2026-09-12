const C = "tog-398211b1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./favicon-32.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(r).then(hit => hit || fetch(r).then(res => {
      const copy = res.clone();
      caches.open(C).then(c => c.put(r, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
