// auth.js - Sistema de autenticação com usuários pré-cadastrados
console.log("🔐 Módulo de autenticação carregado!");

// Banco de dados de usuários (simulação)
const usuariosCadastrados = {
    // GESTOR - Acesso total
    'admin@empresa.com': {
        id: 'user_001',
        nome: 'Administrador Sistema',
        email: 'admin@empresa.com',
        senha: 'admin123',
        tipo: 'gestor',
        cargo: 'Gerente Geral',
        ativo: true,
        criadoEm: '2024-01-01'
    },
    
    // FUNCIONÁRIOS
    'joao.silva@empresa.com': {
        id: 'user_002',
        nome: 'João Silva',
        email: 'joao.silva@empresa.com',
        senha: 'func123',
        tipo: 'funcionario',
        cargo: 'Desenvolvedor',
        ativo: true,
        criadoEm: '2024-01-15'
    },
    
    'maria.santos@empresa.com': {
        id: 'user_003',
        nome: 'Maria Santos',
        email: 'maria.santos@empresa.com',
        senha: 'func123',
        tipo: 'funcionario',
        cargo: 'Designer',
        ativo: true,
        criadoEm: '2024-01-20'
    },
    
    'carlos.oliveira@empresa.com': {
        id: 'user_004',
        nome: 'Carlos Oliveira',
        email: 'carlos.oliveira@empresa.com',
        senha: 'func123',
        tipo: 'funcionario',
        cargo: 'Analista de RH',
        ativo: true,
        criadoEm: '2024-02-01'
    },
    
    'ana.costa@empresa.com': {
        id: 'user_005',
        nome: 'Ana Costa',
        email: 'ana.costa@empresa.com',
        senha: 'func123',
        tipo: 'funcionario',
        cargo: 'Assistente Administrativo',
        ativo: true,
        criadoEm: '2024-02-10'
    }
};

let usuarioLogado = null;

