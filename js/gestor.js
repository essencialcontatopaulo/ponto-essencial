// js/gestor.js - VERSÃO SIMPLIFICADA E FUNCIONAL
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
        window.location.href = 'index (5).html';
        return;
    }
    
    usuarioAtual = usuarioLogado;
    console.log('👤 Gestor logado:', usuarioAtual.nome);
    
    // 2. Configurar interface
    document.getElementById('userName').textContent = usuarioLogado.nome || 'Gestor';
    document.getElementById('userCargo').textContent = 
        `${usuarioLogado.cargo || 'Gestor'} - ${usuarioLogado.departamento || 'Administração'}`;
    
    // 3. Configurar datas
    const hoje = new Date().toISOString().split('T')[0];
    const mesAtual = new Date().toISOString().slice(0, 7);
    
    if (document.getElementById('dataAdmissao')) {
        document.getElementById('dataAdmissao').value = hoje;
    }
    if (document.getElementById('dataAjuste')) {
        document.getElementById('dataAjuste').value = hoje;
    }
    if (document.getElementById('mesRelatorio')) {
        document.getElementById('mesRelatorio').value = mesAtual;
        document.getElementById('periodoRelatorio').value = mesAtual;
        document.getElementById('periodoAjustes').value = mesAtual;
    }
    
    // 4. Inicializar Firebase
    await inicializarFirebase();
    
    // 5. Carregar dados
    if (db) {
        await carregarDadosIniciais();
    } else {
        alert('⚠️ Não foi possível conectar ao banco de dados. Alguns recursos podem estar limitados.');
    }
});

// Função para inicializar Firebase
async function inicializarFirebase() {
    try {
        console.log('⚙️ Inicializando Firebase...');
        
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK não carregado');
        }
        
        if (!firebaseConfig) {
            throw new Error('Configuração do Firebase não encontrada');
        }
        
        // Verificar se já foi inicializado
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase inicializado');
        }
        
        // Obter referências
        auth = firebase.auth();
        db = firebase.firestore();
        
        console.log('✅ Serviços Firebase obtidos');
        
        // Verificar autenticação
        const user = auth.currentUser;
        if (!user) {
            console.log('⚠️ Nenhum usuário autenticado no Firebase');
            
            // Tentar login com as credenciais salvas
            const savedUser = JSON.parse(localStorage.getItem('firebase_user') || 'null');
            if (savedUser) {
                console.log('🔄 Usando sessão salva');
            }
        } else {
            console.log('✅ Usuário autenticado no Firebase:', user.email);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao conectar ao Firebase:', error);
        db = null;
        return false;
    }
}

