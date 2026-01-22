// js/gestor.js - VERSÃO CORRIGIDA
console.log('=== GESTOR.JS CARREGADO ===');

let db = null;
let auth = null;
let usuarioAtual = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔧 Iniciando Painel do Gestor...');
    
    // 1. Verificar login local
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado') || 'null');
    
    if (!usuarioLogado || usuarioLogado.tipo !== 'gestor') {
        alert('❌ Acesso restrito a gestores!');
        window.location.href = 'index.html';
        return;
    }
    
    usuarioAtual = usuarioLogado;
    console.log('👤 Usuário logado:', usuarioAtual);
    
    // 2. Configurar interface
    document.getElementById('userName').textContent = usuarioLogado.nome || 'Gestor';
    document.getElementById('userCargo').textContent = 
        `${usuarioLogado.cargo || 'Gestor'} - ${usuarioLogado.departamento || 'Administração'}`;
    
    // 3. Inicializar Firebase
    try {
        console.log('⚙️ Inicializando Firebase...');
        
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK não carregado');
        }
        
        // Verificar se já foi inicializado
        if (!firebase.apps.length) {
            // Configuração DIRETA - mesma do firebase-config.js
            const config = {
                apiKey: "AIzaSyBNe8ryLTnb-IJBzR9CCmJ9Ljg_lawzTtk",
                authDomain: "essencial-print-5a753.firebaseapp.com",
                projectId: "essencial-print-5a753",
                storageBucket: "essencial-print-5a753.firebasestorage.app",
                messagingSenderId: "544082416072",
                appId: "1:544082416072:web:85d3c8549b25158284f0fd"
            };
            
            firebase.initializeApp(config);
            console.log('✅ Firebase inicializado');
        }
        
        // Obter referências
        auth = firebase.auth();
        db = firebase.firestore();
        
        console.log('✅ Serviços obtidos');
        
        // 4. Verificar autenticação no Firebase
        auth.onAuthStateChanged((user) => {
            if (!user) {
                console.log('⚠️ Nenhum usuário autenticado no Firebase Auth');
                console.log('💡 Funcionará com autenticação local + regras do Firestore');
            } else {
                console.log('✅ Usuário autenticado no Firebase:', user.email);
            }
            
            // 5. Carregar dados iniciais
            carregarDadosIniciais();
            
            // 6. Configurar datas
            const hoje = new Date().toISOString().split('T')[0];
            const mesAtual = new Date().toISOString().slice(0, 7);
            
            if (document.getElementById('dataAdmissao')) {
                document.getElementById('dataAdmissao').value = hoje;
            }
            if (document.getElementById('dataAjuste')) {
                document.getElementById('dataAjuste').value = hoje;
            }
            
            // Relatórios
            ['mesRelatorio', 'periodoRelatorio', 'periodoAjustes'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = mesAtual;
            });
            
            gerarRelatorioMensal();
        });
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        alert('Erro ao conectar com o servidor: ' + error.message);
    }
});

