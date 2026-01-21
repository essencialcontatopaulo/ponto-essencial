// utils.js - Utilitários do Sistema
window.utils = (function() {
    'use strict';
    
    const utils = {};
    
    utils.formatarData = function(data) {
        if (!data) return '--/--/----';
        try {
            const d = new Date(data);
            return d.toLocaleDateString('pt-BR');
        } catch {
            return '--/--/----';
        }
    };
    
    utils.formatarHora = function(data) {
        if (!data) return '--:--';
        try {
            const d = new Date(data);
            return d.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '--:--';
        }
    };
    
    utils.formatarDataHora = function(data) {
        if (!data) return '--/--/---- --:--';
        try {
            const d = new Date(data);
            return d.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '--/--/---- --:--';
        }
    };
    
    utils.formatarCPF = function(cpf) {
        if (!cpf) return '';
        cpf = cpf.replace(/\D/g, '');
        
        if (cpf.length === 11) {
            return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return cpf;
    };
    
    utils.formatarTelefone = function(tel) {
        if (!tel) return '';
        tel = tel.replace(/\D/g, '');
        
        if (tel.length === 11) {
            return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (tel.length === 10) {
            return tel.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return tel;
    };
    
    utils.formatarMoeda = function(valor) {
        if (!valor && valor !== 0) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };
    
    utils.validarCPF = function(cpf) {
        cpf = cpf.replace(/\D/g, '');
        
        if (cpf.length !== 11) return false;
        if (/^(\d)\1+$/.test(cpf)) return false;
        
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let resto = 11 - (soma % 11);
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(9))) return false;
        
        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cpf.charAt(i)) * (11 - i);
        }
        resto = 11 - (soma % 11);
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    };
    
    utils.validarEmail = function(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };
    
    utils.validarSenha = function(senha) {
        return senha && senha.length >= 6;
    };
    
    utils.salvarLocalStorage = function(chave, dados) {
        try {
            localStorage.setItem(chave, JSON.stringify(dados));
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar no localStorage:', error);
            utils.mostrarMensagem('Erro ao salvar dados localmente', 'error');
            return false;
        }
    };
    
    utils.carregarLocalStorage = function(chave) {
        try {
            const dados = localStorage.getItem(chave);
            return dados ? JSON.parse(dados) : null;
        } catch (error) {
            console.error('❌ Erro ao carregar do localStorage:', error);
            return null;
        }
    };
    
    utils.gerarId = function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    };
    
    utils.mostrarMensagem = function(mensagem, tipo = 'info', duracao = 5000) {
        const mensagensAntigas = document.querySelectorAll('.custom-message');
        mensagensAntigas.forEach(msg => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
        
        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `custom-message ${tipo}`;
        mensagemDiv.innerHTML = mensagem;
        
        Object.assign(mensagemDiv.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: '#fff',
            zIndex: '99999',
            minWidth: '300px',
            maxWidth: '500px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
            animation: 'slideInRight 0.3s ease',
            fontWeight: '500',
            fontSize: '14px'
        });
        
        const cores = {
            success: { bg: '#2E8B57', border: '#1b5e20' },
            error: { bg: '#f44336', border: '#d32f2f' },
            warning: { bg: '#ff9800', border: '#f57c00' },
            info: { bg: '#2196F3', border: '#1976D2' }
        };
        
        const cor = cores[tipo] || cores.info;
        mensagemDiv.style.background = `linear-gradient(45deg, ${cor.bg}, ${cor.border})`;
        mensagemDiv.style.borderLeft = `4px solid ${cor.border}`;
        
        document.body.appendChild(mensagemDiv);
        
        if (!document.querySelector('#animacoes-estilo')) {
            const estilo = document.createElement('style');
            estilo.id = 'animacoes-estilo';
            estilo.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(estilo);
        }
        
        setTimeout(() => {
            if (mensagemDiv.parentNode) {
                mensagemDiv.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (mensagemDiv.parentNode) {
                        mensagemDiv.parentNode.removeChild(mensagemDiv);
                    }
                }, 300);
            }
        }, duracao);
        
        mensagemDiv.addEventListener('click', function() {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        });
    };
    
    utils.downloadArquivo = function(nome, conteudo, tipo = 'text/plain') {
        try {
            const blob = new Blob([conteudo], { type: tipo });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = nome;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('❌ Erro ao baixar arquivo:', error);
            utils.mostrarMensagem('Erro ao baixar arquivo', 'error');
            return false;
        }
    };
    
    utils.exportarCSV = function(nome, dados, cabecalhos) {
        let csv = '';
        
        if (cabecalhos && cabecalhos.length > 0) {
            csv += cabecalhos.map(h => `"${h}"`).join(',') + '\n';
        }
        
        dados.forEach(linha => {
            if (Array.isArray(linha)) {
                csv += linha.map(campo => `"${campo}"`).join(',') + '\n';
            } else if (typeof linha === 'object') {
                csv += Object.values(linha).map(valor => `"${valor}"`).join(',') + '\n';
            }
        });
        
        utils.downloadArquivo(`${nome}.csv`, csv, 'text/csv');
    };
    
    utils.calcularHorasTrabalhadas = function(entrada, saida) {
        if (!entrada || !saida) return '00:00';
        
        try {
            const entradaDate = new Date(entrada);
            const saidaDate = new Date(saida);
            
            if (saidaDate <= entradaDate) return '00:00';
            
            const diffMs = saidaDate - entradaDate;
            const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            return `${diffHoras.toString().padStart(2, '0')}:${diffMinutos.toString().padStart(2, '0')}`;
            
        } catch (error) {
            console.error('❌ Erro ao calcular horas:', error);
            return '00:00';
        }
    };
    
    utils.calcularSaldoHoras = function(horasTrabalhadas, horasContratuais) {
        const [htH, htM] = horasTrabalhadas.split(':').map(Number);
        const [hcH, hcM] = horasContratuais.split(':').map(Number);
        
        const totalHT = htH + (htM / 60);
        const totalHC = hcH + (hcM / 60);
        const saldo = totalHT - totalHC;
        
        const horas = Math.floor(Math.abs(saldo));
        const minutos = Math.round((Math.abs(saldo) - horas) * 60);
        
        return {
            saldo: saldo,
            positivo: saldo > 0,
            texto: `${saldo >= 0 ? '+' : '-'}${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`
        };
    };
    
    utils.mostrarLoading = function(mensagem = 'Carregando...') {
        utils.esconderLoading();
        
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loadingOverlay';
        
        overlay.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                z-index: 99998;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    text-align: center;
                    min-width: 200px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 3px solid #f3f3f3;
                        border-top: 3px solid #2E8B57;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 15px;
                    "></div>
                    <div style="color: #333; font-weight: 500;">${mensagem}</div>
                </div>
            </div>
        `;
        
        if (!document.querySelector('#loading-animation')) {
            const style = document.createElement('style');
            style.id = 'loading-animation';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(overlay);
    };
    
    utils.esconderLoading = function() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    };
    
    utils.criarModal = function(titulo, conteudo, opcoes = {}) {
        const config = {
            largura: '500px',
            fecharAoClicarFora: true,
            mostrarBotaoFechar: true,
            ...opcoes
        };
        
        utils.fecharModal();
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'customModal';
        
        overlay.innerHTML = `
            <div class="modal-content" style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: ${config.largura};
                width: 90%;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                border: 1px solid #C8E6C9;
                animation: slideUp 0.3s ease;
            ">
                ${config.mostrarBotaoFechar ? `
                    <button class="fechar-modal" style="
                        position: absolute;
                        top: 15px;
                        right: 15px;
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                    ">×</button>
                ` : ''}
                
                ${titulo ? `<h3 style="color: #1b5e20; margin-bottom: 20px; margin-top: 0;">${titulo}</h3>` : ''}
                
                <div class="modal-body">
                    ${conteudo}
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const fecharBtn = overlay.querySelector('.fechar-modal');
        if (fecharBtn) {
            fecharBtn.addEventListener('click', utils.fecharModal);
        }
        
        if (config.fecharAoClicarFora) {
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    utils.fecharModal();
                }
            });
        }
        
        if (!document.querySelector('#modal-animation')) {
            const style = document.createElement('style');
            style.id = 'modal-animation';
            style.textContent = `
                @keyframes slideUp {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    z-index: 99997;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `;
            document.head.appendChild(style);
        }
        
        return overlay;
    };
    
    utils.fecharModal = function() {
        const modal = document.getElementById('customModal');
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    };
    
    utils.copiarParaAreaTransferencia = function(texto) {
        return new Promise((resolve, reject) => {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = texto;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                textarea.setSelectionRange(0, 99999);
                
                const sucesso = document.execCommand('copy');
                document.body.removeChild(textarea);
                
                if (sucesso) {
                    utils.mostrarMensagem('Copiado para a área de transferência!', 'success');
                    resolve(true);
                } else {
                    reject(new Error('Falha ao copiar'));
                }
            } catch (error) {
                reject(error);
            }
        });
    };
    
    utils.obterLocalizacao = function() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalização não suportada'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        precisao: position.coords.accuracy,
                        timestamp: new Date(position.timestamp)
                    });
                },
                (error) => {
                    let mensagem = 'Erro ao obter localização';
                    
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            mensagem = 'Permissão de localização negada';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            mensagem = 'Localização indisponível';
                            break;
                        case error.TIMEOUT:
                            mensagem = 'Tempo limite excedido';
                            break;
                    }
                    
                    reject(new Error(mensagem));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    };
    
    utils.calcularDistancia = function(lat1, lon1, lat2, lon2) {
        const R = 6371; // Raio da Terra em km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distancia = R * c;
        
        return {
            km: distancia,
            metros: distancia * 1000,
            formatado: distancia < 1 ? 
                `${(distancia * 1000).toFixed(0)} metros` : 
                `${distancia.toFixed(2)} km`
        };
    };
    
    utils.obterEnderecoPorCoordenadas = async function(latitude, longitude) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            
            if (!response.ok) {
                throw new Error('Erro ao buscar endereço');
            }
            
            const data = await response.json();
            
            return {
                endereco: data.display_name || 'Endereço não disponível',
                rua: data.address?.road || '',
                numero: data.address?.house_number || '',
                bairro: data.address?.suburb || data.address?.neighbourhood || '',
                cidade: data.address?.city || data.address?.town || data.address?.village || '',
                estado: data.address?.state || '',
                cep: data.address?.postcode || '',
                pais: data.address?.country || ''
            };
            
        } catch (error) {
            console.error('❌ Erro ao obter endereço:', error);
            return {
                endereco: 'Localização não disponível',
                erro: error.message
            };
        }
    };
    
    utils.verificarProximidade = function(latUsuario, lonUsuario, latEmpresa, lonEmpresa, raioMaximoMetros = 100) {
        const distancia = utils.calcularDistancia(latUsuario, lonUsuario, latEmpresa, lonEmpresa);
        
        return {
            dentroDoRaio: distancia.metros <= raioMaximoMetros,
            distancia: distancia,
            mensagem: distancia.metros <= raioMaximoMetros ? 
                `✅ Dentro do raio permitido (${distancia.formatado})` :
                `❌ Fora do raio permitido (${distancia.formatado})`
        };
    };
    
    utils.formatarLocalizacao = function(localizacao) {
        if (!localizacao) return 'Localização não disponível';
        
        return `📍 Lat: ${localizacao.latitude.toFixed(6)}, Lon: ${localizacao.longitude.toFixed(6)}`;
    };
    
    return utils;
})();
