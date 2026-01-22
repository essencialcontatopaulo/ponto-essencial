// js/gestor.js
// Script do Painel do Gestor - Essencial Print

let db = null;
let auth = null;
let usuarioAtual = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔧 Iniciando Painel do Gestor...');
    
    // Verificar se está logado como gestor
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado') || 'null');
    
    if (!usuarioLogado || usuarioLogado.tipo !== 'gestor') {
        alert('❌ Acesso restrito a gestores!');
        window.location.href = 'index.html';
        return;
    }
    
    usuarioAtual = usuarioLogado;
    
    // Configurar interface
    document.getElementById('userName').textContent = usuarioLogado.nome || 'Gestor';
    document.getElementById('userCargo').textContent = 
        `${usuarioLogado.cargo || 'Gestor'} - ${usuarioLogado.departamento || 'Administração'}`;
    
    // Inicializar Firebase - USANDO CONFIGURAÇÃO GLOBAL
    try {
        // Aguarda o carregamento do Firebase
        if (typeof firebase === 'undefined' || !window.firebaseDb) {
            console.log('⏳ Aguardando inicialização do Firebase...');
            
            // Tenta novamente após 1 segundo
            setTimeout(() => {
                if (window.firebaseDb && window.firebaseAuth) {
                    inicializarSistema();
                } else {
                    alert('❌ Firebase não carregado. Recarregue a página.');
                }
            }, 1000);
            
            return;
        }
        
        // Usa referências globais
        db = window.firebaseDb;
        auth = window.firebaseAuth;
        
        console.log('✅ Firebase inicializado para gestor');
        console.log('📊 Banco de dados:', db ? 'OK' : 'FALHO');
        console.log('🔐 Autenticação:', auth ? 'OK' : 'FALHO');
        
        // Testar conexão
        const conexaoOk = await window.testarConexaoFirebase();
        if (!conexaoOk) {
            alert('⚠️ Problema na conexão. Algumas funcionalidades podem não funcionar.');
        }
        
        inicializarSistema();
        
    } catch (error) {
        console.error('❌ Erro ao inicializar sistema:', error);
        alert('Erro de conexão: ' + error.message);
    }
});

function inicializarSistema() {
    // Verificar autenticação
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            console.warn('⚠️ Usuário não autenticado no Firebase');
            // Não redireciona imediatamente - pode ser gestor local
        }
        
        // Carregar dados do sistema
        carregarDadosIniciais();
        
        // Configurar data atual nos relatórios
        const mesAtual = new Date().toISOString().slice(0, 7);
        document.getElementById('mesRelatorio').value = mesAtual;
        document.getElementById('periodoRelatorio').value = mesAtual;
        document.getElementById('periodoAjustes').value = mesAtual;
        
        // Gerar relatório inicial
        gerarRelatorioMensal();
    });
}

async function carregarDadosIniciais() {
    try {
        await Promise.all([
            carregarFuncionarios(),
            carregarRegistrosHoje(),
            carregarAjustesRecentes(),
            carregarEstatisticas(),
            carregarSelectFuncionarios(),
            carregarFuncionariosParaAjuste()
        ]);
        console.log('✅ Dados iniciais carregados');
    } catch (error) {
        console.error('❌ Erro ao carregar dados iniciais:', error);
    }
}

// ============ FUNÇÕES DE FUNCIONÁRIOS ============
async function carregarFuncionarios() {
    try {
        if (!db) {
            console.error('Firestore não disponível');
            return;
        }
        
        console.log('📋 Carregando funcionários...');
        const snapshot = await db.collection('usuarios')
            .where('tipo', '==', 'funcionario')
            .orderBy('nome')
            .get();
        
        const tbody = document.querySelector('#tabelaFuncionarios tbody');
        if (!tbody) return;
        
        let html = '';
        
        if (snapshot.empty) {
            html = '<tr><td colspan="5" style="text-align: center;">Nenhum funcionário cadastrado</td></tr>';
        } else {
            snapshot.forEach(doc => {
                const func = doc.data();
                const statusClass = func.status === 'inativo' ? 'status-inativo' : 'status-presente';
                const statusText = func.status === 'inativo' ? 'Inativo' : 'Ativo';
                
                html += `
                    <tr>
                        <td>${func.nome || 'Não informado'}</td>
                        <td>${func.email || 'Não informado'}</td>
                        <td>${func.cargo || 'Não informado'}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>
                            <button class="btn btn-primary" style="padding: 5px 10px; font-size: 12px;" 
                                    onclick="abrirEditarFuncionario('${doc.id}')">Editar</button>
                            <button class="btn btn-danger" style="padding: 5px 10px; font-size: 12px;" 
                                    onclick="excluirFuncionario('${doc.id}', '${func.nome || ''}')">${func.status === 'inativo' ? 'Excluir' : 'Inativar'}</button>
                        </td>
                    </tr>
                `;
            });
        }
        
        tbody.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Erro ao carregar funcionários:', error);
        const tbody = document.querySelector('#tabelaFuncionarios tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Erro ao carregar funcionários</td></tr>';
        }
    }
}

