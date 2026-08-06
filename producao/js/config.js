let equipeIdGlobal = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            window.location.replace('index.html');
            return;
        }

        // Descobre a equipe do usuário logado
        const { data: userData, error: userError } = await supabaseClient
            .from('usuarios')
            .select('equipe_id')
            .eq('id', session.user.id)
            .single();

        if (userData) {
            equipeIdGlobal = userData.equipe_id;
            carregarClasses();
        }
    } catch (err) {
        console.error("Erro ao inicializar configurações:", err);
    }
});

// --- MOTOR DE CLASSES ---

async function criarNovaClasse() {
    const nomeClasse = prompt("Digite o nome da nova Classe (ex: Investimentos, Crédito, Câmbio):");
    if (!nomeClasse || nomeClasse.trim() === '') return;

    const { error } = await supabaseClient
        .from('classes_produtos')
        .insert([{ equipe_id: equipeIdGlobal, nome: nomeClasse.trim() }]);

    if (error) {
        alert("Erro ao criar classe: " + error.message);
    } else {
        carregarClasses(); // Atualiza a lista instantaneamente
    }
}

async function carregarClasses() {
    const { data, error } = await supabaseClient
        .from('classes_produtos')
        .select('id, nome')
        .eq('equipe_id', equipeIdGlobal)
        .order('nome');

    if (error) {
        console.error("Erro ao buscar classes", error);
        return;
    }

    const selectClasse = document.getElementById('prod-classe');
    selectClasse.innerHTML = '<option value="">Selecione...</option>';
    
    data.forEach(classe => {
        const option = document.createElement('option');
        option.value = classe.id;
        option.innerText = classe.nome;
        selectClasse.appendChild(option);
    });
}

// --- MOTOR DE PRODUTOS ---

async function salvarProdutoNoBanco() {
    const btnSalvar = document.querySelector('button[onclick="salvarProdutoNoBanco()"]');
    const textoOriginal = btnSalvar.innerText;
    
    const nome = document.getElementById('prod-nome').value;
    const classeId = document.getElementById('prod-classe').value;
    const unidade = document.getElementById('prod-unidade').value;

    if (!nome || !classeId) {
        alert("Por favor, preencha o Nome e selecione uma Classe.");
        return;
    }

    // Varre o HTML para montar o JSON de status inteligentemente
    const statusArray = [];
    const linhasStatus = document.querySelectorAll('.status-row');
    
    linhasStatus.forEach(linha => {
        const nomeStatus = linha.querySelector('.status-nome').value.trim();
        const pesoStatus = parseInt(linha.querySelector('.status-peso').value);
        
        if (nomeStatus !== '') {
            statusArray.push({ nome: nomeStatus, peso: pesoStatus });
        }
    });

    if (statusArray.length === 0) {
        alert("Adicione pelo menos um status permitido (Ex: Realizado com peso 1).");
        return;
    }

    btnSalvar.innerText = "Salvando...";
    btnSalvar.disabled = true;

    try {
        const { error } = await supabaseClient
            .from('produtos')
            .insert([{
                equipe_id: equipeIdGlobal,
                classe_id: classeId,
                nome: nome,
                unidade_medida: unidade,
                status_permitidos: statusArray
            }]);

        if (error) throw error;

        alert("Produto cadastrado com sucesso!");
        document.getElementById('form-produto').reset();
        togglePainelProduto(false); // Fecha a gaveta lateral
        
        // Aqui no futuro chamaremos uma função para atualizar a lista na tela principal
        
    } catch (err) {
        alert("Falha ao salvar produto: " + err.message);
    } finally {
        btnSalvar.innerText = textoOriginal;
        btnSalvar.disabled = false;
    }
}
