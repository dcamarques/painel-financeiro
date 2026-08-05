// Função para alternar entre as abas Login / Criar Equipe
function switchTab(tab) {
    document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
    
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    
    // Altera o visual da aba ativa
    if (tab === 'login') {
        tabLogin.className = "w-1/2 pb-2 text-slate-800 border-b-2 border-slate-800 font-semibold transition";
        tabRegister.className = "w-1/2 pb-2 text-gray-400 hover:text-slate-600 font-medium transition";
    } else {
        tabRegister.className = "w-1/2 pb-2 text-slate-800 border-b-2 border-slate-800 font-semibold transition";
        tabLogin.className = "w-1/2 pb-2 text-gray-400 hover:text-slate-600 font-medium transition";
    }
    showMessage(''); // Limpa mensagens anteriores
}

// Função para exibir alertas na tela
function showMessage(msg, isError = false) {
    const box = document.getElementById('message-box');
    if (!msg) {
        box.style.display = 'none';
        return;
    }
    box.style.display = 'block';
    box.className = `mt-5 p-3 rounded-lg text-sm text-center font-medium ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`;
    box.innerText = msg;
}

// Motor de Login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    showMessage('Autenticando...');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        showMessage('E-mail ou senha incorretos.', true);
    } else {
        showMessage('Acesso liberado! Redirecionando...');
        // O próximo arquivo que criaremos!
        window.location.href = 'dashboard.html';
    }
}

// Motor de Criação de Equipe (Onboarding do Master)
async function handleRegister(e) {
    e.preventDefault();
    const equipeNome = document.getElementById('reg-equipe').value;
    const usuarioNome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    showMessage('Iniciando ambiente da equipe...');

    // 1. Cadastra o usuário no sistema de Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
    });

    if (authError) {
        showMessage(authError.message, true);
        return;
    }

    const userId = authData.user.id;

    // 2. Regra de Negócio: Cria a Equipe no banco concedendo 30 dias de teste grátis
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + 30); 

    const { data: equipeData, error: equipeError } = await supabase
        .from('equipes')
        .insert([{ nome: equipeNome, data_vencimento_acesso: dataVencimento.toISOString() }])
        .select()
        .single();

    if (equipeError) {
        showMessage("Erro ao registrar a equipe. Tente novamente.", true);
        return;
    }

    // 3. Regra de Hierarquia: Registra quem acabou de entrar como 'Master'
    const { error: userError } = await supabase
        .from('usuarios')
        .insert([{
            id: userId,
            equipe_id: equipeData.id,
            nome_usuario: usuarioNome,
            email: email,
            nivel_acesso: 'Master'
        }]);

    if (userError) {
        showMessage("Erro ao aplicar nível hierárquico.", true);
        return;
    }

    showMessage('Equipe criada com sucesso! Você já pode entrar com seu e-mail e senha.', false);
    switchTab('login');
}

// Motor de Recuperação de Senha
async function handleForgotPassword() {
    const email = document.getElementById('login-email').value;
    if (!email) {
        showMessage('Por favor, digite seu e-mail no campo acima antes de solicitar a recuperação.', true);
        return;
    }
    
    showMessage('Solicitando recuperação de senha...');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/producao/dashboard.html',
    });
    
    if (error) {
        showMessage(error.message, true);
    } else {
        showMessage('Instruções enviadas! Verifique sua caixa de entrada.', false);
    }
}
// --- CÓDIGO A SER ADICIONADO NO FINAL DO AUTH.JS ---

// Radar de Sessão: Verifica se o usuário já está logado ao abrir a página
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // Se já tem sessão ativa, pula o login e vai pro painel
        window.location.href = 'dashboard.html';
    }
});
