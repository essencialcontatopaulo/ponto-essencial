// js/gestor.js - VERSÃO COMPLETA E FUNCIONAL
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
    console.log('👤 Usuário logado:', usuarioAtual.nome);
    
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
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase inicializado');
        }
        
        // Obter referências
        auth = firebase.auth();
        db = firebase.firestore();
        
        console.log('✅ Serviços Firebase obtidos');
        
        // 4. Verificar autenticação no Firebase
        const user = auth.currentUser;
        if (!user) {
            console.log('⚠️ Nenhum usuário autenticado no Firebase');
            console.log('💡 Tentando recuperar sessão...');
            
            // Tentar recuperar sessão salva
            const savedUser = JSON.parse(localStorage.getItem('firebase_user') || 'null');
            if (savedUser) {
                console.log('🔄 Recuperando sessão salva...');
            } else {
                console.log('⚠️ Faça login novamente');
                window.location.href = 'index.html';
                return;
            }
        } else {
            console.log('✅ Usuário autenticado no Firebase:', user.email);
        }
        
        // 5. Carregar dados iniciais
        await carregarDadosIniciais();
        
        // 6. Configurar datas
        configurarDatas();
        
        // 7. Gerar relatório inicial
        gerarRelatorioMensal();
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        alert('Erro ao conectar com o servidor: ' + error.message);
    }
});

