// Service Worker para PWA
const CACHE_NAME = 'ponto-eletronico-localizacao-v1.0';
const urlsToCache = [
  '/',import { auth, db } from "./firebase-config.js";
import { collection, addDoc, query, where, getDocs, orderBy, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ELEMENTOS DO DOM
const btnEntradaManual = document.getElementById("btnEntradaManual");
const btnSaidaManual = document.getElementById("btnSaidaManual");
const nomeFuncionario = document.getElementById("nomeFuncionario");
const emailFuncionario = document.getElementById("emailFuncionario");
const senhaFuncionario = document.getElementById("senhaFuncionario");
const btnCadastrarFuncionario = document.getElementById("btnCadastrarFuncionario");
const mensagemFuncionario = document.getElementById("mensagemFuncionario");
const justificativasPendentes = document.getElementById("justificativasPendentes");
const relatoriosDiv = document.getElementById("relatorios");

// FUNÇÃO PARA OBTER LOCALIZAÇÃO (ADMIN PODE REGISTRAR MANUALMENTE)
async function obterLocalizacao() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => resolve({ lat: 0, lng: 0 }) // caso negue, registra 0
    );
  });
}

// FUNÇÃO PARA REGISTRAR PONTO MANUAL
async function registrarPonto(tipo) {
  try {
    const loc = await obterLocalizacao();
    const uid = auth.currentUser.uid; // Admin UID
    const agora = new Date();

    await addDoc(collection(db, "pontos"), {
      uid: uid,
      tipo: tipo,
      data: agora.toISOString().split("T")[0],
      hora: agora.toTimeString().split(" ")[0],
      localizacao: loc,
      dispositivo: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop"
    });
    alert(`Ponto de ${tipo} registrado com sucesso!`);
    carregarRelatorios();
  } catch (err) {
    console.error(err);
    alert("Erro ao registrar ponto: " + err.message);
  }
}

// EVENTOS
btnEntradaManual.addEventListener("click", () => registrarPonto("entrada"));
btnSaidaManual.addEventListener("click", () => registrarPonto("saida"));

// CADASTRO DE FUNCIONÁRIO
btnCadastrarFuncionario.addEventListener("click", async () => {
  const nome = nomeFuncionario.value.trim();
  const email = emailFuncionario.value.trim();
  const senha = senhaFuncionario.value;

  if (!nome || !email || !senha) {
    mensagemFuncionario.style.color = "red";
    mensagemFuncionario.textContent = "Preencha todos os campos.";
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    const uid = cred.user.uid;

    // Salva no Firestore
    await setDoc(doc(db, "usuarios", uid), {
      nome: nome,
      email: email,
      role: "funcionario",
      ativo: true
    });

    mensagemFuncionario.style.color = "green";
    mensagemFuncionario.textContent = "Funcionário cadastrado com sucesso!";
    nomeFuncionario.value = "";
    emailFuncionario.value = "";
    senhaFuncionario.value = "";
  } catch (err) {
    mensagemFuncionario.style.color = "red";
    mensagemFuncionario.textContent = "Erro: " + err.message;
  }
});

// CARREGAR JUSTIFICATIVAS PENDENTES
async function carregarJustificativas() {
  justificativasPendentes.innerHTML = "<p>Carregando...</p>";
  const q = query(collection(db, "justificativas"), where("status", "==", "pendente"), orderBy("data", "desc"));
  const snapshot = await getDocs(q);
  justificativasPendentes.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.style.border = "1px solid #1f5e3b";
    div.style.padding = "10px";
    div.style.marginBottom = "5px";
    div.innerHTML = `
      <strong>${data.tipo}</strong> - ${data.descricao} (${data.data})<br>
      <button onclick="aprovar('${docSnap.id}')">Aprovar</button>
      <button onclick="rejeitar('${docSnap.id}')">Rejeitar</button>
    `;
    justificativasPendentes.appendChild(div);
  });
}

// FUNÇÕES APROVAR / REJEITAR
window.aprovar = async (id) => {
  await setDoc(doc(db, "justificativas", id), { status: "aprovado", adminUid: auth.currentUser.uid }, { merge: true });
  carregarJustificativas();
};

window.rejeitar = async (id) => {
  await setDoc(doc(db, "justificativas", id), { status: "rejeitado", adminUid: auth.currentUser.uid }, { merge: true });
  carregarJustificativas();
};

// CARREGAR RELATÓRIOS SIMPLES
async function carregarRelatorios() {
  relatoriosDiv.innerHTML = "<p>Carregando...</p>";
  const snapshot = await getDocs(collection(db, "pontos"));
  relatoriosDiv.innerHTML = "";

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    const div = document.createElement("div");
    div.textContent = `${d.data} ${d.hora} - ${d.tipo} (Usuário: ${d.uid})`;
    relatoriosDiv.appendChild(div);
  });
}

// INICIALIZAÇÃO
window.addEventListener("load", () => {
  carregarJustificativas();
  carregarRelatorios();
});

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