async function cadastrarFuncionario() {
    console.log('👤 Iniciando cadastro de funcionário...');
    
    const nome = document.getElementById('nomeFuncionario').value.trim();
    const email = document.getElementById('emailFuncionario').value.trim();
    const senha = document.getElementById('senhaFuncionario').value;
    const cpf = document.getElementById('cpfFuncionario').value.trim();
    const cargo = document.getElementById('cargoFuncionario').value;
    const departamento = document.getElementById('departamentoFuncionario').value;
    const salario = document.getElementById('salarioFuncionario').value;
    const dataAdmissao = document.getElementById('dataAdmissao').value;
    const telefone = document.getElementById('telefoneFuncionario').value.trim();
    const endereco = document.getElementById('enderecoFuncionario').value.trim();
    
    // Validações básicas
    if (!nome || !email || !senha || !cpf || !cargo || !departamento || !dataAdmissao) {
        alert('⚠️ Preencha todos os campos obrigatórios (*)');
        return;
    }
    
    if (senha.length < 6) {
        alert('⚠️ A senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    if (!auth || !db) {
        alert('❌ Sistema não inicializado. Recarregue a página.');
        return;
    }
    
    // Desabilita botão para evitar múltiplos cliques
    const btnCadastrar = document.querySelector('#formNovoFuncionario .btn-success');
    const originalText = btnCadastrar.textContent;
    btnCadastrar.textContent = 'Cadastrando...';
    btnCadastrar.disabled = true;
    
    try {
        console.log('🔐 Criando usuário no Firebase Auth...');
        
        // 1. Criar usuário no Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
        const userId = userCredential.user.uid;
        
        console.log('✅ Usuário criado no Auth:', userId);
        
        // 2. Preparar dados do funcionário
        const funcionarioData = {
            id: userId,
            nome: nome,
            email: email,
            cpf: cpf.replace(/\D/g, ''), // Remove formatação do CPF
            cargo: cargo,
            departamento: departamento,
            dataAdmissao: dataAdmissao,
            tipo: 'funcionario',
            status: 'ativo',
            dataCriacao: new Date().toISOString(),
            criadoPor: usuarioAtual?.id || 'gestor_sistema'
        };
        
        // Campos opcionais
        if (salario && !isNaN(salario)) {
            funcionarioData.salario = parseFloat(salario);
        }
        
        if (telefone) {
            funcionarioData.telefone = telefone.replace(/\D/g, '');
        }
        
        if (endereco) {
            funcionarioData.endereco = endereco;
        }
        
        console.log('📝 Salvando dados no Firestore:', funcionarioData);
        
        // 3. Salvar no Firestore
        await db.collection('usuarios').doc(userId).set(funcionarioData);
        
        console.log('✅ Funcionário salvo no Firestore');
        
        // 4. Mostrar sucesso
        alert('✅ Funcionário cadastrado com sucesso!\n\nNome: ' + nome + '\nEmail: ' + email);
        
        // 5. Fechar modal e resetar formulário
        closeModal('novoFuncionario');
        
        // 6. Atualizar listas
        await carregarFuncionarios();
        await carregarSelectFuncionarios();
        await carregarEstatisticas();
        await carregarFuncionariosParaAjuste();
        
        console.log('🔄 Dados atualizados na interface');
        
    } catch (error) {
        console.error('❌ Erro detalhado:', error);
        
        // Tratamento detalhado de erros
        let mensagemErro = 'Erro ao cadastrar funcionário: ';
        
        if (error.code) {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    mensagemErro = '❌ Este e-mail já está cadastrado no sistema.';
                    break;
                case 'auth/invalid-email':
                    mensagemErro = '❌ E-mail inválido. Verifique o formato.';
                    break;
                case 'auth/operation-not-allowed':
                    mensagemErro = '❌ Cadastro por email/senha não está habilitado no Firebase.';
                    break;
                case 'auth/weak-password':
                    mensagemErro = '❌ Senha muito fraca. Use pelo menos 6 caracteres.';
                    break;
                case 'auth/network-request-failed':
                    mensagemErro = '❌ Erro de rede. Verifique sua conexão com a internet.';
                    break;
                case 'permission-denied':
                    mensagemErro = '❌ Permissão negada. Verifique as regras do Firestore.';
                    break;
                default:
                    mensagemErro += error.message || 'Erro desconhecido';
            }
        } else {
            mensagemErro += error.message || 'Erro desconhecido';
        }
        
        alert(mensagemErro);
        
    } finally {
        // Reabilita o botão
        if (btnCadastrar) {
            btnCadastrar.textContent = originalText;
            btnCadastrar.disabled = false;
        }
    }
}

