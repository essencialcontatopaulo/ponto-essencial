const CACHE_NAME = 'ponto-eletronico-v1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/funcionario.html',
  '/admin.html',
  '/cadastro-funcionario.html',
  '/completar-perfil.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/funcionario.js',
  '/js/admin.js',
  '/firebase-config.js',
  '/manifest.json'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativar e limpar caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
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
        
        // Clone a requisição
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Verificar se a resposta é válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clonar a resposta
          const responseToCache = response.clone();
          
          // Adicionar ao cache
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // Fallback para página offline
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});

// Receber mensagens
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});