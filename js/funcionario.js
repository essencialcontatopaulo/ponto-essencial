// funcionario.js - Funcionalidades do funcionário
console.log("👨‍💼 Módulo do funcionário carregado!");

document.addEventListener('DOMContentLoaded', function() {
    console.log("📋 Inicializando área do funcionário...");
    
    // Verificar autenticação
    const usuario = window.auth?.verificarLogin();
    if (!usuario) {
        window.utils?.mostrarMensagem('⚠️ Faça login para acessar esta área!', 'warning');
        setTimeout(() => window.location.href = 'login.html', 2000);
        return;
    }
    
    // Configurar botões
    configurarBotoesFuncionario();
    
    // Carregar dados do funcionário
    carregarDadosFuncionario(usuario.email);
    
    // Carregar registros de ponto
    carregarRegistrosPonto();
});

// Configurar botões específicos do funcionário
function configurarBotoesFuncionario() {
    // Botão de bater ponto
    const baterPontoBtn = document.getElementById('baterPontoBtn');
    if (baterPontoBtn) {
        baterPontoBtn.addEventListener('click', baterPonto);
    }
    
    // Botão de histórico
    const historicoBtn = document.getElementById('historicoBtn');
    if (historicoBtn) {
        historicoBtn.addEventListener('click', mostrarHistorico);
    }
    
    // Botão de sair
    const sairBtn = document.getElementById('sairBtn');
    if (sairBtn) {
        sairBtn.addEventListener('click', () => {
            window.auth?.logout();
        });
    }
    
    // Botão de reconhecimento facial
    const facialBtn = document.getElementById('facialBtn');
    if (facialBtn) {
        facialBtn.addEventListener('click', () => {
            window.app?.iniciarReconhecimentoFacial();
        });
    }
}

// Bater ponto
async function baterPonto() {
    const usuario = window.auth?.verificarLogin();
    if (!usuario) return;
    
    const agora = window.utils?.getDataHoraAtual();
    
    // Determinar tipo de registro (entrada/saída)
    const ultimoRegistro = await getUltimoRegistro(usuario.email);
    let tipo = 'entrada';
    
    if (ultimoRegistro && !ultimoRegistro.saida) {
        tipo = 'saida';
    }
    
    // Criar registro
    const registro = {
        funcionarioEmail: usuario.email,
        funcionarioNome: usuario.nome,
        data: agora.data,
        [tipo]: agora.hora,
        timestamp: agora.timestamp,
        localizacao: await getLocalizacao(),
        metodo: 'web'
    };
    
    // Salvar no Firebase
    const resultado = await window.firebaseConfig?.salvarRegistro('pontos', registro);
    
    if (resultado?.success) {
        window.utils?.mostrarMensagem(
            `✅ Ponto ${tipo === 'entrada' ? 'registrado' : 'finalizado'} às ${agora.hora}!`,
            'success'
        );
        
        // Atualizar interface
        carregarRegistrosPonto();
        
        // Atualizar botão
        const baterPontoBtn = document.getElementById('baterPontoBtn');
        if (baterPontoBtn) {
            baterPontoBtn.textContent = tipo === 'entrada' ? '🔄 Registrar Saída' : '📍 Registrar Entrada';
            baterPontoBtn.style.background = tipo === 'entrada' ? '#dc3545' : '#28a745';
        }
        
    } else {
        window.utils?.mostrarMensagem('❌ Erro ao registrar ponto!', 'error');
    }
}

// Buscar último registro
async function getUltimoRegistro(email) {
    try {
        const registros = await window.firebaseConfig?.buscarRegistros('pontos', {
            campo: 'funcionarioEmail',
            operador: '==',
            valor: email
        });
        
        // Ordenar por timestamp e pegar o mais recente
        if (registros && registros.length > 0) {
            return registros.sort((a, b) => b.timestamp - a.timestamp)[0];
        }
        
    } catch (error) {
        console.error("Erro ao buscar registros:", error);
    }
    
    return null;
}

