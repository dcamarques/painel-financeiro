// Variável de controle global da data visualizada
let dataAtual = new Date(); 

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Utilizamos a variável correta: supabaseClient
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (!session) {
            window.location.replace('index.html');
            return;
        }

        // Preenche o cabeçalho
        document.getElementById('user-info').innerText = session.user.email;
        
        // Inicializa a interface
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

function atualizarDisplayMes() {
    // Formata para o padrão "Agosto 2026" e joga para maiúsculo
    const nomeMes = dataAtual.toLocaleDateString('pt-BR', { month: 'long' });
    const ano = dataAtual.getFullYear();
    document.getElementById('display-mes').innerText = `${nomeMes} ${ano}`.toUpperCase();
}

function inicializarData() {
    atualizarDisplayMes();
}

function mudarMes(direcao) {
    dataAtual.setMonth(dataAtual.getMonth() + direcao);
    atualizarDisplayMes();
    
    // Simula o recarregamento do grid para dar feedback visual ao usuário
    document.getElementById('grid-container').innerHTML = `<p class="text-center text-slate-400 mt-10">Buscando dados de ${document.getElementById('display-mes').innerText}...</p>`;
    setTimeout(() => { renderizarGridVazio(); }, 400);
}

// Constrói o layout tabular de performance
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
                        <!-- Linha de Estado Vazio -->
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
    alert("Próxima etapa: O modal de lançamento retroativo será aberto aqui.");
}
