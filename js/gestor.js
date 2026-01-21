// gestor.js - Sistema da Área do Gestor
window.gestor = (function() {
    'use strict';
    
    const modulo = {};
    let usuarioAtual = null;
    
    modulo.inicializar = function() {
        console.log("👑 Módulo gestor inicializado");
        
        usuarioAtual = window.auth?.getCurrentUser();
        if (!usuarioAtual || usuarioAtual.tipo !== 'gestor') {
            window.location.href = 'index.html';
            return false;
        }
        
        configurarEventos();
        carregarDashboard();
        carregarFuncionarios();
        
        return true;
    };
    
    function configurarEventos() {
        // Botão de sair
        const btnSair = document.getElementById('logoutBtn');
        if (btnSair) {
            btnSair.addEventListener('click', function() {
                if (confirm('Deseja realmente sair da área do gestor?')) {
                    window.auth?.logout();
                }
            });
        }
        
        // Navegação por abas
        const tabs = document.querySelectorAll('.gestor-tab');
        const contents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                this.classList.add('active');
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
                
                switch(tabId) {
                    case 'funcionarios':
                        carregarFuncionarios();
                        break;
                    case 'ponto':
                        carregarPontos();
                        break;
                    case 'relatorios':
                        carregarRelatorios();
                        break;
                }
            });
        });
        
        // Buscar funcionários
        const searchInput = document.getElementById('searchFuncionario');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                buscarFuncionarios(this.value);
            });
        }
        
        // Formulário de cadastro de funcionário
        const formCadastro = document.getElementById('formCadastroFuncionario');
        if (formCadastro) {
            formCadastro.addEventListener('submit', function(e) {
                e.preventDefault();
                cadastrarFuncionario();
            });
        }
        
        // Formatar CPF
        const cpfInput = document.getElementById('cpfFuncionario');
        if (cpfInput) {
            cpfInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                
                if (value.length > 11) value = value.substring(0, 11);
                
                if (value.length > 9) {
                    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                } else if (value.length > 6) {
                    value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
                } else if (value.length > 3) {
                    value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
                }
                
                e.target.value = value;
            });
        }
        
        // Formatar telefone
        const telefoneInput = document.getElementById('telefoneFuncionario');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                
                if (value.length > 11) value = value.substring(0, 11);
                
                if (value.length > 10) {
                    value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                } else if (value.length > 6) {
                    value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                } else if (value.length > 2) {
                    value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
                }
                
                e.target.value = value;
            });
        }
    }
    
    function carregarDashboard() {
        const totalFuncionarios = document.getElementById('totalFuncionarios');
        const pontoHoje = document.getElementById('pontoHoje');
        const horasTrabalhadas = document.getElementById('horasTrabalhadas');
        const presenca = document.getElementById('presenca');
        
        // Carregar funcionários
        const funcionarios = window.auth?.listarUsuarios() || [];
        const funcionariosAtivos = funcionarios.filter(f => f.tipo === 'funcionario' && f.ativo !== false);
        
        // Carregar registros
        const registros = JSON.parse(localStorage.getItem('registros_ponto') || '[]');
        const hoje = new Date().toISOString().split('T')[0];
        const registrosHoje = registros.filter(r => r.data.split('T')[0] === hoje);
        
        // Calcular horas trabalhadas
        let totalHoras = 0;
        let totalMinutos = 0;
        
        registros.forEach(r => {
            if (r.horas && r.horas !== '00:00') {
                const [horas, minutos] = r.horas.split(':').map(Number);
                totalHoras += horas;
                totalMinutos += minutos;
            }
        });
        
        // Ajustar minutos
        totalHoras += Math.floor(totalMinutos / 60);
        totalMinutos = totalMinutos % 60;
        
        // Atualizar dashboard
        if (totalFuncionarios) totalFuncionarios.textContent = funcionariosAtivos.length;
        if (pontoHoje) pontoHoje.textContent = registrosHoje.length;
        if (horasTrabalhadas) horasTrabalhadas.textContent = `${totalHoras}h`;
        if (presenca) {
            const taxa = funcionariosAtivos.length > 0 ? 
                Math.round((registrosHoje.length / funcionariosAtivos.length) * 100) : 0;
            presenca.textContent = `${taxa}%`;
        }
        
        // Carregar pontos recentes
        carregarPontosRecentes();
    }
    
    function carregarPontosRecentes() {
        const pontosRecentesDiv = document.getElementById('pontosRecentes');
        if (!pontosRecentesDiv) return;
        
        const registros = JSON.parse(localStorage.getItem('registros_ponto') || '[]');
        const registrosRecentes = registros
            .sort((a, b) => new Date(b.data) - new Date(a.data))
            .slice(0, 10);
        
        if (registrosRecentes.length === 0) {
            pontosRecentesDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #888;">
                    <div>⏰</div>
                    Nenhum registro de ponto recente
                </div>
            `;
            return;
        }
        
        let html = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #E8F5E9;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #C8E6C9;">Funcionário</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #C8E6C9;">Horário</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #C8E6C9;">Tipo</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #C8E6C9;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        registrosRecentes.forEach((registro, index) => {
            const tipo = registro.entrada ? 'Entrada' : 'Saída';
            const hora = registro.entrada || registro.saida;
            
            html += `
                <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : ''}">
                    <td style="padding: 12px; border-bottom: 1px solid #E8F5E9;">${registro.usuarioNome}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #E8F5E9;">${hora}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #E8F5E9;">${tipo}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #E8F5E9;">
                        <span style="color: ${registro.status === 'completo' ? '#4CAF50' : '#2196F3'}; font-weight: bold;">
                            ${registro.status === 'completo' ? '✅ Completo' : '⏱️ Pendente'}
                        </span>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        pontosRecentesDiv.innerHTML = html;
    }
    
    function carregarFuncionarios() {
        const listaFuncionariosDiv = document.getElementById('listaFuncionarios');
        if (!listaFuncionariosDiv) return;
        
        const funcionarios = window.auth?.listarUsuarios() || [];
        const funcionariosAtivos = funcionarios.filter(f => f.tipo === 'funcionario' && f.ativo !== false);
        
        if (funcionariosAtivos.length === 0) {
            listaFuncionariosDiv.innerHTML = `
                <div class="no-data">
                    <div>👥</div>
                    Nenhum funcionário cadastrado ainda.<br>
                    <button class="btn-gestor" onclick="abrirAba('cadastro')" 
                            style="margin-top: 15px; padding: 10px 20px;">
                        Cadastrar Primeiro Funcionário
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        funcionariosAtivos.forEach(func => {
            // Carregar registros do funcionário
            const registros = JSON.parse(localStorage.getItem('registros_ponto') || '[]');
            const registrosFunc = registros.filter(r => r.usuarioId === func.id);
            const hoje = new Date().toISOString().split('T')[0];
            const registroHoje = registrosFunc.find(r => r.data.split('T')[0] === hoje);
            
            let statusHoje = '';
            if (registroHoje) {
                if (registroHoje.status === 'completo') {
                    statusHoje = '<span style="color: #2E8B57; font-weight: bold;">✅ Presente</span>';
                } else if (registroHoje.status === 'pendente') {
                    statusHoje = '<span style="color: #FF9800; font-weight: bold;">⏱️ Entrada registrada</span>';
                }
            } else {
                statusHoje = '<span style="color: #f44336; font-weight: bold;">❌ Ausente</span>';
            }
            
            html += `
                <div class="funcionario-card">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                        <div style="
                            width: 60px;
                            height: 60px;
                            background: #E8F5E9;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-right: 15px;
                            color: #2E8B57;
                            font-size: 24px;
                            border: 2px solid #C8E6C9;
                        ">
                            👤
                        </div>
                        <div>
                            <div class="funcionario-nome">${func.nome}</div>
                            <div class="funcionario-detalhes">
                                <strong>Matrícula:</strong> ${func.matricula || 'N/A'}<br>
                                <strong>Cargo:</strong> ${func.cargo || 'N/A'}<br>
                                <strong>Departamento:</strong> ${func.departamento || 'N/A'}
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 10px;">
                        <strong>Status hoje:</strong> ${statusHoje}
                    </div>
                    
                    <div style="margin-top: 15px; display: flex; gap: 10px;">
                        <button onclick="window.gestor.editarFuncionario('${func.id}')" 
                                style="background: #2E8B57; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            ✏️ Editar
                        </button>
                        <button onclick="window.gestor.verRegistros('${func.id}')" 
                                style="background: #2196F3; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            📊 Ver Registros
                        </button>
                        <button onclick="window.gestor.excluirFuncionario('${func.id}')" 
                                style="background: #f44336; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
            `;
        });
        
        listaFuncionariosDiv.innerHTML = html;
    }
    
    function buscarFuncionarios(termo) {
        const funcionarios = window.auth?.listarUsuarios() || [];
        const funcionariosAtivos = funcionarios.filter(f => f.tipo === 'funcionario' && f.ativo !== false);
        
        if (!termo) {
            renderizarFuncionarios(funcionariosAtivos);
            return;
        }
        
        termo = termo.toLowerCase();
        const funcionariosFiltrados = funcionariosAtivos.filter(func => 
            func.nome.toLowerCase().includes(termo) ||
            func.email.toLowerCase().includes(termo) ||
            func.cargo?.toLowerCase().includes(termo) ||
            func.departamento?.toLowerCase().includes(termo) ||
            func.matricula?.includes(termo)
        );
        
        renderizarFuncionarios(funcionariosFiltrados);
    }
    
    function renderizarFuncionarios(funcionarios) {
        const listaFuncionariosDiv = document.getElementById('listaFuncionarios');
        if (!listaFuncionariosDiv) return;
        
        if (funcionarios.length === 0) {
            listaFuncionariosDiv.innerHTML = `
                <div class="no-data">
                    <div>🔍</div>
                    Nenhum funcionário encontrado
                </div>
            `;
            return;
        }
        
        let html = '';
        
        funcionarios.forEach(func => {
            html += `
                <div class="funcionario-card">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                        <div style="
                            width: 60px;
                            height: 60px;
                            background: #E8F5E9;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-right: 15px;
                            color: #2E8B57;
                            font-size: 24px;
                            border: 2px solid #C8E6C9;
                        ">
                            👤
                        </div>
                        <div>
                            <div class="funcionario-nome">${func.nome}</div>
                            <div class="funcionario-detalhes">
                                <strong>Email:</strong> ${func.email}<br>
                                <strong>Cargo:</strong> ${func.cargo || 'N/A'}<br>
                                <strong>Departamento:</strong> ${func.departamento || 'N/A'}
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 15px; display: flex; gap: 10px;">
                        <button onclick="window.gestor.editarFuncionario('${func.id}')" 
                                style="background: #2E8B57; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            ✏️ Editar
                        </button>
                        <button onclick="window.gestor.verRegistros('${func.id}')" 
                                style="background: #2196F3; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            📊 Ver Registros
                        </button>
                    </div>
                </div>
            `;
        });
        
        listaFuncionariosDiv.innerHTML = html;
    }
    
    function cadastrarFuncionario() {
        const nome = document.getElementById('nomeFuncionario').value;
        const cpf = document.getElementById('cpfFuncionario').value;
        const email = document.getElementById('emailFuncionario').value;
        const telefone = document.getElementById('telefoneFuncionario').value;
        const cargo = document.getElementById('cargoFuncionario').value;
        const departamento = document.getElementById('departamentoFuncionario').value;
        const admissao = document.getElementById('admissaoFuncionario').value;
        const salario = document.getElementById('salarioFuncionario').value;
        
        if (!nome || !cpf || !cargo || !departamento || !admissao) {
            if (window.utils) {
                window.utils.mostrarMensagem('Preencha todos os campos obrigatórios!', 'error');
            }
            return;
        }
        
        if (cpf && !window.utils?.validarCPF(cpf)) {
            if (window.utils) {
                window.utils.mostrarMensagem('CPF inválido!', 'error');
            }
            return;
        }
        
        if (email && !window.utils?.validarEmail(email)) {
            if (window.utils) {
                window.utils.mostrarMensagem('Email inválido!', 'error');
            }
            return;
        }
        
        // Gerar senha temporária
        const senhaTemporaria = 'func123';
        
        // Dados do funcionário
        const dadosFuncionario = {
            nome: nome,
            email: email || `${nome.toLowerCase().replace(/\s+/g, '.')}@empresa.com`,
            senha: senhaTemporaria,
            tipo: 'funcionario',
            cargo: cargo,
            departamento: departamento,
            cpf: cpf,
            telefone: telefone,
            salario: salario ? parseFloat(salario) : 0,
            dataAdmissao: admissao,
            matricula: 'MAT' + Date.now().toString().substr(-6)
        };
        
        // Cadastrar usuário
        window.auth?.cadastrarUsuario(dadosFuncionario)
            .then(resultado => {
                if (resultado.success) {
                    if (window.utils) {
                        window.utils.mostrarMensagem(
                            `Funcionário ${nome} cadastrado com sucesso!<br>Senha temporária: ${senhaTemporaria}`,
                            'success'
                        );
                    }
                    
                    // Limpar formulário
                    document.getElementById('formCadastroFuncionario').reset();
                    
                    // Atualizar lista de funcionários
                    carregarFuncionarios();
                    carregarDashboard();
                    
                } else {
                    if (window.utils) {
                        window.utils.mostrarMensagem(resultado.error, 'error');
                    }
                }
            })
            .catch(error => {
                if (window.utils) {
                    window.utils.mostrarMensagem(`Erro: ${error.message}`, 'error');
                }
            });
    }
    
    function carregarPontos() {
        const tabelaPontosDiv = document.getElementById('tabelaPontos');
        if (!tabelaPontosDiv) return;
        
        const registros = JSON.parse(localStorage.getItem('registros_ponto') || '[]');
        
        if (registros.length === 0) {
            tabelaPontosDiv.innerHTML = `
                <div class="no-data">
                    <div>⏰</div>
                    Nenhum registro de ponto encontrado
                </div>
            `;
            return;
        }
        
        // Ordenar por data (mais recente primeiro)
        registros.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        let html = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #E8F5E9;">
                            <th style="padding: 12px; text-align: left;">Data</th>
                            <th style="padding: 12px; text-align: left;">Funcionário</th>
                            <th style="padding: 12px; text-align: left;">Entrada</th>
                            <th style="padding: 12px; text-align: left;">Saída</th>
                            <th style="padding: 12px; text-align: left;">Horas</th>
                            <th style="padding: 12px; text-align: left;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        registros.slice(0, 50).forEach((registro, index) => {
            // Formatar status
            let statusHTML = '';
            if (registro.status === 'completo') {
                statusHTML = '<span style="color: #2E8B57; font-weight: bold;">✅ Completo</span>';
            } else if (registro.status === 'pendente') {
                statusHTML = '<span style="color: #FF9800; font-weight: bold;">⏱️ Pendente</span>';
            } else if (registro.status === 'saida_sem_entrada') {
                statusHTML = '<span style="color: #f44336; font-weight: bold;">⚠️ Sem entrada</span>';
            }
            
            html += `
                <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : ''}">
                    <td style="padding: 12px; border-bottom: 1px solid #E8F5E9;">
                        ${window.utils?.formatarData(registro.data) || '--/--/----'}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #E8F5E9;">
                        ${registro.usuarioNome}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #E8F5E9; color: #2E8B57; font-weight: bold;">
                        ${registro.entrada || '--:--'}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #E8F5E9; color: #1b5e20; font-weight: bold;">
                        ${registro.saida || '--:--'}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #E8F5E9;">
                        ${registro.horas || '00:00'}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #E8F5E9;">
                        ${statusHTML}
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 20px; color: #666; font-size: 0.9rem;">
                Mostrando ${Math.min(registros.length, 50)} de ${registros.length} registros
            </div>
        `;
        
        tabelaPontosDiv.innerHTML = html;
    }
    
    function carregarRelatorios() {
        // Implementação básica de relatórios
        console.log("Carregando relatórios...");
    }
    
    modulo.editarFuncionario = function(funcionarioId) {
        const funcionario = window.auth?.buscarUsuarioPorId(funcionarioId);
        
        if (!funcionario) {
            if (window.utils) {
                window.utils.mostrarMensagem('Funcionário não encontrado', 'error');
            }
            return;
        }
        
        // Criar modal de edição
        const modal = window.utils?.criarModal(
            `Editar Funcionário: ${funcionario.nome}`,
            `
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: #1b5e20; font-weight: 500;">Nome Completo</label>
                    <input type="text" id="editNome" class="form-control" value="${funcionario.nome}" style="width: 100%;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: #1b5e20; font-weight: 500;">Email</label>
                    <input type="email" id="editEmail" class="form-control" value="${funcionario.email}" style="width: 100%;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: #1b5e20; font-weight: 500;">Cargo</label>
                    <input type="text" id="editCargo" class="form-control" value="${funcionario.cargo || ''}" style="width: 100%;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: #1b5e20; font-weight: 500;">Departamento</label>
                    <select id="editDepartamento" class="form-control" style="width: 100%;">
                        <option value="ti" ${funcionario.departamento === 'ti' ? 'selected' : ''}>TI</option>
                        <option value="rh" ${funcionario.departamento === 'rh' ? 'selected' : ''}>RH</option>
                        <option value="vendas" ${funcionario.departamento === 'vendas' ? 'selected' : ''}>Vendas</option>
                        <option value="financeiro" ${funcionario.departamento === 'financeiro' ? 'selected' : ''}>Financeiro</option>
                        <option value="administrativo" ${funcionario.departamento === 'administrativo' ? 'selected' : ''}>Administrativo</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: #1b5e20; font-weight: 500;">Status</label>
                    <select id="editStatus" class="form-control" style="width: 100%;">
                        <option value="true" ${funcionario.ativo !== false ? 'selected' : ''}>Ativo</option>
                        <option value="false" ${funcionario.ativo === false ? 'selected' : ''}>Inativo</option>
                    </select>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 25px;">
                    <button id="btnSalvarEdicao" style="
                        flex: 1;
                        background: #2E8B57;
                        color: white;
                        border: none;
                        padding: 12px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    ">
                        💾 Salvar Alterações
                    </button>
                    <button id="btnCancelarEdicao" style="
                        background: #f8f9fa;
                        color: #495057;
                        border: 2px solid #e9ecef;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                    ">
                        Cancelar
                    </button>
                </div>
            `,
            { largura: '500px' }
        );
        
        // Configurar eventos dos botões
        document.getElementById('btnSalvarEdicao').addEventListener('click', function() {
            const dadosAtualizados = {
                nome: document.getElementById('editNome').value,
                email: document.getElementById('editEmail').value,
                cargo: document.getElementById('editCargo').value,
                departamento: document.getElementById('editDepartamento').value,
                ativo: document.getElementById('editStatus').value === 'true'
            };
            
            window.auth?.atualizarUsuario(funcionarioId, dadosAtualizados)
                .then(resultado => {
                    if (resultado.success) {
                        if (window.utils) {
                            window.utils.mostrarMensagem('Funcionário atualizado com sucesso!', 'success');
                        }
                        window.utils?.fecharModal();
                        carregarFuncionarios();
                        carregarDashboard();
                    } else {
                        if (window.utils) {
                            window.utils.mostrarMensagem(resultado.error, 'error');
                        }
                    }
                });
        });
        
        document.getElementById('btnCancelarEdicao').addEventListener('click', function() {
            window.utils?.fecharModal();
        });
    };
    
    modulo.verRegistros = function(funcionarioId) {
        const funcionario = window.auth?.buscarUsuarioPorId(funcionarioId);
        const registros = JSON.parse(localStorage.getItem('registros_ponto') || '[]');
        const registrosFunc = registros.filter(r => r.usuarioId === funcionarioId);
        
        if (registrosFunc.length === 0) {
            if (window.utils) {
                window.utils.mostrarMensagem('Nenhum registro encontrado para este funcionário', 'info');
            }
            return;
        }
        
        let html = `
            <div style="max-height: 400px; overflow-y: auto;">
                <h4 style="color: #1b5e20; margin-bottom: 15px;">Registros de ${funcionario?.nome || 'Funcionário'}</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #E8F5E9;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #C8E6C9;">Data</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #C8E6C9;">Entrada</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #C8E6C9;">Saída</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #C8E6C9;">Horas</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        registrosFunc.forEach((registro, index) => {
            html += `
                <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : ''}">
                    <td style="padding: 10px; border-bottom: 1px solid #E8F5E9;">
                        ${window.utils?.formatarData(registro.data) || '--/--/----'}
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #E8F5E9; color: #2E8B57;">
                        ${registro.entrada || '--:--'}
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #E8F5E9; color: #1b5e20;">
                        ${registro.saida || '--:--'}
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #E8F5E9;">
                        ${registro.horas || '00:00'}
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
                <div style="margin-top: 15px; color: #666; font-size: 0.9rem;">
                    Total: ${registrosFunc.length} registros
                </div>
            </div>
        `;
        
        window.utils?.criarModal(
            `Registros de ${funcionario?.nome || 'Funcionário'}`,
            html,
            { largura: '600px' }
        );
    };
    
    modulo.excluirFuncionario = function(funcionarioId) {
        const funcionario = window.auth?.buscarUsuarioPorId(funcionarioId);
        
        if (!funcionario) {
            if (window.utils) {
                window.utils.mostrarMensagem('Funcionário não encontrado', 'error');
            }
            return;
        }
        
        if (!confirm(`Tem certeza que deseja excluir o funcionário ${funcionario.nome}?\n\nEsta ação não pode ser desfeita.`)) {
            return;
        }
        
        // Marcar como inativo (em produção, seria exclusão real)
        window.auth?.atualizarUsuario(funcionarioId, { ativo: false })
            .then(resultado => {
                if (resultado.success) {
                    if (window.utils) {
                        window.utils.mostrarMensagem('Funcionário marcado como inativo', 'success');
                    }
                    carregarFuncionarios();
                    carregarDashboard();
                } else {
                    if (window.utils) {
                        window.utils.mostrarMensagem(resultado.error, 'error');
                    }
                }
            });
    };
    
    modulo.exportarFuncionarios = function() {
        const funcionarios = window.auth?.listarUsuarios() || [];
        const funcionariosAtivos = funcionarios.filter(f => f.tipo === 'funcionario' && f.ativo !== false);
        
        if (funcionariosAtivos.length === 0) {
            if (window.utils) {
                window.utils.mostrarMensagem('Nenhum funcionário para exportar', 'warning');
            }
            return;
        }
        
        // Criar CSV
        let csv = 'Nome,Email,CPF,Telefone,Cargo,Departamento,Matrícula,Data Admissão,Status\n';
        
        funcionariosAtivos.forEach(func => {
            csv += `"${func.nome}","${func.email}","${func.cpf || ''}","${func.telefone || ''}","${func.cargo || ''}","${func.departamento || ''}","${func.matricula || ''}","${func.dataAdmissao || ''}","${func.ativo !== false ? 'Ativo' : 'Inativo'}"\n`;
        });
        
        if (window.utils) {
            window.utils.downloadArquivo(
                `funcionarios_${new Date().toISOString().split('T')[0]}.csv`,
                csv,
                'text/csv'
            );
        }
    };
    
    function abrirAba(abaId) {
        const tabs = document.querySelectorAll('.gestor-tab');
        const contents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === abaId) {
                tab.classList.add('active');
            }
        });
        
        contents.forEach(content => {
            content.classList.remove('active');
            if (content.id === abaId) {
                content.classList.add('active');
                
                switch(abaId) {
                    case 'funcionarios':
                        carregarFuncionarios();
                        break;
                    case 'ponto':
                        carregarPontos();
                        break;
                }
            }
        });
    }
    
    // Inicializar automaticamente
    document.addEventListener('DOMContentLoaded', function() {
        modulo.inicializar();
    });
    
    // Exportar funções para uso global
    window.abrirAba = abrirAba;
    
    return modulo;
})();
