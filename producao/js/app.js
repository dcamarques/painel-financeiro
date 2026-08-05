// Variável central unificada para controle de tempo
let dataAtual = new Date(); 

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (!session) {
            window.location.replace('index.html');
            return;
        }

        // Busca a identidade real do usuário na nossa tabela
        const { data: userData, error: userError } = await supabaseClient
            .from('usuarios')
            .select('nome_usuario, nivel_acesso')
            .eq('id', session.user.id)
            .single();

        const userInfoDiv = document.getElementById('user-info');

        // Renderiza o cabeçalho dinâmico (Nome + Email + Badge de Hierarquia)
        if (userData) {
            userInfoDiv.innerHTML = `
                <div class="flex items-center gap-2">
                    <div class="flex flex-col leading-tight">
                        <span class="font-semibold text-white tracking-wide">${userData.nome_usuario}</span>
                        <span class="text-slate-400 text-xs">${session.user.email}</span>
                    </div>
                    <span class="ml-2 bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                        ${userData.nivel_acesso}
                    </span>
                </div>
            `;
        } else {
            // Fallback caso ocorra atraso na leitura do banco
            userInfoDiv.innerText = session.user.email;
        }
        
        inicializarData();
        renderizarGridVazio();

    } catch (err) {
        console.error("Falha ao carregar a sessão:", err);
    }
});

async function handleLogout() {
    await supabaseClient.auth.signOut();
    window.location.replace('index.html');
}

// --- MOTORES DE CALENDÁRIO ---

function atualizarDisplaysDeData() {
    // Atualiza o bloco do Mês (Ex: AGOSTO 2026)
    const nomeMes = dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    document.getElementById('display-mes').innerText = nomeMes.toUpperCase();

    // Atualiza o bloco do Dia (Ex: 05 de Ago)
    const formatoDia = dataAtual.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    // Ajusta o "de ago." para um formato mais limpo "05 Ago"
    document.getElementById('display-dia').innerText = formatoDia.replace(' de ', ' ').replace('.', '').toUpperCase();
}

function inicializarData() {
    atualizarDisplaysDeData();
}

function mudarMes(direcao) {
    // Adiciona ou subtrai 1 mês da data atual
    dataAtual.setMonth(dataAtual.getMonth() + direcao);
    atualizarDisplaysDeData();
    simularCarregamento();
}

function mudarDia(direcao) {
    // Adiciona ou subtrai 1 dia da data atual
    dataAtual.setDate(dataAtual.getDate() + direcao);
    atualizarDisplaysDeData();
    simularCarregamento();
}

function simularCarregamento() {
    document.getElementById('grid-container').innerHTML = `<p class="text-center text-slate-400 mt-10">Buscando resultados para ${document.getElementById('display-dia').innerText}...</p>`;
    setTimeout(() => { renderizarGridVazio(); }, 300);
}

// --- CONSTRUÇÃO DO GRID ---

function renderizarGridVazio() {
    const container = document.getElementById('grid-container');
    container.innerHTML = `
        <div class="w-full">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-semibold text-slate-800">Performance da Equipe</h3>
                <button onclick="abrirModalLancamento()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition">
                    + Lançar Produção
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr class="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                            <th class="p-3 font-semibold rounded-tl-lg">Classe / Produto</th>
                            <th class="p-3 font-semibold text-right">Realizado Hoje</th>
                            <th class="p-3 font-semibold text-right">Meta Mês</th>
                            <th class="p-3 font-semibold text-right">Realizado Mês</th>
                            <th class="p-3 font-semibold text-right rounded-tr-lg">% Atingimento</th>
                        </tr>
                    </thead>
                    <tbody id="tabela-corpo">
                        <tr>
                            <td colspan="5" class="p-10 text-center text-slate-500 text-sm">
                                Nenhuma meta ou produção registrada para este período.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function abrirModalLancamento() {
    alert("O modal de lançamento será integrado à matriz de classes na próxima etapa.");
}
