// Sistema de Autenticação atualizado
window.auth = (function() {
    'use strict';
    
    const auth = {};
    
    // Verificar se está logado
    auth.getCurrentUser = function() {
        try {
            const userStr = localStorage.getItem('ponto_user');
            if (userStr) {
                return JSON.parse(userStr);
            }
        } catch (error) {
            console.error('Erro ao ler usuário:', error);
        }
        return null;
    };
    
    // Login
    auth.login = async function(email, senha) {
        try {
            // Se Firebase estiver disponível, usar autenticação real
            if (window.firebase && window.firebase.auth) {
                const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js');
                
                const userCredential = await signInWithEmailAndPassword(
                    window.firebase.auth, 
                    email, 
                    senha
                );
                
                // Buscar dados adicionais no Firestore
                const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
                const userDoc = await getDoc(doc(window.firebase.db, 'usuarios', userCredential.user.uid));
                
                let userData = {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    nome: userCredential.user.displayName || email.split('@')[0],
                    tipo: 'funcionario' // default
                };
                
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    userData = { ...userData, ...data };
                }
                
                // Salvar no localStorage
                localStorage.setItem('ponto_user', JSON.stringify(userData));
                
                return {
                    success: true,
                    usuario: userData
                };
                
            } else {
                // Modo simulação para desenvolvimento
                console.log('🔥 Modo SIMULAÇÃO de login ativo');
                
                // Usuários de teste
                const usuariosTeste = {
                    'admin@empresa.com': {
                        uid: 'admin001',
                        email: 'admin@empresa.com',
                        nome: 'Administrador',
                        tipo: 'gestor',
                        senha: 'admin123'
                    },
                    'joao.silva@empresa.com': {
                        uid: 'func001',
                        email: 'joao.silva@empresa.com',
                        nome: 'João Silva',
                        tipo: 'funcionario',
                        senha: 'func123'
                    },
                    'maria.santos@empresa.com': {
                        uid: 'func002',
                        email: 'maria.santos@empresa.com',
                        nome: 'Maria Santos',
                        tipo: 'funcionario',
                        senha: 'func123'
                    }
                };
                
                if (usuariosTeste[email] && usuariosTeste[email].senha === senha) {
                    const userData = { ...usuariosTeste[email] };
                    delete userData.senha;
                    
                    localStorage.setItem('ponto_user', JSON.stringify(userData));
                    
                    return {
                        success: true,
                        usuario: userData
                    };
                } else {
                    return {
                        success: false,
                        error: 'Credenciais inválidas'
                    };
                }
            }
            
        } catch (error) {
            console.error('Erro no login:', error);
            return {
                success: false,
                error: error.message || 'Erro ao fazer login'
            };
        }
    };
    
    // Logout
    auth.logout = async function() {
        try {
            if (window.firebase && window.firebase.auth) {
                const { signOut } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js');
                await signOut(window.firebase.auth);
            }
        } catch (error) {
            console.error('Erro no logout:', error);
        }
        
        localStorage.removeItem('ponto_user');
        window.location.href = 'index.html';
    };
    
    // Verificar autenticação em páginas protegidas
    auth.requireAuth = function(tipoRequerido = null) {
        const user = auth.getCurrentUser();
        
        if (!user) {
            window.location.href = 'index.html';
            return false;
        }
        
        if (tipoRequerido && user.tipo !== tipoRequerido) {
            alert(`Acesso restrito para ${tipoRequerido}s`);
            window.location.href = 'index.html';
            return false;
        }
        
        return user;
    };
    
    // Cadastrar novo usuário (apenas gestor)
    auth.cadastrarUsuario = async function(dados) {
        try {
            if (window.firebase && window.firebase.auth && window.firebase.db) {
                const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js');
                const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
                
                // Criar usuário no Authentication
                const userCredential = await createUserWithEmailAndPassword(
                    window.firebase.auth,
                    dados.email,
                    dados.senha
                );
                
                // Salvar dados adicionais no Firestore
                const userData = {
                    nome: dados.nome,
                    email: dados.email,
                    tipo: dados.tipo || 'funcionario',
                    cargo: dados.cargo || '',
                    departamento: dados.departamento || '',
                    dataCadastro: new Date().toISOString(),
                    ativo: true
                };
                
                await setDoc(doc(window.firebase.db, 'usuarios', userCredential.user.uid), userData);
                
                return {
                    success: true,
                    uid: userCredential.user.uid,
                    usuario: userData
                };
                
            } else {
                // Modo simulação
                console.log('🔥 Modo SIMULAÇÃO de cadastro');
                
                // Carregar usuários existentes
                let usuarios = JSON.parse(localStorage.getItem('ponto_usuarios') || '[]');
                
                // Verificar se email já existe
                if (usuarios.some(u => u.email === dados.email)) {
                    return {
                        success: false,
                        error: 'Este e-mail já está cadastrado'
                    };
                }
                
                const novoUsuario = {
                    uid: 'user_' + Date.now(),
                    nome: dados.nome,
                    email: dados.email,
                    tipo: dados.tipo || 'funcionario',
                    cargo: dados.cargo || '',
                    departamento: dados.departamento || '',
                    dataCadastro: new Date().toISOString(),
                    ativo: true
                };
                
                usuarios.push(novoUsuario);
                localStorage.setItem('ponto_usuarios', JSON.stringify(usuarios));
                
                return {
                    success: true,
                    uid: novoUsuario.uid,
                    usuario: novoUsuario
                };
            }
            
        } catch (error) {
            console.error('Erro ao cadastrar usuário:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    // Listar todos os usuários (apenas gestor)
    auth.listarUsuarios = function() {
        try {
            const usuarios = JSON.parse(localStorage.getItem('ponto_usuarios') || '[]');
            return usuarios;
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            return [];
        }
    };
    
    return auth;
})();