// Funções de autenticação
const auth = {
    // Login com email/senha
    async login(email, senha) {
        console.log('🔑 Tentando login com:', email);
        
        try {
            // Verificar se usuário existe
            const usuario = usuariosCadastrados[email];
            
            if (usuario && usuario.senha === senha) {
                if (!usuario.ativo) {
                    throw new Error('Usuário inativo. Contate o administrador.');
                }
                
                // Criar sessão (sem senha)
                const sessaoUsuario = {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    tipo: usuario.tipo,
                    cargo: usuario.cargo,
                    logadoEm: new Date().toISOString()
                };
                
                usuarioLogado = sessaoUsuario;
                localStorage.setItem('usuarioLogado', JSON.stringify(sessaoUsuario));
                
                console.log(`✅ Login realizado: ${usuario.nome} (${usuario.tipo})`);
                return { 
                    success: true, 
                    usuario: sessaoUsuario,
                    message: `Bem-vindo, ${usuario.nome}!`
                };
            }
            
            throw new Error('Email ou senha incorretos');
            
        } catch (error) {
            console.error('❌ Erro no login:', error.message);
            return { 
                success: false, 
                error: error.message,
                sugestao: 'Use: admin@empresa.com / admin123'
            };
        }
    },
    
    // Logout
    logout() {
        const nomeUsuario = usuarioLogado?.nome || 'Usuário';
        usuarioLogado = null;
        localStorage.removeItem('usuarioLogado');
        console.log(`👋 ${nomeUsuario} deslogado`);
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
    
    // Registrar novo usuário (apenas gestor)
    async registrar(novoUsuario) {
        console.log('📝 Registrando novo usuário:', novoUsuario.nome);
        
        try {
            // Verificar permissão (apenas gestor)
            if (usuarioLogado?.tipo !== 'gestor') {
                throw new Error('Apenas gestores podem registrar novos usuários');
            }
            
            // Validar dados
            if (!novoUsuario.email || !novoUsuario.nome || !novoUsuario.cargo) {
                throw new Error('Preencha todos os campos obrigatórios');
            }
            
            // Verificar se email já existe (simulação)
            if (usuariosCadastrados[novoUsuario.email]) {
                throw new Error('Email já cadastrado no sistema');
            }
            
            // Criar ID único
            const novoId = 'user_' + Date.now();
            
            // Adicionar ao banco simulado
            usuariosCadastrados[novoUsuario.email] = {
                id: novoId,
                nome: novoUsuario.nome,
                email: novoUsuario.email,
                senha: novoUsuario.senha || 'senha123', // Senha padrão
                tipo: novoUsuario.tipo || 'funcionario',
                cargo: novoUsuario.cargo,
                ativo: true,
                criadoEm: new Date().toISOString().split('T')[0]
            };
            
            console.log('✅ Usuário registrado com sucesso:', novoId);
            
            return {
                success: true,
                message: `Usuário ${novoUsuario.nome} registrado com sucesso!`,
                usuario: {
                    id: novoId,
                    nome: novoUsuario.nome,
                    email: novoUsuario.email,
                    tipo: novoUsuario.tipo,
                    cargo: novoUsuario.cargo
                }
            };
            
        } catch (error) {
            console.error('❌ Erro ao registrar usuário:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // Listar todos usuários (apenas gestor)
    listarUsuarios() {
        if (usuarioLogado?.tipo !== 'gestor') {
            console.warn('⚠️ Acesso não autorizado à lista de usuários');
            return [];
        }
        
        const lista = Object.values(usuariosCadastrados).map(usuario => ({
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            tipo: usuario.tipo,
            cargo: usuario.cargo,
            ativo: usuario.ativo,
            criadoEm: usuario.criadoEm
        }));
        
        console.log(`📋 ${lista.length} usuários encontrados`);
        return lista;
    },
    
    // Buscar usuário por email
    buscarUsuario(email) {
        return usuariosCadastrados[email] || null;
    },
    
    // Atualizar usuário
    async atualizarUsuario(email, dadosAtualizados) {
        try {
            if (usuarioLogado?.tipo !== 'gestor') {
                throw new Error('Apenas gestores podem atualizar usuários');
            }
            
            if (!usuariosCadastrados[email]) {
                throw new Error('Usuário não encontrado');
            }
            
            // Atualizar dados
            usuariosCadastrados[email] = {
                ...usuariosCadastrados[email],
                ...dadosAtualizados
            };
            
            console.log(`✅ Usuário ${email} atualizado`);
            return { success: true, message: 'Usuário atualizado com sucesso!' };
            
        } catch (error) {
            console.error('❌ Erro ao atualizar usuário:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Reconhecimento facial (simulação)
    async reconhecimentoFacial(imagemData) {
        console.log('📸 Processando reconhecimento facial...');
        
        // Simulação de processamento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Lista de rostos "conhecidos" (simulação)
        const rostosConhecidos = [
            { nome: 'João Silva', email: 'joao.silva@empresa.com', confidence: 0.95 },
            { nome: 'Maria Santos', email: 'maria.santos@empresa.com', confidence: 0.92 },
            { nome: 'Carlos Oliveira', email: 'carlos.oliveira@empresa.com', confidence: 0.88 }
        ];
        
        // Escolher aleatoriamente (simulação)
        const usuarioReconhecido = rostosConhecidos[Math.floor(Math.random() * rostosConhecidos.length)];
        
        return {
            success: true,
            usuario: {
                id: 'user_facial_' + Date.now(),
                nome: usuarioReconhecido.nome,
                email: usuarioReconhecido.email
            },
            confidence: usuarioReconhecido.confidence,
            message: `Rosto reconhecido: ${usuarioReconhecido.nome}`
        };
    }
};

// Inicializar auth
document.addEventListener('DOMContentLoaded', function() {
    const usuario = auth.verificarLogin();
    if (usuario) {
        console.log(`👤 Usuário já logado: ${usuario.nome} (${usuario.tipo})`);
        
        // Se for gestor, mostrar menu especial
        if (usuario.tipo === 'gestor') {
            console.log('👔 Modo gestor ativado');
        }
    } else {
        console.log('🔐 Nenhum usuário logado');
    }
});

// Exportar
window.auth = auth;
