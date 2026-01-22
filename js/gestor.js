async function cadastrarFuncionario() {
    const nome = document.getElementById('nomeFuncionario').value.trim();
    const email = document.getElementById('emailFuncionario').value.trim();
    const senha = document.getElementById('senhaFuncionario').value;
    const cpf = document.getElementById('cpfFuncionario').value.trim();
    const cargo = document.getElementById('cargoFuncionario').value;
    const departamento = document.getElementById('departamentoFuncionario').value;
    const salario = document.getElementById('salarioFuncionario').value;
    const dataAdmissao = document.getElementById('dataAdmissao').value;
    const telefone = document.getElementById('telefoneFuncionario').value.trim();
    const endereco = document.getElementById('enderecoFuncionario').value.trim();
    
    // Validações
    if (!nome || !email || !senha || !cpf || !cargo || !departamento || !dataAdmissao) {
        alert('Preencha todos os campos obrigatórios (*)');
        return;
    }
    
    if (senha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    try {
        if (!auth || !db) {
            throw new Error('Sistema de autenticação não disponível');
        }
        
        console.log('Criando funcionário:', email);
        
        // 1. Criar usuário no Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
        const userId = userCredential.user.uid;
        
        console.log('Usuário criado no Auth:', userId);
        
        // 2. Criar no Firestore
        const funcionarioData = {
            nome: nome,
            email: email,
            cpf: cpf,
            cargo: cargo,
            departamento: departamento,
            dataAdmissao: dataAdmissao,
            tipo: 'funcionario',
            status: 'ativo',
            dataCriacao: new Date().toISOString(),
            criadoPor: usuarioAtual?.id || auth.currentUser?.uid || 'gestor'
        };
        
        // Adicionar campos opcionais apenas se preenchidos
        if (salario) funcionarioData.salario = parseFloat(salario);
        if (telefone) funcionarioData.telefone = telefone;
        if (endereco) funcionarioData.endereco = endereco;
        
        await db.collection('usuarios').doc(userId).set(funcionarioData);
        
        alert('✅ Funcionário cadastrado com sucesso!');
        closeModal('novoFuncionario');
        
        // Atualizar listas
        await carregarFuncionarios();
        await carregarSelectFuncionarios();
        await carregarEstatisticas();
        
    } catch (error) {
        console.error('Erro ao cadastrar funcionário:', error);
        
        // Tratamento de erros específicos do Firebase
        if (error.code === 'auth/email-already-in-use') {
            alert('❌ Este e-mail já está cadastrado!');
        } else if (error.code === 'auth/weak-password') {
            alert('❌ A senha deve ter pelo menos 6 caracteres!');
        } else if (error.code === 'auth/invalid-email') {
            alert('❌ E-mail inválido!');
        } else if (error.code === 'auth/network-request-failed') {
            alert('❌ Erro de conexão. Verifique sua internet.');
        } else if (error.code === 'auth/operation-not-allowed') {
            alert('❌ Operação não permitida. Contate o administrador.');
        } else if (error.code === 'permission-denied') {
            alert('❌ Permissão negada. Você não tem autorização para cadastrar.');
        } else {
            alert('❌ Erro ao cadastrar funcionário: ' + (error.message || 'Erro desconhecido'));
        }
    }
}
