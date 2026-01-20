// firebase-config.js - Configuração do Firebase
console.log("🔥 Configuração Firebase carregada!");

const firebaseConfig = {
    // SUAS CONFIGURAÇÕES DO FIREBASE VÃO AQUI
    // Você precisa criar um projeto em: https://firebase.google.com
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO_ID",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_NUMERO",
    appId: "SEU_APP_ID"
};

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseStorage = null;

// Inicializar Firebase
async function inicializarFirebase() {
    console.log("🔄 Inicializando Firebase...");
    
    try {
        // Verificar se Firebase já está carregado
        if (window.firebaseApp) {
            firebaseApp = window.firebaseApp;
            firebaseAuth = window.firebaseAuth;
            firebaseDb = window.firebaseDb;
            firebaseStorage = window.firebaseStorage;
            
            console.log("✅ Firebase já inicializado!");
            return { firebaseApp, firebaseAuth, firebaseDb, firebaseStorage };
        }
        
        // Se não, esperar o carregamento do index.html
        console.log("⏳ Aguardando carregamento do Firebase...");
        
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                if (window.firebaseApp) {
                    clearInterval(checkInterval);
                    
                    firebaseApp = window.firebaseApp;
                    firebaseAuth = window.firebaseAuth;
                    firebaseDb = window.firebaseDb;
                    firebaseStorage = window.firebaseStorage;
                    
                    console.log("✅ Firebase inicializado com sucesso!");
                    resolve({ firebaseApp, firebaseAuth, firebaseDb, firebaseStorage });
                }
            }, 100);
            
            // Timeout após 10 segundos
            setTimeout(() => {
                clearInterval(checkInterval);
                console.warn("⚠️ Firebase não carregado - modo simulação ativado");
                reject(new Error("Firebase não carregado"));
            }, 10000);
        });
        
    } catch (error) {
        console.warn("⚠️ Modo simulação ativado (sem Firebase):", error.message);
        
        // Modo simulação para desenvolvimento
        return {
            firebaseApp: { name: "[SIMULAÇÃO] Firebase App" },
            firebaseAuth: {
                currentUser: null,
                signInWithEmailAndPassword: () => Promise.resolve({ user: { email: "teste@simulacao.com" } }),
                createUserWithEmailAndPassword: () => Promise.resolve({ user: { email: "novo@simulacao.com" } }),
                signOut: () => Promise.resolve()
            },
            firebaseDb: {
                collection: () => ({
                    doc: () => ({
                        set: () => Promise.resolve(),
                        get: () => Promise.resolve({ exists: false, data: () => null }),
                        update: () => Promise.resolve()
                    }),
                    add: () => Promise.resolve({ id: "sim_" + Date.now() }),
                    where: () => ({ get: () => Promise.resolve({ empty: true, docs: [] }) })
                })
            },
            firebaseStorage: {
                ref: () => ({
                    put: () => Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve("https://via.placeholder.com/300") } })
                })
            }
        };
    }
}

// Funções auxiliares
async function salvarRegistro(collection, dados) {
    const { firebaseDb } = await inicializarFirebase();
    
    try {
        if (firebaseDb.collection) {
            const resultado = await firebaseDb.collection(collection).add(dados);
            console.log("✅ Registro salvo no Firebase:", resultado.id);
            return { success: true, id: resultado.id };
        } else {
            // Modo simulação
            console.log("💾 [SIMULAÇÃO] Registro salvo:", dados);
            return { success: true, id: "sim_" + Date.now() };
        }
    } catch (error) {
        console.error("❌ Erro ao salvar registro:", error);
        return { success: false, error: error.message };
    }
}

async function buscarRegistros(collection, filtro = null) {
    const { firebaseDb } = await inicializarFirebase();
    
    try {
        let query = firebaseDb.collection(collection);
        
        if (filtro) {
            query = query.where(filtro.campo, filtro.operador, filtro.valor);
        }
        
        const snapshot = await query.get();
        const resultados = [];
        
        snapshot.forEach(doc => {
            resultados.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`✅ ${resultados.length} registros encontrados em ${collection}`);
        return resultados;
        
    } catch (error) {
        console.warn("⚠️ Erro ao buscar registros - retornando dados simulados");
        
        // Dados simulados para desenvolvimento
        if (collection === 'funcionarios') {
            return [
                { id: '1', nome: 'João Silva', email: 'joao@empresa.com', cargo: 'Desenvolvedor' },
                { id: '2', nome: 'Maria Santos', email: 'maria@empresa.com', cargo: 'Designer' }
            ];
        } else if (collection === 'pontos') {
            return [
                { id: '1', funcionarioId: '1', data: '20/01/2026', entrada: '08:00', saida: '17:00' }
            ];
        }
        
        return [];
    }
}

// Exportar
window.firebaseConfig = {
    inicializarFirebase,
    salvarRegistro,
    buscarRegistros
};
