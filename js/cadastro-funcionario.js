// Sistema de Cadastro de Funcionários para Administradores
const cadastroSystem = {
    // Estado
    estado: {
        funcionarios: [],
        filtroAtual: '',
        editandoId: null
    },

    // Inicializar
    init: function() {
        console.log('Sistema de cadastro iniciando...');
        
        // Verificar se é administrador
        this.verificarAdmin();
        
        // Configurar eventos
        this.configurarEventos();
        
        // Carregar lista de funcionários
        this.carregarFuncionarios();
    },

    // Verificar se usuário é administrador
    verificarAdmin: function() {
        if (!authSystem.isAdmin()) {
            alert('Acesso restrito a administradores!');
            window.location.href = 'funcionario.html';
        }
    },

    // Configurar eventos
    configurarEventos: function() {
        // Formulário de cadastro
        const form = document.getElementById('employeeForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarFuncionario();
            });
        }
        
        // Busca de funcionários
        const searchInput = document.getElementById('searchEmployee');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filtrarFuncionarios(e.target.value);
            });
        }
        
        // Botão de novo funcionário
        const novoBtn = document.getElementById('novoFuncionarioBtn');
        if (novoBtn) {
            novoBtn.addEventListener('click', () => {
                this.abrirModalCadastro();
            });
        }
        
        // Data de admissão padrão (hoje)
        const admissionInput = document.getElementById('employeeAdmission');
        if (admissionInput) {
            const hoje = new Date().toISOString().split('T')[0];
            admissionInput.value = hoje;
            admissionInput.max = hoje; // Não permitir datas futuras
        }
    },

    // Carregar lista de funcionários
    carregarFuncionarios: async function() {
        try {
            console.log('Carregando funcionários...');
            
            const loadingElement = document.getElementById('loadingEmployees');
            if (loadingElement) {
                loadingElement.style.display = 'flex';
            }
            
            // Buscar todos os usuários no Firestore
            const querySnapshot = await firebaseDb.collection('usuarios').get();
            
            this.estado.funcionarios = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                this.estado.funcionarios.push({
                    id: doc.id,
                    ...data,
                    // Garantir que dataAdmissao seja Date object
                    dataAdmissao: data.dataAdmissao ? 
                        (data.dataAdmissao.toDate ? data.dataAdmissao.toDate() : new Date(data.dataAdmissao)) : 
                        new Date()
                });
            });
            
            console.log(`${this.estado.funcionarios.length} funcionários carregados`);
            
            // Ordenar por nome
            this.estado.funcionarios.sort((a, b) => 
                (a.nome || '').localeCompare(b.nome || '')
            );
            
            // Atualizar tabela
            this.atualizarTabelaFuncionarios();
            
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Erro ao carregar funcionários:', error);
            
            const loadingElement = document.getElementById('loadingEmployees');
            if (loadingElement) {
                loadingElement.innerHTML = `
                    <div class="error-message">
                        Erro ao carregar funcionários: ${error.message}
                    </div>
                `;
            }
        }
    },

    // Atualizar tabela de funcionários
    atualizarTabelaFuncionarios: function(funcionarios = this.estado.funcionarios) {
        const tableBody = document.querySelector('#employeesTable tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (funcionarios.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        Nenhum funcionário encontrado
                    </td>
                </tr>
            `;
            return;
        }
        
        funcionarios.forEach(funcionario => {
            // Formatar data de admissão
            const dataAdmissao = funcionario.dataAdmissao ?
                funcionario.dataAdmissao.toLocaleDateString('pt-BR') : 'Não informada';
            
            // Determinar badge de tipo
            const tipoBadge = funcionario.tipo === 'admin' ?
                `<span class="badge badge-warning">Administrador</span>` :
                `<span class="badge badge-info">Funcionário</span>`;
            
            // Determinar badge de status
            const statusBadge = funcionario.ativo !== false ?
                `<span class="badge badge-success">Ativo</span>` :
                `<span class="badge badge-danger">Inativo</span>`;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${funcionario.nome || 'Não informado'}</td>
                <td>${funcionario.matricula || 'Não informada'}</td>
                <td>${funcionario.departamento || 'Não informado'}</td>
                <td>${funcionario.cargo || 'Não informado'}</td>
                <td>${tipoBadge}</td>
                <td>${statusBadge}</td>
                <td>
                    <button onclick="cadastroSystem.editarFuncionario('${funcionario.id}')" 
                            class="btn-secondary btn-sm" style="margin-right: 5px;">
                        Editar
                    </button>
                    <button onclick="cadastroSystem.alterarStatus('${funcionario.id}', ${!funcionario.ativo})" 
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
        this.estado.filtroAtual = termo.toLowerCase();
        
        if (!termo) {
            this.atualizarTabelaFuncionarios();
            return;
        }
        
        const filtrados = this.estado.funcionarios.filter(funcionario => {
            const nome = (funcionario.nome || '').toLowerCase();
            const matricula = (funcionario.matricula || '').toLowerCase();
            const departamento = (funcionario.departamento || '').toLowerCase();
            const cargo = (funcionario.cargo || '').toLowerCase();
            const email = (funcionario.email || '').toLowerCase();
            
            return nome.includes(this.estado.filtroAtual) ||
                   matricula.includes(this.estado.filtroAtual) ||
                   departamento.includes(this.estado.filtroAtual) ||
                   cargo.includes(this.estado.filtroAtual) ||
                   email.includes(this.estado.filtroAtual);
        });
        
        this.atualizarTabelaFuncionarios(filtrados);
    },

    // Abrir modal de cadastro
    abrirModalCadastro: function(funcionarioId = null) {
        this.estado.editandoId = funcionarioId;
        
        const modal = document.getElementById('employeeModal');
        const title = document.getElementById('modalEmployeeTitle');
        const submitBtn = document.getElementById('employeeSubmitBtn');
        const form = document.getElementById('employeeForm');
        
        if (funcionarioId) {
            // Modo edição
            title.textContent = 'Editar Funcionário';
            submitBtn.textContent = 'Atualizar Funcionário';
            
            // Preencher formulário com dados do funcionário
            const funcionario = this.estado.funcionarios.find(f => f.id === funcionarioId);
            if (funcionario) {
                document.getElementById('employeeName').value = funcionario.nome || '';
                document.getElementById('employeeEmail').value = funcionario.email || '';
                document.getElementById('employeeMatricula').value = funcionario.matricula || '';
                document.getElementById('employeeDepartment').value = funcionario.departamento || '';
                document.getElementById('employeePosition').value = funcionario.cargo || '';
                document.getElementById('employeeType').value = funcionario.tipo || 'funcionario';
                
                // Formatar data para input type="date"
                if (funcionario.dataAdmissao) {
                    const data = funcionario.dataAdmissao.toDate ? 
                        funcionario.dataAdmissao.toDate() : 
                        new Date(funcionario.dataAdmissao);
                    document.getElementById('employeeAdmission').value = 
                        data.toISOString().split('T')[0];
                }
                
                document.getElementById('employeeActive').checked = funcionario.ativo !== false;
                
                // Desabilitar e-mail em edição
                document.getElementById('employeeEmail').disabled = true;
                document.getElementById('employeePassword').disabled = true;
                document.getElementById('employeePassword').required = false;
            }
        } else {
            // Modo novo cadastro
            title.textContent = 'Cadastrar Novo Funcionário';
            submitBtn.textContent = 'Cadastrar Funcionário';
            
            // Resetar formulário
            form.reset();
            
            // Habilitar campos
            document.getElementById('employeeEmail').disabled = false;
            document.getElementById('employeePassword').disabled = false;
            document.getElementById('employeePassword').required = true;
            
            // Data padrão (hoje)
            const hoje = new Date().toISOString().split('T')[0];
            document.getElementById('employeeAdmission').value = hoje;
            document.getElementById('employeeAdmission').max = hoje;
        }
        
        modal.style.display = 'flex';
    },

    // Fechar modal de cadastro
    fecharModalCadastro: function() {
        const modal = document.getElementById('employeeModal');
        modal.style.display = 'none';
        
        // Resetar estado
        this.estado.editandoId = null;
        
        // Resetar formulário
        const form = document.getElementById('employeeForm');
        if (form) {
            form.reset();
        }
    },

    // Salvar funcionário (novo ou edição)
    salvarFuncionario: async function() {
        try {
            console.log('Salvando funcionário...');
            
            // Coletar dados do formulário
            const formData = {
                nome: document.getElementById('employeeName').value.trim(),
                email: document.getElementById('employeeEmail').value.trim(),
                password: document.getElementById('employeePassword').value,
                matricula: document.getElementById('employeeMatricula').value.trim(),
                departamento: document.getElementById('employeeDepartment').value,
                cargo: document.getElementById('employeePosition').value.trim(),
                tipo: document.getElementById('employeeType').value,
                dataAdmissao: document.getElementById('employeeAdmission').value,
                ativo: document.getElementById('employeeActive').checked
            };
            
            // Validações
            const erros = this.validarFormulario(formData);
            if (erros.length > 0) {
                alert(erros.join('\n'));
                return;
            }
            
            const isEditing = this.estado.editandoId !== null;
            
            if (isEditing) {
                // Atualizar funcionário existente
                await this.atualizarFuncionario(formData);
            } else {
                // Criar novo funcionário
                await this.criarNovoFuncionario(formData);
            }
            
            // Fechar modal e recarregar lista
            this.fecharModalCadastro();
            await this.carregarFuncionarios();
            
        } catch (error) {
            console.error('Erro ao salvar funcionário:', error);
            alert('Erro ao salvar funcionário: ' + error.message);
        }
    },

    // Validar formulário
    validarFormulario: function(formData) {
        const erros = [];
        
        if (!formData.nome) erros.push('Nome é obrigatório');
        if (!formData.email) erros.push('E-mail é obrigatório');
        if (!formData.matricula) erros.push('Matrícula é obrigatória');
        if (!formData.departamento) erros.push('Departamento é obrigatório');
        if (!formData.cargo) erros.push('Cargo é obrigatório');
        if (!formData.dataAdmissao) erros.push('Data de admissão é obrigatória');
        
        // Validar e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            erros.push('E-mail inválido');
        }
        
        // Validar senha apenas para novo cadastro
        if (!this.estado.editandoId && !formData.password) {
            erros.push('Senha é obrigatória para novo cadastro');
        }
        
        if (!this.estado.editandoId && formData.password && formData.password.length < 6) {
            erros.push('A senha deve ter no mínimo 6 caracteres');
        }
        
        return erros;
    },

    // Criar novo funcionário
    criarNovoFuncionario: async function(formData) {
        console.log('Criando novo funcionário:', formData.email);
        
        try {
            // Verificar se e-mail já existe
            const emailExists = this.estado.funcionarios.some(f => 
                f.email.toLowerCase() === formData.email.toLowerCase()
            );
            
            if (emailExists) {
                throw new Error('Este e-mail já está cadastrado no sistema');
            }
            
            // Preparar dados para o Firestore
            const firestoreData = {
                nome: formData.nome,
                email: formData.email,
                matricula: formData.matricula,
                departamento: formData.departamento,
                cargo: formData.cargo,
                tipo: formData.tipo,
                dataAdmissao: new Date(formData.dataAdmissao),
                ativo: formData.ativo,
                dataCadastro: new Date(),
                criadoPor: authSystem.getUserId(),
                jornadaPadrao: {
                    segundaSexta: { entrada: "08:00", saida: "18:00", intervalo: 2 },
                    sabado: { entrada: "08:00", saida: "13:00", intervalo: 0 },
                    domingo: { trabalho: false }
                }
            };
            
            // Criar usuário no Authentication
            const userCredential = await firebaseAuth.createUserWithEmailAndPassword(
                formData.email,
                formData.password
            );
            
            const userId = userCredential.user.uid;
            
            // Salvar dados no Firestore
            await firebaseDb.collection('usuarios').doc(userId).set(firestoreData);
            
            // Enviar e-mail de redefinição de senha
            await firebaseAuth.sendPasswordResetEmail(formData.email);
            
            alert(`Funcionário criado com sucesso!\n\n` +
                  `Um e-mail foi enviado para ${formData.email} com instruções para definir a senha.`);
            
            console.log('Funcionário criado com ID:', userId);
            
        } catch (error) {
            console.error('Erro ao criar funcionário:', error);
            throw error;
        }
    },

    // Atualizar funcionário existente
    atualizarFuncionario: async function(formData) {
        console.log('Atualizando funcionário:', this.estado.editandoId);
        
        try {
            const funcionario = this.estado.funcionarios.find(f => f.id === this.estado.editandoId);
            if (!funcionario) {
                throw new Error('Funcionário não encontrado');
            }
            
            // Preparar dados para atualização
            const updates = {
                nome: formData.nome,
                matricula: formData.matricula,
                departamento: formData.departamento,
                cargo: formData.cargo,
                tipo: formData.tipo,
                dataAdmissao: new Date(formData.dataAdmissao),
                ativo: formData.ativo,
                atualizadoEm: new Date(),
                atualizadoPor: authSystem.getUserId()
            };
            
            // Atualizar no Firestore
            await firebaseDb.collection('usuarios')
                .doc(this.estado.editandoId)
                .update(updates);
            
            alert('Funcionário atualizado com sucesso!');
            
        } catch (error) {
            console.error('Erro ao atualizar funcionário:', error);
            throw error;
        }
    },

    // Editar funcionário
    editarFuncionario: function(funcionarioId) {
        this.abrirModalCadastro(funcionarioId);
    },

    // Alterar status (ativo/inativo)
    alterarStatus: async function(funcionarioId, novoStatus) {
        const funcionario = this.estado.funcionarios.find(f => f.id === funcionarioId);
        if (!funcionario) return;
        
        const acao = novoStatus ? 'ativar' : 'desativar';
        const confirmar = confirm(`Tem certeza que deseja ${acao} o funcionário ${funcionario.nome}?`);
        
        if (!confirmar) return;
        
        try {
            await firebaseDb.collection('usuarios')
                .doc(funcionarioId)
                .update({
                    ativo: novoStatus,
                    atualizadoEm: new Date(),
                    atualizadoPor: authSystem.getUserId()
                });
            
            alert(`Funcionário ${acao === 'ativar' ? 'ativado' : 'desativado'} com sucesso!`);
            
            // Recarregar lista
            await this.carregarFuncionarios();
            
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            alert('Erro ao alterar status do funcionário: ' + error.message);
        }
    },

    // Exportar lista de funcionários para CSV
    exportarParaCSV: function() {
        if (this.estado.funcionarios.length === 0) {
            alert('Nenhum funcionário para exportar');
            return;
        }
        
        const funcionariosParaExportar = this.estado.filtroAtual ?
            this.estado.funcionarios.filter(f => 
                (f.nome || '').toLowerCase().includes(this.estado.filtroAtual) ||
                (f.matricula || '').toLowerCase().includes(this.estado.filtroAtual) ||
                (f.departamento || '').toLowerCase().includes(this.estado.filtroAtual)
            ) : this.estado.funcionarios;
        
        // Cabeçalhos CSV
        const headers = ['Nome', 'Matrícula', 'E-mail', 'Departamento', 'Cargo', 'Tipo', 'Status', 'Data Admissão'];
        
        // Dados CSV
        const rows = funcionariosParaExportar.map(funcionario => {
            const dataAdmissao = funcionario.dataAdmissao ?
                funcionario.dataAdmissao.toLocaleDateString('pt-BR') : '';
            
            return [
                `"${funcionario.nome || ''}"`,
                `"${funcionario.matricula || ''}"`,
                `"${funcionario.email || ''}"`,
                `"${funcionario.departamento || ''}"`,
                `"${funcionario.cargo || ''}"`,
                `"${funcionario.tipo || ''}"`,
                `"${funcionario.ativo !== false ? 'Ativo' : 'Inativo'}"`,
                `"${dataAdmissao}"`
            ];
        });
        
        // Combinar headers e rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        // Criar arquivo para download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `funcionarios_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Exportação CSV concluída');
    }
};

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    cadastroSystem.init();
});

// Exportar para uso global
window.cadastroSystem = cadastroSystem;
