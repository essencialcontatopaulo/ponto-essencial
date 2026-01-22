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
    
    // Inicializar Firebase
    try {
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK não carregado');
        }
        
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        auth = firebase.auth();
        db = firebase.firestore();
        
        console.log('✅ Firebase inicializado para gestor');
        
        // Verificar autenticação
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                alert('Sessão expirada! Faça login novamente.');
                window.location.href = 'index.html';
                return;
            }
            
            // Carregar dados do sistema
            await carregarFuncionarios();
            await carregarRegistrosHoje();
            await carregarAjustesRecentes();
            await carregarEstatisticas();
            await carregarSelectFuncionarios();
            
            // Configurar data atual nos relatórios
            const mesAtual = new Date().toISOString().slice(0, 7);
            document.getElementById('mesRelatorio').value = mesAtual;
            document.getElementById('periodoRelatorio').value = mesAtual;
            document.getElementById('periodoAjustes').value = mesAtual;
            
            // Gerar relatório inicial
            gerarRelatorioMensal();
        });
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        alert('Erro de conexão com o servidor: ' + error.message);
    }
});

// ============ FUNÇÕES DE FUNCIONÁRIOS ============
async function carregarFuncionarios() {
    try {
        if (!db) throw new Error('Firestore não disponível');
        
        const snapshot = await db.collection('usuarios')
            .where('tipo', '==', 'funcionario')
            .orderBy('nome')
            .get();
        
        const tbody = document.querySelector('#tabelaFuncionarios tbody');
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
                                    onclick="excluirFuncionario('${doc.id}')">${func.status === 'inativo' ? 'Excluir' : 'Inativar'}</button>
                        </td>
                    </tr>
                `;
            });
        }
        
        tbody.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
        const tbody = document.querySelector('#tabelaFuncionarios tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Erro ao carregar funcionários</td></tr>';
        }
    }
}

async function cadastrarFuncionario() {
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
    
    // Validações
    if (!nome || !email || !senha || !cpf || !cargo || !departamento || !dataAdmissao) {
        alert('Preencha todos os campos obrigatórios (*)');
        return;
    }
    
    if (senha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    try {
        if (!auth || !db) {
            throw new Error('Sistema de autenticação não disponível');
        }
        
        console.log('Criando funcionário:', email);
        
        // 1. Criar usuário no Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
        const userId = userCredential.user.uid;
        
        console.log('Usuário criado no Auth:', userId);
        
        // 2. Criar no Firestore
        await db.collection('usuarios').doc(userId).set({
            nome: nome,
            email: email,
            cpf: cpf,
            cargo: cargo,
            departamento: departamento,
            salario: salario ? parseFloat(salario) : null,
            dataAdmissao: dataAdmissao,
            telefone: telefone || null,
            endereco: endereco || null,
            tipo: 'funcionario',
            status: 'ativo',
            dataCriacao: new Date().toISOString(),
            criadoPor: auth.currentUser ? auth.currentUser.uid : null
        });
        
        alert('✅ Funcionário cadastrado com sucesso!');
        closeModal('novoFuncionario');
        
        // Atualizar listas
        await carregarFuncionarios();
        await carregarSelectFuncionarios();
        await carregarEstatisticas();
        
    } catch (error) {
        console.error('Erro ao cadastrar funcionário:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            alert('Este e-mail já está cadastrado!');
        } else if (error.code === 'auth/weak-password') {
            alert('A senha deve ter pelo menos 6 caracteres!');
        } else if (error.code === 'auth/invalid-email') {
            alert('E-mail inválido!');
        } else {
            alert('Erro ao cadastrar funcionário: ' + error.message);
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
        await carregarFuncionarios();
        await carregarSelectFuncionarios();
        await carregarEstatisticas();
        
    } catch (error) {
        console.error('Erro ao atualizar funcionário:', error);
        alert('Erro ao atualizar funcionário: ' + error.message);
    }
}

async function excluirFuncionario(funcionarioId) {
    const confirmMessage = confirm('⚠️ Tem certeza que deseja INATIVAR este funcionário?\n\nEle não poderá mais acessar o sistema.');
    
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
            dataDesativacao: new Date().toISOString()
        });
        
        alert('✅ Funcionário marcado como inativo!');
        await carregarFuncionarios();
        await carregarEstatisticas();
        await carregarSelectFuncionarios();
        
    } catch (error) {
        console.error('Erro ao excluir funcionário:', error);
        alert('Erro ao processar funcionário: ' + error.message);
    }
}

// ============ FUNÇÕES DE AJUSTE DE HORAS ============
async function carregarFuncionariosParaAjuste() {
    try {
        if (!db) return;
        
        const snapshot = await db.collection('usuarios')
            .where('tipo', '==', 'funcionario')
            .where('status', '!=', 'inativo')
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

async function carregarHorarioAtual() {
    const funcionarioId = document.getElementById('funcionarioAjuste').value;
    const data = document.getElementById('dataAjuste').value;
    
    if (!funcionarioId || !data || !db) {
        const element = document.getElementById('horariosExistentes');
        if (element) {
            element.innerHTML = '<p style="color: #666;">Selecione um funcionário e data para ver os horários</p>';
        }
        return;
    }
    
    try {
        const snapshot = await db.collection('pontos')
            .where('funcionarioId', '==', funcionarioId)
            .where('data', '==', data)
            .orderBy('timestamp')
            .get();
        
        let html = '';
        
        if (snapshot.empty) {
            html = '<p style="color: #666;">Nenhum registro encontrado para esta data</p>';
        } else {
            html = '<ul style="margin: 0; padding-left: 20px;">';
            snapshot.forEach(doc => {
                const ponto = doc.data();
                const tipoEmoji = ponto.tipo === 'entrada' ? '📥' : '📤';
                html += `<li>${tipoEmoji} ${ponto.horario} - ${ponto.tipo === 'entrada' ? 'Entrada' : 'Saída'}</li>`;
            });
            html += '</ul>';
        }
        
        const element = document.getElementById('horariosExistentes');
        if (element) {
            element.innerHTML = html;
        }
        
    } catch (error) {
        console.error('Erro ao carregar horários:', error);
    }
}

async function salvarAjusteHoras() {
    if (!db || !auth || !auth.currentUser) {
        alert('Sistema não inicializado. Tente recarregar a página.');
        return;
    }
    
    const funcionarioId = document.getElementById('funcionarioAjuste').value;
    const funcionarioSelect = document.getElementById('funcionarioAjuste').selectedOptions[0];
    const funcionarioNome = funcionarioSelect ? funcionarioSelect.text.split(' - ')[0] : 'Funcionário';
    const data = document.getElementById('dataAjuste').value;
    const tipoAjuste = document.getElementById('tipoAjuste').value;
    const horaEntrada = document.getElementById('horaEntradaAjuste').value;
    const horaSaida = document.getElementById('horaSaidaAjuste').value;
    const totalHoras = document.getElementById('totalHorasAjuste').value;
    const justificativa = document.getElementById('justificativaAjuste').value.trim();
    
    // Validações
    if (!funcionarioId || !data || !tipoAjuste || !horaEntrada || !horaSaida || !justificativa) {
        alert('Preencha todos os campos obrigatórios!');
        return;
    }
    
    if (!totalHoras) {
        alert('Calcule as horas primeiro! Clique em "Calcular Horas"');
        return;
    }
    
    if (horaEntrada >= horaSaida) {
        alert('A hora de entrada deve ser anterior à hora de saída!');
        return;
    }
    
    try {
        const ajusteId = db.collection('ajustes_horas').doc().id;
        const userName = document.getElementById('userName').textContent;
        
        // 1. Criar registro de ajuste
        await db.collection('ajustes_horas').doc(ajusteId).set({
            id: ajusteId,
            funcionarioId: funcionarioId,
            funcionarioNome: funcionarioNome,
            data: data,
            tipo: tipoAjuste,
            horaEntrada: horaEntrada,
            horaSaida: horaSaida,
            totalHoras: totalHoras,
            justificativa: justificativa,
            status: 'aprovado',
            aprovadoPor: auth.currentUser.uid,
            aprovadoPorNome: userName,
            dataAprovacao: new Date().toISOString(),
            dataCriacao: new Date().toISOString()
        });
        
        // 2. Criar pontos de entrada e saída
        const entradaTimestamp = new Date(`${data}T${horaEntrada}:00`).getTime();
        const saidaTimestamp = new Date(`${data}T${horaSaida}:00`).getTime();
        
        // Ponto de entrada
        await db.collection('pontos').add({
            funcionarioId: funcionarioId,
            funcionarioNome: funcionarioNome,
            tipo: 'entrada',
            horario: horaEntrada,
            data: data,
            timestamp: entradaTimestamp,
            localizacao: { latitude: null, longitude: null },
            metodo: 'ajuste_gestor',
            ajusteId: ajusteId,
            observacao: `Ajuste gestor: ${justificativa}`,
            dataRegistro: new Date().toISOString()
        });
        
        // Ponto de saída
        await db.collection('pontos').add({
            funcionarioId: funcionarioId,
            funcionarioNome: funcionarioNome,
            tipo: 'saida',
            horario: horaSaida,
            data: data,
            timestamp: saidaTimestamp,
            localizacao: { latitude: null, longitude: null },
            metodo: 'ajuste_gestor',
            ajusteId: ajusteId,
            observacao: `Ajuste gestor: ${justificativa}`,
            dataRegistro: new Date().toISOString()
        });
        
        alert('✅ Horas ajustadas com sucesso!\nForam criados registros de entrada e saída.');
        
        // Limpar formulário
        document.getElementById('formAjusteHoras').reset();
        document.getElementById('totalHorasAjuste').value = '';
        closeModal('ajusteHoras');
        
        // Atualizar listas
        await carregarRegistrosHoje();
        await carregarAjustesRecentes();
        await carregarEstatisticas();
        
    } catch (error) {
        console.error('Erro ao salvar ajuste:', error);
        alert('Erro ao salvar ajuste de horas: ' + error.message);
    }
}

async function carregarAjustesRecentes() {
    try {
        if (!db) return;
        
        const snapshot = await db.collection('ajustes_horas')
            .orderBy('dataCriacao', 'desc')
            .limit(5)
            .get();
        
        const tbody = document.querySelector('#tabelaAjustes tbody');
        if (!tbody) return;
        
        let html = '';
        
        if (snapshot.empty) {
            html = '<tr><td colspan="4" style="text-align: center;">Nenhum ajuste recente</td></tr>';
        } else {
            snapshot.forEach(doc => {
                const ajuste = doc.data();
                const dataBR = new Date(ajuste.data).toLocaleDateString('pt-BR');
                const tipoTexto = {
                    'trabalho_externo': 'Trab. Externo',
                    'hora_extra': 'Hora Extra',
                    'falta_justificada': 'Falta Justif.',
                    'atraso_justificado': 'Atraso Justif.',
                    'compensacao': 'Compensação'
                }[ajuste.tipo] || ajuste.tipo;
                
                html += `
                    <tr>
                        <td>${ajuste.funcionarioNome}</td>
                        <td>${dataBR}</td>
                        <td>${ajuste.totalHoras}h</td>
                        <td><span class="status-badge status-presente">Aprovado</span></td>
                    </tr>
                `;
            });
        }
        
        tbody.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar ajustes:', error);
    }
}

// ============ FUNÇÕES DE REGISTROS E ESTATÍSTICAS ============
async function carregarRegistrosHoje() {
    try {
        if (!db) return;
        
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
                        <td>${reg.funcionarioNome}</td>
                        <td>${reg.horario}</td>
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

async function carregarEstatisticas() {
    try {
        if (!db) return;
        
        // Total de funcionários ativos
        const funcionariosSnapshot = await db.collection('usuarios')
            .where('tipo', '==', 'funcionario')
            .where('status', '==', 'ativo')
            .get();
        
        const totalFuncionarios = funcionariosSnapshot.size;
        
        // Registros de hoje
        const hoje = new Date().toISOString().split('T')[0];
        const registrosSnapshot = await db.collection('pontos')
            .where('data', '==', hoje)
            .get();
        
        const totalRegistrosHoje = registrosSnapshot.size;
        
        // Ajustes do mês
        const hojeObj = new Date();
        const primeiroDiaMes = new Date(hojeObj.getFullYear(), hojeObj.getMonth(), 1).toISOString().split('T')[0];
        const ultimoDiaMes = new Date(hojeObj.getFullYear(), hojeObj.getMonth() + 1, 0).toISOString().split('T')[0];
        
        const ajustesSnapshot = await db.collection('ajustes_horas')
            .where('data', '>=', primeiroDiaMes)
            .where('data', '<=', ultimoDiaMes)
            .get();
        
        const totalAjustesMes = ajustesSnapshot.size;
        
        // Atualizar interface
        const statsGrid = document.getElementById('statsGrid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">${totalFuncionarios}</div>
                    <div class="stat-label">Funcionários Ativos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalRegistrosHoje}</div>
                    <div class="stat-label">Registros Hoje</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalAjustesMes}</div>
                    <div class="stat-label">Ajustes/Mês</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${Math.round(totalRegistrosHoje / 2)}</div>
                    <div class="stat-label">Pessoas Hoje</div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

async function carregarSelectFuncionarios() {
    try {
        if (!db) return;
        
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

// ============ FUNÇÕES DE RELATÓRIOS ============
async function gerarRelatorioMensal() {
    const mesAno = document.getElementById('mesRelatorio')?.value;
    if (!mesAno || !db) return;
    
    try {
        const [ano, mes] = mesAno.split('-');
        const primeiroDia = `${ano}-${mes}-01`;
        const ultimoDia = new Date(ano, mes, 0).toISOString().split('T')[0];
        
        // Buscar registros do mês
        const pontosSnapshot = await db.collection('pontos')
            .where('data', '>=', primeiroDia)
            .where('data', '<=', ultimoDia)
            .get();
        
        // Buscar ajustes do mês
        const ajustesSnapshot = await db.collection('ajustes_horas')
            .where('data', '>=', primeiroDia)
            .where('data', '<=', ultimoDia)
            .get();
        
        let totalRegistros = pontosSnapshot.size;
        let entradas = 0;
        let saidas = 0;
        let totalAjustes = ajustesSnapshot.size;
        
        pontosSnapshot.forEach(doc => {
            const reg = doc.data();
            if (reg.tipo === 'entrada') entradas++;
            if (reg.tipo === 'saida') saidas++;
        });
        
        const mesNome = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        
        const contentDiv = document.getElementById('relatorioMensalContent');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div style="background: #e8f5e8; padding: 20px; border-radius: 10px;">
                    <h4>Relatório de ${mesNome}</h4>
                    <div class="stats-grid" style="margin-top: 15px;">
                        <div class="stat-card">
                            <div class="stat-number">${totalRegistros}</div>
                            <div class="stat-label">Total Registros</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${entradas}</div>
                            <div class="stat-label">Entradas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${saidas}</div>
                            <div class="stat-label">Saídas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${totalAjustes}</div>
                            <div class="stat-label">Ajustes</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Erro ao gerar relatório mensal:', error);
    }
}

async function gerarRelatorioAjustes() {
    const mesAno = document.getElementById('periodoAjustes')?.value;
    if (!mesAno || !db) return;
    
    try {
        const [ano, mes] = mesAno.split('-');
        const primeiroDia = `${ano}-${mes}-01`;
        const ultimoDia = new Date(ano, mes, 0).toISOString().split('T')[0];
        
        const snapshot = await db.collection('ajustes_horas')
            .where('data', '>=', primeiroDia)
            .where('data', '<=', ultimoDia)
            .orderBy('data')
            .get();
        
        let html = '<h4>Ajustes do Período</h4>';
        
        if (snapshot.empty) {
            html += '<p style="color: #666;">Nenhum ajuste encontrado</p>';
        } else {
            html += '<table style="width: 100%; margin-top: 15px;">';
            html += '<thead><tr><th>Data</th><th>Funcionário</th><th>Horas</th><th>Tipo</th></tr></thead><tbody>';
            
            snapshot.forEach(doc => {
                const ajuste = doc.data();
                const dataBR = new Date(ajuste.data).toLocaleDateString('pt-BR');
                html += `
                    <tr>
                        <td>${dataBR}</td>
                        <td>${ajuste.funcionarioNome}</td>
                        <td>${ajuste.totalHoras}h</td>
                        <td>${ajuste.tipo}</td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
        }
        
        const contentDiv = document.getElementById('relatorioAjustesContent');
        if (contentDiv) {
            contentDiv.innerHTML = html;
        }
        
    } catch (error) {
        console.error('Erro ao gerar relatório de ajustes:', error);
    }
}

// ============ FUNÇÕES AUXILIARES ============
function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('usuario_logado');
        localStorage.removeItem('funcionario_logado');
        
        if (auth) {
            auth.signOut();
        }
        
        window.location.href = 'index.html';
    }
}

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
