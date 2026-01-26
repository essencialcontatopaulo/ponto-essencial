// Aplicação Principal do Ponto Eletrônico
const app = {
    // Configurações
    config: {
        jornadaPadrao: {
            segundaSexta: { entrada: "08:00", saida: "18:00", intervalo: 2 },
            sabado: { entrada: "08:00", saida: "13:00", intervalo: 0 },
            domingo: { trabalho: false }
        }
    },

    // Inicialização
    init: function() {
        console.log('Aplicação iniciando...');
        
        // Configurar botões
        this.setupEventListeners();
        
        // Verificar autenticação
        this.checkAuth();
    },

    // Configurar eventos
    setupEventListeners: function() {
        // Botão de login
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
        }
        
        // Botão de primeiro admin
        const firstAdminBtn = document.getElementById('firstAdminBtn');
        if (firstAdminBtn) {
            firstAdminBtn.addEventListener('click', () => this.createFirstAdmin());
        }
        
        // Permitir login com Enter
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLogin();
                }
            });
        }
    },

    // Verificar autenticação
    checkAuth: function() {
        firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                console.log('Usuário autenticado:', user.email);
                this.redirectUser(user.uid);
            } else {
                console.log('Nenhum usuário autenticado');
            }
        });
    },

    // Manipular login
    handleLogin: async function() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('errorMessage');
        
        // Validação
        if (!email || !password) {
            this.showError('Por favor, preencha todos os campos');
            return;
        }
        
        try {
            // Mostrar loading
            const loginBtn = document.getElementById('loginBtn');
            const originalText = loginBtn.textContent;
            loginBtn.textContent = 'Entrando...';
            loginBtn.disabled = true;
            
            // Fazer login
            const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('Login bem sucedido para:', user.email);
            
            // Redirecionar baseado no tipo de usuário
            await this.redirectUser(user.uid);
            
        } catch (error) {
            console.error('Erro no login:', error);
            
            let errorMessage = 'Erro ao fazer login. ';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage += 'Usuário não encontrado.';
                    break;
                case 'auth/wrong-password':
                    errorMessage += 'Senha incorreta.';
                    break;
                case 'auth/invalid-email':
                    errorMessage += 'E-mail inválido.';
                    break;
                case 'auth/user-disabled':
                    errorMessage += 'Usuário desativado.';
                    break;
                default:
                    errorMessage += error.message;
            }
            
            this.showError(errorMessage);
            
            // Restaurar botão
            const loginBtn = document.getElementById('loginBtn');
            loginBtn.textContent = 'Entrar no Sistema';
            loginBtn.disabled = false;
        }
    },

    // Redirecionar usuário baseado no tipo
    redirectUser: async function(userId) {
        try {
            // Buscar informações do usuário no Firestore
            const userDoc = await firebaseDb.collection('usuarios').doc(userId).get();
            
            if (!userDoc.exists) {
                // Usuário não tem perfil completo, redirecionar para completar
                window.location.href = 'completar-perfil.html';
                return;
            }
            
            const userData = userDoc.data();
            
            // Redirecionar baseado no tipo
            if (userData.tipo === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'funcionario.html';
            }
            
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            this.showError('Erro ao carregar perfil do usuário');
        }
    },

    // Criar primeiro administrador
    createFirstAdmin: async function() {
        const email = prompt('Digite o e-mail para o administrador:');
        if (!email) return;
        
        const password = prompt('Digite a senha (mínimo 6 caracteres):');
        if (!password || password.length < 6) {
            alert('Senha deve ter no mínimo 6 caracteres');
            return;
        }
        
        const nome = prompt('Digite o nome do administrador:');
        if (!nome) return;
        
        try {
            // Criar usuário no Authentication
            const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Criar perfil no Firestore
            await firebaseDb.collection('usuarios').doc(user.uid).set({
                nome: nome,
                email: email,
                tipo: 'admin',
                matricula: 'ADM001',
                departamento: 'Administração',
                cargo: 'Administrador do Sistema',
                dataAdmissao: new Date().toISOString().split('T')[0],
                ativo: true,
                jornadaPadrao: this.config.jornadaPadrao,
                dataCadastro: new Date(),
                criadoPor: 'sistema'
            });
            
            alert('Administrador criado com sucesso!\n\nE-mail: ' + email + '\nSenha: ' + password);
            
            // Fazer login automaticamente
            await this.handleLogin();
            
        } catch (error) {
            console.error('Erro ao criar administrador:', error);
            alert('Erro ao criar administrador: ' + error.message);
        }
    },

    // Mostrar mensagem de erro
    showError: function(message) {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Auto-esconder após 5 segundos
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    },

    // Mostrar mensagem de sucesso
    showSuccess: function(message) {
        // Criar elemento de sucesso se não existir
        let successElement = document.getElementById('successMessage');
        if (!successElement) {
            successElement = document.createElement('div');
            successElement.id = 'successMessage';
            successElement.className = 'success-message';
            document.querySelector('.login-form').appendChild(successElement);
        }
        
        successElement.textContent = message;
        successElement.style.display = 'block';
        
        // Auto-esconder após 5 segundos
        setTimeout(() => {
            successElement.style.display = 'none';
        }, 5000);
    },

    // Formatar data
    formatDate: function(date, format = 'full') {
        const d = new Date(date);
        
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        return d.toLocaleDateString('pt-BR', options);
    },

    // Formatar hora
    formatTime: function(date) {
        const d = new Date(date);
        return d.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Calcular horas trabalhadas
    calcularHorasTrabalhadas: function(entrada, saida) {
        const entradaMs = new Date(entrada).getTime();
        const saidaMs = new Date(saida).getTime();
        
        if (!entradaMs || !saidaMs) return 0;
        
        const diffMs = saidaMs - entradaMs;
        const horas = diffMs / (1000 * 60 * 60);
        
        // Subtrair intervalo de almoço (2 horas) se a jornada for maior que 6 horas
        return horas > 6 ? horas - 2 : horas;
    },

    // Obter dia da semana
    getDiaSemana: function(date) {
        const d = new Date(date);
        return d.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    },

    // Verificar se é dia útil
    isDiaUtil: function(date) {
        const dia = this.getDiaSemana(date);
        return dia >= 1 && dia <= 6; // Segunda a Sábado
    },

    // Verificar se é sábado
    isSabado: function(date) {
        return this.getDiaSemana(date) === 6;
    },

    // Verificar se é domingo
    isDomingo: function(date) {
        return this.getDiaSemana(date) === 0;
    }
};

// Exportar para uso global
window.app = app;