// Função para cadastrar funcionário (SIMPLIFICADA)
async function cadastrarFuncionario() {
    if (!db) {
        alert('❌ Sistema não conectado ao banco de dados.');
        return;
    }
    
    const dados = {
        nome: document.getElementById('nomeFuncionario').value.trim(),
        email: document.getElementById('emailFuncionario').value.trim().toLowerCase(),
        senha: document.getElementById('senhaFuncionario').value,
        cpf: document.getElementById('cpfFuncionario').value.trim(),
        cargo: document.getElementById('cargoFuncionario').value,
        departamento: document.getElementById('departamentoFuncionario').value,
        dataAdmissao: document.getElementById('dataAdmissao').value
    };
    
    // Validações
    if (!dados.nome || !dados.email || !dados.senha || !dados.cargo || !dados.departamento) {
        alert('Preencha todos os campos obrigatórios!');
        return;
    }
    
    if (dados.senha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    try {
        // 1. Criar usuário no Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(dados.email, dados.senha);
        const userId = userCredential.user.uid;
        
        // 2. Atualizar perfil
        await userCredential.user.updateProfile({
            displayName: dados.nome
        });
        
        // 3. Preparar dados para Firestore
        const funcionarioData = {
            id: userId,
            nome: dados.nome,
            email: dados.email,
            cpf: dados.cpf || '',
            cargo: dados.cargo,
            departamento: dados.departamento,
            dataAdmissao: dados.dataAdmissao || new Date().toISOString().split('T')[0],
            tipo: 'funcionario',
            status: 'ativo',
            dataCriacao: new Date().toISOString(),
            criadoPor: usuarioAtual?.id || 'gestor',
            criadoPorNome: usuarioAtual?.nome || 'Gestor'
        };
        
        // 4. Salvar no Firestore
        await db.collection('usuarios').doc(userId).set(funcionarioData);
        
        alert(`✅ FUNCIONÁRIO CADASTRADO COM SUCESSO!\n\n📋 Dados:\n• Nome: ${dados.nome}\n• Email: ${dados.email}\n• Cargo: ${dados.cargo}\n• Senha: ${dados.senha}`);
        
        // 5. Limpar e fechar
        document.getElementById('formNovoFuncionario').reset();
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('dataAdmissao').value = hoje;
        closeModal('novoFuncionario');
        
        // 6. Atualizar dados
        await carregarFuncionarios();
        await carregarSelectFuncionarios();
        await carregarFuncionariosParaAjuste();
        await carregarEstatisticas();
        
    } catch (error) {
        console.error('❌ Erro ao cadastrar funcionário:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            alert('❌ Este email já está cadastrado!');
        } else if (error.code === 'auth/invalid-email') {
            alert('❌ Email inválido!');
        } else if (error.code === 'auth/weak-password') {
            alert('❌ Senha muito fraca. Use pelo menos 6 caracteres.');
        } else {
            alert('Erro: ' + error.message);
        }
    }
}

// Carregar funcionários
async function carregarFuncionarios() {
    if (!db) return;
    
    try {
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
                const statusClass = func.status === 'ativo' ? 'status-presente' : 'status-inativo';
                const statusText = func.status === 'ativo' ? 'Ativo' : 'Inativo';
                
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
                                    onclick="excluirFuncionario('${doc.id}', '${func.nome || ''}')">${func.status === 'ativo' ? 'Inativar' : 'Excluir'}</button>
                        </td>
                    </tr>
                `;
            });
        }
        
        tbody.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Erro ao carregar funcionários:', error);
    }
}

// Carregar registros de hoje
async function carregarRegistrosHoje() {
    if (!db) return;
    
    try {
        const hoje = new Date().toISOString().split('T')[0];
        const snapshot = await db.collection('pontos')
            .where('data', '==', hoje)
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();
        
        const tbody = document.querySelector('#tabelaRegistros tbody');
        if (!tbody) return;
        
        let html = '';
        
        if (snapshot.empty) {
            html = '<tr><td colspan="4" style="text-align: center;">Nenhum registro hoje</td></tr>';
        } else {
            snapshot.forEach(doc => {
                const reg = doc.data();
                html += `
                    <tr>
                        <td>${reg.funcionarioNome || 'Desconhecido'}</td>
                        <td>${reg.horario || '--:--'}</td>
                        <td>${reg.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td>
                        <td>${reg.localizacao?.latitude ? '📍' : '--'}</td>
                    </tr>
                `;
            });
        }
        
        tbody.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar registros:', error);
    }
}

// Carregar estatísticas
async function carregarEstatisticas() {
    if (!db) return;
    
    try {
        // Total de funcionários ativos
        const funcionariosSnapshot = await db.collection('usuarios')
            .where('tipo', '==', 'funcionario')
            .where('status', '==', 'ativo')
            .get();
        
        // Registros de hoje
        const hoje = new Date().toISOString().split('T')[0];
        const registrosSnapshot = await db.collection('pontos')
            .where('data', '==', hoje)
            .get();
        
        // Ajustes do mês
        const hojeObj = new Date();
        const primeiroDiaMes = new Date(hojeObj.getFullYear(), hojeObj.getMonth(), 1).toISOString().split('T')[0];
        const ultimoDiaMes = new Date(hojeObj.getFullYear(), hojeObj.getMonth() + 1, 0).toISOString().split('T')[0];
        
        let totalAjustesMes = 0;
        try {
            const ajustesSnapshot = await db.collection('ajustes_horas')
                .where('data', '>=', primeiroDiaMes)
                .where('data', '<=', ultimoDiaMes)
                .get();
            totalAjustesMes = ajustesSnapshot.size;
        } catch (error) {
            console.log('Erro ao contar ajustes:', error);
        }
        
        // Justificativas pendentes
        let justificativasPendentes = 0;
        try {
            const justificativasSnapshot = await db.collection('justificativas')
                .where('status', '==', 'pendente')
                .get();
            justificativasPendentes = justificativasSnapshot.size;
        } catch (error) {
            console.log('Erro ao contar justificativas:', error);
        }
        
        // Atualizar interface
        const statsGrid = document.getElementById('statsGrid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">${funcionariosSnapshot.size}</div>
                    <div class="stat-label">Funcionários Ativos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${registrosSnapshot.size}</div>
                    <div class="stat-label">Registros Hoje</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${justificativasPendentes}</div>
                    <div class="stat-label">Justificativas Pendentes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalAjustesMes}</div>
                    <div class="stat-label">Ajustes/Mês</div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Carregar justificativas pendentes
async function carregarJustificativasPendentes() {
    if (!db) return;
    
    try {
        const snapshot = await db.collection('justificativas')
            .where('status', '==', 'pendente')
            .orderBy('dataEnvio', 'desc')
            .get();
        
        const container = document.getElementById('justificativasContainer');
        if (!container) return;
        
        let html = '';
        
        if (snapshot.empty) {
            html = '<p style="color: #666;">Nenhuma justificativa pendente</p>';
        } else {
            snapshot.forEach(doc => {
                const just = doc.data();
                const dataBR = new Date(just.data).toLocaleDateString('pt-BR');
                
                let tipoTexto = '';
                switch(just.tipo) {
                    case 'falta_justificada': tipoTexto = 'Falta Justificada'; break;
                    case 'atraso_justificado': tipoTexto = 'Atraso Justificado'; break;
                    case 'saida_antecipada': tipoTexto = 'Saída Antecipada'; break;
                    case 'ausencia_justificada': tipoTexto = 'Ausência Justificada'; break;
                    default: tipoTexto = just.tipo;
                }
                
                html += `
                    <div class="justificativa-item">
                        <div class="justificativa-header">
                            <div>
                                <strong>${just.funcionarioNome}</strong>
                                <span style="color: #666; font-size: 14px; margin-left: 10px;">${dataBR} - ${tipoTexto}</span>
                            </div>
                            <span class="status-badge status-pendente">Pendente</span>
                        </div>
                        
                        <p style="margin: 10px 0; color: #555;">${just.motivo}</p>
                        
                        ${just.hora ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Hora:</strong> ${just.hora}</p>` : ''}
                        
                        <div class="justificativa-actions">
                            <button class="btn btn-success" onclick="aprovarJustificativa('${doc.id}')" style="padding: 5px 10px; font-size: 12px;">
                                ✅ Aprovar
                            </button>
                            <button class="btn btn-danger" onclick="rejeitarJustificativa('${doc.id}')" style="padding: 5px 10px; font-size: 12px;">
                                ❌ Rejeitar
                            </button>
                            <button class="btn btn-primary" onclick="verDetalhesJustificativa('${doc.id}')" style="padding: 5px 10px; font-size: 12px;">
                                🔍 Detalhes
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar justificativas:', error);
    }
}

// Aprovar justificativa
async function aprovarJustificativa(justificativaId) {
    if (!db) return;
    
    if (!confirm('Aprovar esta justificativa?')) return;
    
    try {
        await db.collection('justificativas').doc(justificativaId).update({
            status: 'aprovada',
            dataAprovacao: new Date().toISOString(),
            aprovadoPor: usuarioAtual.id,
            aprovadoPorNome: usuarioAtual.nome
        });
        
        alert('✅ Justificativa aprovada com sucesso!');
        await carregarJustificativasPendentes();
        await carregarEstatisticas();
        
    } catch (error) {
        console.error('Erro ao aprovar justificativa:', error);
        alert('Erro ao aprovar justificativa: ' + error.message);
    }
}

// Rejeitar justificativa
async function rejeitarJustificativa(justificativaId) {
    if (!db) return;
    
    const motivoRejeicao = prompt('Informe o motivo da rejeição:');
    
    if (!motivoRejeicao || motivoRejeicao.trim() === '') {
        alert('É necessário informar um motivo para rejeitar.');
        return;
    }
    
    try {
        await db.collection('justificativas').doc(justificativaId).update({
            status: 'rejeitada',
            motivoRejeicao: motivoRejeicao.trim(),
            dataRejeicao: new Date().toISOString(),
            rejeitadoPor: usuarioAtual.id,
            rejeitadoPorNome: usuarioAtual.nome
        });
        
        alert('✅ Justificativa rejeitada!');
        await carregarJustificativasPendentes();
        await carregarEstatisticas();
        
    } catch (error) {
        console.error('Erro ao rejeitar justificativa:', error);
        alert('Erro ao rejeitar justificativa: ' + error.message);
    }
}

// Carregar dados iniciais
async function carregarDadosIniciais() {
    try {
        await Promise.all([
            carregarFuncionarios(),
            carregarRegistrosHoje(),
            carregarEstatisticas(),
            carregarJustificativasPendentes(),
            carregarFuncionariosParaAjuste(),
            carregarSelectFuncionarios()
        ]);
        console.log('✅ Dados iniciais carregados');
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// Funções auxiliares
async function carregarFuncionariosParaAjuste() {
    if (!db) return;
    
    try {
        const snapshot = await db.collection('usuarios')
            .where('tipo', '==', 'funcionario')
            .where('status', '==', 'ativo')
            .orderBy('nome')
            .get();
        
        const select = document.getElementById('funcionarioAjuste');
        if (select) {
            let html = '<option value="">Selecione um funcionário</option>';
            
            snapshot.forEach(doc => {
                const func = doc.data();
                html += `<option value="${doc.id}">${func.nome} - ${func.cargo}</option>`;
            });
            
            select.innerHTML = html;
        }
        
    } catch (error) {
        console.error('Erro ao carregar funcionários para ajuste:', error);
    }
}

async function carregarSelectFuncionarios() {
    if (!db) return;
    
    try {
        const snapshot = await db.collection('usuarios')
            .where('tipo', '==', 'funcionario')
            .where('status', '==', 'ativo')
            .orderBy('nome')
            .get();
        
        const select = document.getElementById('funcionarioRelatorio');
        if (select) {
            let html = '<option value="">Selecione um funcionário</option>';
            
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

// Exportar funções
window.cadastrarFuncionario = cadastrarFuncionario;
window.carregarFuncionarios = carregarFuncionarios;
window.carregarJustificativasPendentes = carregarJustificativasPendentes;
window.aprovarJustificativa = aprovarJustificativa;
window.rejeitarJustificativa = rejeitarJustificativa;
window.verDetalhesJustificativa = async function(id) {
    if (!db) return;
    
    try {
        const justDoc = await db.collection('justificativas').doc(id).get();
        if (justDoc.exists) {
            const just = justDoc.data();
            alert(`Detalhes:\n\nFuncionário: ${just.funcionarioNome}\nData: ${just.data}\nTipo: ${just.tipo}\nMotivo: ${just.motivo}`);
        }
    } catch (error) {
        console.error('Erro:', error);
    }
};
