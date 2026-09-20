const C = "tog-18db9fbe";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./favicon-32.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
const ROOT = new URL("./", self.registration.scope).pathname;   // koren nasadenia appky
const IMG = "tog-img-v2";                       // obrázky prežijú nasadenie novej verzie
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
    // len korenovy dokument je appka; /legendy/ je samostatna stranka a nesmie prepisat jej cache
    const isHub = url.pathname === ROOT || url.pathname === ROOT + "index.html";
    // appka: vzdy skus najprv siet, aby sa nove hry objavili hned
    e.respondWith(
      fetch(r).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(C).then(c => c.put(isHub ? "./index.html" : r, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(r).then(hit => hit || (isHub ? caches.match("./index.html") : Response.error())))
    );
    return;
  }
  const kam = /\.(png|jpg|jpeg|webp|gif|svg|ico)$/i.test(url.pathname) ? IMG : C;
  e.respondWith(
    caches.match(r).then(hit => hit || fetch(r).then(res => {
      // do cache patri len uspesna odpoved - 404 by tam ostalo navzdy
      if (res && res.ok && res.status === 200 && res.type !== "opaque"){
        const copy = res.clone();
        caches.open(kam).then(c => c.put(r, copy)).catch(() => {});
      }
      return res;
    }))
  );
});
