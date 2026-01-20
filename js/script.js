// script.js - Scripts principais do sistema
console.log("🚀 Script principal carregado!");

// Inicialização do sistema
document.addEventListener('DOMContentLoaded', async function() {
    console.log("🎬 Inicializando sistema de ponto eletrônico...");
    
    // Verificar Service Worker
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('sw.js');
            console.log('✅ Service Worker registrado:', registration.scope);
        } catch (error) {
            console.log('⚠️ Service Worker não registrado:', error);
        }
    }
    
    // Inicializar Firebase
    try {
        const firebase = await window.firebaseConfig?.inicializarFirebase();
        if (firebase) {
            console.log("🔥 Firebase conectado!");
            document.dispatchEvent(new CustomEvent('firebaseReady'));
        }
    } catch (error) {
        console.warn("⚠️ Firebase em modo simulação");
        document.dispatchEvent(new CustomEvent('firebaseReady')); // Para teste
    }
    
    // Verificar autenticação
    const usuario = window.auth?.verificarLogin();
    if (usuario) {
        console.log(`👤 Bem-vindo de volta, ${usuario.nome}!`);
        
        // Mostrar opções baseadas no tipo de usuário
        if (usuario.tipo === 'gestor') {
            mostrarOpcoesGestor();
        }
    }
    
    // Configurar botões
    configurarBotoes();
    
    console.log("✅ Sistema inicializado com sucesso!");
});

// Configurar botões da página
function configurarBotoes() {
    // Botão de login
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            window.location.href = 'login.html';
        });
    }
    
    // Botão de funcionário
    const funcionarioBtn = document.getElementById('registerBtn');
    if (funcionarioBtn) {
        funcionarioBtn.addEventListener('click', function() {
            window.location.href = 'funcionario.html';
        });
    }
    
    // Botão de gestor
    const gestorBtn = document.getElementById('managerBtn');
    if (gestorBtn) {
        gestorBtn.addEventListener('click', function() {
            window.location.href = 'gestor.html';
        });
    }
    
    // Botão de registro facial (se existir)
    const facialBtn = document.getElementById('facialBtn');
    if (facialBtn) {
        facialBtn.addEventListener('click', iniciarReconhecimentoFacial);
    }
}

// Reconhecimento facial
async function iniciarReconhecimentoFacial() {
    console.log("📸 Iniciando reconhecimento facial...");
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Seu navegador não suporta acesso à câmera!");
        return;
    }
    
    try {
        // Solicitar acesso à câmera
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' } 
        });
        
        // Criar elemento de vídeo
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 9999;
        `;
        
        // Criar overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
        `;
        
        overlay.innerHTML = `
            <div style="text-align: center; max-width: 400px;">
                <h2>👤 Reconhecimento Facial</h2>
                <p>Posicione seu rosto no centro do círculo</p>
                <div style="width: 300px; height: 300px; border: 3px solid white; border-radius: 50%; margin: 20px auto;"></div>
                <button id="capturarBtn" style="background: #28a745; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; margin: 10px;">
                    📸 Capturar
                </button>
                <button id="cancelarBtn" style="background: #dc3545; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; margin: 10px;">
                    ❌ Cancelar
                </button>
            </div>
        `;
        
        document.body.appendChild(video);
        document.body.appendChild(overlay);
        
        // Capturar foto
        document.getElementById('capturarBtn').addEventListener('click', async () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            
            const imagemData = canvas.toDataURL('image/jpeg');
            
            // Parar stream
            stream.getTracks().forEach(track => track.stop());
            
            // Remover elementos
            document.body.removeChild(video);
            document.body.removeChild(overlay);
            
            // Processar reconhecimento
            const resultado = await window.auth?.reconhecimentoFacial(imagemData);
            
            if (resultado?.success) {
                window.utils?.mostrarMensagem(`✅ Bem-vindo, ${resultado.usuario.nome}!`, 'success');
                // Redirecionar ou fazer login automático
            } else {
                window.utils?.mostrarMensagem('❌ Rosto não reconhecido!', 'error');
            }
        });
        
        // Cancelar
        document.getElementById('cancelarBtn').addEventListener('click', () => {
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(video);
            document.body.removeChild(overlay);
        });
        
    } catch (error) {
        console.error("❌ Erro ao acessar câmera:", error);
        window.utils?.mostrarMensagem('❌ Erro ao acessar a câmera!', 'error');
    }
}

// Mostrar opções de gestor
function mostrarOpcoesGestor() {
    console.log("👔 Modo gestor ativado");
    
    // Adicionar botão de relatórios se não existir
    if (!document.getElementById('reportsBtn')) {
        const actionsDiv = document.querySelector('.actions');
        if (actionsDiv) {
            const reportsBtn = document.createElement('button');
            reportsBtn.id = 'reportsBtn';
            reportsBtn.className = 'btn-secondary';
            reportsBtn.innerHTML = '📊 Relatórios Avançados';
            reportsBtn.addEventListener('click', () => {
                window.location.href = 'gestor.html?aba=relatorios';
            });
            actionsDiv.appendChild(reportsBtn);
        }
    }
}

// Exportar funções principais
window.app = {
    iniciarReconhecimentoFacial,
    configurarBotoes,
    mostrarOpcoesGestor
};
