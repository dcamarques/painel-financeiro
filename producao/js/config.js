let equipeIdGlobal = null;

// Função principal que roda imediatamente
async function inicializarConfiguracoes() {
    const listaCatalogo = document.getElementById('lista-catalogo');
    try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (!session) {
            window.location.replace('index.html');
            return;
        }

        const { data: userData, error: userError } = await supabaseClient
            .from('usuarios')
            .select('equipe_id')
            .eq('id', session.user.id)
            .single();

        if (userError) throw userError;

        if (userData) {
            equipeIdGlobal = userData.equipe_id;
            await carregarClasses();
        } else {
            listaCatalogo.innerHTML = `<p class="text-rose-600 font-bold p-5">Erro: Usuário não encontrado no banco.</p>`;
        }
    } catch (err) {
        listaCatalogo.innerHTML = `<div class="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-md text-sm"><b>Erro de Autenticação:</b> ${err.message}</div>`;
    }
}

// --- MOTOR DE CLASSES (VISUALIZAR, CRIAR, EDITAR E EXCLUIR) ---

async function criarNovaClasse() {
    const nomeClasse = prompt("Digite o nome da nova Classe (ex: Investimentos, Crédito, Câmbio):");
    if (!nomeClasse || nomeClasse.trim() === '') return;

    const { error } = await supabaseClient
        .from('classes_produtos')
        .insert([{ equipe_id: equipeIdGlobal, nome: nomeClasse.trim() }]);

    if (error) {
        alert("Erro ao criar classe: " + error.message);
    } else {
        alert(`A classe "${nomeClasse.trim()}" foi criada com sucesso!`);
        carregarClasses(); 
    }
}

async function editarClasse(id, nomeAtual) {
    const novoNome = prompt("Editar nome da Classe:", nomeAtual);
    if (!novoNome || novoNome.trim() === '' || novoNome === nomeAtual) return;

    const { error } = await supabaseClient
        .from('classes_produtos')
        .update({ nome: novoNome.trim() })
        .eq('id', id);

    if (error) {
        alert("Erro ao editar classe: " + error.message);
    } else {
        carregarClasses(); 
    }
}

async function excluirClasse(id, nomeAtual) {
    const confirmacao = confirm(`ATENÇÃO: Tem certeza que deseja excluir a classe "${nomeAtual}"?\n\nIsso apagará TODOS OS PRODUTOS atrelados a ela no catálogo. Esta ação não pode ser desfeita.`);
    if (!confirmacao) return;

    const { error } = await supabaseClient
        .from('classes_produtos')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Erro ao excluir classe: " + error.message);
    } else {
        carregarClasses();
    }
}

async function carregarClasses() {
    const selectClasse = document.getElementById('prod-classe');
    const listaCatalogo = document.getElementById('lista-catalogo');
    
    try {
        const { data, error } = await supabaseClient
            .from('classes_produtos')
            .select('id, nome')
            .eq('equipe_id', equipeIdGlobal)
            .order('nome');

        if (error) throw error;

        selectClasse.innerHTML = '<option value="">Selecione...</option>';
        listaCatalogo.innerHTML = ''; 

        if (!data || data.length === 0) {
            listaCatalogo.innerHTML = `
                <div class="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg bg-slate-50/50">
                    <p class="text-slate-500 text-sm">Nenhuma classe ou produto cadastrado no catálogo.</p>
                </div>
            `;
            return;
        }
        
        data.forEach(classe => {
            const option = document.createElement('option');
            option.value = classe.id;
            option.innerText = classe.nome;
            selectClasse.appendChild(option);

            const classeCard = document.createElement('div');
            classeCard.className = "bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden";
            classeCard.innerHTML = `
                <div class="flex justify-between items-center p-4 bg-slate-50 border-b border-gray-200">
                    <h4 class="font-bold text-slate-800 text-md flex items-center gap-2">
                        <span class="text-slate-400">📁</span> ${classe.nome}
                    </h4>
                    <div class="flex gap-4">
                        <button onclick="editarClasse('${classe.id}', '${classe.nome}')" class="text-slate-500 hover:text-blue-600 text-sm font-medium transition flex items-center gap-1">✏️ Editar</button>
                        <button onclick="excluirClasse('${classe.id}', '${classe.nome}')" class="text-slate-500 hover:text-rose-600 text-sm font-medium transition flex items-center gap-1">🗑️ Excluir</button>
                    </div>
                </div>
                <div id="produtos-classe-${classe.id}" class="p-4 text-sm text-slate-500 bg-white">
                    <span class="italic text-xs">Os produtos vinculados a esta classe aparecerão listados aqui em breve...</span>
                </div>
            `;
            listaCatalogo.appendChild(classeCard);
        });
    } catch (err) {
        listaCatalogo.innerHTML = `<div class="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-md text-sm"><b>Erro no Banco de Dados:</b> ${err.message}</div>`;
    }
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
        alert("Adicione pelo menos um status permitido.");
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
        togglePainelProduto(false); 
        
    } catch (err) {
        alert("Falha ao salvar produto: " + err.message);
    } finally {
        btnSalvar.innerText = textoOriginal;
        btnSalvar.disabled = false;
    }
}

// Dispara o motor principal na hora que o arquivo é lido!
inicializarConfiguracoes();
