// js/firebase-config.js
// CONFIGURAÇÃO ATUALIZADA DO FIREBASE - GERE UMA NOVA NO CONSOLE

// ⚠️ SUBSTITUA ESTES VALORES COM OS DA NOVA CONFIGURAÇÃO ⚠️
const firebaseConfig = {
  apiKey: "AIzaSyBNe8ryLTnb-IJBzR9CCmJ9Ljg_lawzTtk",
  authDomain: "essencial-print-5a753.firebaseapp.com",
  projectId: "essencial-print-5a753",
  storageBucket: "essencial-print-5a753.firebasestorage.app",
  messagingSenderId: "544082416072",
  appId: "1:544082416072:web:85d3c8549b25158284f0fd"
};

// Função para inicializar Firebase com fallback
function inicializarFirebase() {
    try {
        console.log('🚀 Inicializando Firebase...');
        
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK não carregado');
            return null;
        }
        
        // Verificar se a API Key foi configurada
        if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('SUA_NOVA_API_KEY_AQUI')) {
            console.error('❌ API Key não configurada! Acesse Firebase Console para obter uma nova.');
            return null;
        }
        
        let app;
        
        // Tentar inicializar
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase inicializado com sucesso');
        } else {
            app = firebase.apps[0];
            console.log('✅ Firebase já estava inicializado');
        }
        
        return {
            app: app,
            auth: firebase.auth(),
            db: firebase.firestore()
        };
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        console.error('Código do erro:', error.code);
        console.error('Mensagem:', error.message);
        return null;
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado, iniciando Firebase...');
    inicializarFirebase();
});

// Exportar configuração para uso global
if (typeof window !== 'undefined') {
    window.firebaseConfig = firebaseConfig;
    window.inicializarFirebase = inicializarFirebase;
}
