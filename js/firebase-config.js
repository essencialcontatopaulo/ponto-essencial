// firebase-config.js
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO_ID",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};

// Inicializar Firebase
let firebaseApp;
let db;
let auth;

try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    console.log('Firebase inicializado com sucesso!');
} catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
}

// Funções utilitárias
function getCurrentUser() {
    return auth.currentUser;
}

async function isGestor(userId) {
    try {
        const gestorDoc = await db.collection('gestores').doc(userId).get();
        return gestorDoc.exists;
    } catch (error) {
        console.error('Erro ao verificar gestor:', error);
        return false;
    }
}

async function getFuncionarioByCpf(cpf) {
    try {
        const snapshot = await db.collection('funcionarios')
            .where('cpf', '==', cpf)
            .where('ativo', '==', true)
            .limit(1)
            .get();
        
        if (snapshot.empty) return null;
        
        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('Erro ao buscar funcionário:', error);
        return null;
    }
}

export { firebaseApp, db, auth, getCurrentUser, isGestor, getFuncionarioByCpf };
