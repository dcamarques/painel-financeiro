let equipeIdGlobal = null;

async function inicializarConfiguracoes() {
    const listaCatalogo = document.getElementById('lista-catalogo');
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return window.location.replace('index.html');

        const { data: userData } = await supabaseClient.from('usuarios').select('equipe_id').eq('id', session.user.id).single();

        if (userData) {
            equipeIdGlobal = userData.equipe_id;
            await carregarClassesEProdutos();
        }
    } catch (err) {
        console.error("Erro na inicialização", err);
    }
}

async function criarNovaClasse() {
    const nomeClasse = prompt("Digite o nome da nova Classe:");
    if (!nomeClasse || nomeClasse.trim() === '') return;
    await supabaseClient.from('classes_produtos').insert([{ equipe_id: equipeIdGlobal, nome: nomeClasse.trim() }]);
    carregarClassesEProdutos(); 
}

async function editarClasse(id, nomeAtual) {
    const novoNome = prompt("Editar nome da Classe:", nomeAtual);
    if (!novoNome || novoNome.trim() === '' || novoNome === nomeAtual) return;
    await supabaseClient.from('classes_produtos').update({ nome: novoNome.trim() }).eq('id', id);
    carregarClassesEProdutos(); 
}

async function excluirClasse(id, nomeAtual) {
    if (!confirm(`Excluir a classe "${nomeAtual}" e TODOS os produtos dela?`)) return;
    await supabaseClient.from('classes_produtos').delete().eq('id', id);
    carregarClassesEProdutos();
}

async function excluirProduto(id, nomeAtual) {
    if (!confirm(`Excluir o produto "${nomeAtual}"?`)) return;
    await supabaseClient.from('produtos').delete().eq('id', id);
    carregarClassesEProdutos();
}

