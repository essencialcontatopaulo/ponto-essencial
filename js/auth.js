// auth.js - Sistema de Autenticação Completo
window.auth = (function() {
    'use strict';
    
    const auth = {};
    
    // ==================== USUÁRIOS DE TESTE ====================
    const USUARIOS_TESTE = {
        'admin@empresa.com': {
            id: 'admin001',
            email: 'admin@empresa.com',
            nome: 'Administrador Sistema',
            tipo: 'gestor',
            senha: 'admin123',
            cargo: 'Gerente Geral',
            departamento: 'Administração',
            dataCadastro: '2024-01-01',
            ativo: true
        },
        'joao.silva@empresa.com': {
            id: 'func001',
            email: 'joao.silva@empresa.com',
            nome: 'João Silva',
            tipo: 'funcionario',
            senha: 'func123',
            cargo: 'Analista de TI',
            departamento: 'Tecnologia',
            dataCadastro: '2024-01-15',
            ativo: true
        },
        'maria.santos@empresa.com': {
            id: 'func002',
            email: 'maria.santos@empresa.com',
            nome: 'Maria Santos',
            tipo: 'funcionario',
            senha: 'func123',
            cargo: 'Analista de RH',
            departamento: 'Recursos Humanos',
            dataCadastro: '2024-01-20',
            ativo: true
        }
    };
    
    // ==================== FUNÇÕES PRINCIPAIS ====================
    
    auth.getCurrentUser = function() {
        try {
            const userStr = localStorage.getItem('ponto_user');
            if (userStr) {
                const usuario = JSON.parse(userStr);
                return usuario;
            }
        } catch (error) {
            console.error('❌ Erro ao ler usuário:', error);
        }
        return null;
    };
    
    auth.login = async function(email, senha) {
        console.log(`🔐 Tentando login: ${email}`);
        
        try {
            if (window.firebase && window.firebase.auth) {
                const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js');
                
                const userCredential = await signInWithEmailAndPassword(
                    window.firebase.auth, 
                    email, 
                    senha
                );
                
                const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
                const userDoc = await getDoc(doc(window.firebase.db, 'usuarios', userCredential.user.uid));
                
                let userData = {
                    id: userCredential.user.uid,
                    email: userCredential.user.email,
                    nome: userCredential.user.displayName || email.split('@')[0],
                    tipo: 'funcionario'
                };
                
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    userData = { ...userData, ...data };
                }
                
                localStorage.setItem('ponto_user', JSON.stringify(userData));
                
                return {
                    success: true,
                    usuario: userData,
                    message: 'Login realizado com sucesso!'
                };
                
            } else {
                if (USUARIOS_TESTE[email] && USUARIOS_TESTE[email].senha === senha) {
                    const userData = { ...USUARIOS_TESTE[email] };
                    delete userData.senha;
                    
                    localStorage.setItem('ponto_user', JSON.stringify(userData));
                    
                    return {
                        success: true,
                        usuario: userData,
                        message: 'Login realizado com sucesso!'
                    };
                } else {
                    return {
                        success: false,
                        error: 'E-mail ou senha incorretos'
                    };
                }
            }
            
        } catch (error) {
            console.error('❌ Erro no login:', error);
            
            let errorMessage = 'Erro ao fazer login';
            
            if (error.code) {
                switch(error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'Usuário não encontrado';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Senha incorreta';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'E-mail inválido';
                        break;
                    default:
                        errorMessage = error.message || 'Erro desconhecido';
                }
            }
            
            return {
                success: false,
                error: errorMessage
            };
        }
    };
    
    auth.logout = async function() {
        console.log("🚪 Realizando logout");
        
        try {
            if (window.firebase && window.firebase.auth) {
                const { signOut } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js');
                await signOut(window.firebase.auth);
            }
        } catch (error) {
            console.error('❌ Erro no logout Firebase:', error);
        }
        
        localStorage.removeItem('ponto_user');
        window.location.href = 'index.html';
    };
    
    auth.requireAuth = function(tipoRequerido = null) {
        const user = auth.getCurrentUser();
        
        if (!user) {
            window.location.href = 'index.html';
            return false;
        }
        
        if (tipoRequerido && user.tipo !== tipoRequerido) {
            alert(`⚠️ Acesso restrito para ${tipoRequerido}s`);
            window.location.href = 'index.html';
            return false;
        }
        
        return user;
    };
    
    auth.cadastrarUsuario = async function(dados) {
        console.log("📝 Cadastrando novo usuário:", dados.email);
        
        if (!dados.nome || !dados.email || !dados.senha) {
            return {
                success: false,
                error: 'Preencha todos os campos obrigatórios'
            };
        }
        
        if (dados.senha.length < 6) {
            return {
                success: false,
                error: 'A senha deve ter no mínimo 6 caracteres'
            };
        }
        
        try {
            if (window.firebase && window.firebase.auth && window.firebase.db) {
                const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js');
                const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
                
                const userCredential = await createUserWithEmailAndPassword(
                    window.firebase.auth,
                    dados.email,
                    dados.senha
                );
                
                const userData = {
                    nome: dados.nome,
                    email: dados.email,
                    tipo: dados.tipo || 'funcionario',
                    cargo: dados.cargo || '',
                    departamento: dados.departamento || '',
                    matricula: dados.matricula || '',
                    dataCadastro: new Date().toISOString(),
                    ativo: true,
                    cadastradoPor: auth.getCurrentUser()?.id || 'sistema'
                };
                
                await setDoc(doc(window.firebase.db, 'usuarios', userCredential.user.uid), userData);
                
                adicionarUsuarioLocal({
                    id: userCredential.user.uid,
                    ...userData
                });
                
                return {
                    success: true,
                    usuario: userData,
                    message: 'Usuário cadastrado com sucesso!'
                };
                
            } else {
                if (USUARIOS_TESTE[dados.email]) {
                    return {
                        success: false,
                        error: 'Este e-mail já está cadastrado'
                    };
                }
                
                const novoUsuario = {
                    id: 'user_' + Date.now(),
                    nome: dados.nome,
                    email: dados.email,
                    tipo: dados.tipo || 'funcionario',
                    cargo: dados.cargo || '',
                    departamento: dados.departamento || '',
                    dataCadastro: new Date().toISOString(),
                    ativo: true
                };
                
                adicionarUsuarioLocal(novoUsuario);
                
                return {
                    success: true,
                    usuario: novoUsuario,
                    message: 'Usuário cadastrado com sucesso!'
                };
            }
            
        } catch (error) {
            console.error('❌ Erro ao cadastrar usuário:', error);
            
            let errorMessage = 'Erro ao cadastrar usuário';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Este e-mail já está em uso';
            }
            
            return {
                success: false,
                error: errorMessage
            };
        }
    };
    
    auth.listarUsuarios = function() {
        try {
            const usuariosLocais = JSON.parse(localStorage.getItem('ponto_usuarios') || '[]');
            
            const todosUsuarios = Object.values(USUARIOS_TESTE).map(usuario => {
                const userCopy = { ...usuario };
                delete userCopy.senha;
                return userCopy;
            });
            
            usuariosLocais.forEach(userLocal => {
                if (!todosUsuarios.some(u => u.email === userLocal.email)) {
                    todosUsuarios.push(userLocal);
                }
            });
            
            return todosUsuarios;
            
        } catch (error) {
            console.error('❌ Erro ao listar usuários:', error);
            return [];
        }
    };
    
    auth.buscarUsuarioPorId = function(usuarioId) {
        const usuarios = auth.listarUsuarios();
        return usuarios.find(u => u.id === usuarioId) || null;
    };
    
    auth.atualizarUsuario = async function(usuarioId, dados) {
        try {
            if (window.firebase && window.firebase.db) {
                const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
                
                await updateDoc(doc(window.firebase.db, 'usuarios', usuarioId), dados);
                
                atualizarUsuarioLocal(usuarioId, dados);
                
                return {
                    success: true,
                    message: 'Usuário atualizado com sucesso!'
                };
                
            } else {
                atualizarUsuarioLocal(usuarioId, dados);
                
                return {
                    success: true,
                    message: 'Usuário atualizado com sucesso!'
                };
            }
            
        } catch (error) {
            console.error('❌ Erro ao atualizar usuário:', error);
            return {
                success: false,
                error: 'Erro ao atualizar usuário'
            };
        }
    };
    
    function adicionarUsuarioLocal(usuario) {
        try {
            let usuarios = JSON.parse(localStorage.getItem('ponto_usuarios') || '[]');
            
            const index = usuarios.findIndex(u => u.id === usuario.id || u.email === usuario.email);
            
            if (index === -1) {
                usuarios.push(usuario);
            } else {
                usuarios[index] = usuario;
            }
            
            localStorage.setItem('ponto_usuarios', JSON.stringify(usuarios));
            
        } catch (error) {
            console.error('❌ Erro ao salvar usuário localmente:', error);
        }
    }
    
    function atualizarUsuarioLocal(usuarioId, dados) {
        try {
            let usuarios = JSON.parse(localStorage.getItem('ponto_usuarios') || '[]');
            const index = usuarios.findIndex(u => u.id === usuarioId);
            
            if (index !== -1) {
                usuarios[index] = { ...usuarios[index], ...dados };
                localStorage.setItem('ponto_usuarios', JSON.stringify(usuarios));
            }
            
        } catch (error) {
            console.error('❌ Erro ao atualizar usuário localmente:', error);
        }
    }
    
    function inicializarDadosTeste() {
        try {
            const dadosExistem = localStorage.getItem('ponto_usuarios');
            
            if (!dadosExistem) {
                const usuariosParaSalvar = Object.values(USUARIOS_TESTE).map(usuario => {
                    const userCopy = { ...usuario };
                    delete userCopy.senha;
                    return userCopy;
                });
                
                localStorage.setItem('ponto_usuarios', JSON.stringify(usuariosParaSalvar));
            }
            
        } catch (error) {
            console.error('❌ Erro ao inicializar dados de teste:', error);
        }
    }
    
    document.addEventListener('DOMContentLoaded', function() {
        inicializarDadosTeste();
    });
    
    return auth;
})();
