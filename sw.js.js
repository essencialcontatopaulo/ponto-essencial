// sw.js - Service Worker para PWA
const CACHE_NAME = 'ponto-eletronico-v1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/funcionario.html',
  '/gestor.html',
  '/css/style.css',
  '/js/utils.js',
  '/js/auth.js',
  '/js/firebase-config.js',
  '/js/script.js',
  '/js/funcionario.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('✅ Service Worker instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache aberto, adicionando arquivos...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Todos os recursos foram cacheados');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Erro ao adicionar ao cache:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker ativando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑️ Removendo cache antigo: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker ativado e pronto!');
      return self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar requisições do Firebase
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retornar do cache se existir
        if (response) {
          console.log(`📂 Servindo do cache: ${event.request.url}`);
          return response;
        }
        
        // Se não estiver no cache, buscar da rede
        console.log(`🌐 Buscando da rede: ${event.request.url}`);
        return fetch(event.request)
          .then(response => {
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
                console.log(`💾 Adicionado ao cache: ${event.request.url}`);
              });
            
            return response;
          })
          .catch(error => {
            console.log('❌ Erro na requisição:', error);
            
            // Página offline personalizada
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // Para outros tipos de arquivo
            return new Response('Offline - Sem conexão com a internet', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Sincronização em background
self.addEventListener('sync', event => {
  console.log(`🔄 Sincronização em background: ${event.tag}`);
  
  if (event.tag === 'sync-pontos') {
    event.waitUntil(syncPontosOffline());
  }
});

// Função para sincronizar pontos offline
async function syncPontosOffline() {
  console.log('Sincronizando pontos offline...');
  
  // Aqui você implementaria a lógica para enviar
  // pontos registrados offline para o servidor
  
  return Promise.resolve();
}

// Notificações push
self.addEventListener('push', event => {
  console.log('📲 Evento de push recebido');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do sistema',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'abrir',
        title: 'Abrir sistema',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'fechar',
        title: 'Fechar',
        icon: '/icons/icon-72x72.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Ponto Eletrônico', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', event => {
  console.log('👆 Notificação clicada');
  
  event.notification.close();
  
  if (event.action === 'abrir') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Mensagens do cliente
self.addEventListener('message', event => {
  console.log('📨 Mensagem do cliente:', event.data);
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0', cache: CACHE_NAME });
  }
});