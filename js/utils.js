// utils.js - Funções utilitárias para o sistema
window.utils = (function() {
    'use strict';
    
    const utils = {};
    
    // Formatar data para exibição
    utils.formatarData = function(data) {
        if (!data) return '--/--/----';
        const d = new Date(data);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };
    
    // Formatar hora
    utils.formatarHora = function(data) {
        if (!data) return '--:--';
        const d = new Date(data);
        return d.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    // Formatar data completa
    utils.formatarDataHora = function(data) {
        if (!data) return '--/--/---- --:--';
        const d = new Date(data);
        return d.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    // Mostrar mensagem ao usuário
    utils.mostrarMensagem = function(mensagem, tipo = 'info') {
        // Remover mensagens anteriores
        const mensagensAntigas = document.querySelectorAll('.custom-message');
        mensagensAntigas.forEach(msg => msg.remove());
        
        // Criar nova mensagem
        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `custom-message ${tipo}`;
        mensagemDiv.innerHTML = mensagem;
        
        // Estilos
        Object.assign(mensagemDiv.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: '#fff',
            zIndex: '9999',
            minWidth: '300px',
            maxWidth: '500px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
            animation: 'slideInRight 0.3s ease'
        });
        
        // Cores por tipo
        if (tipo === 'success') {
            mensagemDiv.style.background = 'linear-gradient(45deg, #2E8B57, #388E3C)';
            mensagemDiv.style.borderLeft = '4px solid #1b5e20';
        } else if (tipo === 'error') {
            mensagemDiv.style.background = 'linear-gradient(45deg, #d32f2f, #f44336)';
            mensagemDiv.style.borderLeft = '4px solid #b71c1c';
        } else if (tipo === 'warning') {
            mensagemDiv.style.background = 'linear-gradient(45deg, #ff9800, #ffb74d)';
            mensagemDiv.style.borderLeft = '4px solid #f57c00';
        } else {
            mensagemDiv.style.background = 'linear-gradient(45deg, #2196F3, #64B5F6)';
            mensagemDiv.style.borderLeft = '4px solid #1976D2';
        }
        
        // Adicionar ao corpo
        document.body.appendChild(mensagemDiv);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (mensagemDiv.parentNode) {
                mensagemDiv.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (mensagemDiv.parentNode) {
                        mensagemDiv.parentNode.removeChild(mensagemDiv);
                    }
                }, 300);
            }
        }, 5000);
        
        // Criar estilos de animação se não existirem
        if (!document.querySelector('#animacoes-estilo')) {
            const estilo = document.createElement('style');
            estilo.id = 'animacoes-estilo';
            estilo.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(estilo);
        }
    };
    
    // Gerar ID único
    utils.gerarId = function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };
    
    // Calcular horas trabalhadas
    utils.calcularHorasTrabalhadas = function(entrada, saida) {
        if (!entrada || !saida) return '00:00';
        
        const entradaMs = new Date(entrada).getTime();
        const saidaMs = new Date(saida).getTime();
        
        if (saidaMs <= entradaMs) return '00:00';
        
        const diffMs = saidaMs - entradaMs;
        const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${diffHoras.toString().padStart(2, '0')}:${diffMinutos.toString().padStart(2, '0')}`;
    };
    
    // Validar CPF
    utils.validarCPF = function(cpf) {
        cpf = cpf.replace(/\D/g, '');
        
        if (cpf.length !== 11) return false;
        
        // Verificar se todos os dígitos são iguais
        if (/^(\d)\1+$/.test(cpf)) return false;
        
        // Validar primeiro dígito
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let resto = 11 - (soma % 11);
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(9))) return false;
        
        // Validar segundo dígito
        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cpf.charAt(i)) * (11 - i);
        }
        resto = 11 - (soma % 11);
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    };
    
    // Formatar CPF
    utils.formatarCPF = function(cpf) {
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length <= 11) {
            return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return cpf;
    };
    
    // Formatar telefone
    utils.formatarTelefone = function(telefone) {
        telefone = telefone.replace(/\D/g, '');
        if (telefone.length === 11) {
            return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (telefone.length === 10) {
            return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return telefone;
    };
    
    // Salvar no localStorage com tratamento de erro
    utils.salvarLocalStorage = function(chave, dados) {
        try {
            localStorage.setItem(chave, JSON.stringify(dados));
            return true;
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
            utils.mostrarMensagem('Erro ao salvar dados localmente', 'error');
            return false;
        }
    };
    
    // Carregar do localStorage
    utils.carregarLocalStorage = function(chave) {
        try {
            const dados = localStorage.getItem(chave);
            return dados ? JSON.parse(dados) : null;
        } catch (error) {
            console.error('Erro ao carregar do localStorage:', error);
            return null;
        }
    };
    
    // Download de arquivo
    utils.downloadArquivo = function(nome, conteudo, tipo = 'text/plain') {
        const blob = new Blob([conteudo], { type: tipo });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nome;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    // Gerar relatório em PDF (simulação)
    utils.gerarPDF = function(titulo, conteudo) {
        utils.mostrarMensagem(`Gerando PDF: ${titulo}...`, 'info');
        
        // Em produção, integrar com biblioteca como jsPDF
        setTimeout(() => {
            const relatorio = `Relatório: ${titulo}\n\n${conteudo}`;
            utils.downloadArquivo(`${titulo}_${new Date().toISOString().split('T')[0]}.txt`, relatorio);
            utils.mostrarMensagem('Relatório gerado com sucesso!', 'success');
        }, 1000);
    };
    
    return utils;
})();
