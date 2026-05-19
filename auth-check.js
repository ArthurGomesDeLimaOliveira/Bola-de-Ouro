async function checarPermissaoAdmin() {
  const { data: { user }, error } = await _supabase.auth.getUser();
  
  if (error || !user || user.user_metadata?.role !== 'admin') {
    alert('Acesso restrito! Apenas administradores podem acessar esta área.');
    window.location.href = 'login.html';
  }
}

checarPermissaoAdmin();