// Carregar dados do funcionário
async function carregarDadosFuncionario(email) {
    try {
        const funcionarios = await window.firebaseConfig?.buscarRegistros('funcionarios', {
            campo: 'email',
            operador: '==',
            valor: email
        });
        
        if (funcionarios && funcionarios.length > 0) {
            const funcionario = funcionarios[0];
            
            // Atualizar interface
            const nomeElement = document.getElementById('funcionarioNome');
            const cargoElement = document.getElementById('funcionarioCargo');
            const emailElement = document.getElementById('funcionarioEmail');
            
            if (nomeElement) nomeElement.textContent = funcionario.nome;
            if (cargoElement) cargoElement.textContent = funcionario.cargo || 'Funcionário';
            if (emailElement) emailElement.textContent = funcionario.email;
            
            // Verificar status do ponto
            const ultimoRegistro = await getUltimoRegistro(email);
            const baterPontoBtn = document.getElementById('baterPontoBtn');
            
            if (baterPontoBtn) {
                if (ultimoRegistro && !ultimoRegistro.saida) {
                    baterPontoBtn.textContent = '🔄 Registrar Saída';
                    baterPontoBtn.style.background = '#dc3545';
                } else {
                    baterPontoBtn.textContent = '📍 Registrar Entrada';
                    baterPontoBtn.style.background = '#28a745';
                }
            }
        }
        
    } catch (error) {
        console.warn("Usando dados simulados do funcionário");
        
        // Dados simulados
        const nomeElement = document.getElementById('funcionarioNome');
        const cargoElement = document.getElementById('funcionarioCargo');
        
        if (nomeElement) nomeElement.textContent = 'Funcionário de Teste';
        if (cargoElement) cargoElement.textContent = 'Desenvolvedor';
    }
}

// Carregar registros de ponto
async function carregarRegistrosPonto() {
    const usuario = window.auth?.verificarLogin();
    if (!usuario) return;
    
    try {
        const registros = await window.firebaseConfig?.buscarRegistros('pontos', {
            campo: 'funcionarioEmail',
            operador: '==',
            valor: usuario.email
        });
        
        const tabela = document.getElementById('tabelaPontos');
        if (!tabela) return;
        
        // Limpar tabela (exceto cabeçalho)
        while (tabela.rows.length > 1) {
            tabela.deleteRow(1);
        }
        
        // Ordenar por data (mais recente primeiro)
        const registrosOrdenados = registros?.sort((a, b) => b.timestamp - a.timestamp) || [];
        
        // Adicionar linhas
        registrosOrdenados.slice(0, 10).forEach(registro => {
            const row = tabela.insertRow();
            
            // Calcular horas trabalhadas
            let horasTrabalhadas = '--:--';
            if (registro.entrada && registro.saida) {
                const entradaMin = timeToMinutes(registro.entrada);
                const saidaMin = timeToMinutes(registro.saida);
                const totalMin = saidaMin - entradaMin;
                horasTrabalhadas = window.utils?.formatarHoras(totalMin) || '--:--';
            }
            
            row.innerHTML = `
                <td>${registro.data}</td>
                <td>${registro.entrada || '--:--'}</td>
                <td>${registro.saida || '--:--'}</td>
                <td>${horasTrabalhadas}</td>
                <td>${registro.metodo || 'Web'}</td>
            `;
        });
        
    } catch (error) {
        console.error("Erro ao carregar registros:", error);
    }
}

// Mostrar histórico completo
function mostrarHistorico() {
    window.utils?.mostrarMensagem('📊 Carregando histórico completo...', 'info');
    // Em implementação real, abriria uma nova página ou modal
}

// Obter localização (simulação)
async function getLocalizacao() {
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        precisao: position.coords.accuracy
                    });
                },
                () => {
                    resolve({ lat: null, lng: null, erro: 'Permissão negada' });
                }
            );
        } else {
            resolve({ lat: null, lng: null, erro: 'Não suportado' });
        }
    });
}

// Converter tempo HH:MM para minutos
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Exportar
window.funcionarioModule = {
    baterPonto,
    carregarDadosFuncionario,
    carregarRegistrosPonto,
    mostrarHistorico
};