// ============ FUNÇÃO PRINCIPAL DE CADASTRO ============
async function cadastrarFuncionario() {
    console.log('🚀 INICIANDO CADASTRO DE FUNCIONÁRIO');
    
    // 1. Coletar dados do formulário
    const dados = {
        nome: document.getElementById('nomeFuncionario').value.trim(),
        email: document.getElementById('emailFuncionario').value.trim().toLowerCase(),
        senha: document.getElementById('senhaFuncionario').value,
        cpf: document.getElementById('cpfFuncionario').value.trim().replace(/\D/g, ''),
        cargo: document.getElementById('cargoFuncionario').value,
        departamento: document.getElementById('departamentoFuncionario').value,
        dataAdmissao: document.getElementById('dataAdmissao').value,
        salario: document.getElementById('salarioFuncionario').value,
        telefone: document.getElementById('telefoneFuncionario').value.trim().replace(/\D/g, ''),
        endereco: document.getElementById('enderecoFuncionario').value.trim()
    };
    
    console.log('📋 Dados coletados:', dados);
    
    // 2. Validações
    const camposObrigatorios = ['nome', 'email', 'senha', 'cpf', 'cargo', 'departamento', 'dataAdmissao'];
    const camposFaltantes = camposObrigatorios.filter(campo => !dados[campo]);
    
    if (camposFaltantes.length > 0) {
        alert(`Preencha os campos obrigatórios: ${camposFaltantes.join(', ')}`);
        return;
    }
    
    if (dados.senha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    if (dados.cpf.length !== 11) {
        alert('CPF deve ter 11 dígitos');
        return;
    }
    
    // 3. Preparar interface (loading)
    const btnCadastrar = document.querySelector('#formNovoFuncionario .btn-success');
    const textoOriginal = btnCadastrar.textContent;
    btnCadastrar.textContent = 'Cadastrando...';
    btnCadastrar.disabled = true;
    
    try {
        // 4. VERIFICAR SE AUTH E DB ESTÃO DISPONÍVEIS
        if (!auth || !db) {
            throw new Error('Sistema não inicializado. Recarregue a página.');
        }
        
        console.log('🔐 Etapa 1/2: Criando no Firebase Authentication...');
        
        // 5. CRIAR USUÁRIO NO FIREBASE AUTHENTICATION
        const userCredential = await auth.createUserWithEmailAndPassword(dados.email, dados.senha);
        const userId = userCredential.user.uid;
        
        console.log('✅ Auth criado! ID:', userId);
        
        // 6. Atualizar perfil do usuário
        await userCredential.user.updateProfile({
            displayName: dados.nome
        });
        
        console.log('✅ Perfil atualizado');
        
        // 7. PREPARAR DADOS PARA FIRESTORE
        const funcionarioFirestore = {
            id: userId,
            nome: dados.nome,
            email: dados.email,
            cpf: dados.cpf,
            cargo: dados.cargo,
            departamento: dados.departamento,
            dataAdmissao: dados.dataAdmissao,
            tipo: 'funcionario',
            status: 'ativo',
            dataCriacao: new Date().toISOString(),
            criadoPor: usuarioAtual?.id || 'gestor',
            criadoPorNome: usuarioAtual?.nome || 'Gestor'
        };
        
        // Adicionar campos opcionais
        if (dados.salario && !isNaN(parseFloat(dados.salario))) {
            funcionarioFirestore.salario = parseFloat(dados.salario);
        }
        
        if (dados.telefone) {
            funcionarioFirestore.telefone = dados.telefone;
        }
        
        if (dados.endereco) {
            funcionarioFirestore.endereco = dados.endereco;
        }
        
        console.log('📝 Etapa 2/2: Salvando no Firestore...', funcionarioFirestore);
        
        // 8. SALVAR NO FIRESTORE
        await db.collection('usuarios').doc(userId).set(funcionarioFirestore);
        
        console.log('✅ Firestore salvo!');
        
        // 9. SUCESSO!
        alert(`✅ FUNCIONÁRIO CADASTRADO COM SUCESSO!\n\n📋 Dados:\n• Nome: ${dados.nome}\n• Email: ${dados.email}\n• Cargo: ${dados.cargo}\n• Departamento: ${dados.departamento}\n• Senha: ${dados.senha}\n\n⚠️ Anote a senha para entregar ao funcionário!`);
        
        // 10. Limpar formulário
        document.getElementById('formNovoFuncionario').reset();
        document.getElementById('dataAdmissao').value = new Date().toISOString().split('T')[0];
        
        // 11. Fechar modal
        setTimeout(() => {
            closeModal('novoFuncionario');
            
            // 12. Atualizar listas
            carregarFuncionarios();
            carregarSelectFuncionarios();
            carregarEstatisticas();
            carregarFuncionariosParaAjuste();
            
            console.log('🔄 Interface atualizada');
        }, 1000);
        
    } catch (error) {
        console.error('❌ ERRO NO CADASTRO:', error);
        
        // TRATAMENTO DETALHADO DE ERROS
        let mensagemUsuario = '';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                mensagemUsuario = '❌ Este email já está cadastrado no sistema.';
                break;
                
            case 'auth/invalid-email':
                mensagemUsuario = '❌ Formato de email inválido.';
                break;
                
            case 'auth/operation-not-allowed':
                mensagemUsuario = '❌ Cadastro por email/senha não está habilitado.\n\n👉 Acesse Firebase Console > Authentication > Sign-in method\n👉 Habilite "Email/Password"';
                break;
                
            case 'auth/weak-password':
                mensagemUsuario = '❌ Senha muito fraca. Use pelo menos 6 caracteres.';
                break;
                
            case 'auth/network-request-failed':
                mensagemUsuario = '❌ Erro de conexão. Verifique sua internet.';
                break;
                
            case 'permission-denied':
                mensagemUsuario = '❌ Permissão negada.\n\n👉 Verifique as regras do Firestore\n👉 Verifique se está autenticado';
                break;
                
            default:
                mensagemUsuario = `❌ Erro: ${error.message || 'Desconhecido'}`;
        }
        
        alert(mensagemUsuario + '\n\nCódigo: ' + (error.code || 'N/A'));
        
        // Tentar limpar usuário criado no Auth (se aplicável)
        if (userCredential && userCredential.user) {
            try {
                await userCredential.user.delete();
                console.log('🗑️ Usuário removido do Auth após erro');
            } catch (deleteError) {
                console.error('Erro ao remover usuário:', deleteError);
            }
        }
        
    } finally {
        // Restaurar botão
        if (btnCadastrar) {
            btnCadastrar.textContent = textoOriginal;
            btnCadastrar.disabled = false;
        }
    }
}

