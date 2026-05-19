const form = document.querySelector('form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const telefone = document.getElementById('telefone').value;
  const senha = document.getElementById('senha').value;
  const confirmar = document.getElementById('confirmar').value;
  
  if (senha !== confirmar) {
    alert('As senhas não coincidem!');
    return;
  }
  
 
  const { data, error } = await _supabase.auth.signUp({
    email: email,
    password: senha,
    options: {
      data: {
        full_name: nome,
        phone: telefone,
        role: 'client'
      }
    }
  });
  
  if (error) {
    alert('Erro ao cadastrar: ' + error.message);
  } else {
    alert('Cadastro realizado com sucesso! Verifique seu e-mail se necessário ou faça login.');
    window.location.href = 'login.html';
  }
});