// ============ FUNÇÃO DE CADASTRO DE FUNCIONÁRIO ============
async function cadastrarFuncionario() {
    console.log('📝 Iniciando cadastro de funcionário...');
    
    // 1. Coletar dados
    const dados = {
        nome: document.getElementById('nomeFuncionario').value.trim(),
        email: document.getElementById('emailFuncionario').value.trim().toLowerCase(),
        senha: document.getElementById('senhaFuncionario').value,
        cpf: document.getElementById('cpfFuncionario').value.trim().replace(/\D/g, ''),
        cargo: document.getElementById('cargoFuncionario').value,
        departamento: document.getElementById('departamentoFuncionario').value,
        dataAdmissao: document.getElementById('dataAdmissao').value
    };
    
    // 2. Validações
    if (!dados.nome || !dados.email || !dados.senha || !dados.cargo || !dados.departamento || !dados.dataAdmissao) {
        alert('Preencha todos os campos obrigatórios (*)');
        return;
    }
    
    if (dados.senha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    if (dados.cpf && dados.cpf.length !== 11) {
        alert('CPF deve ter 11 dígitos');
        return;
    }
    
    // 3. Loading
    const btn = document.querySelector('#formNovoFuncionario .btn-success');
    const textoOriginal = btn.textContent;
    btn.textContent = 'Cadastrando...';
    btn.disabled = true;
    
    try {
        // 4. Verificar se Firebase está disponível
        if (!auth || !db) {
            throw new Error('Sistema não inicializado');
        }
        
        console.log('🔐 Etapa 1: Criando no Firebase Auth...');
        
        // 5. Criar usuário no Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(dados.email, dados.senha);
        const userId = userCredential.user.uid;
        
        console.log('✅ Usuário criado no Auth. ID:', userId);
        
        // 6. Atualizar perfil do usuário
        await userCredential.user.updateProfile({
            displayName: dados.nome
        });
        
        console.log('✅ Perfil atualizado');
        
        // 7. Preparar dados para Firestore
        const funcionarioData = {
            id: userId,
            nome: dados.nome,
            email: dados.email,
            cpf: dados.cpf || '',
            cargo: dados.cargo,
            departamento: dados.departamento,
            dataAdmissao: dados.dataAdmissao,
            tipo: 'funcionario',
            status: 'ativo',
            dataCriacao: new Date().toISOString(),
            criadoPor: usuarioAtual?.id || 'gestor',
            criadoPorNome: usuarioAtual?.nome || 'Gestor'
        };
        
        // Campos opcionais
        const salario = document.getElementById('salarioFuncionario').value;
        const telefone = document.getElementById('telefoneFuncionario').value.trim();
        const endereco = document.getElementById('enderecoFuncionario').value.trim();
        
        if (salario && !isNaN(parseFloat(salario))) {
            funcionarioData.salario = parseFloat(salario);
        }
        
        if (telefone) {
            funcionarioData.telefone = telefone.replace(/\D/g, '');
        }
        
        if (endereco) {
            funcionarioData.endereco = endereco;
        }
        
        console.log('📝 Etapa 2: Salvando no Firestore...', funcionarioData);
        
        // 8. Salvar no Firestore
        await db.collection('usuarios').doc(userId).set(funcionarioData);
        
        console.log('✅ Funcionário salvo no Firestore!');
        
        // 9. SUCESSO
        alert(`✅ FUNCIONÁRIO CADASTRADO COM SUCESSO!\n\n📋 Dados:\n• Nome: ${dados.nome}\n• Email: ${dados.email}\n• Cargo: ${dados.cargo}\n• Senha: ${dados.senha}\n\n⚠️ Anote a senha para entregar ao funcionário!`);
        
        // 10. Limpar formulário
        document.getElementById('formNovoFuncionario').reset();
        configurarDatas();
        
        // 11. Fechar modal e atualizar
        setTimeout(() => {
            closeModal('novoFuncionario');
            
            // Atualizar listas
            carregarFuncionarios();
            carregarSelectFuncionarios();
            carregarFuncionariosParaAjuste();
            carregarEstatisticas();
            
            console.log('🔄 Interface atualizada');
        }, 1000);
        
    } catch (error) {
        console.error('❌ ERRO NO CADASTRO:', error);
        
        // Tratamento de erros
        let mensagem = '';
        
        if (error.code === 'auth/email-already-in-use') {
            mensagem = '❌ Este email já está cadastrado!';
        } else if (error.code === 'auth/invalid-email') {
            mensagem = '❌ Email inválido!';
        } else if (error.code === 'auth/operation-not-allowed') {
            mensagem = '❌ Cadastro por email não está habilitado. Habilite no Firebase Console.';
        } else if (error.code === 'auth/weak-password') {
            mensagem = '❌ Senha muito fraca. Use pelo menos 6 caracteres.';
        } else if (error.code === 'permission-denied') {
            mensagem = '❌ Permissão negada. Verifique as regras do Firestore.';
        } else {
            mensagem = 'Erro: ' + (error.message || 'Desconhecido');
        }
        
        alert(mensagem);
        
    } finally {
        // Restaurar botão
        if (btn) {
            btn.textContent = textoOriginal;
            btn.disabled = false;
        }
    }
}

// ============ FUNÇÕES DE CARREGAMENTO ============
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
        console.error('Erro ao carregar dados:', error);
    }
}

