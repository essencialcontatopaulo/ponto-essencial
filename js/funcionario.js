// Aplicação do Funcionário - Versão Completa
const funcionarioApp = {
    // Estado
    estado: {
        usuario: null,
        dadosUsuario: null,
        localizacao: null,
        registrosHoje: [],
        registrosSemana: [],
        emTrabalho: false,
        intervaloAtualizacao: null
    },

    // Inicialização
    init: function() {
        console.log('Aplicação do funcionário iniciando...');
        
        // Verificar autenticação
        this.verificarAutenticacao();
        
        // Configurar atualização de hora
        this.iniciarAtualizacaoHora();
        
        // Obter localização
        this.obterLocalizacao();
        
        // Configurar eventos
        this.configurarEventos();
        
        // Carregar dados iniciais
        this.carregarDadosIniciais();
    },

    // Verificar autenticação
    verificarAutenticacao: function() {
        firebaseAuth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'index.html';
                return;
            }
            
            this.estado.usuario = user;
            
            // Verificar se é funcionário
            await this.carregarDadosUsuario();
            
            if (this.estado.dadosUsuario && this.estado.dadosUsuario.tipo !== 'funcionario') {
                // Se for admin, pode ficar na página de funcionário também
                if (this.estado.dadosUsuario.tipo !== 'admin') {
                    alert('Acesso restrito a funcionários');
                    window.location.href = 'index.html';
                }
            }
            
            this.atualizarInterfaceUsuario();
            this.verificarRegistrosHoje();
        });
    },

    // Carregar dados do usuário
    carregarDadosUsuario: async function() {
        try {
            const userDoc = await firebaseDb.collection('usuarios')
                .doc(this.estado.usuario.uid)
                .get();
            
            if (userDoc.exists) {
                this.estado.dadosUsuario = userDoc.data();
                console.log('Dados do usuário carregados:', this.estado.dadosUsuario);
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
        }
    },

    // Atualizar interface do usuário
    atualizarInterfaceUsuario: function() {
        // Atualizar avatar com iniciais
        if (this.estado.dadosUsuario && this.estado.dadosUsuario.nome) {
            const names = this.estado.dadosUsuario.nome.split(' ');
            const initials = names.map(name => name[0]).join('');
            const avatarElement = document.getElementById('userInitials');
            if (avatarElement) {
                avatarElement.textContent = initials.substring(0, 2).toUpperCase();
            }
        }
        
        // Atualizar nome na interface (se houver elemento)
        const userNameElement = document.getElementById('userName');
        if (userNameElement && this.estado.dadosUsuario) {
            userNameElement.textContent = this.estado.dadosUsuario.nome || 'Funcionário';
        }
    },

    // Iniciar atualização de hora
    iniciarAtualizacaoHora: function() {
        // Atualizar imediatamente
        this.atualizarHora();
        
        // Configurar intervalo para atualização a cada segundo
        this.estado.intervaloAtualizacao = setInterval(() => {
            this.atualizarHora();
        }, 1000);
    },

    // Atualizar hora e data na interface
    atualizarHora: function() {
        const agora = new Date();
        
        // Atualizar elementos da interface
        const elementos = {
            'currentDate': agora.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            'currentTime': agora.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        };
        
        for (const [id, valor] of Object.entries(elementos)) {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = valor;
            }
        }
    },

    // Obter localização
    obterLocalizacao: function() {
        const locationElement = document.getElementById('locationText');
        
        if (!navigator.geolocation) {
            if (locationElement) {
                locationElement.textContent = 'Geolocalização não suportada pelo navegador';
            }
            return;
        }
        
        // Primeira tentativa com alta precisão
        navigator.geolocation.getCurrentPosition(
            (position) => this.atualizarLocalizacaoSucesso(position),
            (error) => this.atualizarLocalizacaoErro(error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
        
        // Monitorar mudanças de localização (opcional)
        this.estado.watchId = navigator.geolocation.watchPosition(
            (position) => this.atualizarLocalizacaoSucesso(position),
            (error) => console.warn('Erro no monitoramento de localização:', error),
            {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 60000 // 1 minuto
            }
        );
    },

    // Atualizar localização em caso de sucesso
    atualizarLocalizacaoSucesso: function(position) {
        this.estado.localizacao = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            precisao: position.coords.accuracy,
            timestamp: new Date(position.timestamp)
        };
        
        const locationElement = document.getElementById('locationText');
        if (locationElement) {
            locationElement.innerHTML = `
                <strong>Localização:</strong> 
                ${this.estado.localizacao.latitude.toFixed(6)}, 
                ${this.estado.localizacao.longitude.toFixed(6)}
                <br>
                <small>Precisão: ${Math.round(this.estado.localizacao.precisao)} metros</small>
            `;
        }
        
        console.log('Localização atualizada:', this.estado.localizacao);
    },

    // Atualizar localização em caso de erro
    atualizarLocalizacaoErro: function(error) {
        console.warn('Erro ao obter localização:', error);
        
        const locationElement = document.getElementById('locationText');
        if (locationElement) {
            let mensagem = 'Localização não disponível';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    mensagem = 'Permissão de localização negada. Por favor, habilite no navegador.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    mensagem = 'Localização indisponível. Verifique seu GPS.';
                    break;
                case error.TIMEOUT:
                    mensagem = 'Tempo esgotado ao obter localização.';
                    break;
            }
            
            locationElement.textContent = mensagem;
        }
    },

    // Configurar eventos
    configurarEventos: function() {
        // Botões de registro
        const btnEntrada = document.getElementById('btnEntrada');
        const btnSaida = document.getElementById('btnSaida');
        const btnJustificativa = document.getElementById('btnJustificativa');
        
        if (btnEntrada) {
            btnEntrada.addEventListener('click', () => this.registrarEntrada());
        }
        
        if (btnSaida) {
            btnSaida.addEventListener('click', () => this.registrarSaida());
        }
        
        if (btnJustificativa) {
            btnJustificativa.addEventListener('click', () => this.abrirJustificativa());
        }
        
        // Botão de logout
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => this.logout());
        }
        
        // Formulário de justificativa
        const formJustificativa = document.getElementById('justificationForm');
        if (formJustificativa) {
            formJustificativa.addEventListener('submit', (e) => {
                e.preventDefault();
                this.enviarJustificativa();
            });
        }
        
        // Tipo de justificativa (para mostrar/ocultar atestado)
        const tipoJustificativa = document.getElementById('justificationType');
        if (tipoJustificativa) {
            tipoJustificativa.addEventListener('change', (e) => {
                this.atualizarCampoAtestado(e.target.value);
            });
        }
        
        // Fechar modal
        const btnFecharModal = document.querySelector('.modal-close');
        if (btnFecharModal) {
            btnFecharModal.addEventListener('click', () => this.fecharModal());
        }
        
        // Data da justificativa (padrão: hoje)
        const dataJustificativa = document.getElementById('justificationDate');
        if (dataJustificativa) {
            const hoje = new Date().toISOString().split('T')[0];
            dataJustificativa.value = hoje;
            dataJustificativa.max = hoje; // Não permitir datas futuras
        }
    },

    // Carregar dados iniciais
    carregarDadosIniciais: async function() {
        await Promise.all([
            this.verificarRegistrosHoje(),
            this.carregarHistoricoSemanal(),
            this.carregarResumoHoras()
        ]);
    },

    // Verificar registros do dia atual
    verificarRegistrosHoje: async function() {
        try {
            if (!this.estado.usuario) return;
            
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            
            const amanha = new Date(hoje);
            amanha.setDate(amanha.getDate() + 1);
            
            const querySnapshot = await firebaseDb.collection('registros')
                .where('userId', '==', this.estado.usuario.uid)
                .where('data', '>=', hoje)
                .where('data', '<', amanha)
                .orderBy('data', 'asc')
                .get();
            
            this.estado.registrosHoje = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                this.estado.registrosHoje.push({
                    id: doc.id,
                    ...data,
                    data: data.data ? (data.data.toDate ? data.data.toDate() : new Date(data.data)) : new Date()
                });
            });
            
            console.log(`${this.estado.registrosHoje.length} registros hoje:`, this.estado.registrosHoje);
            
            this.atualizarBotoes();
            this.atualizarStatus();
            
        } catch (error) {
            console.error('Erro ao verificar registros:', error);
        }
    },

    // Atualizar estado dos botões
    atualizarBotoes: function() {
        const btnEntrada = document.getElementById('btnEntrada');
        const btnSaida = document.getElementById('btnSaida');
        
        if (!btnEntrada || !btnSaida) return;
        
        const temEntrada = this.estado.registrosHoje.some(r => r.tipo === 'entrada');
        const temSaida = this.estado.registrosHoje.some(r => r.tipo === 'saida');
        const hoje = new Date();
        const diaSemana = hoje.getDay(); // 0 = Domingo, 6 = Sábado
        
        // Verificar se é domingo
        if (diaSemana === 0) {
            btnEntrada.disabled = true;
            btnSaida.disabled = true;
            return;
        }
        
        // Lógica normal para dias úteis
        btnEntrada.disabled = temEntrada || this.estado.emTrabalho;
        btnSaida.disabled = !temEntrada || temSaida || !this.estado.emTrabalho;
    },

    // Atualizar status na interface
    atualizarStatus: function() {
        const statusElement = document.getElementById('dailyStatus');
        if (!statusElement) return;
        
        const agora = new Date();
        const diaSemana = agora.getDay();
        
        // Verificar se é domingo
        if (diaSemana === 0) {
            statusElement.textContent = 'Domingo - Folga';
            statusElement.className = 'status-badge status-ausente';
            return;
        }
        
        // Verificar se é sábado
        if (diaSemana === 6) {
            const horaAtual = agora.getHours();
            if (horaAtual < 8 || horaAtual >= 13) {
                statusElement.textContent = 'Sábado - Fora do horário';
                statusElement.className = 'status-badge status-ausente';
                return;
            }
        }
        
        const temEntrada = this.estado.registrosHoje.some(r => r.tipo === 'entrada');
        const temSaida = this.estado.registrosHoje.some(r => r.tipo === 'saida');
        
        if (temEntrada && temSaida) {
            // Calcular horas trabalhadas
            const entrada = this.estado.registrosHoje.find(r => r.tipo === 'entrada');
            const saida = this.estado.registrosHoje.find(r => r.tipo === 'saida');
            
            if (entrada && saida) {
                const horas = this.calcularHorasTrabalhadas(entrada.data, saida.data);
                statusElement.textContent = `Trabalho concluído (${horas.toFixed(2)}h)`;
                statusElement.className = 'status-badge status-presente';
            }
        } else if (temEntrada && !temSaida) {
            const entrada = this.estado.registrosHoje.find(r => r.tipo === 'entrada');
            const horasDesdeEntrada = (agora - entrada.data) / (1000 * 60 * 60);
            
            statusElement.textContent = `Em trabalho (${horasDesdeEntrada.toFixed(2)}h)`;
            statusElement.className = 'status-badge status-trabalhando';
            this.estado.emTrabalho = true;
        } else {
            // Verificar horário de trabalho
            const horaAtual = agora.getHours();
            const minutoAtual = agora.getMinutes();
            
            if (diaSemana >= 1 && diaSemana <= 5) { // Segunda a Sexta
                if (horaAtual >= 8 && horaAtual < 12) {
                    statusElement.textContent = 'Período da manhã - Aguardando registro';
                } else if (horaAtual >= 14 && horaAtual < 18) {
                    statusElement.textContent = 'Período da tarde - Aguardando registro';
                } else {
                    statusElement.textContent = 'Fora do horário de trabalho';
                }
            } else if (diaSemana === 6) { // Sábado
                if (horaAtual >= 8 && horaAtual < 13) {
                    statusElement.textContent = 'Sábado - Aguardando registro';
                } else {
                    statusElement.textContent = 'Sábado - Fora do horário';
                }
            }
            
            statusElement.className = 'status-badge status-ausente';
            this.estado.emTrabalho = false;
        }
    },

    // Registrar entrada
    registrarEntrada: async function() {
        try {
            // Validar se já registrou entrada hoje
            const temEntrada = this.estado.registrosHoje.some(r => r.tipo === 'entrada');
            if (temEntrada) {
                this.mostrarMensagem('Você já registrou entrada hoje!', 'warning');
                return;
            }
            
            // Validar localização
            if (!this.estado.localizacao) {
                const continuar = confirm('Localização não disponível. Deseja registrar mesmo assim?');
                if (!continuar) return;
            }
            
            // Verificar se é domingo
            const hoje = new Date();
            if (hoje.getDay() === 0) {
                const confirmar = confirm('Hoje é domingo. Normalmente é folga. Deseja registrar entrada mesmo assim?');
                if (!confirmar) return;
            }
            
            const registro = {
                userId: this.estado.usuario.uid,
                tipo: 'entrada',
                data: new Date(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                localizacao: this.estado.localizacao,
                dispositivo: navigator.userAgent,
                status: 'registrado',
                sincronizado: true
            };
            
            // Salvar no Firestore
            const docRef = await firebaseDb.collection('registros').add(registro);
            
            // Atualizar estado local
            this.estado.registrosHoje.push({
                id: docRef.id,
                ...registro
            });
            
            // Atualizar interface
            this.atualizarBotoes();
            this.atualizarStatus();
            
            // Mostrar mensagem de sucesso
            const horaFormatada = hoje.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            this.mostrarMensagem(`Entrada registrada com sucesso às ${horaFormatada}!`, 'success');
            
            // Recarregar histórico
            await this.carregarHistoricoSemanal();
            
        } catch (error) {
            console.error('Erro ao registrar entrada:', error);
            this.mostrarMensagem(`Erro ao registrar entrada: ${error.message}`, 'error');
        }
    },

    // Registrar saída
    registrarSaida: async function() {
        try {
            // Validar se tem entrada registrada
            const entrada = this.estado.registrosHoje.find(r => r.tipo === 'entrada');
            if (!entrada) {
                this.mostrarMensagem('Você precisa registrar entrada primeiro!', 'warning');
                return;
            }
            
            // Validar se já registrou saída hoje
            const temSaida = this.estado.registrosHoje.some(r => r.tipo === 'saida');
            if (temSaida) {
                this.mostrarMensagem('Você já registrou saída hoje!', 'warning');
                return;
            }
            
            // Validar localização
            if (!this.estado.localizacao) {
                const continuar = confirm('Localização não disponível. Deseja registrar mesmo assim?');
                if (!continuar) return;
            }
            
            const agora = new Date();
            const horasTrabalhadas = this.calcularHorasTrabalhadas(entrada.data, agora);
            
            const registro = {
                userId: this.estado.usuario.uid,
                tipo: 'saida',
                data: agora,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                localizacao: this.estado.localizacao,
                dispositivo: navigator.userAgent,
                horasTrabalhadas: horasTrabalhadas,
                status: 'registrado',
                sincronizado: true
            };
            
            // Salvar no Firestore
            const docRef = await firebaseDb.collection('registros').add(registro);
            
            // Atualizar estado local
            this.estado.registrosHoje.push({
                id: docRef.id,
                ...registro
            });
            
            // Atualizar interface
            this.atualizarBotoes();
            this.atualizarStatus();
            
            // Mostrar mensagem de sucesso
            const horaFormatada = agora.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            this.mostrarMensagem(
                `Saída registrada com sucesso às ${horaFormatada}! Horas trabalhadas: ${horasTrabalhadas.toFixed(2)}h`,
                'success'
            );
            
            // Recarregar histórico e resumo
            await Promise.all([
                this.carregarHistoricoSemanal(),
                this.carregarResumoHoras()
            ]);
            
        } catch (error) {
            console.error('Erro ao registrar saída:', error);
            this.mostrarMensagem(`Erro ao registrar saída: ${error.message}`, 'error');
        }
    },

    // Calcular horas trabalhadas
    calcularHorasTrabalhadas: function(entrada, saida) {
        if (!entrada || !saida) return 0;
        
        const entradaDate = entrada instanceof Date ? entrada : new Date(entrada);
        const saidaDate = saida instanceof Date ? saida : new Date(saida);
        
        // Calcular diferença em milissegundos
        const diffMs = saidaDate.getTime() - entradaDate.getTime();
        
        // Converter para horas
        const horas = diffMs / (1000 * 60 * 60);
        
        // Descontar intervalo de almoço se trabalho for maior que 6 horas
        return horas > 6 ? horas - 2 : horas;
    },

    // Abrir modal de justificativa
    abrirJustificativa: function() {
        const modal = document.getElementById('justificationModal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Data padrão: hoje
            const hoje = new Date().toISOString().split('T')[0];
            const dataInput = document.getElementById('justificationDate');
            if (dataInput) {
                dataInput.value = hoje;
                dataInput.max = hoje;
            }
        }
    },

    // Fechar modal
    fecharModal: function() {
        const modal = document.getElementById('justificationModal');
        if (modal) {
            modal.style.display = 'none';
            
            // Resetar formulário
            const form = document.getElementById('justificationForm');
            if (form) {
                form.reset();
                
                // Ocultar campo de atestado
                const atestadoSection = document.getElementById('medicalCertificateSection');
                if (atestadoSection) {
                    atestadoSection.style.display = 'none';
                }
            }
        }
    },

    // Atualizar campo de atestado baseado no tipo
    atualizarCampoAtestado: function(tipo) {
        const atestadoSection = document.getElementById('medicalCertificateSection');
        if (atestadoSection) {
            atestadoSection.style.display = tipo === 'doenca' ? 'block' : 'none';
        }
    },

    // Enviar justificativa
    enviarJustificativa: async function() {
        try {
            // Coletar dados do formulário
            const tipo = document.getElementById('justificationType').value;
            const data = document.getElementById('justificationDate').value;
            const descricao = document.getElementById('justificationDescription').value;
            
            // Validações
            if (!tipo) {
                throw new Error('Selecione o tipo de justificativa');
            }
            
            if (!data) {
                throw new Error('Selecione a data');
            }
            
            if (!descricao || descricao.trim().length < 10) {
                throw new Error('Descreva o motivo com pelo menos 10 caracteres');
            }
            
            // Verificar se é domingo
            const dataObj = new Date(data);
            if (dataObj.getDay() === 0) {
                const confirmar = confirm('A data selecionada é um domingo. Normalmente é folga. Deseja continuar?');
                if (!confirmar) return;
            }
            
            let urlAtestado = null;
            
            // Upload do atestado se necessário
            if (tipo === 'doenca') {
                const fileInput = document.getElementById('medicalCertificate');
                if (fileInput.files.length > 0) {
                    urlAtestado = await this.uploadAtestado(fileInput.files[0]);
                }
            }
            
            // Criar objeto de justificativa
            const justificativa = {
                userId: this.estado.usuario.uid,
                tipo: tipo,
                data: dataObj,
                descricao: descricao.trim(),
                atestadoUrl: urlAtestado,
                status: 'pendente',
                dataRegistro: new Date(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Salvar no Firestore
            await firebaseDb.collection('justificativas').add(justificativa);
            
            // Fechar modal e mostrar mensagem
            this.fecharModal();
            this.mostrarMensagem('Justificativa enviada com sucesso! Aguarde análise do administrador.', 'success');
            
        } catch (error) {
            console.error('Erro ao enviar justificativa:', error);
            this.mostrarMensagem(`Erro ao enviar justificativa: ${error.message}`, 'error');
        }
    },

    // Upload de atestado
    uploadAtestado: async function(file) {
        try {
            // Validar tamanho do arquivo (máx 5MB)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error('Arquivo muito grande. Tamanho máximo: 5MB');
            }
            
            // Validar tipo do arquivo
            const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!tiposPermitidos.includes(file.type)) {
                throw new Error('Tipo de arquivo não permitido. Use JPG, PNG ou PDF');
            }
            
            // Criar nome único para o arquivo
            const timestamp = Date.now();
            const nomeArquivo = `atestado_${this.estado.usuario.uid}_${timestamp}_${file.name}`;
            
            // Criar referência no Storage
            const storageRef = firebaseStorage.ref();
            const atestadoRef = storageRef.child(`atestados/${nomeArquivo}`);
            
            // Mostrar progresso (opcional)
            console.log('Iniciando upload do atestado...');
            
            // Fazer upload
            const snapshot = await atestadoRef.put(file);
            
            // Obter URL de download
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            console.log('Upload do atestado concluído:', downloadURL);
            return downloadURL;
            
        } catch (error) {
            console.error('Erro no upload do atestado:', error);
            throw error;
        }
    },

    // Carregar histórico semanal
    carregarHistoricoSemanal: async function() {
        try {
            if (!this.estado.usuario) return;
            
            const loadingElement = document.getElementById('loadingHistory');
            if (loadingElement) {
                loadingElement.style.display = 'flex';
            }
            
            // Calcular início da semana (segunda-feira)
            const hoje = new Date();
            const diaSemana = hoje.getDay();
            const diferenca = diaSemana === 0 ? -6 : 1 - diaSemana;
            const inicioSemana = new Date(hoje);
            inicioSemana.setDate(hoje.getDate() + diferenca);
            inicioSemana.setHours(0, 0, 0, 0);
            
            const fimSemana = new Date(inicioSemana);
            fimSemana.setDate(fimSemana.getDate() + 6);
            fimSemana.setHours(23, 59, 59, 999);
            
            const querySnapshot = await firebaseDb.collection('registros')
                .where('userId', '==', this.estado.usuario.uid)
                .where('data', '>=', inicioSemana)
                .where('data', '<=', fimSemana)
                .orderBy('data', 'desc')
                .get();
            
            // Processar registros por dia
            const registrosPorDia = {};
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const dataDate = data.data ? (data.data.toDate ? data.data.toDate() : new Date(data.data)) : new Date();
                const dataKey = dataDate.toISOString().split('T')[0];
                
                if (!registrosPorDia[dataKey]) {
                    registrosPorDia[dataKey] = {
                        entrada: null,
                        saida: null,
                        horas: 0
                    };
                }
                
                if (data.tipo === 'entrada') {
                    registrosPorDia[dataKey].entrada = dataDate;
                } else if (data.tipo === 'saida') {
                    registrosPorDia[dataKey].saida = dataDate;
                    if (registrosPorDia[dataKey].entrada) {
                        registrosPorDia[dataKey].horas = this.calcularHorasTrabalhadas(
                            registrosPorDia[dataKey].entrada,
                            dataDate
                        );
                    }
                }
            });
            
            // Ordenar dias
            const dias = Object.keys(registrosPorDia).sort().reverse();
            this.estado.registrosSemana = dias.map(dia => ({
                data: dia,
                ...registrosPorDia[dia]
            }));
            
            // Preencher tabela
            this.preencherTabelaHistorico(registrosPorDia);
            
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            
            const loadingElement = document.getElementById('loadingHistory');
            if (loadingElement) {
                loadingElement.innerHTML = '<p class="error-message">Erro ao carregar histórico</p>';
            }
        }
    },

    // Preencher tabela de histórico
    preencherTabelaHistorico: function(registrosPorDia) {
        const tableBody = document.querySelector('#weeklyHistory tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        const dias = Object.keys(registrosPorDia).sort().reverse();
        let totalHoras = 0;
        
        dias.forEach(diaKey => {
            const diaData = registrosPorDia[diaKey];
            const dataObj = new Date(diaKey);
            
            const entradaFormatada = diaData.entrada ? 
                diaData.entrada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 
                '--:--';
            
            const saidaFormatada = diaData.saida ? 
                diaData.saida.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 
                '--:--';
            
            const horasFormatadas = diaData.horas > 0 ? 
                diaData.horas.toFixed(2) + 'h' : '--';
            
            // Determinar status
            let status = 'Ausente';
            let statusClass = 'badge-danger';
            
            if (dataObj.getDay() === 0) { // Domingo
                status = 'Domingo';
                statusClass = 'badge-info';
            } else if (diaData.entrada && diaData.saida) {
                status = 'Completo';
                statusClass = 'badge-success';
                totalHoras += diaData.horas;
            } else if (diaData.entrada && !diaData.saida) {
                status = 'Em andamento';
                statusClass = 'badge-warning';
            } else if (dataObj > new Date()) {
                status = 'Futuro';
                statusClass = 'badge-info';
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dataObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</td>
                <td>${entradaFormatada}</td>
                <td>${saidaFormatada}</td>
                <td>${horasFormatadas}</td>
                <td><span class="badge ${statusClass}">${status}</span></td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Atualizar total de horas
        const totalElement = document.getElementById('totalHours');
        if (totalElement) {
            totalElement.textContent = totalHoras.toFixed(2) + 'h';
        }
    },

    // Carregar resumo de horas
    carregarResumoHoras: async function() {
        try {
            // Esta função calcula horas extras, etc.
            // Por enquanto, usamos o total já calculado na tabela
            
            // Você pode expandir esta função para calcular:
            // - Horas extras
            // - Horas noturnas
            // - Faltas
            // - Banco de horas
            
        } catch (error) {
            console.error('Erro ao carregar resumo:', error);
        }
    },

    // Mostrar mensagem
    mostrarMensagem: function(texto, tipo) {
        // Criar elemento de mensagem
        const mensagem = document.createElement('div');
        mensagem.className = tipo === 'success' ? 'success-message' : 'error-message';
        mensagem.textContent = texto;
        mensagem.style.position = 'fixed';
        mensagem.style.top = '20px';
        mensagem.style.right = '20px';
        mensagem.style.zIndex = '1000';
        mensagem.style.maxWidth = '300px';
        mensagem.style.padding = '15px';
        mensagem.style.borderRadius = '8px';
        mensagem.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        
        // Adicionar ao body
        document.body.appendChild(mensagem);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (document.body.contains(mensagem)) {
                mensagem.remove();
            }
        }, 5000);
    },

    // Logout
    logout: async function() {
        try {
            await firebaseAuth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erro no logout:', error);
            this.mostrarMensagem('Erro ao sair do sistema', 'error');
        }
    },

    // Limpar recursos
    destroy: function() {
        // Limpar intervalos
        if (this.estado.intervaloAtualizacao) {
            clearInterval(this.estado.intervaloAtualizacao);
        }
        
        // Parar monitoramento de localização
        if (this.estado.watchId) {
            navigator.geolocation.clearWatch(this.estado.watchId);
        }
    }
};

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    funcionarioApp.init();
});

// Limpar recursos quando a página for fechada
window.addEventListener('beforeunload', function() {
    funcionarioApp.destroy();
});

// Exportar para uso global
window.funcionarioApp = funcionarioApp;
