// facial-simple.js - Sistema híbrido de reconhecimento facial
window.facialSystem = (function() {
    'use strict';
    
    const system = {};
    
    // Estado do sistema
    let cameraAtiva = false;
    let videoStream = null;
    
    // Inicializar câmera
    system.iniciarCamera = async function(videoElementId) {
        try {
            const video = document.getElementById(videoElementId);
            if (!video) {
                throw new Error('Elemento de vídeo não encontrado');
            }
            
            // Solicitar acesso à câmera
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } 
            });
            
            video.srcObject = stream;
            videoStream = stream;
            cameraAtiva = true;
            
            // Esperar vídeo carregar
            await new Promise(resolve => {
                video.onloadedmetadata = () => {
                    video.play();
                    resolve();
                };
            });
            
            return { sucesso: true, mensagem: 'Câmera ativada' };
            
        } catch (error) {
            console.error('Erro ao acessar câmera:', error);
            return { 
                sucesso: false, 
                mensagem: 'Não foi possível acessar a câmera',
                erro: error.message 
            };
        }
    };
    
    // Capturar foto
    system.capturarFoto = function(videoElementId, canvasElementId) {
        const video = document.getElementById(videoElementId);
        const canvas = document.getElementById(canvasElementId);
        
        if (!video || !canvas || !cameraAtiva) {
            return null;
        }
        
        // Configurar canvas com mesmo tamanho do vídeo
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Desenhar frame no canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Converter para base64
        const fotoBase64 = canvas.toDataURL('image/jpeg', 0.8);
        
        return fotoBase64;
    };
    
    // Registrar rosto de funcionário (para gestor)
    system.registrarRosto = async function(funcionarioId, funcionarioNome) {
        return new Promise((resolve) => {
            // Criar interface para captura
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h3 style="color: #1b5e20;">📸 Cadastrar Reconhecimento Facial</h3>
                        <p style="color: #666;">Funcionário: <strong>${funcionarioNome}</strong></p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <h4 style="color: #2E8B57; margin-bottom: 10px;">Câmera ao vivo</h4>
                            <video id="facialVideo" autoplay playsinline 
                                   style="width: 100%; border: 3px solid #2E8B57; border-radius: 8px;"></video>
                        </div>
                        <div>
                            <h4 style="color: #2E8B57; margin-bottom: 10px;">Preview</h4>
                            <canvas id="facialCanvas" 
                                    style="width: 100%; border: 3px solid #C8E6C9; border-radius: 8px; display: none;"></canvas>
                            <div id="facialPreview" style="text-align: center; padding: 40px; color: #888; border: 2px dashed #C8E6C9; border-radius: 8px;">
                                Aguardando captura...
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin: 25px 0;">
                        <button id="btnCapturar" style="background: #2E8B57; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-size: 16px; cursor: pointer; margin-right: 10px;">
                            📸 Capturar Rosto
                        </button>
                        <button id="btnCancelar" style="background: #f8f9fa; color: #495057; border: 2px solid #e9ecef; padding: 12px 30px; border-radius: 8px; font-size: 16px; cursor: pointer;">
                            Cancelar
                        </button>
                    </div>
                    
                    <div style="background: #F1F8E9; padding: 15px; border-radius: 8px; border: 1px solid #C8E6C9;">
                        <p style="margin: 0; color: #2E8B57; font-size: 0.9rem;">
                            <strong>💡 Instruções:</strong><br>
                            1. Posicione o rosto no centro<br>
                            2. Mantenha boa iluminação<br>
                            3. Olhe diretamente para a câmera<br>
                            4. Mantenha expressão neutra
                        </p>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Inicializar câmera
            system.iniciarCamera('facialVideo')
                .then(resultado => {
                    if (!resultado.sucesso) {
                        alert(`Erro na câmera: ${resultado.mensagem}`);
                        document.body.removeChild(modal);
                        resolve({ sucesso: false, erro: resultado.mensagem });
                    }
                })
                .catch(erro => {
                    console.error('Erro:', erro);
                    document.body.removeChild(modal);
                    resolve({ sucesso: false, erro: 'Falha ao iniciar câmera' });
                });
            
            // Configurar botões
            document.getElementById('btnCapturar').addEventListener('click', async () => {
                const foto = system.capturarFoto('facialVideo', 'facialCanvas');
                
                if (foto) {
                    // Mostrar preview
                    const previewDiv = document.getElementById('facialPreview');
                    previewDiv.innerHTML = `
                        <img src="${foto}" style="max-width: 100%; border-radius: 5px; border: 2px solid #2E8B57;">
                        <p style="color: #2E8B57; margin-top: 10px;">✅ Rosto capturado!</p>
                    `;
                    
                    // Salvar no sistema
                    setTimeout(async () => {
                        await salvarRostoNoSistema(funcionarioId, foto);
                        
                        // Fechar modal
                        document.body.removeChild(modal);
                        
                        // Parar câmera
                        if (videoStream) {
                            videoStream.getTracks().forEach(track => track.stop());
                        }
                        
                        resolve({ 
                            sucesso: true, 
                            mensagem: 'Rosto cadastrado com sucesso!',
                            foto: foto 
                        });
                    }, 1000);
                }
            });
            
            document.getElementById('btnCancelar').addEventListener('click', () => {
                document.body.removeChild(modal);
                if (videoStream) {
                    videoStream.getTracks().forEach(track => track.stop());
                }
                resolve({ sucesso: false, erro: 'Cancelado pelo usuário' });
            });
            
            // Fechar ao clicar fora
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    if (videoStream) {
                        videoStream.getTracks().forEach(track => track.stop());
                    }
                    resolve({ sucesso: false, erro: 'Cancelado' });
                }
            });
        });
    };
    
    // Login por reconhecimento facial (para funcionário)
    system.loginFacial = async function() {
        return new Promise((resolve) => {
            // Em produção, compararia com rostos cadastrados
            // Aqui simulamos um login bem-sucedido
            
            // Simular processamento
            setTimeout(() => {
                // Usuário de teste (em produção, buscar do Firebase)
                const usuario = {
                    id: 'func001',
                    nome: 'João Silva',
                    email: 'joao.silva@empresa.com',
                    tipo: 'funcionario',
                    foto: null
                };
                
                resolve({
                    sucesso: true,
                    usuario: usuario,
                    mensagem: 'Reconhecimento facial realizado com sucesso!'
                });
            }, 2000);
        });
    };
    
    // Função auxiliar para salvar rosto
    async function salvarRostoNoSistema(funcionarioId, fotoBase64) {
        // Salvar no localStorage para demonstração
        let rostos = JSON.parse(localStorage.getItem('rostos_funcionarios') || '{}');
        rostos[funcionarioId] = {
            foto: fotoBase64,
            dataCadastro: new Date().toISOString()
        };
        localStorage.setItem('rostos_funcionarios', JSON.stringify(rostos));
        
        // Se Firebase estiver disponível, salvar também
        if (window.firebase && window.firebase.db) {
            try {
                const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
                
                await setDoc(doc(window.firebase.db, 'rostos', funcionarioId), {
                    funcionarioId: funcionarioId,
                    foto: fotoBase64, // Em produção, salvar no Storage
                    dataCadastro: new Date().toISOString(),
                    ativo: true
                });
            } catch (error) {
                console.error('Erro ao salvar no Firebase:', error);
            }
        }
    }
    
    return system;
})();
