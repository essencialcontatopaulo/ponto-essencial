// facial-simple.js - Sistema Simples de Reconhecimento Facial
window.facialSystem = (function() {
    'use strict';
    
    const system = {};
    
    system.iniciarCamera = async function(videoElementId) {
        try {
            const video = document.getElementById(videoElementId);
            if (!video) {
                throw new Error('Elemento de vídeo não encontrado');
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } 
            });
            
            video.srcObject = stream;
            
            await new Promise(resolve => {
                video.onloadedmetadata = () => {
                    video.play();
                    resolve();
                };
            });
            
            return { sucesso: true, mensagem: 'Câmera ativada' };
            
        } catch (error) {
            console.error('❌ Erro ao acessar câmera:', error);
            return { 
                sucesso: false, 
                mensagem: 'Não foi possível acessar a câmera',
                erro: error.message 
            };
        }
    };
    
    system.capturarFoto = function(videoElementId, canvasElementId) {
        const video = document.getElementById(videoElementId);
        const canvas = document.getElementById(canvasElementId);
        
        if (!video || !canvas) {
            return null;
        }
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const fotoBase64 = canvas.toDataURL('image/jpeg', 0.8);
        
        return fotoBase64;
    };
    
    system.registrarRosto = async function(funcionarioId, funcionarioNome) {
        return new Promise((resolve) => {
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
                        <button id="btnCancelar" style="background: #f8f9fa; color: #495057; border: 2px solid #e9ecef; padding: 12px
