const C = "tog-2880c398";
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
  if (r.method !== "GET") return;
  const url = new URL(r.url);
  if (url.origin !== location.origin) return;
  const isDoc = r.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("index.html");
  if (isDoc) {
    // appka: vzdy skus najprv siet, aby sa nove hry objavili hned
    e.respondWith(
      fetch(r).then(res => {
        const copy = res.clone();
        caches.open(C).then(c => c.put("./index.html", copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(r).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }
  e.respondWith(
    caches.match(r).then(hit => hit || fetch(r).then(res => {
      const copy = res.clone();
      caches.open(C).then(c => c.put(r, copy)).catch(() => {});
      return res;
    }))
  );
});
