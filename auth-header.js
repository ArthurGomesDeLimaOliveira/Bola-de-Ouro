async function inicializarMenuCabecalho() {
  const guestMenu = document.getElementById('guestMenu');
  const userMenu = document.getElementById('userMenu');
  const txtNomeUsuario = document.getElementById('txtNomeUsuario');
  const btnTriggerDropdown = document.getElementById('btnTriggerDropdown');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const linkAdmin = document.getElementById('linkAdmin');
  const btnSair = document.getElementById('btnSair');

  try {
    // 1. Captura o usuário ativo no Supabase
    const { data: { user }, error } = await _supabase.auth.getUser();

    if (error) throw error;

    if (user) {
      // Alterna a exibição dos blocos do cabeçalho
      guestMenu.style.display = 'none';
      userMenu.style.display = 'inline-block';

      // 2. Extrai o primeiro nome do cadastro
      const nomeCompleto = user.user_metadata?.full_name || 'Jogador';
      const primeiroNome = nomeCompleto.split(' ')[0];
      txtNomeUsuario.textContent = `Olá, ${primeiroNome}`;

      // 3. Verifica o nível de acesso para liberar o link correto no dropdown
      const nivelAcesso = user.user_metadata?.role || 'client';
      if (nivelAcesso === 'admin') {
        linkAdmin.textContent = "Painel Admin";
        linkAdmin.href = "dashboard.html";
        linkAdmin.style.display = 'block';
      } else {
        linkAdmin.textContent = "Minhas Reservas";
        linkAdmin.href = "minhas-reservas.html";
        linkAdmin.style.display = 'block'; // Mostra o link para o cliente também, mas apontando para as reservas dele!
      }

      // 4. Mecanismo de abrir/fechar o Dropdown
      btnTriggerDropdown.addEventListener('click', (evento) => {
        evento.stopPropagation();
        const estaAberto = dropdownMenu.style.display === 'block';
        dropdownMenu.style.display = estaAberto ? 'none' : 'block';
      });

      // Fecha o menu caso clique em qualquer outra área da tela
      document.addEventListener('click', () => {
        dropdownMenu.style.display = 'none';
      });

      // 5. Ação do Botão Deslogar (Sair)
      btnSair.addEventListener('click', async (evento) => {
        evento.preventDefault();
        
        const { error: signOutError } = await _supabase.auth.signOut();
        
        if (signOutError) {
          alert('Erro ao desconectar: ' + signOutError.message);
        } else {
          alert('Sessão encerrada com sucesso!');
          window.location.href = 'home.html'; // Redireciona para a Home limpa
        }
      });

    } else {
      // Força a exibição do menu de visitante se não houver sessão ativa
      guestMenu.style.display = 'block';
      userMenu.style.display = 'none';
    }

  } catch (err) {
    console.error('Erro no controle de sessão do cabeçalho:', err.message);
    // Em caso de falha crítica na API, mantém os botões padrão ativos
    guestMenu.style.display = 'block';
    userMenu.style.display = 'none';
  }
}

// Roda a verificação de sessão assim que a página é carregada
document.addEventListener('DOMContentLoaded', inicializarMenuCabecalho);