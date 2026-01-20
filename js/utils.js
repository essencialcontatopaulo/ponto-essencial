// utils.js - Funções utilitárias do sistema
console.log("🛠️ Utilitários carregados!");

// Data e hora formatada
function getDataHoraAtual() {
    const agora = new Date();
    return {
        data: agora.toLocaleDateString('pt-BR'),
        hora: agora.toLocaleTimeString('pt-BR'),
        timestamp: agora.getTime()
    };
}

// Mostrar mensagem de status
function mostrarMensagem(texto, tipo = 'info') {
    const cores = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    console.log(`[${tipo.toUpperCase()}] ${texto}`);
    
    // Cria elemento de mensagem se não existir
    let mensagemDiv = document.getElementById('mensagemGlobal');
    if (!mensagemDiv) {
        mensagemDiv = document.createElement('div');
        mensagemDiv.id = 'mensagemGlobal';
        mensagemDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            display: none;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(mensagemDiv);
    }
    
    mensagemDiv.textContent = texto;
    mensagemDiv.style.background = cores[tipo] || cores.info;
    mensagemDiv.style.display = 'block';
    
    // Remove após 5 segundos
    setTimeout(() => {
        mensagemDiv.style.display = 'none';
    }, 5000);
}

// Verificar se está online
function verificarConexao() {
    if (!navigator.onLine) {
        mostrarMensagem('⚠️ Você está offline! Algumas funções podem não funcionar.', 'warning');
        return false;
    }
    return true;
}

// Formatar horas (de minutos para HH:MM)
function formatarHoras(minutos) {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Validar email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Carregar template
async function carregarTemplate(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Template não encontrado');
        return await response.text();
    } catch (error) {
        console.error('Erro ao carregar template:', error);
        return '';
    }
}

// Inicializar utilitários
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Utilitários inicializados!');
    console.log('📅', getDataHoraAtual());
    
    // Verificar conexão
    window.addEventListener('online', () => {
        mostrarMensagem('✅ Conexão restaurada!', 'success');
    });
    
    window.addEventListener('offline', () => {
        mostrarMensagem('⚠️ Você está offline!', 'warning');
    });
    
    verificarConexao();
});

// Exportar funções
window.utils = {
    getDataHoraAtual,
    mostrarMensagem,
    verificarConexao,
    formatarHoras,
    validarEmail,
    carregarTemplate
};
