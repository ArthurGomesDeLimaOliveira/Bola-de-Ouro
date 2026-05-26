document.getElementById('contactForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const botaoEnviar = this.querySelector('button[type="submit"]');
    const textoOriginalBotao = botaoEnviar.textContent;

    botaoEnviar.textContent = 'Enviando...';
    botaoEnviar.disabled = true;

    let userId = null;
    const { data: dadosUsuario } = await _supabase.auth.getUser();

    if (dadosUsuario?.user) {
        userId = dadosUsuario.user.id;
    }

    const mensagemContato = {
        user_id: userId,
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefone: document.getElementById('telefone').value.trim(),
        assunto: document.getElementById('assunto').value,
        mensagem: document.getElementById('mensagem').value.trim()
    };

    const { error } = await _supabase
        .from('mensagens_contato')
        .insert([mensagemContato]);

    botaoEnviar.textContent = textoOriginalBotao;
    botaoEnviar.disabled = false;

    if (error) {
        alert('Erro ao enviar mensagem: ' + error.message);
        return;
    }

    alert('Mensagem enviada com sucesso!');
    this.reset();
});
