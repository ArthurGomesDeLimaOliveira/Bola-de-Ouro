async function inicializarMenuCabecalho() {
  const guestMenu = document.getElementById('guestMenu');
  const userMenu = document.getElementById('userMenu');
  const txtNomeUsuario = document.getElementById('txtNomeUsuario');
  const btnTriggerDropdown = document.getElementById('btnTriggerDropdown');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const linkAdmin = document.getElementById('linkAdmin');
  const btnSair = document.getElementById('btnSair');

  try {
    const { data: { user }, error } = await _supabase.auth.getUser();

    if (error) throw error;

    if (user) {
      guestMenu.style.display = 'none';
      userMenu.style.display = 'inline-block';

      const nomeCompleto = user.user_metadata?.full_name || 'Jogador';
      const primeiroNome = nomeCompleto.split(' ')[0];
      txtNomeUsuario.textContent = `Olá, ${primeiroNome}`;

      const nivelAcesso = user.user_metadata?.role || 'client';
      if (nivelAcesso === 'admin') {
        linkAdmin.textContent = "Painel Admin";
        linkAdmin.href = "dashboard.html";
        linkAdmin.style.display = 'block';
      } else {
        linkAdmin.textContent = "Minhas Reservas";
        linkAdmin.href = "minhas-reservas.html";
        linkAdmin.style.display = 'block';
      }

      btnTriggerDropdown.addEventListener('click', (evento) => {
        evento.stopPropagation();
        const estaAberto = dropdownMenu.style.display === 'block';
        dropdownMenu.style.display = estaAberto ? 'none' : 'block';
      });

      document.addEventListener('click', () => {
        dropdownMenu.style.display = 'none';
      });

      btnSair.addEventListener('click', async (evento) => {
        evento.preventDefault();
        
        const { error: signOutError } = await _supabase.auth.signOut();
        
        if (signOutError) {
          alert('Erro ao desconectar: ' + signOutError.message);
        } else {
          alert('Sessão encerrada com sucesso!');
          window.location.href = 'home.html';
        }
      });

    } else {
      guestMenu.style.display = 'block';
      userMenu.style.display = 'none';
    }

  } catch (err) {
    console.error('Erro no controle de sessão do cabeçalho:', err.message);
    guestMenu.style.display = 'block';
    userMenu.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', inicializarMenuCabecalho);