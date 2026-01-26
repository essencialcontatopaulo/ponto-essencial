// Sistema de Autenticação do Ponto Eletrônico
const authSystem = {
    // Estado do usuário
    currentUser: null,
    userData: null,

    // Inicializar sistema de auth
    init: function() {
        console.log('Sistema de autenticação iniciando...');
        
        // Configurar listeners de auth state
        this.setupAuthListeners();
    },

    // Configurar listeners de autenticação
    setupAuthListeners: function() {
        firebaseAuth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('Usuário autenticado:', user.email);
                this.currentUser = user;
                
                // Buscar dados do usuário no Firestore
                await this.loadUserData(user.uid);
                
                // Redirecionar baseado no tipo de usuário
                this.redirectBasedOnUserType();
            } else {
                console.log('Nenhum usuário autenticado');
                this.currentUser = null;
                this.userData = null;
                
                // Se não estiver na página de login, redirecionar
                if (!window.location.pathname.includes('index.html') && 
                    !window.location.pathname.includes('/')) {
                    window.location.href = 'index.html';
                }
            }
        });
    },

    // Carregar dados do usuário do Firestore
    loadUserData: async function(userId) {
        try {
            const userDoc = await firebaseDb.collection('usuarios').doc(userId).get();
            
            if (userDoc.exists) {
                this.userData = userDoc.data();
                console.log('Dados do usuário carregados:', this.userData);
            } else {
                console.log('Usuário não encontrado no Firestore');
                // Se for um novo usuário sem perfil, redirecionar para completar perfil
                if (!window.location.pathname.includes('completar-perfil.html')) {
                    window.location.href = 'completar-perfil.html';
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
        }
    },

    // Redirecionar baseado no tipo de usuário
    redirectBasedOnUserType: function() {
        // Se não tem userData, ainda não carregou
        if (!this.userData) return;
        
        const currentPage = window.location.pathname;
        
        // Se está na página inicial e já está autenticado, redirecionar
        if (currentPage.includes('index.html') || currentPage === '/') {
            if (this.userData.tipo === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'funcionario.html';
            }
        }
        
        // Verificar acesso à página atual
        this.checkPageAccess();
    },

    // Verificar se usuário tem acesso à página atual
    checkPageAccess: function() {
        if (!this.userData) return;
        
        const currentPage = window.location.pathname;
        const userType = this.userData.tipo;
        
        // Páginas restritas a administradores
        const adminPages = ['admin.html', 'cadastro-funcionario.html'];
        const isAdminPage = adminPages.some(page => currentPage.includes(page));
        
        if (isAdminPage && userType !== 'admin') {
            alert('Acesso restrito a administradores!');
            window.location.href = 'funcionario.html';
        }
        
        // Páginas restritas a funcionários
        const employeePages = ['funcionario.html'];
        const isEmployeePage = employeePages.some(page => currentPage.includes(page));
        
        if (isEmployeePage && userType !== 'funcionario') {
            // Se não é funcionário, mas está em página de funcionário, verificar se é admin
            if (userType === 'admin') {
                // Admin pode acessar página de funcionário também
                return;
            }
            window.location.href = 'index.html';
        }
    },

    // Fazer login
    login: async function(email, password) {
        try {
            console.log('Tentando login para:', email);
            
            // Validar entrada
            if (!email || !password) {
                throw new Error('Por favor, preencha todos os campos');
            }
            
            // Fazer login com Firebase Auth
            const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
            console.log('Login bem sucedido');
            
            return {
                success: true,
                user: userCredential.user
            };
            
        } catch (error) {
            console.error('Erro no login:', error);
            
            // Tratar erros específicos
            let errorMessage = 'Erro ao fazer login. ';
            
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage += 'E-mail inválido.';
                    break;
                case 'auth/user-disabled':
                    errorMessage += 'Conta desativada.';
                    break;
                case 'auth/user-not-found':
                    errorMessage += 'Usuário não encontrado.';
                    break;
                case 'auth/wrong-password':
                    errorMessage += 'Senha incorreta.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage += 'Muitas tentativas. Tente novamente mais tarde.';
                    break;
                default:
                    errorMessage += error.message;
            }
            
            return {
                success: false,
                error: errorMessage
            };
        }
    },

    // Fazer logout
    logout: async function() {
        try {
            await firebaseAuth.signOut();
            console.log('Logout realizado com sucesso');
            
            // Redirecionar para login
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('Erro no logout:', error);
            throw error;
        }
    },

    // Criar novo usuário (para administradores)
    createUser: async function(email, password, userData) {
        try {
            console.log('Criando novo usuário:', email);
            
            // Validar dados
            if (!email || !password) {
                throw new Error('E-mail e senha são obrigatórios');
            }
            
            if (password.length < 6) {
                throw new Error('A senha deve ter no mínimo 6 caracteres');
            }
            
            // Criar usuário no Authentication
            const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('Usuário criado no Auth:', user.uid);
            
            // Preparar dados para Firestore
            const firestoreData = {
                uid: user.uid,
                email: email,
                ...userData,
                dataCadastro: new Date(),
                ativo: true
            };
            
            // Salvar no Firestore
            await firebaseDb.collection('usuarios').doc(user.uid).set(firestoreData);
            
            console.log('Dados salvos no Firestore');
            
            // Enviar e-mail de verificação (opcional)
            // await user.sendEmailVerification();
            
            return {
                success: true,
                user: user,
                data: firestoreData
            };
            
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            
            let errorMessage = 'Erro ao criar usuário. ';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage += 'Este e-mail já está em uso.';
                    break;
                case 'auth/invalid-email':
                    errorMessage += 'E-mail inválido.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage += 'Operação não permitida.';
                    break;
                case 'auth/weak-password':
                    errorMessage += 'Senha muito fraca. Use pelo menos 6 caracteres.';
                    break;
                default:
                    errorMessage += error.message;
            }
            
            return {
                success: false,
                error: errorMessage
            };
        }
    },

    // Redefinir senha
    resetPassword: async function(email) {
        try {
            await firebaseAuth.sendPasswordResetEmail(email);
            return {
                success: true,
                message: 'E-mail de redefinição de senha enviado!'
            };
        } catch (error) {
            console.error('Erro ao redefinir senha:', error);
            
            let errorMessage = 'Erro ao enviar e-mail de redefinição. ';
            
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage += 'E-mail inválido.';
                    break;
                case 'auth/user-not-found':
                    errorMessage += 'Usuário não encontrado.';
                    break;
                default:
                    errorMessage += error.message;
            }
            
            return {
                success: false,
                error: errorMessage
            };
        }
    },

    // Atualizar perfil do usuário
    updateProfile: async function(userId, updates) {
        try {
            await firebaseDb.collection('usuarios').doc(userId).update({
                ...updates,
                atualizadoEm: new Date()
            });
            
            return {
                success: true,
                message: 'Perfil atualizado com sucesso!'
            };
            
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            return {
                success: false,
                error: 'Erro ao atualizar perfil: ' + error.message
            };
        }
    },

    // Verificar se usuário é administrador
    isAdmin: function() {
        return this.userData && this.userData.tipo === 'admin';
    },

    // Verificar se usuário é funcionário
    isEmployee: function() {
        return this.userData && this.userData.tipo === 'funcionario';
    },

    // Obter dados do usuário atual
    getUser: function() {
        return {
            auth: this.currentUser,
            data: this.userData
        };
    },

    // Obter ID do usuário
    getUserId: function() {
        return this.currentUser ? this.currentUser.uid : null;
    },

    // Obter nome do usuário
    getUserName: function() {
        return this.userData ? this.userData.nome : 'Usuário';
    },

    // Obter iniciais do usuário (para avatar)
    getUserInitials: function() {
        if (!this.userData || !this.userData.nome) return 'U';
        
        const names = this.userData.nome.split(' ');
        const initials = names.map(name => name[0]).join('');
        return initials.substring(0, 2).toUpperCase();
    }
};

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    authSystem.init();
});

// Exportar para uso global
window.authSystem = authSystem;
