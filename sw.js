// Enkel offline-støtte: henter alltid nyeste fra nettet, faller tilbake på lagret kopi.
const CACHE = 'abundance-v2'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  const sameOrigin = url.origin === location.origin
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)
  if (!sameOrigin && !fonts) return
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
        }
        return res
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match(self.registration.scope) : undefined)))
      .then((res) => res || new Response('', { status: 504 })),
  )
})
