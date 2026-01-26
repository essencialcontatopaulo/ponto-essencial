// CONFIGURAÇÃO DO FIREBASE - SUBSTITUA COM SEUS DADOS
const firebaseConfig = {
    // VOCÊ VAI PEGAR ESSES DADOS NO CONSOLE DO FIREBASE
    apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdefghijklmnop"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Exportar as referências principais
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configurações do Firestore
db.settings({
    timestampsInSnapshots: true
});

// Funções globais para uso em outros arquivos
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;

console.log('Firebase configurado com sucesso!');
