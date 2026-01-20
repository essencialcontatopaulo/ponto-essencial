// auth.js - Sistema de autenticação
console.log("🔐 Módulo de autenticação carregado!");

let usuarioLogado = null;

// Funções de autenticação
const auth = {
    // Login com email/senha
    async login(email, senha) {
        console.log('Tentando login com:', email);
        
        try {
            // Simulação de login (substituir por Firebase depois)
            if (email && senha) {
                usuarioLogado = {
                    email: email,
                    nome: email.split('@')[0],
                    tipo: 'funcionario',
                    logadoEm: new Date().toISOString()
                };
                
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
                console.log('✅ Login realizado com sucesso!');
                return { success: true, usuario: usuarioLogado };
            }
            
            throw new Error('Email ou senha inválidos');
            
        } catch (error) {
            console.error('❌ Erro no login:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Logout
    logout() {
        usuarioLogado = null;
        localStorage.removeItem('usuarioLogado');
        console.log('👋 Usuário deslogado');
        window.location.href = 'index.html';
    },
    
    // Verificar se está logado
    verificarLogin() {
        const usuarioSalvo = localStorage.getItem('usuarioLogado');
        if (usuarioSalvo) {
            usuarioLogado = JSON.parse(usuarioSalvo);
            return usuarioLogado;
        }
        return null;
    },
    
    // Registrar novo usuário
    async registrar(nome, email, senha, tipo = 'funcionario') {
        console.log('Registrando novo usuário:', nome);
        
        // Simulação (substituir por Firebase)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            success: true,
            message: 'Usuário registrado com sucesso!',
            usuario: { nome, email, tipo }
        };
    },
    
    // Reconhecimento facial (simulação)
    async reconhecimentoFacial(imagemData) {
        console.log('Processando reconhecimento facial...');
        
        // Simulação de processamento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulação: sempre retorna sucesso para teste
        return {
            success: true,
            usuario: {
                id: 'func_' + Date.now(),
                nome: 'Funcionário Teste',
                foto: imagemData.substring(0, 100) + '...' // Preview
            },
            confidence: 0.95
        };
    }
};

// Inicializar auth
document.addEventListener('DOMContentLoaded', function() {
    const usuario = auth.verificarLogin();
    if (usuario) {
        console.log(`👤 Usuário já logado: ${usuario.nome} (${usuario.tipo})`);
    }
});

// Exportar
window.auth = auth;
