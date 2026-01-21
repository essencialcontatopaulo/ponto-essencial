// Simulação de reconhecimento facial
class FaceRecognition {
    constructor() {
        this.employees = JSON.parse(localStorage.getItem('employees') || '[]');
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.stream = null;
    }

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
            });
            this.video.srcObject = this.stream;
            return true;
        } catch (error) {
            console.error('Erro ao acessar câmera:', error);
            return false;
        }
    }

    captureFrame() {
        const context = this.canvas.getContext('2d');
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        context.drawImage(this.video, 0, 0);
        return this.canvas.toDataURL('image/jpeg');
    }

    // Simulação de reconhecimento (em produção, usar uma API como FaceAPI.js)
    async recognizeEmployee() {
        const capturedPhoto = this.captureFrame();
        
        // Em produção, aqui viria o algoritmo de reconhecimento
        // Por enquanto, simulamos encontrando um funcionário aleatório
        if (this.employees.length > 0) {
            const randomEmployee = this.employees[Math.floor(Math.random() * this.employees.length)];
            
            // Simular processamento
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            return {
                success: true,
                employee: randomEmployee,
                confidence: 0.85, // Simulação de confiança
                timestamp: new Date().toISOString()
            };
        } else {
            return {
                success: false,
                message: "Nenhum funcionário cadastrado no sistema."
            };
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
}

// Inicializar na página principal
if (document.getElementById('startCamera')) {
    const faceRecog = new FaceRecognition();
    
    document.getElementById('startCamera').addEventListener('click', async () => {
        const started = await faceRecog.startCamera();
        if (started) {
            document.getElementById('captureFace').disabled = false;
            document.getElementById('employeeStatus').textContent = 'Câmera ativa. Posicione seu rosto.';
            document.getElementById('employeeStatus').className =
