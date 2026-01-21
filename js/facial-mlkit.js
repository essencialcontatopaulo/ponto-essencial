// facial-mlkit.js - Reconhecimento Facial com Firebase ML Kit
window.facialRecognition = (function() {
    'use strict';
    
    const facial = {};
    let videoElement = null;
    let canvasElement = null;
    let stream = null;
    let faceDetector = null;
    
    // Inicializar detector facial
    facial.inicializar = async function() {
        try {
            if (!window.firebase) {
                console.warn('Firebase não carregado. Usando modo simulação.');
                return false;
            }
            
            // Carregar ML Kit
            const { faceDetector } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-ml.js');
            
            // Configurar detector
            const options = {
                mode: 'fast', // 'fast' ou 'accurate'
                enableTracking: true,
                enableContours: false,
                enableClassification: false
            };
            
            faceDetector = window.firebase.ml.faceDetector(options);
            console.log('✅ ML Kit Face Detection inicializado!');
            return true;
            
        } catch (error) {
            console.error('Erro ao inicializar ML Kit:', error);
            return false;
        }
    };
    
    // Iniciar câmera
    facial.iniciarCamera = async function(videoId, canvasId) {
        try {
            videoElement = document.getElementById(videoId);
            canvasElement = document.getElementById(canvasId);
            
            if (!videoElement || !canvasElement) {
                throw new Error('Elementos de vídeo/canvas não encontrados');
            }
            
            // Solicitar permissão da câmera
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } 
            });
            
            videoElement.srcObject = stream;
            
            // Configurar canvas com mesmo tamanho do vídeo
            videoElement.onloadedmetadata = () => {
                canvasElement.width = videoElement.videoWidth;
                canvasElement.height = videoElement.videoHeight;
            };
            
            console.log('📷 Câmera inicializada com sucesso!');
            return true;
            
        } catch (error) {
            console.error('Erro ao acessar câmera:', error);
            throw error;
        }
    };
    
    // Detectar rostos
    facial.detectarRostos = async function() {
        if (!videoElement || !faceDetector) {
            throw new Error('Câmera ou detector não inicializado');
        }
        
        try {
            // Capturar frame do vídeo
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            
            // Converter para formato do ML Kit
            const imageData = {
                image: canvas,
                inputImageFormat: 'rgba'
            };
            
            // Detectar rostos
            const faces = await faceDetector.processImage(imageData);
            
            // Desenhar bounding boxes no canvas
            if (canvasElement) {
                const ctx2 = canvasElement.getContext('2d');
                ctx2.clearRect(0, 0, canvasElement.width, canvasElement.height);
                ctx2.drawImage(videoElement, 0, 0);
                
                faces.forEach(face => {
                    const { boundingBox } = face;
                    ctx2.strokeStyle = '#00FF00';
                    ctx2.lineWidth = 2;
                    ctx2.strokeRect(
                        boundingBox.x, 
                        boundingBox.y, 
                        boundingBox.width, 
                        boundingBox.height
                    );
                    
                    // Desenhar pontos faciais se disponíveis
                    if (face.landmarks) {
                        face.landmarks.forEach(landmark => {
                            ctx2.fillStyle = '#FF0000';
                            ctx2.beginPath();
                            ctx2.arc(landmark.x, landmark.y, 3, 0, 2 * Math.PI);
                            ctx2.fill();
                        });
                    }
                });
            }
            
            return {
                sucesso: faces.length > 0,
                quantidade: faces.length,
                faces: faces
            };
            
        } catch (error) {
            console.error('Erro na detecção facial:', error);
            throw error;
        }
    };
    
    // Capturar rosto para cadastro
    facial.capturarRosto = async function(usuarioId) {
        try {
            // Detectar rostos
            const resultado = await facial.detectarRostos();
            
            if (!resultado.sucesso || resultado.quantidade === 0) {
                return {
                    sucesso: false,
                    erro: 'Nenhum rosto detectado'
                };
            }
            
            if (resultado.quantidade > 1) {
                return {
                    sucesso: false,
                    erro: 'Mais de um rosto detectado. Certifique-se de estar sozinho.'
                };
            }
            
            // Capturar imagem
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoElement, 0, 0);
            
            // Converter para base64
            const imagemBase64 = canvas.toDataURL('image/jpeg', 0.8);
            
            // Extrair características faciais (simplificado)
            const face = resultado.faces[0];
            const caracteristicas = {
                boundingBox: face.boundingBox,
                probabilidadeSorriso: face.smilingProbability || 0,
                probabilidadeOlhoDireitoAberto: face.rightEyeOpenProbability || 0,
                probabilidadeOlhoEsquerdoAberto: face.leftEyeOpenProbability || 0
            };
            
            // Salvar no Firebase
            await salvarRostoFirebase(usuarioId, imagemBase64, caracteristicas);
            
            return {
                sucesso: true,
                imagem: imagemBase64,
                caracteristicas: caracteristicas
            };
            
        } catch (error) {
            console.error('Erro ao capturar rosto:', error);
            return {
                sucesso: false,
                erro: error.message
            };
        }
    };
    
    // Verificar rosto (para login)
    facial.verificarRosto = async function() {
        try {
            // Detectar rostos
            const resultado = await facial.detectarRostos();
            
            if (!resultado.sucesso) {
                return {
                    sucesso: false,
                    erro: 'Nenhum rosto detectado'
                };
            }
            
            // Em produção, você compararia com os rostos cadastrados no Firebase
            // Aqui é uma simulação
            const face = resultado.faces[0];
            const confianca = calcularConfianca(face);
            
            if (confianca > 0.7) {
                // Buscar usuário correspondente no Firebase
                const usuario = await buscarUsuarioPorRosto(face);
                
                return {
                    sucesso: true,
                    usuario: usuario,
                    confianca: confianca
                };
            } else {
                return {
                    sucesso: false,
                    erro: 'Rosto não reconhecido'
                };
            }
            
        } catch (error) {
            console.error('Erro na verificação facial:', error);
            return {
                sucesso: false,
                erro: error.message
            };
        }
    };
    
    // Funções auxiliares (implementação simplificada)
    async function salvarRostoFirebase(usuarioId, imagem, caracteristicas) {
        // Salvar no Firestore
        if (window.firebase && window.firebase.db) {
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            
            await setDoc(doc(window.firebase.db, 'rostos', usuarioId), {
                usuarioId: usuarioId,
                imagem: imagem, // Em produção, salvar no Storage
                caracteristicas: caracteristicas,
                dataCadastro: new Date().toISOString()
            });
        }
        
        // Também salvar localmente para demonstração
        let rostos = JSON.parse(localStorage.getItem('rostos_cadastrados') || '{}');
        rostos[usuarioId] = {
            imagem: imagem,
            caracteristicas: caracteristicas,
            dataCadastro: new Date().toISOString()
        };
        localStorage.setItem('rostos_cadastrados', JSON.stringify(rostos));
    }
    
    function calcularConfianca(face) {
        // Simulação de cálculo de confiança
        // Em produção, usar algoritmos de comparação facial
        return Math.random() * 0.3 + 0.7; // Entre 0.7 e 1.0
    }
    
    async function buscarUsuarioPorRosto(face) {
        // Simulação: retorna um usuário de teste
        return {
            id: 'func001',
            nome: 'João Silva',
            email: 'joao.silva@empresa.com',
            tipo: 'funcionario'
        };
    }
    
    // Parar câmera
    facial.pararCamera = function() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        if (videoElement) {
            videoElement.srcObject = null;
        }
        
        console.log('📷 Câmera parada');
    };
    
    return facial;
})();
