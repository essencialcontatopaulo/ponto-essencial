// PWA Installation Prompt
let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const closeInstall = document.getElementById('closeInstall');

// Mostrar banner apenas na primeira visita
if (!localStorage.getItem('pwaBannerShown')) {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Mostrar banner após 3 segundos
        setTimeout(() => {
            if (installBanner) {
                installBanner.style.display = 'flex';
                localStorage.setItem('pwaBannerShown', 'true');
            }
        }, 3000);
    });
}

// Botão de instalação
if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('PWA instalado');
            installBanner.style.display = 'none';
        }
        
        deferredPrompt = null;
    });
}

// Fechar banner
if (closeInstall) {
    closeInstall.addEventListener('click', () => {
        installBanner.style.display = 'none';
    });
}

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registrado com sucesso:', registration);
            })
            .catch(error => {
                console.log('Falha ao registrar Service Worker:', error);
            });
    });
}
