// Funções utilitárias para o sistema

const Utils = {
    // Formatar CPF
    formatCPF: function(cpf) {
        if (!cpf) return '';
        cpf = cpf.replace(/\D/g, '');
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },

    // Formatar telefone
    formatPhone: function(phone) {
        if (!phone) return '';
        phone = phone.replace(/\D/g, '');
        if (phone.length === 11) {
            return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (phone.length === 10) {
            return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    },

    // Validar e-mail
    isValidEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Gerar matrícula automática
    generateMatricula: function() {
        const timestamp = Date.now().toString();
        return 'FUNC' + timestamp.slice(-6);
    },

    // Calcular idade a partir da data de nascimento
    calculateAge: function(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    },

    // Converter horas decimais para formato HH:MM
    decimalToTime: function(decimalHours) {
        const hours = Math.floor(decimalHours);
        const minutes = Math.round((decimalHours - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    },

    // Converter tempo HH:MM para decimal
    timeToDecimal: function(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours + (minutes / 60);
    },

    // Formatar moeda
    formatCurrency: function(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    // Download de arquivo
    downloadFile: function(filename, text) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    },

    // Copiar para área de transferência
    copyToClipboard: function(text) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Texto copiado para área de transferência');
        }).catch(err => {
            console.error('Erro ao copiar texto: ', err);
        });
    },

    // Debounce para otimizar eventos
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle para otimizar eventos
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Exportar para uso global
window.Utils = Utils;