async function carregarFuncionarios() {
    try {
        console.log('📋 Carregando funcionários...');
        
        const snapshot = await db.collection('usuarios')
            .where('tipo', '==', 'funcionario')
            .orderBy('nome')
            .get();
        
        const tbody = document.querySelector('#tabelaFuncionarios tbody');
        if (!tbody) {
            console.error('Tabela de funcionários não encontrada');
            return;
        }
        
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
        console.log(`✅ ${snapshot.size} funcionários carregados`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar funcionários:', error);
        const tbody = document.querySelector('#tabelaFuncionarios tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Erro ao carregar funcionários</td></tr>';
        }
    }
}

async function carregarRegistrosHoje() {
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

async function carregarAjustesRecentes() {
    try {
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
                html += `
                    <tr>
                        <td>${ajuste.funcionarioNome || 'Desconhecido'}</td>
                        <td>${dataBR}</td>
                        <td>${ajuste.totalHoras || '0:00'}h</td>
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

async function carregarEstatisticas() {
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
                    <div class="stat-number">0</div>
                    <div class="stat-label">Pendentes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">0</div>
                    <div class="stat-label">Ajustes/Mês</div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
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

async function carregarFuncionariosParaAjuste() {
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

// ============ FUNÇÕES DE EDIÇÃO ============
async function abrirEditarFuncionario(funcionarioId) {
    try {
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
        `⚠️ Tem certeza que deseja INATIVAR este funcionário?\n\nNome: ${nomeFuncionario || 'Funcionário'}\n\nEle não poderá mais acessar o sistema.`
    );
    
    if (!confirmMessage) {
        return;
    }
    
    try {
        // Marcar como inativo
        await db.collection('usuarios').doc(funcionarioId).update({
            status: 'inativo',
            dataDesativacao: new Date().toISOString()
        });
        
        alert('✅ Funcionário marcado como inativo!');
        
        // Atualizar interface
        await carregarFuncionarios();
        await carregarEstatisticas();
        await carregarSelectFuncionarios();
        await carregarFuncionariosParaAjuste();
        
    } catch (error) {
        console.error('Erro ao excluir funcionário:', error);
        alert('Erro ao processar funcionário: ' + error.message);
    }
}

// ============ FUNÇÕES DE AJUSTE DE HORAS ============
async function carregarHorarioAtual() {
    const funcionarioId = document.getElementById('funcionarioAjuste').value;
    const data = document.getElementById('dataAjuste').value;
    
    if (!funcionarioId || !data) {
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
    if (!db) {
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
        const ajusteId = 'ajuste-' + Date.now();
        
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
            aprovadoPor: usuarioAtual?.id || 'gestor',
            aprovadoPorNome: usuarioAtual?.nome || 'Gestor',
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

// ============ FUNÇÕES DE RELATÓRIO ============
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
function configurarDatas() {
    const hoje = new Date().toISOString().split('T')[0];
    const mesAtual = new Date().toISOString().slice(0, 7);
    
    // Configurar datas nos formulários
    const elementosData = [
        { id: 'dataAdmissao', valor: hoje },
        { id: 'dataAjuste', valor: hoje },
        { id: 'mesRelatorio', valor: mesAtual },
        { id: 'periodoRelatorio', valor: mesAtual },
        { id: 'periodoAjustes', valor: mesAtual }
    ];
    
    elementosData.forEach(item => {
        const elemento = document.getElementById(item.id);
        if (elemento) {
            elemento.value = item.valor;
        }
    });
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('usuario_logado');
        localStorage.removeItem('firebase_user');
        
        if (auth) {
            auth.signOut();
        }
        
        window.location.href = 'index.html';
    }
}

function calcularHoras() {
    const entrada = document.getElementById('horaEntradaAjuste')?.value;
    const saida = document.getElementById('horaSaidaAjuste')?.value;
    
    if (!entrada || !saida) {
        if (document.getElementById('totalHorasAjuste')) {
            document.getElementById('totalHorasAjuste').value = '';
        }
        return;
    }
    
    const [h1, m1] = entrada.split(':').map(Number);
    const [h2, m2] = saida.split(':').map(Number);
    
    const entradaDate = new Date(0, 0, 0, h1, m1);
    const saidaDate = new Date(0, 0, 0, h2, m2);
    
    const diffMs = saidaDate - entradaDate;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    const horas = Math.floor(diffMinutes / 60);
    const minutos = diffMinutes % 60;
    
    if (document.getElementById('totalHorasAjuste')) {
        document.getElementById('totalHorasAjuste').value = `${horas}:${minutos.toString().padStart(2, '0')}`;
    }
}

function filtrarFuncionarios() {
    const input = document.getElementById('searchFuncionarios')?.value.toLowerCase() || '';
    const rows = document.querySelectorAll('#tabelaFuncionarios tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(input) ? '' : 'none';
    });
}

function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const tabElement = document.getElementById(tabName);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    if (event && event.target) {
        event.target.classList.add('active');
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
window.filtrarFuncionarios = filtrarFuncionarios;
window.openTab = openTab;
