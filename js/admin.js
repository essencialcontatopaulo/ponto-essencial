// Aplicação do Administrador
const adminApp = {
    // Estado
    estado: {
        usuario: null,
        funcionarios: [],
        registrosHoje: [],
        justificativas: [],
        painelAtivo: 'dashboard'
    },

    // Inicialização
    init: function() {
        console.log('Aplicação do administrador iniciando...');
        
        // Verificar autenticação
        this.verificarAutenticacao();
        
        // Configurar eventos
        this.configurarEventos();
        
        // Carregar dashboard inicial
        this.carregarPainel('dashboard');
    },

    // Verificar autenticação
    verificarAutenticacao: function() {
        firebaseAuth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'index.html';
                return;
            }
            
            this.estado.usuario = user;
            
            // Verificar se é realmente admin
            const isAdmin = await this.verificarAdmin(user.uid);
            if (!isAdmin) {
                alert('Acesso restrito a administradores');
                window.location.href = 'funcionario.html';
                return;
            }
            
            this.atualizarUsuarioInfo();
        });
    },

    // Verificar se é admin
    verificarAdmin: async function(userId) {
        try {
            const userDoc = await firebaseDb.collection('usuarios').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                return userData.tipo === 'admin';
            }
            return false;
        } catch (error) {
            console.error('Erro ao verificar admin:', error);
            return false;
        }
    },

    // Atualizar informações do usuário
    atualizarUsuarioInfo: async function() {
        try {
            const userDoc = await firebaseDb.collection('usuarios')
                .doc(this.estado.usuario.uid)
                .get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const initials = userData.nome.split(' ').map(n => n[0]).join('').toUpperCase();
                document.getElementById('userInitials').textContent = initials.substring(0, 2);
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
        }
    },

    // Configurar eventos
    configurarEventos: function() {
        // Formulário de funcionário
        const form = document.getElementById('employeeForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.cadastrarFuncionario();
            });
        }
        
        // Data de admissão padrão
        const admissionInput = document.getElementById('employeeAdmission');
        if (admissionInput) {
            const hoje = new Date().toISOString().split('T')[0];
            admissionInput.value = hoje;
        }
    },

    // Carregar painel
    carregarPainel: function(painel) {
        this.estado.painelAtivo = painel;
        
        // Atualizar UI
        this.atualizarPainelAtivo();
        
        // Carregar conteúdo específico
        switch(painel) {
            case 'dashboard':
                this.carregarDashboard();
                break;
            case 'funcionarios':
                this.carregarFuncionarios();
                break;
            case 'registros':
                this.carregarRegistrosDia();
                break;
            case 'justificativas':
                this.carregarJustificativas();
                break;
            case 'relatorios':
                this.carregarRelatorios();
                break;
            case 'meu-ponto':
                this.carregarMeuPonto();
                break;
        }
    },

    // Atualizar indicador de painel ativo
    atualizarPainelAtivo: function() {
        // Implementar highlight do botão ativo se necessário
    },

    // Carregar dashboard
    carregarDashboard: async function() {
        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="card">
                <div class="card-title">Dashboard - Visão Geral</div>
                <div class="d-flex gap-20" style="flex-wrap: wrap;">
                    <div class="card" style="flex: 1; min-width: 250px;">
                        <h3>Funcionários</h3>
                        <div class="loading-container" id="totalEmployees">
                            <div class="loading-spinner"></div>
                        </div>
                    </div>
                    <div class="card" style="flex: 1; min-width: 250px;">
                        <h3>Presentes Hoje</h3>
                        <div class="loading-container" id="presentToday">
                            <div class="loading-spinner"></div>
                        </div>
                    </div>
                    <div class="card" style="flex: 1; min-width: 250px;">
                        <h3>Justificativas Pendentes</h3>
                        <div class="loading-container" id="pendingJustifications">
                            <div class="loading-spinner"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">Ações Rápidas</div>
                <div class="action-buttons">
                    <button onclick="adminApp.abrirModalFuncionario()" class="btn-primary">
                        Cadastrar Novo Funcionário
                    </button>
                    <button onclick="adminApp.carregarPainel('justificativas')" class="btn-secondary">
                        Ver Justificativas Pendentes
                    </button>
                    <button onclick="adminApp.gerarRelatorioMensal()" class="btn-secondary">
                        Gerar Relatório Mensal
                    </button>
                </div>
            </div>
        `;
        
        // Carregar dados
        await this.carregarDadosDashboard();
    },

    // Carregar dados do dashboard
    carregarDadosDashboard: async function() {
        try {
            // Total de funcionários
            const employeesSnapshot = await firebaseDb.collection('usuarios')
                .where('ativo', '==', true)
                .get();
            
            document.getElementById('totalEmployees').innerHTML = 
                `<h2 style="color: var(--verde-principal);">${employeesSnapshot.size}</h2><p>funcionários ativos</p>`;
            
            // Presentes hoje
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const amanha = new Date(hoje);
            amanha.setDate(amanha.getDate() + 1);
            
            const registrosSnapshot = await firebaseDb.collection('registros')
                .where('data', '>=', hoje)
                .where('data', '<', amanha)
                .where('tipo', '==', 'entrada')
                .get();
            
            const presentes = new Set();
            registrosSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.userId) {
                    presentes.add(data.userId);
                }
            });
            
            document.getElementById('presentToday').innerHTML = 
                `<h2 style="color: var(--verde-principal);">${presentes.size}</h2><p>funcionários presentes</p>`;
            
            // Justificativas pendentes
            const justificativasSnapshot = await firebaseDb.collection('justificativas')
                .where('status', '==', 'pendente')
                .get();
            
            document.getElementById('pendingJustifications').innerHTML = 
                `<h2 style="color: var(--verde-principal);">${justificativasSnapshot.size}</h2><p>justificativas pendentes</p>`;
                
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
        }
    },

    // Carregar funcionários
    carregarFuncionarios: async function() {
        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="card">
                <div class="card-title">Gerenciar Funcionários</div>
                
                <div class="form-group">
                    <div class="d-flex gap-10">
                        <input type="text" class="form-control" id="searchEmployee" 
                               placeholder="Buscar por nome, matrícula ou departamento...">
                        <button onclick="adminApp.abrirModalFuncionario()" class="btn-primary">
                            Novo Funcionário
                        </button>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="data-table" id="employeesTable">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Matrícula</th>
                                <th>Departamento</th>
                                <th>Cargo</th>
                                <th>Tipo</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Dados serão carregados aqui -->
                        </tbody>
                    </table>
                </div>
                
                <div class="loading-container" id="loadingEmployees">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;
        
        // Configurar busca
        const searchInput = document.getElementById('searchEmployee');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filtrarFuncionarios(e.target.value);
            });
        }
        
        // Carregar lista de funcionários
        await this.carregarListaFuncionarios();
    },

    // Carregar lista de funcionários
    carregarListaFuncionarios: async function() {
        try {
            const loadingElement = document.getElementById('loadingEmployees');
            const tableBody = document.querySelector('#employeesTable tbody');
            
            if (loadingElement) loadingElement.style.display = 'flex';
            if (tableBody) tableBody.innerHTML = '';
            
            const querySnapshot = await firebaseDb.collection('usuarios').get();
            
            this.estado.funcionarios = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                this.estado.funcionarios.push({
                    id: doc.id,
                    ...data
                });
            });
            
            // Ordenar por nome
            this.estado.funcionarios.sort((a, b) => a.nome.localeCompare(b.nome));
            
            // Preencher tabela
            this.atualizarTabelaFuncionarios();
            
            // Esconder loading
            if (loadingElement) loadingElement.style.display = 'none';
            
        } catch (error) {
            console.error('Erro ao carregar funcionários:', error);
            const loadingElement = document.getElementById('loadingEmployees');
            if (loadingElement) {
                loadingElement.innerHTML = '<p class="error-message">Erro ao carregar funcionários</p>';
            }
        }
    },

    // Atualizar tabela de funcionários
    atualizarTabelaFuncionarios: function(funcionarios = this.estado.funcionarios) {
        const tableBody = document.querySelector('#employeesTable tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        funcionarios.forEach(funcionario => {
            const row = document.createElement('tr');
            
            // Tipo de badge
            const tipoBadge = funcionario.tipo === 'admin' ? 
                '<span class="badge badge-warning">Admin</span>' : 
                '<span class="badge badge-info">Funcionário</span>';
            
            // Status badge
            const statusBadge = funcionario.ativo ?
                '<span class="badge badge-success">Ativo</span>' :
                '<span class="badge badge-danger">Inativo</span>';
            
            row.innerHTML = `
                <td>${funcionario.nome || 'Não informado'}</td>
                <td>${funcionario.matricula || 'Não informada'}</td>
                <td>${funcionario.departamento || 'Não informado'}</td>
                <td>${funcionario.cargo || 'Não informado'}</td>
                <td>${tipoBadge}</td>
                <td>${statusBadge}</td>
                <td>
                    <button onclick="adminApp.editarFuncionario('${funcionario.id}')" 
                            class="btn-secondary btn-sm">Editar</button>
                    <button onclick="adminApp.alterarStatusFuncionario('${funcionario.id}', ${!funcionario.ativo})" 
                            class="btn-secondary btn-sm">
                        ${funcionario.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    },

    // Filtrar funcionários
    filtrarFuncionarios: function(termo) {
        if (!termo) {
            this.atualizarTabelaFuncionarios();
            return;
        }
        
        const termoLower = termo.toLowerCase();
        const filtrados = this.estado.funcionarios.filter(funcionario => {
            return (
                (funcionario.nome && funcionario.nome.toLowerCase().includes(termoLower)) ||
                (funcionario.matricula && funcionario.matricula.toLowerCase().includes(termoLower)) ||
                (funcionario.departamento && funcionario.departamento.toLowerCase().includes(termoLower)) ||
                (funcionario.cargo && funcionario.cargo.toLowerCase().includes(termoLower))
            );
        });
        
        this.atualizarTabelaFuncionarios(filtrados);
    },

    // Abrir modal de funcionário
    abrirModalFuncionario: function(funcionarioId = null) {
        const modal = document.getElementById('employeeModal');
        const title = document.getElementById('modalEmployeeTitle');
        const form = document.getElementById('employeeForm');
        const submitBtn = document.getElementById('employeeSubmitBtn');
        
        if (funcionarioId) {
            // Modo edição
            title.textContent = 'Editar Funcionário';
            submitBtn.textContent = 'Atualizar Funcionário';
            
            // Preencher dados do funcionário
            const funcionario = this.estado.funcionarios.find(f => f.id === funcionarioId);
            if (funcionario) {
                document.getElementById('employeeName').value = funcionario.nome || '';
                document.getElementById('employeeEmail').value = funcionario.email || '';
                document.getElementById('employeeMatricula').value = funcionario.matricula || '';
                document.getElementById('employeeDepartment').value = funcionario.departamento || '';
                document.getElementById('employeePosition').value = funcionario.cargo || '';
                document.getElementById('employeeType').value = funcionario.tipo || 'funcionario';
                document.getElementById('employeeAdmission').value = funcionario.dataAdmissao || '';
                document.getElementById('employeeActive').checked = funcionario.ativo !== false;
                
                // Desabilitar e-mail e senha na edição
                document.getElementById('employeeEmail').disabled = true;
                document.getElementById('employeePassword').disabled = true;
            }
        } else {
            // Modo cadastro
            title.textContent = 'Cadastrar Funcionário';
            submitBtn.textContent = 'Cadastrar Funcionário';
            form.reset();
            
            // Habilitar campos
            document.getElementById('employeeEmail').disabled = false;
            document.getElementById('employeePassword').disabled = false;
            
            // Data padrão
            const hoje = new Date().toISOString().split('T')[0];
            document.getElementById('employeeAdmission').value = hoje;
        }
        
        modal.style.display = 'flex';
    },

    // Fechar modal de funcionário
    fecharModalFuncionario: function() {
        const modal = document.getElementById('employeeModal');
        modal.style.display = 'none';
        document.getElementById('employeeForm').reset();
    },

    // Cadastrar/editar funcionário
    cadastrarFuncionario: async function() {
        try {
            const formData = {
                nome: document.getElementById('employeeName').value,
                email: document.getElementById('employeeEmail').value,
                password: document.getElementById('employeePassword').value,
                matricula: document.getElementById('employeeMatricula').value,
                departamento: document.getElementById('employeeDepartment').value,
                cargo: document.getElementById('employeePosition').value,
                tipo: document.getElementById('employeeType').value,
                dataAdmissao: document.getElementById('employeeAdmission').value,
                ativo: document.getElementById('employeeActive').checked
            };
            
            // Validações
            if (!formData.nome || !formData.email || !formData.matricula || 
                !formData.departamento || !formData.cargo || !formData.dataAdmissao) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            const submitBtn = document.getElementById('employeeSubmitBtn');
            const isEditing = submitBtn.textContent === 'Atualizar Funcionário';
            
            if (isEditing) {
                // Buscar funcionário existente
                const funcionario = this.estado.funcionarios.find(f => f.email === formData.email);
                if (funcionario) {
                    await firebaseDb.collection('usuarios').doc(funcionario.id).update({
                        nome: formData.nome,
                        matricula: formData.matricula,
                        departamento: formData.departamento,
                        cargo: formData.cargo,
                        tipo: formData.tipo,
                        dataAdmissao: formData.dataAdmissao,
                        ativo: formData.ativo,
                        atualizadoEm: new Date(),
                        atualizadoPor: this.estado.usuario.uid
                    });
                    
                    alert('Funcionário atualizado com sucesso!');
                }
            } else {
                // Verificar se e-mail já existe
                const emailExists = this.estado.funcionarios.some(f => f.email === formData.email);
                if (emailExists) {
                    alert('Este e-mail já está cadastrado no sistema.');
                    return;
                }
                
                // Validar senha
                if (!formData.password || formData.password.length < 6) {
                    alert('A senha deve ter no mínimo 6 caracteres.');
                    return;
                }
                
                // Criar usuário no Authentication
                const userCredential = await firebaseAuth.createUserWithEmailAndPassword(
                    formData.email,
                    formData.password
                );
                
                // Enviar e-mail de redefinição de senha
                await firebaseAuth.sendPasswordResetEmail(formData.email);
                
                // Criar perfil no Firestore
                await firebaseDb.collection('usuarios').doc(userCredential.user.uid).set({
                    nome: formData.nome,
                    email: formData.email,
                    tipo: formData.tipo,
                    matricula: formData.matricula,
                    departamento: formData.departamento,
                    cargo: formData.cargo,
                    dataAdmissao: formData.dataAdmissao,
                    ativo: formData.ativo,
                    dataCadastro: new Date(),
                    criadoPor: this.estado.usuario.uid,
                    jornadaPadrao: {
                        segundaSexta: { entrada: "08:00", saida: "18:00", intervalo: 2 },
                        sabado: { entrada: "08:00", saida: "13:00", intervalo: 0 }
                    }
                });
                
                alert('Funcionário cadastrado com sucesso! Um e-mail foi enviado para definir a senha.');
            }
            
            // Fechar modal e recarregar lista
            this.fecharModalFuncionario();
            await this.carregarListaFuncionarios();
            
        } catch (error) {
            console.error('Erro ao cadastrar funcionário:', error);
            alert('Erro: ' + error.message);
        }
    },

    // Editar funcionário
    editarFuncionario: function(funcionarioId) {
        this.abrirModalFuncionario(funcionarioId);
    },

    // Alterar status do funcionário
    alterarStatusFuncionario: async function(funcionarioId, novoStatus) {
        const confirmar = confirm(`Tem certeza que deseja ${novoStatus ? 'ativar' : 'desativar'} este funcionário?`);
        if (!confirmar) return;
        
        try {
            await firebaseDb.collection('usuarios').doc(funcionarioId).update({
                ativo: novoStatus,
                atualizadoEm: new Date(),
                atualizadoPor: this.estado.usuario.uid
            });
            
            alert(`Funcionário ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
            await this.carregarListaFuncionarios();
            
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            alert('Erro ao alterar status do funcionário: ' + error.message);
        }
    },

    // Carregar registros do dia
    carregarRegistrosDia: async function() {
        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="card">
                <div class="card-title">Registros do Dia - ${app.formatDate(new Date())}</div>
                
                <div class="form-group">
                    <div class="d-flex gap-10">
                        <select class="form-select" id="filterDepartment" onchange="adminApp.filtrarRegistros()">
                            <option value="">Todos os departamentos</option>
                            <option value="administrativo">Administrativo</option>
                            <option value="vendas">Vendas</option>
                            <option value="producao">Produção</option>
                            <option value="rh">Recursos Humanos</option>
                            <option value="ti">Tecnologia da Informação</option>
                        </select>
                        <button onclick="adminApp.exportarRegistros()" class="btn-secondary">
                            Exportar CSV
                        </button>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="data-table" id="registrosTable">
                        <thead>
                            <tr>
                                <th>Funcionário</th>
                                <th>Departamento</th>
                                <th>Entrada</th>
                                <th>Saída</th>
                                <th>Horas</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Dados serão carregados aqui -->
                        </tbody>
                    </table>
                </div>
                
                <div class="loading-container" id="loadingRegistros">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;
        
        await this.carregarDadosRegistros();
    },

    // Carregar dados dos registros
    carregarDadosRegistros: async function() {
        try {
            const loadingElement = document.getElementById('loadingRegistros');
            const tableBody = document.querySelector('#registrosTable tbody');
            
            if (loadingElement) loadingElement.style.display = 'flex';
            if (tableBody) tableBody.innerHTML = '';
            
            // Buscar todos os funcionários
            const funcionariosSnapshot = await firebaseDb.collection('usuarios').get();
            const funcionariosMap = new Map();
            
            funcionariosSnapshot.forEach(doc => {
                const data = doc.data();
                funcionariosMap.set(doc.id, {
                    nome: data.nome,
                    departamento: data.departamento,
                    cargo: data.cargo
                });
            });
            
            // Buscar registros do dia
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const amanha = new Date(hoje);
            amanha.setDate(amanha.getDate() + 1);
            
            const registrosSnapshot = await firebaseDb.collection('registros')
                .where('data', '>=', hoje)
                .where('data', '<', amanha)
                .orderBy('data', 'desc')
                .get();
            
            // Agrupar registros por usuário
            const registrosPorUsuario = new Map();
            
            registrosSnapshot.forEach(doc => {
                const data = doc.data();
                const userId = data.userId;
                
                if (!registrosPorUsuario.has(userId)) {
                    registrosPorUsuario.set(userId, {
                        entrada: null,
                        saida: null,
                        horas: 0
                    });
                }
                
                const userRegistros = registrosPorUsuario.get(userId);
                
                if (data.tipo === 'entrada') {
                    userRegistros.entrada = data.data;
                } else if (data.tipo === 'saida') {
                    userRegistros.saida = data.data;
                    if (userRegistros.entrada) {
                        userRegistros.horas = app.calcularHorasTrabalhadas(
                            userRegistros.entrada,
                            data.data
                        );
                    }
                }
            });
            
            // Preencher tabela
            tableBody.innerHTML = '';
            let totalHoras = 0;
            
            for (const [userId, registros] of registrosPorUsuario.entries()) {
                const funcionario = funcionariosMap.get(userId);
                if (!funcionario) continue;
                
                const entradaFormatada = registros.entrada ? 
                    app.formatTime(registros.entrada) : '--:--';
                const saidaFormatada = registros.saida ? 
                    app.formatTime(registros.saida) : '--:--';
                const horasFormatadas = registros.horas > 0 ? 
                    registros.horas.toFixed(2) + 'h' : '--';
                
                let status = 'Ausente';
                let statusClass = 'badge-danger';
                
                if (registros.entrada && registros.saida) {
                    status = 'Completo';
                    statusClass = 'badge-success';
                    totalHoras += registros.horas;
                } else if (registros.entrada && !registros.saida) {
                    status = 'Em trabalho';
                    statusClass = 'badge-warning';
                }
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${funcionario.nome}</td>
                    <td>${funcionario.departamento}</td>
                    <td>${entradaFormatada}</td>
                    <td>${saidaFormatada}</td>
                    <td>${horasFormatadas}</td>
                    <td><span class="badge ${statusClass}">${status}</span></td>
                `;
                
                tableBody.appendChild(row);
            }
            
            // Adicionar linha de total
            const totalRow = document.createElement('tr');
            totalRow.style.fontWeight = 'bold';
            totalRow.style.backgroundColor = 'var(--verde-bg)';
            totalRow.innerHTML = `
                <td colspan="4" class="text-right">Total de horas trabalhadas:</td>
                <td>${totalHoras.toFixed(2)}h</td>
                <td></td>
            `;
            tableBody.appendChild(totalRow);
            
            // Esconder loading
            if (loadingElement) loadingElement.style.display = 'none';
            
        } catch (error) {
            console.error('Erro ao carregar registros:', error);
            const loadingElement = document.getElementById('loadingRegistros');
            if (loadingElement) {
                loadingElement.innerHTML = '<p class="error-message">Erro ao carregar registros</p>';
            }
        }
    },

    // Carregar justificativas
    carregarJustificativas: async function() {
        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="card">
                <div class="card-title">Justificativas Pendentes</div>
                
                <div class="table-container">
                    <table class="data-table" id="justificationsTable">
                        <thead>
                            <tr>
                                <th>Funcionário</th>
                                <th>Data</th>
                                <th>Tipo</th>
                                <th>Descrição</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Dados serão carregados aqui -->
                        </tbody>
                    </table>
                </div>
                
                <div class="loading-container" id="loadingJustifications">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;
        
        await this.carregarDadosJustificativas();
    },

    // Carregar dados das justificativas
    carregarDadosJustificativas: async function() {
        try {
            const loadingElement = document.getElementById('loadingJustifications');
            const tableBody = document.querySelector('#justificationsTable tbody');
            
            if (loadingElement) loadingElement.style.display = 'flex';
            if (tableBody) tableBody.innerHTML = '';
            
            // Buscar justificativas pendentes
            const querySnapshot = await firebaseDb.collection('justificativas')
                .where('status', '==', 'pendente')
                .orderBy('dataRegistro', 'desc')
                .get();
            
            this.estado.justificativas = [];
            querySnapshot.forEach((doc) => {
                this.estado.justificativas.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Buscar informações dos funcionários
            const funcionariosMap = new Map();
            const funcionariosSnapshot = await firebaseDb.collection('usuarios').get();
            
            funcionariosSnapshot.forEach(doc => {
                const data = doc.data();
                funcionariosMap.set(doc.id, data.nome);
            });
            
            // Preencher tabela
            tableBody.innerHTML = '';
            
            this.estado.justificativas.forEach(justificativa => {
                const funcionarioNome = funcionariosMap.get(justificativa.usuarioId) || justificativa.usuarioId;
                const dataFormatada = app.formatDate(justificativa.data);
                
                // Traduzir tipo
                const tipoMap = {
                    'esqueceu_entrada': 'Esqueceu entrada',
                    'esqueceu_saida': 'Esqueceu saída',
                    'falta': 'Falta',
                    'atraso': 'Atraso',
                    'doenca': 'Doença/Atestado',
                    'outro': 'Outro'
                };
                
                const tipoTraduzido = tipoMap[justificativa.tipo] || justificativa.tipo;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${funcionarioNome}</td>
                    <td>${dataFormatada}</td>
                    <td>${tipoTraduzido}</td>
                    <td title="${justificativa.descricao}">
                        ${justificativa.descricao.substring(0, 50)}${justificativa.descricao.length > 50 ? '...' : ''}
                    </td>
                    <td>
                        <span class="badge badge-warning">Pendente</span>
                    </td>
                    <td>
                        <button onclick="adminApp.analisarJustificativa('${justificativa.id}', 'aprovada')" 
                                class="btn-secondary btn-sm">Aprovar</button>
                        <button onclick="adminApp.analisarJustificativa('${justificativa.id}', 'rejeitada')" 
                                class="btn-danger btn-sm">Rejeitar</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Esconder loading
            if (loadingElement) loadingElement.style.display = 'none';
            
        } catch (error) {
            console.error('Erro ao carregar justificativas:', error);
            const loadingElement = document.getElementById('loadingJustifications');
            if (loadingElement) {
                loadingElement.innerHTML = '<p class="error-message">Erro ao carregar justificativas</p>';
            }
        }
    },

    // Analisar justificativa
    analisarJustificativa: async function(justificativaId, status) {
        const observacao = prompt('Digite uma observação para a análise:');
        if (observacao === null) return; // Usuário cancelou
        
        try {
            await firebaseDb.collection('justificativas').doc(justificativaId).update({
                status: status,
                observacaoAdmin: observacao,
                analisadoPor: this.estado.usuario.uid,
                dataAnalise: new Date()
            });
            
            alert(`Justificativa ${status === 'aprovada' ? 'aprovada' : 'rejeitada'} com sucesso!`);
            await this.carregarDadosJustificativas();
            
        } catch (error) {
            console.error('Erro ao analisar justificativa:', error);
            alert('Erro ao analisar justificativa: ' + error.message);
        }
    },

    // Carregar relatórios
    carregarRelatorios: function() {
        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="card">
                <div class="card-title">Relatórios</div>
                
                <div class="action-buttons">
                    <button onclick="adminApp.gerarRelatorioMensal()" class="btn-primary">
                        Relatório Mensal
                    </button>
                    <button onclick="adminApp.gerarRelatorioAnual()" class="btn-primary">
                        Relatório Anual
                    </button>
                    <button onclick="adminApp.gerarRelatorioHorasExtras()" class="btn-secondary">
                        Horas Extras
                    </button>
                    <button onclick="adminApp.gerarRelatorioFaltas()" class="btn-secondary">
                        Faltas e Atrasos
                    </button>
                </div>
                
                <div class="form-group mt-30">
                    <h4>Relatório Personalizado</h4>
                    <div class="d-flex gap-10" style="flex-wrap: wrap;">
                        <div>
                            <label class="form-label">Data Inicial</label>
                            <input type="date" class="form-control" id="reportStartDate">
                        </div>
                        <div>
                            <label class="form-label">Data Final</label>
                            <input type="date" class="form-control" id="reportEndDate">
                        </div>
                        <div>
                            <label class="form-label">Funcionário</label>
                            <select class="form-select" id="reportEmployee">
                                <option value="">Todos os funcionários</option>
                                <!-- Opções serão preenchidas via JavaScript -->
                            </select>
                        </div>
                        <div style="align-self: flex-end;">
                            <button onclick="adminApp.gerarRelatorioPersonalizado()" 
                                    class="btn-primary">Gerar</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card" id="reportResult" style="display: none;">
                <div class="card-title">Resultado do Relatório</div>
                <div id="reportContent">
                    <!-- Conteúdo do relatório será exibido aqui -->
                </div>
            </div>
        `;
        
        // Preencher lista de funcionários
        this.preencherSelectFuncionarios();
        
        // Configurar datas padrão
        const hoje = new Date();
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        
        document.getElementById('reportStartDate').value = primeiroDiaMes.toISOString().split('T')[0];
        document.getElementById('reportEndDate').value = hoje.toISOString().split('T')[0];
    },

    // Preencher select de funcionários
    preencherSelectFuncionarios: async function() {
        const select = document.getElementById('reportEmployee');
        if (!select) return;
        
        try {
            const snapshot = await firebaseDb.collection('usuarios')
                .where('ativo', '==', true)
                .get();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = `${data.nome} - ${data.departamento}`;
                select.appendChild(option);
            });
            
        } catch (error) {
            console.error('Erro ao carregar funcionários:', error);
        }
    },

    // Gerar relatório mensal
    gerarRelatorioMensal: function() {
        const hoje = new Date();
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        
        document.getElementById('reportStartDate').value = primeiroDiaMes.toISOString().split('T')[0];
        document.getElementById('reportEndDate').value = ultimoDiaMes.toISOString().split('T')[0];
        document.getElementById('reportEmployee').value = '';
        
        this.gerarRelatorioPersonalizado();
    },

    // Gerar relatório personalizado
    gerarRelatorioPersonalizado: async function() {
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        const employeeId = document.getElementById('reportEmployee').value;
        
        if (!startDate || !endDate) {
            alert('Por favor, selecione as datas inicial e final.');
            return;
        }
        
        try {
            const reportResult = document.getElementById('reportResult');
            const reportContent = document.getElementById('reportContent');
            
            reportResult.style.display = 'block';
            reportContent.innerHTML = '<div class="loading-spinner"></div>';
            
            // Implementar lógica do relatório
            // Esta é uma implementação básica - você pode expandir conforme necessário
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simular processamento
            
            reportContent.innerHTML = `
                <h4>Relatório: ${startDate} até ${endDate}</h4>
                <p>Funcionário: ${employeeId ? 'Selecionado' : 'Todos'}</p>
                <p>Este é um exemplo de relatório. Implemente a lógica específica para seus dados.</p>
                
                <div class="table-container mt-20">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Funcionário</th>
                                <th>Dias Trabalhados</th>
                                <th>Horas Totais</th>
                                <th>Horas Extras</th>
                                <th>Faltas</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Exemplo Funcionário</td>
                                <td>22</td>
                                <td>176h</td>
                                <td>8h</td>
                                <td>0</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-20">
                    <button onclick="window.print()" class="btn-primary">Imprimir Relatório</button>
                    <button onclick="adminApp.exportarRelatorio()" class="btn-secondary">Exportar CSV</button>
                </div>
            `;
            
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            document.getElementById('reportContent').innerHTML = 
                '<p class="error-message">Erro ao gerar relatório: ' + error.message + '</p>';
        }
    },

    // Carregar meu ponto
    carregarMeuPonto: function() {
        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="card">
                <div class="card-title">Meu Registro de Ponto</div>
                
                <div class="action-buttons">
                    <button onclick="adminApp.registrarMinhaEntrada()" class="btn-primary">
                        Registrar Minha Entrada
                    </button>
                    <button onclick="adminApp.registrarMinhaSaida()" class="btn-primary">
                        Registrar Minha Saída
                    </button>
                </div>
                
                <div class="location-info mt-20">
                    <span class="location-icon">📍</span>
                    <span id="adminLocationText">Obtendo localização...</span>
                </div>
                
                <div class="mt-30">
                    <h4>Meus Registros Recentes</h4>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Entrada</th>
                                    <th>Saída</th>
                                    <th>Horas</th>
                                </tr>
                            </thead>
                            <tbody id="adminRegistros">
                                <!-- Dados serão carregados aqui -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Obter localização
        this.obterLocalizacaoAdmin();
        
        // Carregar registros do admin
        this.carregarMeusRegistros();
    },

    // Obter localização do admin
    obterLocalizacaoAdmin: function() {
        if (!navigator.geolocation) {
            document.getElementById('adminLocationText').textContent = 'Geolocalização não suportada';
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                document.getElementById('adminLocationText').textContent = 
                    `Localizado (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`;
            },
            (error) => {
                console.error('Erro ao obter localização:', error);
                document.getElementById('adminLocationText').textContent = 
                    'Localização não disponível';
            }
        );
    },

    // Registrar minha entrada
    registrarMinhaEntrada: async function() {
        try {
            if (!navigator.geolocation) {
                alert('Geolocalização não disponível');
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const agora = new Date();
                    const registro = {
                        userId: this.estado.usuario.uid,
                        tipo: 'entrada',
                        data: agora,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        localizacao: {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        },
                        dispositivo: navigator.userAgent,
                        status: 'pendente'
                    };
                    
                    await firebaseDb.collection('registros').add(registro);
                    alert('Entrada registrada com sucesso!');
                    this.carregarMeusRegistros();
                },
                (error) => {
                    alert('Erro ao obter localização: ' + error.message);
                }
            );
            
        } catch (error) {
            console.error('Erro ao registrar entrada:', error);
            alert('Erro ao registrar entrada: ' + error.message);
        }
    },

    // Carregar meus registros
    carregarMeusRegistros: async function() {
        try {
            const tableBody = document.getElementById('adminRegistros');
            if (!tableBody) return;
            
            // Buscar registros dos últimos 7 dias
            const seteDiasAtras = new Date();
            seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
            
            const querySnapshot = await firebaseDb.collection('registros')
                .where('userId', '==', this.estado.usuario.uid)
                .where('data', '>=', seteDiasAtras)
                .orderBy('data', 'desc')
                .get();
            
            // Processar registros
            const registrosPorDia = new Map();
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const dataDate = data.data.toDate ? data.data.toDate() : new Date(data.data);
                const dataKey = dataDate.toISOString().split('T')[0];
                
                if (!registrosPorDia.has(dataKey)) {
                    registrosPorDia.set(dataKey, {
                        entrada: null,
                        saida: null,
                        horas: 0
                    });
                }
                
                const dia = registrosPorDia.get(dataKey);
                if (data.tipo === 'entrada') {
                    dia.entrada = dataDate;
                } else if (data.tipo === 'saida') {
                    dia.saida = dataDate;
                    if (dia.entrada) {
                        dia.horas = app.calcularHorasTrabalhadas(dia.entrada, dataDate);
                    }
                }
            });
            
            // Preencher tabela
            tableBody.innerHTML = '';
            const diasArray = Array.from(registrosPorDia.entries()).sort((a, b) => b[0].localeCompare(a[0]));
            
            diasArray.forEach(([dataKey, registros]) => {
                const dataObj = new Date(dataKey);
                const entradaFormatada = registros.entrada ? app.formatTime(registros.entrada) : '--:--';
                const saidaFormatada = registros.saida ? app.formatTime(registros.saida) : '--:--';
                const horasFormatadas = registros.horas > 0 ? registros.horas.toFixed(2) + 'h' : '--';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${app.formatDate(dataObj, 'short')}</td>
                    <td>${entradaFormatada}</td>
                    <td>${saidaFormatada}</td>
                    <td>${horasFormatadas}</td>
                `;
                tableBody.appendChild(row);
            });
            
        } catch (error) {
            console.error('Erro ao carregar registros:', error);
        }
    },

    // Logout
    logout: async function() {
        try {
            await firebaseAuth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erro no logout:', error);
            alert('Erro ao sair: ' + error.message);
        }
    }
};

// Exportar para uso global
window.adminApp = adminApp;
