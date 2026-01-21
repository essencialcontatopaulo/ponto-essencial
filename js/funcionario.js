// funcionario.js - Sistema da Área do Funcionário
window.funcionario = (function() {
    'use strict';
    
    const modulo = {};
    
    // Variáveis do sistema
    let usuarioAtual = null;
    let registros = [];
    let justificativas = [];
    
    // Inicializar módulo
    modulo.inicializar = function() {
        console.log("👨‍💼 Módulo funcionário inicializado");
        
        // Carregar usuário atual
        usuarioAtual = window.auth?.getCurrentUser();
        if (!usuarioAtual) {
            window.location.href = 'index.html';
            return false;
        }
        
        // Carregar dados
        carregarDados();
        
        // Configurar eventos
        configurarEventos();
        
        return true;
    };
    
    // Carregar dados do localStorage/Firebase
    function carregarDados() {
        // Carregar registros de ponto
        registros = JSON.parse(localStorage.getItem('registros_ponto') || '[]');
        registros = registros.filter(r => r.usuarioId === usuarioAtual.uid);
        
        // Ordenar por data (mais recente primeiro)
        registros.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        // Carregar justificativas
        justificativas = JSON.parse(localStorage.getItem('justificativas') || '[]');
        justificativas = justificativas.filter(j => j.usuarioId === usuarioAtual.uid);
    }
    
    // Configurar eventos da página
    function configurarEventos() {
        // Botão de sair
        const btnSair = document.getElementById('sairBtn');
        if (btnSair) {
            btnSair.addEventListener('click', function() {
                if (confirm('Deseja realmente sair do sistema?')) {
                    window.auth?.logout();
                }
            });
        }
        
        // Botão registrar entrada
        const btnEntrada = document.getElementById('btnEntrada');
        if (btnEntrada) {
            btnEntrada.addEventListener('click', function() {
                modulo.registrarEntrada();
            });
        }
        
        // Botão registrar saída
        const btnSaida = document.getElementById('btnSaida');
        if (btnSaida) {
            btnSaida.addEventListener('click', function() {
                modulo.registrarSaida();
            });
        }
        
        // Filtro de mês
        const filtroMes = document.getElementById('filtroMes');
        if (filtroMes) {
            filtroMes.addEventListener('change', function() {
                modulo.filtrarRegistros(this.value);
            });
        }
        
        // Gerar relatório
        const btnRelatorio = document.getElementById('btnGerarRelatorio');
        if (btnRelatorio) {
            btnRelatorio.addEventListener('click', function() {
                modulo.gerarRelatorioMensal();
            });
        }
        
        // Formulário de justificativa
        const formJustificativa = document.getElementById('formJustificativa');
        if (formJustificativa) {
            formJustificativa.addEventListener('submit', function(e) {
                e.preventDefault();
                modulo.enviarJustificativa();
            });
        }
        
        // Inicializar data atual no formulário de justificativa
        const dataJustificativa = document.getElementById('dataJustificativa');
        if (dataJustificativa) {
            dataJustificativa.value = new Date().toISOString().split('T')[0];
        }
    }
    
    // Registrar entrada
    modulo.registrarEntrada = function() {
        if (!usuarioAtual) return;
        
        if (!confirm('Deseja registrar a entrada agora?\n\nO sistema utilizará reconhecimento facial.')) {
            return;
        }
        
        // Simular reconhecimento facial
        modulo.simularReconhecimentoFacial('entrada')
            .then(sucesso => {
                if (sucesso) {
                    salvarRegistro('entrada');
                } else {
                    window.utils?.mostrarMensagem('Reconhecimento facial falhou. Tente novamente.', 'error');
                }
            });
    };
    
    // Registrar saída
    modulo.registrarSaida = function() {
        if (!usuarioAtual) return;
        
        if (!confirm('Deseja registrar a saída agora?')) {
            return;
        }
        
        salvarRegistro('saida');
    };
    
    // Simular reconhecimento facial
    modulo.simularReconhecimentoFacial = function(tipo) {
        return new Promise((resolve) => {
            // Em produção, aqui você integraria com FaceAPI.js, TensorFlow.js, etc.
            
            // Mostrar modal de reconhecimento
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="text-align: center; max-width: 400px;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">📸</div>
                    <h3 style="color: #1b5e20; margin-bottom: 15px;">Reconhecimento Facial</h3>
                    <p style="color: #666; margin-bottom: 25px;">Posicione seu rosto na câmera</p>
                    
                    <div style="background: #f0f0f0; width: 300px; height: 200px; margin: 0 auto 25px; border-radius: 10px; display: flex; align-items: center; justify-content: center; position: relative;">
                        <div style="font-size: 3rem;">👤</div>
                        <div style="position: absolute; top: 10px; left: 10px; right: 10px; bottom: 10px; border: 2px dashed #2E8B57; border-radius: 5px;"></div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="simularSucesso" style="background: #2E8B57; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer;">
                            ✅ Simular Sucesso
                        </button>
                        <button id="simularFalha" style="background: #f44336; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer;">
                            ❌ Simular Falha
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Configurar botões
            document.getElementById('simularSucesso').addEventListener('click', function() {
                document.body.removeChild(modal);
                resolve(true);
            });
            
            document.getElementById('simularFalha').addEventListener('click', function() {
                document.body.removeChild(modal);
                resolve(false);
            });
            
            // Fechar ao clicar fora
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(false);
                }
            });
        });
    };
    
    // Salvar registro no sistema
    function salvarRegistro(tipo) {
        const agora = new Date();
        const hoje = agora.toISOString().split('T')[0];
        const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        // Carregar registros existentes
        let todosRegistros = JSON.parse(localStorage.getItem('registros_ponto') || '[]');
        
        // Buscar registro de hoje
        let registroHoje = todosRegistros.find(r => 
            r.usuarioId === usuarioAtual.uid && 
            r.data.split('T')[0] === hoje
        );
        
        if (!registroHoje) {
            // Criar novo registro para hoje
            registroHoje = {
                id: 'reg_' + Date.now(),
                usuarioId: usuarioAtual.uid,
                usuarioNome: usuarioAtual.nome,
                data: agora.toISOString(),
                entrada: tipo === 'entrada' ? hora : null,
                saida: tipo === 'saida' ? hora : null,
                horas: '00:00',
                status: tipo === 'entrada' ? 'pendente' : 'completo',
                metodo: 'facial'
            };
            todosRegistros.push(registroHoje);
        } else {
            // Atualizar registro existente
            if (tipo === 'entrada') {
                registroHoje.entrada = hora;
                registroHoje.status = 'pendente';
                registroHoje.metodo = 'facial';
            } else if (tipo === 'saida') {
                registroHoje.saida = hora;
                registroHoje.metodo = 'manual';
                
                if (registroHoje.entrada) {
                    // Calcular horas trabalhadas
                    const horasTrabalhadas = calcularHorasTrabalhadas(registroHoje.entrada, hora);
                    registroHoje.horas = horasTrabalhadas;
                    registroHoje.status = 'completo';
                } else {
                    registroHoje.status = 'saida_sem_entrada';
                }
            }
            
            // Atualizar no array
            const index = todosRegistros.findIndex(r => r.id === registroHoje.id);
            if (index !== -1) {
                todosRegistros[index] = registroHoje;
            }
        }
        
        // Salvar no localStorage
        localStorage.setItem('registros_ponto', JSON.stringify(todosRegistros));
        
        // Atualizar dados locais
        carregarDados();
        
        // Atualizar interface
        modulo.atualizarInterface();
        
        // Mostrar mensagem
        const tipoTexto = tipo === 'entrada' ? 'Entrada' : 'Saída';
        window.utils?.mostrarMensagem(
            `${tipoTexto} registrada com sucesso às ${hora}!`,
            'success'
        );
        
        // Se for entrada, mostrar confirmação de reconhecimento
        if (tipo === 'entrada') {
            setTimeout(() => {
                window.utils?.mostrarMensagem(
                    'Reconhecimento facial realizado com sucesso! ✅',
                    'success'
                );
            }, 500);
        }
        
        return registroHoje;
    }
    
    // Calcular horas trabalhadas
    function calcularHorasTrabalhadas(entrada, saida) {
        if (!entrada || !saida) return '00:00';
        
        // Converter strings de hora para objetos Date
        const hoje = new Date().toISOString().split('T')[0];
        const entradaDate = new Date(`${hoje} ${entrada}`);
        const saidaDate = new Date(`${hoje} ${saida}`);
        
        // Verificar se a saída é no dia seguinte (após meia-noite)
        if (saidaDate < entradaDate) {
            saidaDate.setDate(saidaDate.getDate() + 1);
        }
        
        // Calcular diferença
        const diffMs = saidaDate - entradaDate;
        const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${diffHoras.toString().padStart(2, '0')}:${diffMinutos.toString().padStart(2, '0')}`;
    }
    
    // Filtrar registros por mês
    modulo.filtrarRegistros = function(mes) {
        let registrosFiltrados = [...registros];
        
        if (mes !== 'todos') {
            registrosFiltrados = registros.filter(r => {
                const dataRegistro = new Date(r.data);
                return (dataRegistro.getMonth() + 1) === parseInt(mes);
            });
        }
        
        modulo.atualizarTabelaRegistros(registrosFiltrados);
        window.utils?.mostrarMensagem(`Mostrando registros do mês ${mes === 'todos' ? 'todos' : mes}`, 'info');
    };
    
    // Atualizar tabela de registros
    modulo.atualizarTabelaRegistros = function(listaRegistros = registros) {
        const tbody = document.getElementById('tabelaPontosBody');
        if (!tbody) return;
        
        if (listaRegistros.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #888;">
                        Nenhum registro encontrado.
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        let hoje = new Date().toDateString();
        let ultimoRegistroHoje = null;
        
        listaRegistros.forEach(registro => {
            const dataRegistro = new Date(registro.data);
            const hojeRegistro = dataRegistro.toDateString();
            
            // Verificar se é de hoje para mostrar no último registro
            if (hojeRegistro === hoje && !ultimoRegistroHoje) {
                ultimoRegistroHoje = registro;
            }
            
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
                <tr>
                    <td>${window.utils?.formatarData(registro.data) || '--/--/----'}</td>
                    <td style="color: #2E8B57; font-weight: bold;">${registro.entrada || '--:--'}</td>
                    <td style="color: #1b5e20; font-weight: bold;">${registro.saida || '--:--'}</td>
                    <td>${registro.horas || '00:00'}</td>
                    <td>${statusHTML}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        // Atualizar último registro de hoje
        const ultimoRegistroElement = document.getElementById('ultimoRegistro');
        if (ultimoRegistroElement && ultimoRegistroHoje) {
            const hora = ultimoRegistroHoje.entrada || ultimoRegistroHoje.saida;
            const tipo = ultimoRegistroHoje.entrada ? 'Entrada' : 'Saída';
            ultimoRegistroElement.textContent = `${tipo} às ${hora}`;
        } else if (ultimoRegistroElement) {
            ultimoRegistroElement.textContent = 'Nenhum registro hoje';
        }
    };
    
    // Gerar relatório mensal
    modulo.gerarRelatorioMensal = function() {
        const mes = parseInt(document.getElementById('mesRelatorio')?.value || new Date().getMonth() + 1);
        const ano = parseInt(document.getElementById('anoRelatorio')?.value || new Date().getFullYear());
        
        // Filtrar registros do mês/ano
        const registrosMes = registros.filter(r => {
            const dataRegistro = new Date(r.data);
            return (dataRegistro.getMonth() + 1) === mes && 
                   dataRegistro.getFullYear() === ano;
        });
        
        // Calcular estatísticas
        const estatisticas = calcularEstatisticas(registrosMes, mes, ano);
        
        // Exibir resultado
        modulo.exibirRelatorio(estatisticas, mes, ano);
    };
    
    // Calcular estatísticas do relatório
    function calcularEstatisticas(registrosMes, mes, ano) {
        let totalHoras = 0;
        let totalMinutos = 0;
        let diasTrabalhados = 0;
        let diasComHorasNormais = 0;
        let horasExtras = 0;
        let minutosExtras = 0;
        
        // Jornada padrão: 8 horas por dia
        const JORNADA_DIARIA = 8;
        
        registrosMes.forEach(reg => {
            if (reg.horas && reg.horas !== '00:00') {
                const [horas, minutos] = reg.horas.split(':').map(Number);
                totalHoras += horas;
                totalMinutos += minutos;
                diasTrabalhados++;
                
                // Verificar horas extras
                if (horas > JORNADA_DIARIA) {
                    horasExtras += (horas - JORNADA_DIARIA);
                    diasComHorasNormais++;
                } else if (horas === JORNADA_DIARIA && minutos > 0) {
                    minutosExtras += minutos;
                    diasComHorasNormais++;
                } else {
                    diasComHorasNormais++;
                }
            }
        });
        
        // Ajustar minutos para horas
        totalHoras += Math.floor(totalMinutos / 60);
        totalMinutos = totalMinutos % 60;
        
        minutosExtras += Math.floor((horasExtras - Math.floor(horasExtras)) * 60);
        horasExtras = Math.floor(horasExtras);
        minutosExtras = minutosExtras % 60;
        
        // Calcular dias úteis no mês (simulação simples)
        const diasUteis = calcularDiasUteis(mes, ano);
        
        // Calcular faltas
        const faltas = diasUteis - diasTrabalhados;
        
        // Calcular horas totais esperadas
        const horasEsperadas = diasUteis * JORNADA_DIARIA;
        
        return {
            totalHoras: totalHoras,
            totalMinutos: totalMinutos,
            diasTrabalhados: diasTrabalhados,
            diasComHorasNormais: diasComHorasNormais,
            horasExtras: horasExtras,
            minutosExtras: minutosExtras,
            diasUteis: diasUteis,
            faltas: faltas > 0 ? faltas : 0,
            horasEsperadas: horasEsperadas,
            saldoHoras: (totalHoras + (totalMinutos / 60)) - horasEsperadas
        };
    }
    
    // Calcular dias úteis no mês (simulação)
    function calcularDiasUteis(mes, ano) {
        // Em produção, calcularia considerando feriados e finais de semana
        // Aqui é uma simulação: 22 dias úteis por mês
        return 22;
    }
    
    // Exibir relatório na tela
    modulo.exibirRelatorio = function(estatisticas, mes, ano) {
        const resultadoDiv = document.getElementById('relatorioResultado');
        if (!resultadoDiv) return;
        
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        // Formatar saldo de horas
        const saldo = estatisticas.saldoHoras;
        let saldoTexto = '';
        let saldoClasse = '';
        
        if (saldo > 0) {
            const horas = Math.floor(saldo);
            const minutos = Math.round((saldo - horas) * 60);
            saldoTexto = `+${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
            saldoClasse = 'positivo';
        } else if (saldo < 0) {
            const horas = Math.floor(Math.abs(saldo));
            const minutos = Math.round((Math.abs(saldo) - horas) * 60);
            saldoTexto = `-${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
            saldoClasse = 'negativo';
        } else {
            saldoTexto = '00:00';
            saldoClasse = 'neutro';
        }
        
        resultadoDiv.innerHTML = `
            <div style="background: #E8F5E9; padding: 25px; border-radius: 12px; border: 1px solid #C8E6C9;">
                <h4 style="color: #1b5e20; margin-top: 0; border-bottom: 2px solid #C8E6C9; padding-bottom: 10px;">
                    📊 Relatório ${meses[mes-1]}/${ano}
                </h4>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 25px 0;">
                    <div style="text-align: center; background: white; padding: 20px; border-radius: 10px; border: 1px solid #C8E6C9;">
                        <div style="font-size: 2.2rem; color: #2E8B57; font-weight: bold; margin-bottom: 8px;">
                            ${estatisticas.diasTrabalhados}
                        </div>
                        <div style="color: #666; font-size: 0.9rem;">Dias trabalhados</div>
                    </div>
                    
                    <div style="text-align: center; background: white; padding: 20px; border-radius: 10px; border: 1px solid #C8E6C9;">
                        <div style="font-size: 2.2rem; color: #2E8B57; font-weight: bold; margin-bottom: 8px;">
                            ${estatisticas.totalHoras.toString().padStart(2, '0')}:${estatisticas.totalMinutos.toString().padStart(2, '0')}
                        </div>
                        <div style="color: #666; font-size: 0.9rem;">Total de horas</div>
                    </div>
                    
                    <div style="text-align: center; background: white; padding: 20px; border-radius: 10px; border: 1px solid #C8E6C9;">
                        <div style="font-size: 2.2rem; color: ${estatisticas.faltas > 0 ? '#f44336' : '#2E8B57'}; font-weight: bold; margin-bottom: 8px;">
                            ${estatisticas.faltas}
                        </div>
                        <div style="color: #666; font-size: 0.9rem;">Faltas</div>
                    </div>
                    
                    <div style="text-align: center; background: white; padding: 20px; border-radius: 10px; border: 1px solid #C8E6C9;">
                        <div style="font-size: 2.2rem; color: ${estatisticas.horasExtras > 0 ? '#FF9800' : '#2E8B57'}; font-weight: bold; margin-bottom: 8px;">
                            ${estatisticas.horasExtras.toString().padStart(2, '0')}:${estatisticas.minutosExtras.toString().padStart(2, '0')}
                        </div>
                        <div style="color: #666; font-size: 0.9rem;">Horas extras</div>
                    </div>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #C8E6C9; margin-top: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="color: #1b5e20; font-weight: bold; font-size: 1.1rem;">Saldo de horas</div>
                            <div style="color: #666; font-size: 0.9rem;">${saldo > 0 ? 'Horas extras' : saldo < 0 ? 'Horas devidas' : 'Em dia'}</div>
                        </div>
                        <div style="font-size: 1.8rem; font-weight: bold; color: ${saldoClasse === 'positivo' ? '#2E8B57' : saldoClasse === 'negativo' ? '#f44336' : '#666'};">
                            ${saldoTexto}
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 25px; text-align: center;">
                    <button onclick="window.funcionario.exportarRelatorio(${mes}, ${ano})" 
                            style="background: linear-gradient(45deg, #2E8B57, #388E3C); color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-weight: 600; margin-right: 10px;">
                        Exportar PDF
                    </button>
                    <button onclick="window.funcionario.exportarExcel(${mes}, ${ano})" 
                            style="background: linear-gradient(45deg, #1b5e20, #2E8B57); color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Exportar Excel
                    </button>
                </div>
            </div>
        `;
        
        window.utils?.mostrarMensagem(`Relatório ${meses[mes-1]}/${ano} gerado com sucesso!`, 'success');
    };
    
    // Exportar relatório para PDF
    modulo.exportarRelatorio = function(mes, ano) {
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        const relatorio = `
            RELATÓRIO DE PONTO ELETRÔNICO
            ===============================
            
            Funcionário: ${usuarioAtual?.nome || 'N/A'}
            Matrícula: ${usuarioAtual?.matricula || 'N/A'}
            Mês/Ano: ${meses[mes-1]}/${ano}
            Data de geração: ${new Date().toLocaleDateString('pt-BR')}
            
            RESUMO:
            - Dias trabalhados: [ver relatório na tela]
            - Total de horas: [ver relatório na tela]
            - Faltas: [ver relatório na tela]
            - Horas extras: [ver relatório na tela]
            
            Observação: Este é um relatório de demonstração.
            Em produção, os dados seriam mais detalhados e precisos.
            
            Assinatura:
            _______________________
            ${usuarioAtual?.nome || 'Funcionário'}
        `;
        
        window.utils?.downloadArquivo(
            `relatorio_${usuarioAtual?.nome?.replace(/\s+/g, '_')}_${mes}_${ano}.txt`,
            relatorio
        );
    };
    
    // Exportar para Excel
    modulo.exportarExcel = function(mes, ano) {
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'D
