function switchTab(tab) {
    document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
    
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    
    if (tab === 'login') {
        tabLogin.className = "w-1/2 pb-2 text-slate-800 border-b-2 border-slate-800 font-semibold transition";
        tabRegister.className = "w-1/2 pb-2 text-gray-400 hover:text-slate-600 font-medium transition";
    } else {
        tabRegister.className = "w-1/2 pb-2 text-slate-800 border-b-2 border-slate-800 font-semibold transition";
        tabLogin.className = "w-1/2 pb-2 text-gray-400 hover:text-slate-600 font-medium transition";
    }
    showMessage('');
}

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

function toggleButton(btn, isProcessing, originalText = '') {
    if (isProcessing) {
        btn.disabled = true;
        btn.innerText = "Processando...";
        btn.classList.add('opacity-70', 'cursor-not-allowed');
    } else {
        btn.disabled = false;
        btn.innerText = originalText;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    toggleButton(btn, true);
    showMessage('Autenticando...');

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        
        if (error) {
            showMessage('E-mail ou senha incorretos.', true);
            toggleButton(btn, false, originalText);
        } else {
            showMessage('Acesso liberado! Redirecionando...');
            window.location.href = 'dashboard.html';
        }
    } catch (err) {
        showMessage(`Erro crítico: ${err.message}`, true);
        toggleButton(btn, false, originalText);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;

    const equipeNome = document.getElementById('reg-equipe').value;
    const usuarioNome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    toggleButton(btn, true);
    showMessage('Iniciando ambiente da equipe...');

    try {
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email,
            password
        });

        if (authError) {
            showMessage(`Erro no cadastro: ${authError.message}`, true);
            toggleButton(btn, false, originalText);
            return;
        }

        if (!authData.user) {
            showMessage('Erro: Este e-mail já está em uso ou foi bloqueado.', true);
            toggleButton(btn, false, originalText);
            return;
        }

        const userId = authData.user.id;
        const dataVencimento = new Date();
        dataVencimento.setDate(dataVencimento.getDate() + 30); 

        const { data: equipeData, error: equipeError } = await supabaseClient
            .from('equipes')
            .insert([{ nome: equipeNome, data_vencimento_acesso: dataVencimento.toISOString() }])
            .select()
            .single();

        if (equipeError) {
            showMessage(`Erro no Banco (Equipe): ${equipeError.message}`, true);
            toggleButton(btn, false, originalText);
            return;
        }

        const { error: userError } = await supabaseClient
            .from('usuarios')
            .insert([{
                id: userId,
                equipe_id: equipeData.id,
                nome_usuario: usuarioNome,
                email: email,
                nivel_acesso: 'Master'
            }]);

        if (userError) {
            showMessage(`Erro no Banco (Usuário): ${userError.message}`, true);
            toggleButton(btn, false, originalText);
            return;
        }

        showMessage('Equipe criada com sucesso! Você já pode entrar com seu e-mail e senha.', false);
        switchTab('login');
        toggleButton(btn, false, originalText);

    } catch (err) {
        showMessage(`Falha estrutural: ${err.message}`, true);
        toggleButton(btn, false, originalText);
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('login-email').value;
    if (!email) {
        showMessage('Por favor, digite seu e-mail no campo acima antes de solicitar a recuperação.', true);
        return;
    }
    
    showMessage('Solicitando recuperação de senha...');
    
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/producao/dashboard.html',
        });
        
        if (error) {
            showMessage(`Erro: ${error.message}`, true);
        } else {
            showMessage('Instruções enviadas! Verifique sua caixa de entrada.', false);
        }
    } catch (err) {
        showMessage(`Erro crítico: ${err.message}`, true);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            window.location.href = 'dashboard.html';
        }
    } catch (err) {
        console.log("Nenhuma sessão ativa encontrada.");
    }
});
