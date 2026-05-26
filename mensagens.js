const mensagensLista = document.getElementById('lista-mensagens');
const inputBusca = document.getElementById('busca-mensagem');
const selectStatus = document.getElementById('filtro-status-mensagem');

let todasAsMensagens = [];

function escaparHTML(valor) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function buscarMensagens() {
  const { data, error } = await _supabase
    .from('mensagens_contato')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar mensagens:', error.message);
    mensagensLista.innerHTML = `<h3>Erro ao carregar mensagens</h3>`;
    return;
  }

  todasAsMensagens = data || [];
  renderizarMensagens(todasAsMensagens);
}

function renderizarMensagens(lista) {
  mensagensLista.innerHTML = `<h3>Mensagens (${lista.length})</h3>`;

  if (lista.length === 0) {
    mensagensLista.innerHTML += `<p class="empty-text" style="padding: 30px; text-align: center; color: #777; font-size: 13px;">Nenhuma mensagem encontrada.</p>`;
    return;
  }

  lista.forEach(msg => {
    const dataMensagem = new Date(msg.created_at);
    const dataFormatada = dataMensagem.toLocaleDateString('pt-BR') + ' às ' + dataMensagem.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const statusMensagem = msg.status_mensagem || 'Nova';
    const nome = escaparHTML(msg.nome);
    const email = escaparHTML(msg.email);
    const telefone = escaparHTML(msg.telefone || 'Não informado');
    const assunto = escaparHTML(msg.assunto);
    const mensagem = escaparHTML(msg.mensagem).replace(/\n/g, '<br>');

    const cardMensagem = document.createElement('div');
    cardMensagem.className = 'reserva-item';
    cardMensagem.style = 'background: #fff; padding: 15px; border-radius: 6px; margin-top: 10px; border: 1px solid #e2e2e2; display: flex; justify-content: space-between; align-items: flex-start; gap: 18px;';

    cardMensagem.innerHTML = `
      <div style="flex: 1;">
        <strong style="font-size: 14px; color: #222;">${nome}</strong>
        <span style="font-size: 11px; color: #666; margin-left: 8px;">${email}</span>
        <div style="font-size: 12px; color: #444; margin-top: 5px;">
          <b>Telefone:</b> ${telefone} | <b>Assunto:</b> ${assunto}
        </div>
        <div style="font-size: 12px; color: #777; margin-top: 4px;">
          <i>Enviada em: ${dataFormatada}</i>
        </div>
        <div style="font-size: 13px; color: #333; margin-top: 10px; line-height: 1.4;">
          ${mensagem}
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
        <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${statusMensagem === 'Lida' ? '#eefaf1' : '#ffebee'}; color: ${statusMensagem === 'Lida' ? '#1f8f3d' : '#c62828'};">
          ${statusMensagem.toUpperCase()}
        </span>
        ${statusMensagem !== 'Lida' ? `<button onclick="marcarMensagemLida('${msg.id}')" style="background: #1f8f3d; color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: bold;">Marcar como lida</button>` : ''}
      </div>
    `;

    mensagensLista.appendChild(cardMensagem);
  });
}

window.marcarMensagemLida = async function(id) {
  const { error } = await _supabase
    .from('mensagens_contato')
    .update({ status_mensagem: 'Lida' })
    .eq('id', id);

  if (error) {
    alert('Erro ao atualizar mensagem: ' + error.message);
  } else {
    buscarMensagens();
  }
};

function aplicarFiltrosMensagens() {
  const termo = inputBusca.value.toLowerCase();
  const filtroStatus = selectStatus.value;

  const filtradas = todasAsMensagens.filter(msg => {
    const statusMensagem = msg.status_mensagem || 'Nova';
    const telefone = msg.telefone || '';

    const bateTexto = String(msg.nome || '').toLowerCase().includes(termo) ||
                      String(msg.email || '').toLowerCase().includes(termo) ||
                      telefone.toLowerCase().includes(termo) ||
                      String(msg.assunto || '').toLowerCase().includes(termo) ||
                      String(msg.mensagem || '').toLowerCase().includes(termo);

    const bateStatus = filtroStatus === 'Todas' ||
                       (filtroStatus === 'Novas' && statusMensagem === 'Nova') ||
                       (filtroStatus === 'Lidas' && statusMensagem === 'Lida');

    return bateTexto && bateStatus;
  });

  renderizarMensagens(filtradas);
}

inputBusca.addEventListener('input', aplicarFiltrosMensagens);
selectStatus.addEventListener('change', aplicarFiltrosMensagens);

buscarMensagens();
