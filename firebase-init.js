// js/firebase-init.js
// Inicialização segura do Firebase

console.log('🚀 Inicializando Firebase...');

// Verifica se Firebase está carregado
if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK não foi carregado!');
    throw new Error('Firebase SDK não foi carregado. Verifique a conexão com a internet.');
}

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBNe8ryLTnb-IJBzR9CCmJ9Ljg_lawzTtk",
    authDomain: "essencial-print-5a753.firebaseapp.com",
    databaseURL: "https://essencial-print-5a753-default-rtdb.firebaseio.com",
    projectId: "essencial-print-5a753",
    storageBucket: "essencial-print-5a753.firebasestorage.app",
    messagingSenderId: "544082416072",
    appId: "1:544082416072:web:85d3c8549b25158284f0fd"
};

console.log('⚙️ Configuração Firebase:', firebaseConfig.projectId);

// Inicializa Firebase (apenas uma vez)
let firebaseApp;
let auth;
let db;

try {
    // Verifica se já foi inicializado
    if (!firebase.apps.length) {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase inicializado com sucesso!');
    } else {
        firebaseApp = firebase.app();
        console.log('⚠️ Firebase já estava inicializado');
    }
    
    // Obtém referências dos serviços
    auth = firebase.auth();
    db = firebase.firestore();
    
    // Configurações do Firestore
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Modo de desenvolvimento
        console.log('🔧 Modo desenvolvimento ativado');
        db.settings({
            experimentalForceLongPolling: true
        });
    }
    
    // Habilita persistência offline
    db.enablePersistence()
        .then(() => console.log('💾 Persistência offline ativada'))
        .catch(err => {
            if (err.code === 'failed-precondition') {
                console.warn('⚠️ Persistência offline não suportada em múltiplas abas');
            } else if (err.code === 'unimplemented') {
                console.warn('⚠️ Persistência offline não suportada pelo navegador');
            }
        });
    
} catch (error) {
    console.error('❌ ERRO CRÍTICO ao inicializar Firebase:', error);
    alert('Erro crítico: Não foi possível conectar ao servidor. Recarregue a página.');
    throw error;
}

// Teste de conexão
async function testarConexaoFirebase() {
    try {
        console.log('🔍 Testando conexão com Firebase...');
        
        // Testa Auth
        const authState = auth.currentUser ? 'Usuário autenticado' : 'Usuário não autenticado';
        console.log('🔐 Auth Status:', authState);
        
        // Testa Firestore (tenta ler uma coleção vazia)
        const snapshot = await db.collection('teste_conexao').limit(1).get();
        console.log('📁 Firestore Status: Conectado');
        
        return true;
    } catch (error) {
        console.error('❌ Teste de conexão falhou:', error);
        
        if (error.code === 'permission-denied') {
            console.warn('⚠️ Permissão negada - Verifique regras do Firestore');
        } else if (error.code === 'unavailable') {
            console.error('🌐 Serviço indisponível - Verifique conexão com internet');
        } else {
            console.error('❌ Erro desconhecido:', error.code, error.message);
        }
        
        return false;
    }
}

// Exporta para uso global
window.firebaseApp = firebaseApp;
window.firebaseAuth = auth;
window.firebaseDb = db;
window.testarConexaoFirebase = testarConexaoFirebase;

console.log('✅ Firebase iniciado e pronto para uso');
