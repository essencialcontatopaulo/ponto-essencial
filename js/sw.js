// sw.js - Service Worker para PWA
const CACHE_NAME = 'ponto-eletronico-v2.0';
const APP_VERSION = '2.0.0';

// URLs para cache
const urlsToCache = [
  '/ponto-essencial/',
  '/ponto-essencial/index.html',
  '/ponto-essencial/login.html',
  '/ponto-essencial/funcionario.html',
  '/ponto-essencial/gestor.html',
  '/ponto-essencial/css/style.css',
  '/ponto-essencial/js/utils.js',
  '/ponto-essencial/js/auth.js',
  '/ponto-essencial/js/firebase-config.js',
  '/ponto-essencial/js/script.js',
  '/ponto-essencial/js/funcionario.js',
  '/ponto-essencial/manifest.json',
  '/ponto-essencial/icons/icon-192x192.png',
  '/ponto-essencial/icons/icon-512x512.png',
  '/ponto-essencial/sw.js'
];

// Instalação
self.addEventListener('install', event => {
  console.log('🟢 Service Worker instalando v' + APP_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache aberto:', CACHE_NAME);
        return cache.addAll(urlsToCache)
          .then(() => {
            console.log('✅ Todos os recursos cacheados');
            return self.skipWaiting();
          })
          .catch(err => {
            console.error('❌ Erro ao cachear:', err);
            // Continua mesmo com erro
            return self.skipWaiting();
          });
      })
  );
});

// Ativação
self.addEventListener('activate', event => {
  console.log('🔵 Service Worker ativando');
  
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
    }).then(() => {
      console.log('✅ Service Worker ativado!');
      return self.clients.claim();
    })
  );
});

// Estratégia: Cache First, depois Network
self.addEventListener('fetch', event => {
  // Ignorar requisições não-GET e do Firebase
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Ignorar Firebase e APIs externas
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic')) {
    return;
  }
  
  // Para arquivos HTML, sempre tentar rede primeiro
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Atualizar cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          // Se offline, servir do cache
          return caches.match(event.request)
            .then(cachedResponse => {
              return cachedResponse || caches.match('/ponto-essencial/index.html');
            });
        })
    );
    return;
  }
  
  // Para outros recursos (CSS, JS, imagens): Cache First
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('📂 Servindo do cache:', url.pathname);
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Não cachear respostas inválidas
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Se o recurso não está no cache e estamos offline
            if (url.pathname.endsWith('.css')) {
              return new Response('body { background: #f0f0f0; }', {
                headers: { 'Content-Type': 'text/css' }
              });
            }
            
            if (url.pathname.endsWith('.js')) {
              return new Response('console.log("Offline mode");', {
                headers: { 'Content-Type': 'application/javascript' }
              });
            }
            
            if (url.pathname.includes('icon')) {
              return caches.match('/ponto-essencial/icons/icon-192x192.png');
            }
            
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Mensagens do cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ 
      version: APP_VERSION, 
      cache: CACHE_NAME,
      status: 'active'
    });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificações push (para futuro)
self.addEventListener('push', event => {
  const options = {
    body: 'Novo ponto registrado no sistema',
    icon: '/ponto-essencial/icons/icon-192x192.png',
    badge: '/ponto-essencial/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/ponto-essencial/funcionario.html'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Ponto Eletrônico', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes('/ponto-essencial/') && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow('/ponto-essencial/');
        }
      })
  );
});

// ============================================
// SERVICE WORKER COM CONTROLE DE VERSÃO
// ============================================
const APP_VERSION = '2.0.1';
const CACHE_NAME = `ponto-eletronico-${APP_VERSION}`;

// FORÇAR ATUALIZAÇÃO QUANDO VERSÃO MUDAR
self.addEventListener('install', event => {
    console.log('🟢 Instalando Service Worker v' + APP_VERSION);
    
    // Pular fase de waiting (ativar imediatamente)
    self.skipWaiting();
    
    // Limpar caches antigos
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
        })
    );
});

// Notificar cliente sobre nova versão
self.addEventListener('activate', event => {
    console.log('🔵 Service Worker ativado v' + APP_VERSION);
    
    // Tomar controle imediato de todas as páginas
    event.waitUntil(clients.claim());
    
    // Notificar todas as páginas abertas
    event.waitUntil(
        clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'NEW_VERSION',
                    version: APP_VERSION
                });
            });
        })
    );
});