async function abrirEditarFuncionario(funcionarioId) {
    try {
        if (!db) {
            alert('Banco de dados não disponível');
            return;
        }
        
        const doc = await db.collection('usuarios').doc(funcionarioId).get();
        
        if (!doc.exists) {
            alert('Funcionário não encontrado!');
            return;
        }
        
        const func = doc.data();
        
        // Preencher formulário
        document.getElementById('editarFuncionarioId').value = funcionarioId;
        document.getElementById('editarNome').value = func.nome || '';
        document.getElementById('editarEmail').value = func.email || '';
        document.getElementById('editarCpf').value = func.cpf || '';
        document.getElementById('editarCargo').value = func.cargo || '';
        document.getElementById('editarDepartamento').value = func.departamento || '';
        
        // Configurar status
        document.querySelectorAll('input[name="editarStatus"]').forEach(radio => {
            radio.checked = (radio.value === (func.status || 'ativo'));
        });
        
        openModal('editarFuncionario');
        
    } catch (error) {
        console.error('Erro ao abrir edição:', error);
        alert('Erro ao carregar dados do funcionário');
    }
}

async function atualizarFuncionario() {
    const funcionarioId = document.getElementById('editarFuncionarioId').value;
    const nome = document.getElementById('editarNome').value.trim();
    const email = document.getElementById('editarEmail').value.trim();
    const cpf = document.getElementById('editarCpf').value.trim();
    const cargo = document.getElementById('editarCargo').value.trim();
    const departamento = document.getElementById('editarDepartamento').value.trim();
    const status = document.querySelector('input[name="editarStatus"]:checked').value;
    
    if (!nome || !email || !cpf || !cargo || !departamento) {
        alert('Preencha todos os campos obrigatórios!');
        return;
    }
    
    if (!db) {
        alert('Banco de dados não disponível');
        return;
    }
    
    try {
        await db.collection('usuarios').doc(funcionarioId).update({
            nome: nome,
            email: email,
            cpf: cpf,
            cargo: cargo,
            departamento: departamento,
            status: status,
            dataAtualizacao: new Date().toISOString()
        });
        
        alert('✅ Funcionário atualizado com sucesso!');
        closeModal('editarFuncionario');
        
        // Atualizar listas
        await carregarFuncionarios();
        await carregarSelectFuncionarios();
        await carregarFuncionariosParaAjuste();
        await carregarEstatisticas();
        
    } catch (error) {
        console.error('Erro ao atualizar funcionário:', error);
        alert('Erro ao atualizar funcionário: ' + error.message);
    }
}

async function excluirFuncionario(funcionarioId, nomeFuncionario) {
    const confirmMessage = confirm(
        `⚠️ TEM CERTEZA que deseja INATIVAR o funcionário?\n\n` +
        `Nome: ${nomeFuncionario || 'Funcionário'}\n\n` +
        `Após inativar:\n` +
        `• Ele não poderá mais acessar o sistema\n` +
        `• Os registros históricos serão mantidos\n` +
        `• Você pode reativá-lo editando o status`
    );
    
    if (!confirmMessage) {
        return;
    }
    
    if (!db) {
        alert('Banco de dados não disponível');
        return;
    }
    
    try {
        // Marcar como inativo
        await db.collection('usuarios').doc(funcionarioId).update({
            status: 'inativo',
            dataDesativacao: new Date().toISOString(),
            desativadoPor: usuarioAtual?.id || 'gestor_sistema'
        });
        
        alert('✅ Funcionário marcado como inativo!');
        
        // Atualizar interface
        await carregarFuncionarios();
        await carregarEstatisticas();
        await carregarSelectFuncionarios();
        await carregarFuncionariosParaAjuste();
        
    } catch (error) {
        console.error('Erro ao inativar funcionário:', error);
        alert('Erro ao processar funcionário: ' + error.message);
    }
}

// ============ FUNÇÕES DE AJUSTE DE HORAS ============
async function carregarFuncionariosParaAjuste() {
    try {
        if (!db) return;
        
        const snapshot = await db.collection('usuarios')
            .where('tipo', '==', 'funcionario')
            .where('status', '==', 'ativo')
            .orderBy('nome')
            .get();
        
        const select = document.getElementById('funcionarioAjuste');
        if (!select) return;
        
        let html = '<option value="">Selecione um funcionário</option>';
        
        snapshot.forEach(doc => {
            const func = doc.data();
            html += `<option value="${doc.id}">${func.nome} - ${func.cargo}</option>`;
        });
        
        select.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar funcionários para ajuste:', error);
    }
}

// ... (mantenha o restante do código do gestor.js igual, desde carregarHorarioAtual() até o final)

// Exportar funções para uso global
window.cadastrarFuncionario = cadastrarFuncionario;
window.abrirEditarFuncionario = abrirEditarFuncionario;
window.atualizarFuncionario = atualizarFuncionario;
window.excluirFuncionario = excluirFuncionario;
window.salvarAjusteHoras = salvarAjusteHoras;
window.carregarHorarioAtual = carregarHorarioAtual;
window.calcularHoras = calcularHoras;
window.gerarRelatorioMensal = gerarRelatorioMensal;
window.gerarRelatorioAjustes = gerarRelatorioAjustes;
window.logout = logout;
window.carregarFuncionarios = carregarFuncionarios;
