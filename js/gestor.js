// ============ FUNÇÕES DE JUSTIFICATIVAS (ADICIONAR AO GESTOR.JS) ============

async function carregarJustificativasPendentes() {
    try {
        const snapshot = await db.collection('justificativas')
            .where('status', '==', 'pendente')
            .orderBy('dataEnvio', 'desc')
            .get();
        
        // Adicione este HTML em algum lugar do gestor.html para exibir as justificativas
        const container = document.getElementById('justificativasContainer');
        if (!container) return;
        
        let html = '<h3>Justificativas Pendentes</h3>';
        
        if (snapshot.empty) {
            html += '<p style="color: #666;">Nenhuma justificativa pendente</p>';
        } else {
            html += '<table style="width: 100%; margin-top: 10px;">';
            html += '<thead><tr><th>Funcionário</th><th>Data</th><th>Tipo</th><th>Motivo</th><th>Ações</th></tr></thead><tbody>';
            
            snapshot.forEach(doc => {
                const just = doc.data();
                const dataBR = new Date(just.data).toLocaleDateString('pt-BR');
                
                html += `
                    <tr>
                        <td>${just.funcionarioNome}</td>
                        <td>${dataBR}</td>
                        <td>${just.tipo}</td>
                        <td>${just.motivo.substring(0, 50)}${just.motivo.length > 50 ? '...' : ''}</td>
                        <td>
                            <button class="btn btn-success" onclick="aprovarJustificativa('${doc.id}')" style="padding: 3px 8px; font-size: 12px;">Aprovar</button>
                            <button class="btn btn-danger" onclick="rejeitarJustificativa('${doc.id}')" style="padding: 3px 8px; font-size: 12px;">Rejeitar</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
        }
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar justificativas:', error);
    }
}

async function aprovarJustificativa(justificativaId) {
    if (!confirm('Aprovar esta justificativa?')) return;
    
    try {
        const justDoc = await db.collection('justificativas').doc(justificativaId).get();
        if (!justDoc.exists) {
            alert('Justificativa não encontrada');
            return;
        }
        
        const just = justDoc.data();
        
        // Atualizar status da justificativa
        await db.collection('justificativas').doc(justificativaId).update({
            status: 'aprovada',
            dataAprovacao: new Date().toISOString(),
            aprovadoPor: usuarioAtual.id,
            aprovadoPorNome: usuarioAtual.nome
        });
        
        // Se for falta justificada, criar registro de ponto ajustado
        if (just.tipo === 'falta_justificada') {
            // Criar registro de ajuste de horas
            const ajusteId = 'ajuste-' + Date.now();
            
            await db.collection('ajustes_horas').doc(ajusteId).set({
                id: ajusteId,
                funcionarioId: just.funcionarioId,
                funcionarioNome: just.funcionarioNome,
                data: just.data,
                tipo: 'falta_justificada',
                justificativa: just.motivo,
                status: 'aprovado',
                aprovadoPor: usuarioAtual.id,
                aprovadoPorNome: usuarioAtual.nome,
                dataCriacao: new Date().toISOString()
            });
        }
        
        alert('✅ Justificativa aprovada!');
        
        // Atualizar lista
        await carregarJustificativasPendentes();
        
    } catch (error) {
        console.error('Erro ao aprovar justificativa:', error);
        alert('Erro: ' + error.message);
    }
}

async function rejeitarJustificativa(justificativaId) {
    const motivo = prompt('Informe o motivo da rejeição:');
    if (!motivo) return;
    
    try {
        await db.collection('justificativas').doc(justificativaId).update({
            status: 'rejeitada',
            motivoRejeicao: motivo,
            dataRejeicao: new Date().toISOString(),
            rejeitadoPor: usuarioAtual.id,
            rejeitadoPorNome: usuarioAtual.nome
        });
        
        alert('✅ Justificativa rejeitada!');
        
        // Atualizar lista
        await carregarJustificativasPendentes();
        
    } catch (error) {
        console.error('Erro ao rejeitar justificativa:', error);
        alert('Erro: ' + error.message);
    }
}

// Adicione esta chamada no carregarDadosIniciais():
// await carregarJustificativasPendentes();
