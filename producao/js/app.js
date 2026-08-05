// Radar de Segurança: Protege a página de acessos não autorizados
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Se não houver sessão ativa, expulsa de volta para o login
    if (!session) {
        window.location.replace('index.html');
        return;
    }

    // Preenche o cabeçalho com o e-mail do usuário autenticado
    document.getElementById('user-info').innerText = session.user.email;
    
    // Inicializa a data atual no display de meses (Ex: Agosto 2026)
    inicializarData();
});

// Função para encerrar a sessão
async function handleLogout() {
    await supabase.auth.signOut();
    window.location.replace('index.html');
}

// --- VARIÁVEIS DE ESTADO GLOBAL PARA O CONTROLE DE MESES ---
let dataAtual = new Date(); // Inicia com a data de hoje

// Função para formatar e exibir o mês na tela
function atualizarDisplayMes() {
    const opcoes = { month: 'long', year: 'numeric' };
    const formato = dataAtual.toLocaleDateString('pt-BR', opcoes);
    document.getElementById('display-mes').innerText = formato;
}

// Configura a data inicial ao carregar a página
function inicializarData() {
    atualizarDisplayMes();
}

// Função disparada pelos botões << e >>
function mudarMes(direcao) {
    // Altera o mês atual com base na direção (-1 para voltar, 1 para avançar)
    dataAtual.setMonth(dataAtual.getMonth() + direcao);
    atualizarDisplayMes();
    
    // NOTA DO SÓCIO: Aqui, no futuro, chamaremos a função que vai no Supabase
    // buscar as produções do novo mês selecionado e remontar o Grid.
    console.log("Mês alterado. Nova data base:", dataAtual);
}
