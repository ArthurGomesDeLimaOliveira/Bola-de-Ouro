const form = document.querySelector('form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  
  const { data, error } = await _supabase.auth.signInWithPassword({
    email: email,
    password: senha
  });
  
  if (error) {
    alert('Erro ao entrar: ' + error.message);
    return;
  }
  
  const user = data.user;
  const userRole = user.user_metadata?.role;
  
  if (userRole === 'admin') {
    alert('Acesso administrativo autorizado!');
    window.location.href = 'dashboard.html';
  } else {
    alert('Bem-vindo à Arena Bola de Ouro!');
    window.location.href = 'home.html';
  }
});