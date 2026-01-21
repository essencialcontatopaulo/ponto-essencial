// funcionario.js - Sistema da Área do Funcionário
window.funcionario = (function() {
    'use strict';
    
    const modulo = {};
    let usuarioAtual = null;
    let registros = [];
    
    // Coordenadas da empresa (exemplo: São Paulo)
    const LOCAL_EMPRESA = {
        latitude: -23.550520,
        longitude: -46.633308,
        raioMaximo: 100 // metros
    };
    
    modulo.inicializar = function() {
        console.log("👨‍💼 Módulo funcionário inicializado");
        
        usuarioAtual = window.auth?.getCurrentUser();
        if (!usuarioAtual) {
            window.location.href = 'index.html';
            return false;
        }
        
        carregarDados();
        configurarEventos();
        atualizarInterface();
        iniciarRelogio();
        
        return true;
    };
    
    function carregarDados() {
        registros = JSON.parse(localStorage.getItem('registros_ponto') || '[]');
        registros = registros.filter(r => r.usuarioId === usuarioAtual.id);
        registros.sort((a, b) => new Date(b.data) - new Date(a.data));
    }
    
    function configurarEventos() {
        const btnSair = document.getElementById('sairBtn');
        if (btnSair) {
            btnSair.addEventListener('click', function() {
                if (confirm('Deseja realmente sair do sistema?')) {
                    window.auth?.logout();
                }
            });
        }
        
        const btnEntrada = document.getElementById('btnEntrada');
        if (btnEntrada) {
            btnEntrada.addEventListener('click', function() {
                modulo.registrarEntrada();
            });
        }
        
        const btnSaida = document.getElementById('btnSaida');
        if (btnSaida) {
            btnSaida.addEventListener('click', function() {
                modulo.registrarSaida();
            });
        }
        
        const filtroMes = document.getElementById('filtroMes');
        if (filtroMes) {
            filtroMes.addEventListener('change', function() {
                modulo.filtrarRegistros(this.value);
            });
        }
        
        const btnRelatorio = document.getElementById('btnGerarRelatorio');
        if (btnRelatorio) {
            btnRelatorio.addEventListener('click', function() {
                modulo.gerarRelatorioMensal();
            });
        }
        
        const formJustificativa = document.getElementById('formJustificativa');
        if (formJustificativa) {
            formJustificativa.addEventListener('submit', function(e) {
                e.preventDefault();
                modulo.enviarJustificativa();
            });
        }
        
        const dataJustificativa = document.getElementById('dataJustificativa');
        if (dataJustificativa) {
            dataJustificativa.value = new Date().toISOString().split('T')[0];
        }
    }
    
    function atualizarInterface() {
        atualizarInformacoesUsuario();
        atualizarTabelaRegistros();
        atualizarUltimoRegistro();
    }
    
    function atualizarInformacoesUsuario() {
        if (!usuarioAtual) return;
        
        const nomeElement = document.getElementById('funcionarioNome');
        const emailElement = document.getElementById('funcionarioEmail');
        const cargoElement = document.getElementById('funcionarioCargo');
        
        if (nomeElement) nomeElement.textContent = usuarioAtual.nome;
        if (emailElement) emailElement.textContent = usuarioAtual.email;
        if (cargoElement) cargoElement.textContent = usuarioAtual.cargo || 'Funcionário';
    }
    
    function iniciarRelogio() {
        function atualizarRelogio() {
            const agora = new Date();
            const horaElement = document.getElementById('horaAtual');
            const dataElement = document.getElementById('dataAtual');
            
            if (horaElement) {
                horaElement.textContent = agora.toLocaleTimeString('pt-BR');
            }
            
            if (dataElement) {
                dataElement.textContent = agora.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        }
        
        atualizarRelogio();
        setInterval(atualizarRelogio, 1000);
    }
    
    modulo.registrarEntrada = async function() {
        if (!usuarioAtual) return;
        
        try {
            // Obter localização
            const localizacao = await window.utils?.obterLocalizacao();
            
            if (!localizacao) {
                if (confirm('Não foi possível obter sua localização. Deseja registrar mesmo assim?')) {
                    salvarRegistro('entrada', null);
                }
                return;
            }
            
            // Verificar proximidade
            const proximidade = window.utils?.verificarProximidade(
                localizacao.latitude,
                localizacao.longitude,
                LOCAL_EMPRESA.latitude,
                LOCAL_EMPRESA.longitude,
                LOCAL_EMPRESA.raioMaximo
            );
            
            if (proximidade.dentroDoRaio) {
                // Dentro do raio permitido - registrar
                salvarRegistro('entrada', localizacao);
                window.utils?.mostrarMensagem(
                    `✅ Entrada registrada com sucesso! ${proximidade.mensagem}`,
                    'success'
                );
            } else {
                // Fora do raio - pedir confirmação
                if (confirm(
                    `Você está ${proximidade.distancia.formatado} da empresa.\n` +
                    `Deseja registrar a entrada mesmo assim?`
                )) {
                    salvarRegistro('entrada', localizacao);
                    window.utils?.mostrarMensagem(
                        `⚠️ Entrada registrada fora do local habitual`,
                        'warning'
                    );
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao registrar entrada:', error);
            
            if (confirm(`Erro na localização: ${error.message}\nDeseja registrar mesmo assim?`)) {
                salvarRegistro('entrada', null);
            }
        }
    };
    
    modulo.registrarSaida = async function() {
        if (!usuarioAtual) return;
        
        try {
            // Obter localização
            const localizacao = await window.utils?.obterLocalizacao();
            
            if (!localizacao) {
                if (confirm('Não foi possível obter sua localização. Deseja registrar mesmo assim?')) {
                    salvarRegistro('saida', null);
                }
                return;
            }
            
            // Registrar saída
            salvarRegistro('saida', localizacao);
            
            window.utils?.mostrarMensagem(
                `✅ Saída registrada com sucesso!`,
                'success'
            );
            
        } catch (error) {
            console.error('❌ Erro ao registrar saída:', error);
            
            if (confirm(`Erro na localização: ${error.message}\nDeseja registrar mesmo assim?`)) {
                salvarRegistro('saida', null);
            }
        }
    };
    
    function salvarRegistro(tipo, localizacao) {
        const agora = new Date();
        const hoje = agora.toISOString().split('T')[0];
        const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        let todosRegistros = JSON.parse(localStorage.getItem('registros_ponto') || '[]');
        
        let registroHoje = todosRegistros.find(r => 
            r.usuarioId === usuarioAtual.id && 
            r.data.split('T')[0] === hoje
        );
        
        if (!registroHoje) {
            registroHoje = {
                id: 'reg_' + Date.now(),
                usuarioId: usuarioAtual.id,
                usuarioNome: usuarioAtual.nome,
                data: agora.toISOString(),
                entrada: tipo === 'entrada' ? hora : null,
                saida: tipo === 'saida' ? hora : null,
                horas: '00:00',
                status: tipo === 'entrada' ? 'pendente' : 'completo',
                metodo: 'localizacao',
                localizacao: localizacao ? {
                    latitude: localizacao.latitude,
                    longitude: localizacao.longitude,
                    precisao: localizacao.precisao,
                    timestamp: localizacao.timestamp
                } : null
            };
            todosRegistros.push(registroHoje);
        } else {
            if (tipo === 'entrada') {
                registroHoje.entrada = hora;
                registroHoje.status = 'pendente';
                registroHoje.metodo = 'localizacao';
                registroHoje.localizacao = localizacao ? {
                    latitude: localizacao.latitude,
                    longitude: localizacao.longitude,
                    precisao: localizacao.precisao,
                    timestamp: localizacao.timestamp
                } : null;
            } else if (tipo === 'saida') {
                registroHoje.saida = hora;
                registroHoje.metodo = 'localizacao';
                
                if (registroHoje.entrada) {
                    const horasTrabalhadas = calcularHorasTrabalhadas(registroHoje.entrada, hora);
                    registroHoje.horas = horasTrabalhadas;
                    registroHoje.status = 'completo';
                } else {
                    registroHoje.status = 'saida_sem_entrada';
                }
                
                // Adicionar localização da saída
                if (localizacao) {
                    registroHoje.localizacaoSaida = {
                        latitude: localizacao.latitude,
                        longitude: localizacao.longitude,
                        precisao: localizacao.precisao,
                        timestamp: localizacao.timestamp
                    };
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
        atualizarInterface();
    }
    
    function calcularHorasTrabalhadas(entrada, saida) {
        if (!entrada || !saida) return '00:00';
        
        try {
            const hoje = new Date().toISOString().split('T')[0];
            const entradaDate = new Date(`${hoje} ${entrada}`);
            const saidaDate = new Date(`${hoje} ${saida}`);
            
            if (saidaDate < entradaDate) {
                saidaDate.setDate(saidaDate.getDate() + 1);
            }
            
            const diffMs = saidaDate - entradaDate;
            const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            return `${diffHoras.toString().padStart(2, '0')}:${diffMinutos.toString().padStart(2, '0')}`;
            
        } catch (error) {
            console.error('❌ Erro ao calcular horas:', error);
            return '00:00';
        }
    }
    
    modulo.filtrarRegistros = function(mes) {
        let registrosFiltrados = [...registros];
        
        if (mes !== 'todos') {
            registrosFiltrados = registros.filter(r => {
                const dataRegistro = new Date(r.data);
                return (dataRegistro.getMonth() + 1) === parseInt(mes);
            });
        }
        
        atualizarTabelaRegistros(registrosFiltrados);
        
        if (window.utils) {
            window.utils.mostrarMensagem(
                `Mostrando ${registrosFiltrados.length} registros`,
                'info'
            );
        }
    };
    
    function atualizarTabelaRegistros(listaRegistros = registros) {
        const tbody = document.getElementById('tabelaPontosBody');
        if (!tbody) return;
        
        if (listaRegistros.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #888;">
                        Nenhum registro encontrado.
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        
        listaRegistros.forEach(registro => {
            // Formatar status
            let statusHTML = '';
            if (registro.status === 'completo') {
                statusHTML = '<span style="color: #2E8B57; font-weight: bold;">✅ Completo</span>';
            } else if (registro.status === 'pendente') {
                statusHTML = '<span style="color: #FF9800; font-weight: bold;">⏱️ Pendente</span>';
            } else if (registro.status === 'saida_sem_entrada') {
                statusHTML = '<span style="color: #f44336; font-weight: bold;">⚠️ Sem entrada</span>';
            }
            
            // Adicionar ícone de localização se disponível
            let localizacaoHTML = '';
            if (registro.localizacao) {
                localizacaoHTML = '📍';
            }
            
            html += `
                <tr>
                    <td>${window.utils?.formatarData(registro.data) || '--/--/----'}</td>
                    <td style="color: #2E8B57; font-weight: bold;">${registro.entrada || '--:--'}</td>
                    <td style="color: #1b5e20; font-weight: bold;">${registro.saida || '--:--'}</td>
                    <td>${registro.horas || '00:00'}</td>
                    <td>${statusHTML}</td>
                    <td style="text-align: center;">${localizacaoHTML}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }
    
    function atualizarUltimoRegistro() {
        const ultimoRegistroElement = document.getElementById('ultimoRegistro');
        if (!ultimoRegistroElement) return;
        
        const hoje = new Date().toDateString();
        const registrosHoje = registros.filter(r => 
            new Date(r.data).toDateString() === hoje
        );
        
        if (registrosHoje.length > 0) {
            const ultimo = registrosHoje[0];
            const hora = ultimo.entrada || ultimo.saida;
            const tipo = ultimo.entrada ? 'Entrada' : 'Saída';
            ultimoRegistroElement.textContent = `${tipo} às ${hora}`;
        } else {
            ultimoRegistroElement.textContent = 'Nenhum registro hoje';
        }
    }
    
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
        exibirRelatorio(estatisticas, mes, ano);
    };
    
    function calcularEstatisticas(registrosMes, mes, ano) {
        let totalHoras = 0;
        let totalMinutos = 0;
        let diasTrabalhados = 0;
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
                } else if (horas === JORNADA_DIARIA && minutos > 0) {
                    minutosExtras += minutos;
                }
            }
        });
        
        // Ajustar minutos para horas
        totalHoras += Math.floor(totalMinutos / 60);
        totalMinutos = totalMinutos % 60;
        
        minutosExtras += Math.floor((horasExtras - Math.floor(horasExtras)) * 60);
        horasExtras = Math.floor(horasExtras);
        minutosExtras = minutosExtras % 60;
        
        // Calcular dias úteis no mês
        const diasUteis = calcularDiasUteis(mes, ano);
        
        // Calcular faltas
        const faltas = diasUteis - diasTrabalhados;
        
        // Calcular horas totais esperadas
        const horasEsperadas = diasUteis * JORNADA_DIARIA;
        
        return {
            totalHoras: totalHoras,
            totalMinutos: totalMinutos,
            diasTrabalhados: diasTrabalhados,
            horasExtras: horasExtras,
            minutosExtras: minutosExtras,
            diasUteis: diasUteis,
            faltas: faltas > 0 ? faltas : 0,
            horasEsperadas: horasEsperadas,
            saldoHoras: (totalHoras + (totalMinutos / 60)) - horasEsperadas
        };
    }
    
    function calcularDiasUteis(mes, ano) {
        // Em produção, calcularia considerando feriados e finais de semana
        // Aqui é uma simulação: 22 dias úteis por mês
        return 22;
    }
    
    function exibirRelatorio(estatisticas, mes, ano) {
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
        
        if (window.utils) {
            window.utils.mostrarMensagem(`Relatório ${meses[mes-1]}/${ano} gerado com sucesso!`, 'success');
        }
    }
    
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
- Dias trabalhados: Ver relatório na tela
- Total de horas: Ver relatório na tela
- Faltas: Ver relatório na tela
- Horas extras: Ver relatório na tela

Observação: Registros realizados por localização GPS.
Em produção, os dados seriam mais detalhados e precisos.

Assinatura:
_______________________
${usuarioAtual?.nome || 'Funcionário'}
        `;
        
        if (window.utils) {
            window.utils.downloadArquivo(
                `relatorio_${usuarioAtual?.nome?.replace(/\s+/g, '_')}_${mes}_${ano}.txt`,
                relatorio
            );
        }
    };
    
    modulo.exportarExcel = function(mes, ano) {
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        // Criar CSV
        let csv = 'Data,Entrada,Saída,Horas,Status,Localização\n';
        
        const registrosMes = registros.filter(r => {
            const dataRegistro = new Date(r.data);
            return (dataRegistro.getMonth() + 1) === mes && 
                   dataRegistro.getFullYear() === ano;
        });
        
        registrosMes.forEach(reg => {
            const localizacao = reg.localizacao ? 'Sim' : 'Não';
            csv += `"${window.utils?.formatarData(reg.data)}","${reg.entrada || ''}","${reg.saida || ''}","${reg.horas || ''}","${reg.status || ''}","${localizacao}"\n`;
        });
        
        if (window.utils) {
            window.utils.downloadArquivo(
                `registros_${usuarioAtual?.nome?.replace(/\s+/g, '_')}_${mes}_${ano}.csv`,
                csv,
                'text/csv'
            );
        }
    };
    
    modulo.enviarJustificativa = function() {
        const tipo = document.getElementById('tipoJustificativa').value;
        const data = document.getElementById('dataJustificativa').value;
        const descricao = document.getElementById('descricaoJustificativa').value;
        
        if (!tipo || !data || !descricao) {
            if (window.utils) {
                window.utils.mostrarMensagem('Preencha todos os campos obrigatórios!', 'error');
            }
            return;
        }
        
        // Carregar justificativas existentes
        let justificativas = JSON.parse(localStorage.getItem('justificativas') || '[]');
        
        // Adicionar nova justificativa
        const novaJustificativa = {
            id: 'just_' + Date.now(),
            usuarioId: usuarioAtual.id,
            usuarioNome: usuarioAtual.nome,
            tipo: tipo,
            data: data,
            descricao: descricao,
            dataEnvio: new Date().toISOString(),
            status: 'pendente'
        };
        
        justificativas.push(novaJustificativa);
        localStorage.setItem('justificativas', JSON.stringify(justificativas));
        
        // Limpar formulário
        document.getElementById('formJustificativa').reset();
        document.getElementById('dataJustificativa').value = new Date().toISOString().split('T')[0];
        
        // Mostrar mensagem
        if (window.utils) {
            window.utils.mostrarMensagem(
                'Justificativa enviada com sucesso! Aguarde aprovação do gestor.',
                'success'
            );
        }
    };
    
    // Inicializar automaticamente
    document.addEventListener('DOMContentLoaded', function() {
        modulo.inicializar();
    });
    
    return modulo;
})();
