let equipeIdGlobal = null;

// Função principal que roda imediatamente
async function inicializarConfiguracoes() {
    const listaCatalogo = document.getElementById('lista-catalogo');
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
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
            await carregarClassesEProdutos();
        } else {
            listaCatalogo.innerHTML = `<p class="text-rose-600 font-bold p-5">Erro: Usuário não encontrado no banco.</p>`;
        }
    } catch (err) {
        listaCatalogo.innerHTML = `<div class="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-md text-sm"><b>Erro de Autenticação:</b> ${err.message}</div>`;
    }
}

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
        carregarClassesEProdutos(); 
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
        carregarClassesEProdutos(); 
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
        carregarClassesEProdutos();
    }
}

// --- MOTOR PRINCIPAL: CARREGA CLASSES E SEUS PRODUTOS ---

async function carregarClassesEProdutos() {
    const selectClasse = document.getElementById('prod-classe');
    const listaCatalogo = document.getElementById('lista-catalogo');
    
    try {
        // 1. Busca todas as Classes
        const { data: classes, error: erroClasses } = await supabaseClient
            .from('classes_produtos')
            .select('id, nome')
            .eq('equipe_id', equipeIdGlobal)
            .order('nome');

        if (erroClasses) throw erroClasses;

        // 2. Busca todos os Produtos
        const { data: produtos, error: erroProdutos } = await supabaseClient
            .from('produtos')
            .select('*')
            .eq('equipe_id', equipeIdGlobal)
            .order('nome');

        if (erroProdutos) throw erroProdutos;

        // Limpa a tela
        selectClasse.innerHTML = '<option value="">Selecione...</option>';
        listaCatalogo.innerHTML = ''; 

        if (!classes || classes.length === 0) {
            listaCatalogo.innerHTML = `
                <div class="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg bg-slate-50/50">
                    <p class="text-slate-500 text-sm">Nenhuma classe ou produto cadastrado no catálogo.</p>
                </div>
            `;
            return;
        }
        
        // Monta a estrutura visual
        classes.forEach(classe => {
            // Popula a caixinha do formulário
            const option = document.createElement('option');
            option.value = classe.id;
            option.innerText = classe.nome;
            selectClasse.appendChild(option);

            // Filtra apenas os produtos que pertencem a esta classe
            const produtosDestaClasse = produtos.filter(p => p.classe_id === classe.id);
            
            let htmlProdutos = '';
            
            if (produtosDestaClasse.length === 0) {
                htmlProdutos = `<div class="p-4 text-sm text-slate-500 bg-white"><span class="italic text-xs">Nenhum produto cadastrado nesta classe.</span></div>`;
            } else {
                htmlProdutos = `<div class="divide-y divide-gray-100 bg-white">`;
                produtosDestaClasse.forEach(prod => {
                    // Monta as tags visuais (badges) para cada status que o produto tem
                    let badgesStatus = '';
                    if(prod.status_permitidos && Array.isArray(prod.status_permitidos)){
                        prod.status_permitidos.forEach(st => {
                            let corBg = st.peso > 0 ? 'bg-emerald-100 text-emerald-700' : (st.peso < 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600');
                            badgesStatus += `<span class="${corBg} text-[10px] px-2 py-0.5 rounded-full font-medium ml-1">${st.nome} (${st.peso})</span>`;
                        });
                    }

                    htmlProdutos += `
                        <div class="p-4 flex justify-between items-center hover:bg-slate-50 transition">
                            <div>
                                <div class="font-medium text-slate-700 text-sm mb-1">${prod.nome} <span class="ml-2 text-xs text-slate-400 border border-slate-200 rounded px-1">${prod.unidade_medida}</span></div>
                                <div class="flex flex-wrap gap-1">${badgesStatus}</div>
                            </div>
                            <button onclick="excluirProduto('${prod.id}', '${prod.nome}')" class="text-slate-400 hover:text-rose-600 text-xs font-medium transition px-2 py-1">Excluir</button>
                        </div>
                    `;
                });
                htmlProdutos += `</div>`;
            }

            // Monta o Card da Classe com os produtos dentro
            const classeCard = document.createElement('div');
            classeCard.className = "bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden";
            classeCard.innerHTML = `
                <div class="flex justify-between items-center p-4 bg-slate-50 border-b border-gray-200">
                    <h4 class="font-bold text-slate-800 text-md flex items-center gap-2">
                        <span class="text-slate-400">📁</span> ${classe.nome}
                    </h4>
                    <div class="flex gap-4">
                        <button onclick="editarClasse('${classe.id}', '${classe.nome}')" class="text-slate-400 hover:text-blue-600 text-xs font-medium transition uppercase tracking-wide">Editar Classe</button>
                        <button onclick="excluirClasse('${classe.id}', '${classe.nome}')" class="text-slate-400 hover:text-rose-600 text-xs font-medium transition uppercase tracking-wide">Excluir Classe</button>
                    </div>
                </div>
                ${htmlProdutos}
            `;
            listaCatalogo.appendChild(classeCard);
        });
    } catch (err) {
        listaCatalogo.innerHTML = `<div class="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-md text-sm"><b>Erro no Banco de Dados:</b> ${err.message}</div>`;
    }
}

// --- MOTOR DE PRODUTOS ---

async function excluirProduto(id, nomeAtual) {
    const confirmacao = confirm(`Deseja excluir o produto "${nomeAtual}" do catálogo?`);
    if (!confirmacao) return;

    const { error } = await supabaseClient
        .from('produtos')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Erro ao excluir produto: " + error.message);
    } else {
        carregarClassesEProdutos();
    }
}

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

        // Limpa a tela e fecha a gaveta
        document.getElementById('form-produto').reset();
        togglePainelProduto(false); 
        
        // Atualiza a tela instantaneamente para mostrar o produto criado!
        carregarClassesEProdutos();
        
    } catch (err) {
        alert("Falha ao salvar produto: " + err.message);
    } finally {
        btnSalvar.innerText = textoOriginal;
        btnSalvar.disabled = false;
    }
}

inicializarConfiguracoes();
