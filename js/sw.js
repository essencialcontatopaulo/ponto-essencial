// Service Worker para PWA
const CACHE_NAME = 'ponto-eletronico-localizacao-v1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/funcionario.html',
  '/gestor.html',
  '/css/style.css',
  '/js/auth.js',
  '/js/utils.js',
  '/js/funcionario.js',
  '/js/gestor.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativar Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retornar resposta do cache
        if (response) {
          return response;
        }
        
        // Clone da requisição
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Verificar se a resposta é válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone da resposta
          const responseToCache = response.clone();
          
          // Adicionar ao cache
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        }).catch(() => {
          // Se falhar, tentar retornar página offline
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Sincronizar em background (para futuras melhorias)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pontos') {
    console.log('🔄 Sincronizando pontos...');
    event.waitUntil(syncPontos());
  }
});

async function syncPontos() {
  // Em produção, sincronizaria registros offline com o servidor
  console.log('Sincronização de pontos realizada');
}
