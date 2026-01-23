<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ponto Eletrônico - Essencial Print</title>
    
    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    
    <!-- Configuração Firebase -->
    <script src="js/firebase-config.js"></script>
    
    <style>
        /* Mantenha todos os estilos anteriores... */
        /* ... [todos os estilos do código anterior] ... */
        
        .alert {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border-left: 4px solid #f5c6cb;
        }
        
        .alert-success {
            background: #d4edda;
            color: #155724;
            border-left: 4px solid #c3e6cb;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Alerta para conexão -->
        <div id="alertConexao" class="alert alert-error" style="display: none;">
            <strong>Atenção:</strong> <span id="alertMessage">Problema de conexão com o servidor.</span>
        </div>
        
        <header>
            <div class="logo">
                <h1>Essencial<span>Print</span> - Ponto Eletrônico</h1>
            </div>
            <div class="user-info">
                <h3 id="userName">Funcionário</h3>
                <p id="userCargo">Registro de Ponto</p>
                <button class="btn-logout" onclick="logout()">Sair</button>
            </div>
        </header>
        
        <div class="dashboard">
            <!-- Card de Registro -->
            <div class="card">
                <h2>Registrar Ponto</h2>
                <div class="registro-info">
                    <h3 id="dataAtual">Carregando data...</h3>
                    <div class="hora-atual" id="horaAtual">00:00:00</div>
                    <div id="statusRegistro" class="status-badge status-ausente">Status: Aguardando registro</div>
                </div>
                
                <button class="btn btn-primary" onclick="registrarEntrada()" id="btnEntrada">
                    📥 Registrar Entrada
                </button>
                
                <button class="btn btn-secondary" onclick="registrarSaida()" id="btnSaida" disabled>
                    📤 Registrar Saída
                </button>
                
                <button class="btn btn-info" onclick="abrirModalJustificativa()" id="btnJustificativa">
                    📝 Justificar Falta/Atraso
                </button>
                
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <h4 style="color: #1b5e20; margin-bottom: 10px;">Último Registro</h4>
                    <div id="ultimoRegistro">
                        <p style="color: #666;">Nenhum registro hoje</p>
                    </div>
                </div>
            </div>
            
            <!-- Card de Histórico -->
            <div class="card">
                <h2>Seus Registros de Hoje</h2>
                <div style="max-height: 300px; overflow-y: auto;">
                    <table id="tabelaRegistros">
                        <thead>
                            <tr>
                                <th>Horário</th>
                                <th>Tipo</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="3" style="text-align: center;">Carregando registros...</td></tr>
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px;">
                    <h4 style="color: #856404; margin-bottom: 10px;">⚠️ Suas Justificativas</h4>
                    <div id="justificativasLista">
                        <p style="color: #666;">Nenhuma justificativa pendente</p>
                    </div>
                </div>
            </div>
        </div>
        
        <footer>
            <p>Essencial Print &copy; 2024 - Sistema de Ponto Eletrônico</p>
            <p>Registre sua entrada e saída diariamente</p>
        </footer>
    </div>

    <!-- Modal para Justificativa -->
    <div id="modalJustificativa" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Justificar Falta ou Atraso</h3>
                <button class="close-modal" onclick="fecharModalJustificativa()">×</button>
            </div>
            <form id="formJustificativa" onsubmit="return false;">
                <div class="form-group">
                    <label for="tipoJustificativa">Tipo *</label>
                    <select id="tipoJustificativa" class="form-control" required>
                        <option value="">Selecione...</option>
                        <option value="falta_justificada">Falta Justificada</option>
                        <option value="atraso_justificado">Atraso Justificado</option>
                        <option value="saida_antecipada">Saída Antecipada</option>
                        <option value="ausencia_justificada">Ausência Justificada</option>
                        <option value="outro">Outro</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="dataJustificativa">Data *</label>
                    <input type="date" id="dataJustificativa" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label for="horaJustificativa">Hora (para atrasos)</label>
                    <input type="time" id="horaJustificativa" class="form-control">
                    <small style="color: #666;">Preencha apenas para atrasos</small>
                </div>
                
                <div class="form-group">
                    <label for="motivoJustificativa">Motivo/Justificativa *</label>
                    <textarea id="motivoJustificativa" class="form-control" 
                              placeholder="Descreva detalhadamente o motivo da falta/atraso..." 
                              required></textarea>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="button" class="btn btn-primary" onclick="enviarJustificativa()" style="flex: 1;">
                        Enviar Justificativa
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="fecharModalJustificativa()" style="flex: 1;">
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // js/funcionario.js - Versão com fallback e debug
        console.log('=== FUNCIONARIO.JS CARREGADO ===');
        
        let db = null;
        let usuarioAtual = null;
        let ultimoRegistro = null;
        let timerHora = null;
        let firestoreConectado = false;
        
        // Inicialização
        document.addEventListener('DOMContentLoaded', async function() {
            console.log('🔧 Iniciando Página do Funcionário...');
            
            // 1. Verificar login local
            const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado') || 'null');
            
            if (!usuarioLogado || usuarioLogado.tipo !== 'funcionario') {
                alert('❌ Acesso restrito a funcionários!');
                window.location.href = 'index.html';
                return;
            }
            
            usuarioAtual = usuarioLogado;
            console.log('👤 Funcionário logado:', usuarioAtual);
            
            // 2. Configurar interface
            document.getElementById('userName').textContent = usuarioLogado.nome || 'Funcionário';
            document.getElementById('userCargo').textContent = 
                `${usuarioLogado.cargo || 'Funcionário'} - ${usuarioLogado.departamento || 'Departamento'}`;
            
            // 3. Configurar data no modal de justificativa
            const hoje = new Date().toISOString().split('T')[0];
            document.getElementById('dataJustificativa').value = hoje;
            
            // 4. Iniciar relógio
            iniciarRelogio();
            
            // 5. Tentar inicializar Firebase
            await inicializarFirebase();
            
            // 6. Se Firebase não funcionar, usar modo local
            if (!firestoreConectado) {
                usarModoLocal();
            } else {
                // 7. Carregar dados do Firestore
                await verificarRegistrosHoje();
                await carregarRegistrosHoje();
                await carregarJustificativas();
            }
            
            console.log('✅ Sistema do funcionário inicializado');
        });
        
        // Função para inicializar Firebase
        async function inicializarFirebase() {
            try {
                console.log('⚙️ Tentando conectar ao Firebase...');
                
                if (typeof firebase === 'undefined') {
                    throw new Error('Firebase SDK não carregado');
                }
                
                if (!firebaseConfig) {
                    throw new Error('Configuração do Firebase não encontrada');
                }
                
                // Verificar se já foi inicializado
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                    console.log('✅ Firebase inicializado');
                }
                
                // Obter referência do Firestore
                db = firebase.firestore();
                
                // Testar conexão com uma consulta simples
                const testConnection = await db.collection('test').limit(1).get().catch(() => null);
                
                if (testConnection !== null) {
                    firestoreConectado = true;
                    console.log('✅ Firestore conectado com sucesso');
                    document.getElementById('alertConexao').style.display = 'none';
                } else {
                    throw new Error('Não foi possível conectar ao Firestore');
                }
                
            } catch (error) {
                console.error('❌ Erro ao conectar ao Firebase:', error);
                mostrarAlerta('Não foi possível conectar ao servidor. Usando modo local.', 'error');
                firestoreConectado = false;
            }
        }
        
        // Função para usar modo local (fallback)
        function usarModoLocal() {
            console.log('🔄 Usando modo local (fallback)');
            mostrarAlerta('Modo local: Seus registros serão salvos apenas neste navegador.', 'error');
            
            // Carregar registros locais
            carregarRegistrosLocais();
            carregarJustificativasLocais();
            
            // Atualizar interface para modo local
            document.getElementById('statusRegistro').textContent = 'Status: Modo Local';
        }
        
        // Função para mostrar alerta
        function mostrarAlerta(mensagem, tipo) {
            const alertDiv = document.getElementById('alertConexao');
            const messageSpan = document.getElementById('alertMessage');
            
            messageSpan.textContent = mensagem;
            alertDiv.className = `alert alert-${tipo}`;
            alertDiv.style.display = 'block';
        }
        
        // Função para iniciar relógio
        function iniciarRelogio() {
            function atualizarHora() {
                const agora = new Date();
                const dataFormatada = agora.toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                
                const horaFormatada = agora.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                });
                
                document.getElementById('dataAtual').textContent = 
                    dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
                document.getElementById('horaAtual').textContent = horaFormatada;
            }
            
            // Atualizar imediatamente e a cada segundo
            atualizarHora();
            timerHora = setInterval(atualizarHora, 1000);
        }
        
        // Função para registrar entrada (com fallback)
        async function registrarEntrada() {
            if (!confirm('Deseja registrar sua ENTRADA agora?')) {
                return;
            }
            
            const hoje = new Date().toISOString().split('T')[0];
            const horaAtual = new Date().toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            const timestamp = Date.now();
            
            const registro = {
                funcionarioId: usuarioAtual.id,
                funcionarioNome: usuarioAtual.nome,
                tipo: 'entrada',
                horario: horaAtual,
                data: hoje,
                timestamp: timestamp,
                metodo: 'web'
            };
            
            try {
                if (firestoreConectado && db) {
                    // Salvar no Firestore
                    await db.collection('pontos').add(registro);
                    console.log('✅ Entrada registrada no Firestore:', horaAtual);
                    alert(`✅ Entrada registrada às ${horaAtual}`);
                } else {
                    // Salvar localmente
                    salvarRegistroLocal(registro);
                    console.log('✅ Entrada registrada localmente:', horaAtual);
                    alert(`✅ Entrada registrada localmente às ${horaAtual}`);
                }
                
                // Atualizar interface
                if (firestoreConectado) {
                    await verificarRegistrosHoje();
                    await carregarRegistrosHoje();
                } else {
                    atualizarInterfaceLocal();
                    carregarRegistrosLocais();
                }
                
            } catch (error) {
                console.error('❌ Erro ao registrar entrada:', error);
                alert('Erro ao registrar entrada: ' + error.message);
            }
        }
        
        // Função para registrar saída (com fallback)
        async function registrarSaida() {
            if (!confirm('Deseja registrar sua SAÍDA agora?')) {
                return;
            }
            
            const hoje = new Date().toISOString().split('T')[0];
            const horaAtual = new Date().toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            const timestamp = Date.now();
            
            const registro = {
                funcionarioId: usuarioAtual.id,
                funcionarioNome: usuarioAtual.nome,
                tipo: 'saida',
                horario: horaAtual,
                data: hoje,
                timestamp: timestamp,
                metodo: 'web'
            };
            
            try {
                if (firestoreConectado && db) {
                    // Salvar no Firestore
                    await db.collection('pontos').add(registro);
                    console.log('✅ Saída registrada no Firestore:', horaAtual);
                    alert(`✅ Saída registrada às ${horaAtual}`);
                } else {
                    // Salvar localmente
                    salvarRegistroLocal(registro);
                    console.log('✅ Saída registrada localmente:', horaAtual);
                    alert(`✅ Saída registrada localmente às ${horaAtual}`);
                }
                
                // Atualizar interface
                if (firestoreConectado) {
                    await verificarRegistrosHoje();
                    await carregarRegistrosHoje();
                } else {
                    atualizarInterfaceLocal();
                    carregarRegistrosLocais();
                }
                
            } catch (error) {
                console.error('❌ Erro ao registrar saída:', error);
                alert('Erro ao registrar saída: ' + error.message);
            }
        }
        
        // Funções para modo local
        function salvarRegistroLocal(registro) {
            const registros = JSON.parse(localStorage.getItem('registros_locais') || '[]');
            registros.push(registro);
            localStorage.setItem('registros_locais', JSON.stringify(registros));
        }
        
        function carregarRegistrosLocais() {
            const hoje = new Date().toISOString().split('T')[0];
            const registros = JSON.parse(localStorage.getItem('registros_locais') || '[]');
            const registrosHoje = registros.filter(r => r.data === hoje && r.funcionarioId === usuarioAtual.id);
            
            // Ordenar por timestamp
            registrosHoje.sort((a, b) => b.timestamp - a.timestamp);
            
            // Atualizar tabela
            const tbody = document.querySelector('#tabelaRegistros tbody');
            let html = '';
            
            if (registrosHoje.length === 0) {
                html = '<tr><td colspan="3" style="text-align: center;">Nenhum registro hoje (modo local)</td></tr>';
            } else {
                registrosHoje.forEach(reg => {
                    const tipoTexto = reg.tipo === 'entrada' ? 'Entrada' : 'Saída';
                    const tipoIcone = reg.tipo === 'entrada' ? '📥' : '📤';
                    
                    html += `
                        <tr>
                            <td>${reg.horario}</td>
                            <td>${tipoIcone} ${tipoTexto}</td>
                            <td>Local</td>
                        </tr>
                    `;
                });
            }
            
            tbody.innerHTML = html;
            
            // Atualizar último registro
            atualizarInterfaceLocal();
        }
        
        function atualizarInterfaceLocal() {
            const hoje = new Date().toISOString().split('T')[0];
            const registros = JSON.parse(localStorage.getItem('registros_locais') || '[]');
            const registrosHoje = registros.filter(r => r.data === hoje && r.funcionarioId === usuarioAtual.id);
            
            if (registrosHoje.length > 0) {
                const ultimo = registrosHoje[registrosHoje.length - 1]; // Último registro
                
                const statusDiv = document.getElementById('statusRegistro');
                const btnEntrada = document.getElementById('btnEntrada');
                const btnSaida = document.getElementById('btnSaida');
                const ultimoDiv = document.getElementById('ultimoRegistro');
                
                if (ultimo.tipo === 'entrada') {
                    statusDiv.textContent = 'Status: Em trabalho (Local)';
                    statusDiv.className = 'status-badge status-presente';
                    btnEntrada.disabled = true;
                    btnSaida.disabled = false;
                    
                    ultimoDiv.innerHTML = `
                        <p><strong>Última entrada:</strong> ${ultimo.horario} (Local)</p>
                        <p style="color: #666; font-size: 14px;">Aguardando registro de saída</p>
                    `;
                } else {
                    statusDiv.textContent = 'Status: Saída registrada (Local)';
                    statusDiv.className = 'status-badge status-ausente';
                    btnEntrada.disabled = false;
                    btnSaida.disabled = true;
                    
                    ultimoDiv.innerHTML = `
                        <p><strong>Última saída:</strong> ${ultimo.horario} (Local)</p>
                        <p style="color: #666; font-size: 14px;">Aguardando nova entrada</p>
                    `;
                }
            }
        }
        
        // Funções para justificativas (simplificadas)
        function carregarJustificativasLocais() {
            const justificativas = JSON.parse(localStorage.getItem('justificativas_locais') || '[]');
            const container = document.getElementById('justificativasLista');
            
            if (justificativas.length === 0) {
                container.innerHTML = '<p style="color: #666;">Nenhuma justificativa pendente (modo local)</p>';
            }
        }
        
        // Função para abrir modal de justificativa
        function abrirModalJustificativa() {
            const hoje = new Date().toISOString().split('T')[0];
            document.getElementById('dataJustificativa').value = hoje;
            document.getElementById('modalJustificativa').style.display = 'flex';
        }
        
        // Função para fechar modal
        function fecharModalJustificativa() {
            document.getElementById('modalJustificativa').style.display = 'none';
            document.getElementById('formJustificativa').reset();
        }
        
        // Função para enviar justificativa
        async function enviarJustificativa() {
            try {
                const tipo = document.getElementById('tipoJustificativa').value;
                const data = document.getElementById('dataJustificativa').value;
                const hora = document.getElementById('horaJustificativa').value;
                const motivo = document.getElementById('motivoJustificativa').value;
                
                if (!tipo || !data || !motivo) {
                    alert('Preencha todos os campos obrigatórios!');
                    return;
                }
                
                if (firestoreConectado && db) {
                    // Enviar para Firestore
                    await db.collection('justificativas').add({
                        funcionarioId: usuarioAtual.id,
                        funcionarioNome: usuarioAtual.nome,
                        tipo: tipo,
                        data: data,
                        hora: hora || null,
                        motivo: motivo,
                        status: 'pendente',
                        dataEnvio: new Date().toISOString(),
                        timestamp: Date.now()
                    });
                    
                    alert('✅ Justificativa enviada com sucesso! Aguarde aprovação.');
                } else {
                    // Salvar localmente
                    const justificativas = JSON.parse(localStorage.getItem('justificativas_locais') || '[]');
                    justificativas.push({
                        funcionarioId: usuarioAtual.id,
                        funcionarioNome: usuarioAtual.nome,
                        tipo: tipo,
                        data: data,
                        hora: hora || null,
                        motivo: motivo,
                        status: 'pendente',
                        dataEnvio: new Date().toISOString(),
                        timestamp: Date.now()
                    });
                    
                    localStorage.setItem('justificativas_locais', JSON.stringify(justificativas));
                    alert('✅ Justificativa salva localmente!');
                }
                
                fecharModalJustificativa();
                
                if (firestoreConectado) {
                    await carregarJustificativas();
                } else {
                    carregarJustificativasLocais();
                }
                
            } catch (error) {
                console.error('❌ Erro ao enviar justificativa:', error);
                alert('Erro ao enviar justificativa: ' + error.message);
            }
        }
        
        // Funções do Firestore (mantidas para quando conectar)
        async function verificarRegistrosHoje() {
            if (!firestoreConectado) return;
            
            try {
                const hoje = new Date().toISOString().split('T')[0];
                const userId = usuarioAtual.id;
                
                const snapshot = await db.collection('pontos')
                    .where('funcionarioId', '==', userId)
                    .where('data', '==', hoje)
                    .orderBy('timestamp', 'desc')
                    .limit(1)
                    .get();
                
                if (!snapshot.empty) {
                    ultimoRegistro = snapshot.docs[0].data();
                    
                    const statusDiv = document.getElementById('statusRegistro');
                    const btnEntrada = document.getElementById('btnEntrada');
                    const btnSaida = document.getElementById('btnSaida');
                    const ultimoDiv = document.getElementById('ultimoRegistro');
                    
                    if (ultimoRegistro.tipo === 'entrada') {
                        statusDiv.textContent = 'Status: Em trabalho';
                        statusDiv.className = 'status-badge status-presente';
                        btnEntrada.disabled = true;
                        btnSaida.disabled = false;
                        
                        ultimoDiv.innerHTML = `
                            <p><strong>Última entrada:</strong> ${ultimoRegistro.horario}</p>
                            <p style="color: #666; font-size: 14px;">Aguardando registro de saída</p>
                        `;
                    } else {
                        statusDiv.textContent = 'Status: Saída registrada';
                        statusDiv.className = 'status-badge status-ausente';
                        btnEntrada.disabled = false;
                        btnSaida.disabled = true;
                        
                        ultimoDiv.innerHTML = `
                            <p><strong>Última saída:</strong> ${ultimoRegistro.horario}</p>
                            <p style="color: #666; font-size: 14px;">Aguardando nova entrada</p>
                        `;
                    }
                }
                
            } catch (error) {
                console.error('Erro ao verificar registros:', error);
            }
        }
        
        async function carregarRegistrosHoje() {
            if (!firestoreConectado) return;
            
            try {
                const hoje = new Date().toISOString().split('T')[0];
                const userId = usuarioAtual.id;
                
                const snapshot = await db.collection('pontos')
                    .where('funcionarioId', '==', userId)
                    .where('data', '==', hoje)
                    .orderBy('timestamp', 'desc')
                    .get();
                
                const tbody = document.querySelector('#tabelaRegistros tbody');
                let html = '';
                
                if (snapshot.empty) {
                    html = '<tr><td colspan="3" style="text-align: center;">Nenhum registro hoje</td></tr>';
                } else {
                    snapshot.forEach(doc => {
                        const reg = doc.data();
                        const tipoTexto = reg.tipo === 'entrada' ? 'Entrada' : 'Saída';
                        const tipoIcone = reg.tipo === 'entrada' ? '📥' : '📤';
                        
                        html += `
                            <tr>
                                <td>${reg.horario}</td>
                                <td>${tipoIcone} ${tipoTexto}</td>
                                <td>Servidor</td>
                            </tr>
                        `;
                    });
                }
                
                tbody.innerHTML = html;
                
            } catch (error) {
                console.error('Erro ao carregar registros:', error);
            }
        }
        
        async function carregarJustificativas() {
            if (!firestoreConectado) return;
            
            try {
                const userId = usuarioAtual.id;
                
                const snapshot = await db.collection('justificativas')
                    .where('funcionarioId', '==', userId)
                    .orderBy('timestamp', 'desc')
                    .limit(5)
                    .get();
                
                const container = document.getElementById('justificativasLista');
                
                if (snapshot.empty) {
                    container.innerHTML = '<p style="color: #666;">Nenhuma justificativa pendente</p>';
                }
                
            } catch (error) {
                console.error('Erro ao carregar justificativas:', error);
            }
        }
        
        // Função de logout
        function logout() {
            if (confirm('Deseja realmente sair?')) {
                localStorage.removeItem('usuario_logado');
                localStorage.removeItem('firebase_user');
                
                if (timerHora) {
                    clearInterval(timerHora);
                }
                
                window.location.href = 'index.html';
            }
        }
        
        // Exportar funções
        window.registrarEntrada = registrarEntrada;
        window.registrarSaida = registrarSaida;
        window.abrirModalJustificativa = abrirModalJustificativa;
        window.fecharModalJustificativa = fecharModalJustificativa;
        window.enviarJustificativa = enviarJustificativa;
        window.logout = logout;
        
    </script>
</body>
</html>
