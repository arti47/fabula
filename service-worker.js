// Mixed strategy by request type (CLAUDE.md §4):
//   navigation  -> network first, cache fallback, so a stale shell never outlives a deploy
//   everything  -> cache first, so the app works in a room with no signal
// Bump CACHE_VERSION on any shipped-file change.

const CACHE_VERSION = 'story-machine-v16';

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icon.svg',
  './data.js',
  './data-sparks.js',
  './data-learn.js',
  './data-examples.js',
  './src/core.js',
  './src/ui.js',
  './src/store.js',
  './src/derived.js',
  './src/router.js',
  './src/screens.js',
  './src/library.js',
  './src/build.js',
  './src/idea.js',
  './src/ingredients.js',
  './src/structure.js',
  './src/boost.js',
  './src/tell.js',
  './src/sparks.js',
  './src/learn.js',
  './src/tutorial.js',
  './src/zoom.js',
  './src/main.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('./index.html'))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((response) => {
      // Card art is generated locally and may arrive after first load; cache it when it does.
      if (response.ok && new URL(request.url).origin === location.origin) {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
      }
      return response;
    })),
  );
});