async function carregarClassesEProdutos() {
    const selectClasse = document.getElementById('prod-classe');
    const listaCatalogo = document.getElementById('lista-catalogo');
    
    try {
        const { data: classes } = await supabaseClient.from('classes_produtos').select('*').eq('equipe_id', equipeIdGlobal).order('nome');
        const { data: produtos } = await supabaseClient.from('produtos').select('*').eq('equipe_id', equipeIdGlobal).order('nome');

        selectClasse.innerHTML = '<option value="">Selecione...</option>';
        listaCatalogo.innerHTML = ''; 

        if (!classes || classes.length === 0) {
            listaCatalogo.innerHTML = `<p class="text-slate-500 text-sm text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">Nenhuma classe ou produto cadastrado.</p>`;
            return;
        }
        
        classes.forEach(classe => {
            const option = document.createElement('option');
            option.value = classe.id;
            option.innerText = classe.nome;
            selectClasse.appendChild(option);

            const produtosDestaClasse = (produtos || []).filter(p => p.classe_id === classe.id);
            let htmlProdutos = '';
            
            if (produtosDestaClasse.length === 0) {
                htmlProdutos = `<div class="p-4 text-sm text-slate-500 italic">Nenhum produto cadastrado nesta classe.</div>`;
            } else {
                htmlProdutos = `<div class="divide-y divide-gray-100 bg-white">`;
                produtosDestaClasse.forEach(prod => {
                    let badges = '';
                    if(prod.status_permitidos){
                        prod.status_permitidos.forEach(st => {
                            let corBg = st.peso > 0 ? 'bg-emerald-100 text-emerald-700' : (st.peso < 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600');
                            badges += `<span class="${corBg} text-[10px] px-2 py-0.5 rounded-full font-medium ml-1">${st.nome} (${st.peso})</span>`;
                        });
                    }
                    htmlProdutos += `
                        <div class="p-4 flex justify-between items-center hover:bg-slate-50">
                            <div>
                                <div class="font-medium text-slate-700 text-sm mb-1">${prod.nome} <span class="text-xs text-slate-400 border border-slate-200 rounded px-1">${prod.unidade_medida}</span></div>
                                <div class="flex flex-wrap gap-1">${badges}</div>
                            </div>
                            <button onclick="excluirProduto('${prod.id}', '${prod.nome}')" class="text-slate-400 hover:text-rose-600 text-xs font-medium">Excluir</button>
                        </div>`;
                });
                htmlProdutos += `</div>`;
            }

            listaCatalogo.innerHTML += `
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-4">
                    <div class="flex justify-between items-center p-4 bg-slate-50 border-b border-gray-200">
                        <h4 class="font-bold text-slate-800 text-md flex items-center gap-2">📁 ${classe.nome}</h4>
                        <div class="flex gap-4">
                            <button onclick="editarClasse('${classe.id}', '${classe.nome}')" class="text-slate-400 hover:text-blue-600 text-xs font-medium uppercase">Editar</button>
                            <button onclick="excluirClasse('${classe.id}', '${classe.nome}')" class="text-slate-400 hover:text-rose-600 text-xs font-medium uppercase">Excluir</button>
                        </div>
                    </div>
                    ${htmlProdutos}
                </div>`;
        });
    } catch (err) {
        console.error(err);
    }
}

async function salvarProdutoNoBanco() {
    const nome = document.getElementById('prod-nome').value;
    const classeId = document.getElementById('prod-classe').value;
    const unidade = document.getElementById('prod-unidade').value;
    const btnSalvar = document.querySelector('button[onclick="salvarProdutoNoBanco()"]');

    if (!nome || !classeId) return alert("Preencha Nome e Classe.");

    const statusArray = [];
    document.querySelectorAll('.status-row').forEach(linha => {
        const nomeStatus = linha.querySelector('.status-nome').value.trim();
        const pesoStatus = parseInt(linha.querySelector('.status-peso').value);
        if (nomeStatus !== '') statusArray.push({ nome: nomeStatus, peso: pesoStatus });
    });

    btnSalvar.innerText = "Salvando...";
    btnSalvar.disabled = true;

    try {
        await supabaseClient.from('produtos').insert([{
            equipe_id: equipeIdGlobal, classe_id: classeId, nome: nome,
            unidade_medida: unidade, status_permitidos: statusArray
        }]);
        document.getElementById('form-produto').reset();
        togglePainelProduto(false); 
        carregarClassesEProdutos();
    } catch (err) {
        alert("Falha: " + err.message);
    } finally {
        btnSalvar.innerText = "Salvar Produto";
        btnSalvar.disabled = false;
    }
}

// --- MOTOR DE METAS BLINDADO COM RAIO-X ---

async function carregarGradeMetas() {
    const mesSelecionado = document.getElementById('mes-alvo').value;
    const cabecalho = document.getElementById('cabecalho-metas');
    const corpo = document.getElementById('corpo-metas');
    const divSalvar = document.getElementById('div-salvar-metas');

    corpo.innerHTML = '<tr><td colspan="100%" class="p-4 text-center text-slate-500 animate-pulse">Carregando matriz de produtos e equipe...</td></tr>';

    try {
        // Busca com verificação de erro explícita (Raio-X)
        const { data: usuarios, error: errUsu } = await supabaseClient.from('usuarios').select('id, nome, email').eq('equipe_id', equipeIdGlobal);
        if (errUsu) throw new Error(`Erro na Tabela Usuários: ${errUsu.message}`);

        const { data: produtos, error: errProd } = await supabaseClient.from('produtos').select('id, nome, unidade_medida').eq('equipe_id', equipeIdGlobal).order('nome');
        if (errProd) throw new Error(`Erro na Tabela Produtos: ${errProd.message}`);

        const { data: metasSalvas, error: errMetas } = await supabaseClient.from('metas').select('*').eq('equipe_id', equipeIdGlobal).eq('mes', mesSelecionado);
        if (errMetas) throw new Error(`Erro na Tabela Metas: ${errMetas.message}`);

        if (!produtos || produtos.length === 0) {
            corpo.innerHTML = '<tr><td colspan="100%" class="p-4 text-center text-rose-500 font-medium">Cadastre pelo menos 1 produto no catálogo para habilitar a matriz de metas.</td></tr>';
            divSalvar.classList.add('hidden');
            return;
        }

        // 1. Monta as Colunas (Produtos)
        let trCabecalho = `<tr><th class="p-4 bg-slate-100 border-b border-gray-200">Colaborador</th>`;
        produtos.forEach(p => {
            const nomeCurto = p.nome.length > 15 ? p.nome.substring(0, 15) + '...' : p.nome;
            trCabecalho += `<th class="p-4 bg-slate-100 border-b border-gray-200 text-center" title="${p.nome}">${nomeCurto} <br><span class="text-xs text-slate-400 font-normal">(${p.unidade_medida})</span></th>`;
        });
        trCabecalho += `</tr>`;
        cabecalho.innerHTML = trCabecalho;

        // Se não houver usuários, avisa na tela
        if (!usuarios || usuarios.length === 0) {
            corpo.innerHTML = '<tr><td colspan="100%" class="p-4 text-center text-rose-500 font-medium">Nenhum colaborador encontrado na sua equipe.</td></tr>';
            divSalvar.classList.add('hidden');
            return;
        }

        // 2. Monta as Linhas (Usuários)
        corpo.innerHTML = '';
        usuarios.forEach(user => {
            const nomeExibicao = user.nome || (user.email ? user.email.split('@')[0] : 'Membro sem nome');
            let tr = `<tr class="hover:bg-slate-50 transition"><td class="p-4 font-medium text-slate-700 whitespace-nowrap border-b border-gray-100">${nomeExibicao}</td>`;
            
            produtos.forEach(p => {
                const metaExiste = (metasSalvas || []).find(m => m.usuario_id === user.id && m.produto_id === p.id);
                const valorAtual = metaExiste ? metaExiste.valor : '';

                tr += `<td class="p-2 border-b border-gray-100 text-center">
                    <input type="number" 
                           data-usuario="${user.id}" 
                           data-produto="${p.id}" 
                           value="${valorAtual}"
                           placeholder="0" 
                           class="w-24 px-2 py-1.5 border border-gray-300 rounded text-center text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none meta-input">
                </td>`;
            });
            tr += `</tr>`;
            corpo.innerHTML += tr;
        });

        divSalvar.classList.remove('hidden');

    } catch (err) {
        console.error(err);
        // Agora o erro EXATO será escrito na tabela em vermelho!
        corpo.innerHTML = `<tr><td colspan="100%" class="p-4 text-center text-rose-600 font-bold bg-rose-50 border border-rose-200">Falha ao gerar matriz:<br><span class="text-sm font-normal">${err.message}</span></td></tr>`;
        divSalvar.classList.add('hidden');
    }
}

async function salvarMetas() {
    const mesSelecionado = document.getElementById('mes-alvo').value;
    const inputs = document.querySelectorAll('.meta-input');
    const btnSalvar = document.getElementById('btn-salvar-metas');
    
    let metasParaSalvar = [];
    
    inputs.forEach(input => {
        const valor = parseFloat(input.value);
        if (!isNaN(valor) && valor > 0) {
            metasParaSalvar.push({
                equipe_id: equipeIdGlobal,
                usuario_id: input.getAttribute('data-usuario'),
                produto_id: input.getAttribute('data-produto'),
                mes: mesSelecionado,
                valor: valor
            });
        }
    });

    if (metasParaSalvar.length === 0) return alert("Preencha pelo menos um valor maior que zero.");

    btnSalvar.innerText = "Salvando...";
    btnSalvar.disabled = true;

    try {
        const { error } = await supabaseClient.from('metas').upsert(metasParaSalvar, { onConflict: 'usuario_id, produto_id, mes' });
        if (error) throw error;
        
        alert("Grade de metas salva com sucesso!");
        carregarGradeMetas();
    } catch (err) {
        alert("Erro ao salvar metas: " + err.message);
    } finally {
        btnSalvar.innerText = "Salvar Grade de Metas";
        btnSalvar.disabled = false;
    }
}

inicializarConfiguracoes();
