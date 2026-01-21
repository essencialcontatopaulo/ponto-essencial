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
               
