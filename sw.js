const CACHE_NAME = 'tabelas-app-v1';

// Ficheiros que queremos guardar no dispositivo
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './logo.png'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar as requisições (Buscar no cache se a net cair)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna o que está no cache, se não encontrar, vai buscar à internet
        return response || fetch(event.request);
      })
  );
});