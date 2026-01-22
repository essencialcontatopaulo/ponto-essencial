// js/firebase-config.js
// CONFIGURAÇÃO ÚNICA DO FIREBASE - NÃO REPITA EM OUTROS ARQUIVOS

// ⚠️ AQUI ESTÁ A ÚNICA DECLARAÇÃO DE firebaseConfig ⚠️
const firebaseConfig = {
    apiKey: "AIzaSyBNe8ryLTnb-IJBzR9CCmJ9Ljg_lawzTtk",
    authDomain: "essencial-print-5a753.firebaseapp.com",
    projectId: "essencial-print-5a753",
    storageBucket: "essencial-print-5a753.firebasestorage.app",
    messagingSenderId: "544082416072",
    appId: "1:544082416072:web:85d3c8549b25158284f0fd"
};

// Função para inicializar Firebase
function inicializarFirebase() {
    try {
        console.log('🚀 Inicializando Firebase...');
        
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK não carregado');
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
        return null;
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.firebaseConfig = firebaseConfig;
    window.inicializarFirebase = inicializarFirebase;
}
