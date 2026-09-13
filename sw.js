const C = "tog-c780e87b";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./favicon-32.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
const IMG = "tog-img-v1";                       // obrázky prežijú nasadenie novej verzie
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(
      ks.filter(k => k !== C && k !== IMG).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const url = new URL(r.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith("levels.json")) { e.respondWith(fetch(r).catch(() => caches.match(r))); return; }
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
  const kam = /\.(png|jpg|jpeg|webp|gif|svg|ico)$/i.test(url.pathname) ? IMG : C;
  e.respondWith(
    caches.match(r).then(hit => hit || fetch(r).then(res => {
      const copy = res.clone();
      caches.open(kam).then(c => c.put(r, copy)).catch(() => {});
      return res;
    }))
  );
});
