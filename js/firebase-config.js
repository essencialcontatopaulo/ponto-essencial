// js/firebase-config.js
// CONFIGURAÇÃO OFICIAL DO FIREBASE - Essencial Print

const firebaseConfig = {
    apiKey: "AIzaSyBNe8ryLTnb-IJBzR9CCmJ9Ljg_lawzTtk",
    authDomain: "essencial-print-5a753.firebaseapp.com",
    projectId: "essencial-print-5a753",
    storageBucket: "essencial-print-5a753.firebasestorage.app",
    messagingSenderId: "544082416072",
    appId: "1:544082416072:web:85d3c8549b25158284f0fd"
};

// Função para inicializar Firebase com tratamento de erros
function inicializarFirebase() {
    try {
        console.log('🔧 Iniciando Firebase...');
        
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK não carregado');
        }
        
        if (!firebaseConfig.apiKey) {
            throw new Error('API Key não configurada');
        }
        
        let app;
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase inicializado com sucesso');
        } else {
            app = firebase.apps[0];
            console.log('✅ Firebase já estava inicializado');
        }
        
        return {
            auth: firebase.auth(),
            db: firebase.firestore(),
            app: app
        };
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        return null;
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    inicializarFirebase();
});