// ============ FUNÇÕES AUXILIARES (simplificadas) ============
async function carregarFuncionarios() {
    try {
        const snapshot = await db.collection('usuarios')
            .where('tipo', '==', 'funcionario')
            .orderBy('nome')
            .get();
        
        const tbody = document.querySelector('#tabelaFuncionarios tbody');
        let html = '';
        
        snapshot.forEach(doc => {
            const func = doc.data();
            html += `
                <tr>
                    <td>${func.nome}</td>
                    <td>${func.email}</td>
                    <td>${func.cargo}</td>
                    <td><span class="status-badge ${func.status === 'ativo' ? 'status-presente' : 'status-inativo'}">${func.status === 'ativo' ? 'Ativo' : 'Inativo'}</span></td>
                    <td>
                        <button class="btn btn-primary" onclick="abrirEditarFuncionario('${doc.id}')">Editar</button>
                        <button class="btn btn-danger" onclick="excluirFuncionario('${doc.id}')">${func.status === 'ativo' ? 'Inativar' : 'Excluir'}</button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html || '<tr><td colspan="5">Nenhum funcionário</td></tr>';
    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
    }
}

async function carregarSelectFuncionarios() {
    try {
        const snapshot = await db.collection('usuarios')
            .where('tipo', '==', 'funcionario')
            .where('status', '==', 'ativo')
            .orderBy('nome')
            .get();
        
        const select = document.getElementById('funcionarioRelatorio');
        if (select) {
            let html = '<option value="">Selecione</option>';
            snapshot.forEach(doc => {
                const func = doc.data();
                html += `<option value="${doc.id}">${func.nome} - ${func.cargo}</option>`;
            });
            select.innerHTML = html;
        }
    } catch (error) {
        console.error('Erro ao carregar select:', error);
    }
}

async function carregarFuncionariosParaAjuste() {
    try {
        const snapshot = await db.collection('usuarios')
            .where('tipo', '==', 'funcionario')
            .where('status', '==', 'ativo')
            .orderBy('nome')
            .get();
        
        const select = document.getElementById('funcionarioAjuste');
        if (select) {
            let html = '<option value="">Selecione</option>';
            snapshot.forEach(doc => {
                const func = doc.data();
                html += `<option value="${doc.id}">${func.nome} - ${func.cargo}</option>`;
            });
            select.innerHTML = html;
        }
    } catch (error) {
        console.error('Erro ao carregar para ajuste:', error);
    }
}

async function carregarEstatisticas() {
    try {
        const funcionariosSnapshot = await db.collection('usuarios')
            .where('tipo', '==', 'funcionario')
            .where('status', '==', 'ativo')
            .get();
        
        const hoje = new Date().toISOString().split('T')[0];
        const registrosSnapshot = await db.collection('pontos')
            .where('data', '==', hoje)
            .get();
        
        document.getElementById('statsGrid').innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${funcionariosSnapshot.size}</div>
                <div class="stat-label">Funcionários</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${registrosSnapshot.size}</div>
                <div class="stat-label">Registros Hoje</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">0</div>
                <div class="stat-label">Pendentes</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">0</div>
                <div class="stat-label">Ajustes/Mês</div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// ============ FUNÇÕES RESTANTES (mantenha as que já funcionam) ============
// ... [mantenha todas as outras funções do seu gestor.js original] ...

// Exportar funções para o HTML
window.cadastrarFuncionario = cadastrarFuncionario;
window.carregarFuncionarios = carregarFuncionarios;
// ... [exporte as outras funções] ...
