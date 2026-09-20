// Minimálny service worker pre PWA (app shell).
// Pre MVP len umožňuje "Pridať na plochu". Cachovanie je zámerne jednoduché.
const CACHE = 'legendy-krajov-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/', '/index.html', '/manifest.json']))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  // Mapové dlaždice a externé zdroje nechaj ísť priamo na sieť.
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return

  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((cache) => cache.put(request, copy))
        return res
      })
      .catch(() => caches.match(request).then((r) => r || caches.match('/index.html')))
  )
})
