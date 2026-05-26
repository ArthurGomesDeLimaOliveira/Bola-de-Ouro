const reservasLista = document.getElementById('lista-reservas-cliente');
const inputBusca = document.getElementById('busca-reserva-cliente');
const selectStatus = document.getElementById('filtro-status-cliente');
const nomeUsuarioTopbar = document.getElementById('nome-usuario-topbar');

let minhasReservas = [];

async function inicializarPainelCliente() {
  const { data: { user }, error: authError } = await _supabase.auth.getUser();

  if (authError || !user) {
    alert("Você precisa estar logado para acessar esta página!");
    window.location.href = "login.html";
    return;
  }

  const nomeCompleto = user.user_metadata?.full_name || "Jogador";
  nomeUsuarioTopbar.textContent = nomeCompleto;

  const { data, error } = await _supabase
    .from('reservas')
    .select('*')
    .order('data_reserva', { ascending: true })
    .order('horario_reserva', { ascending: true });

  if (error) {
    console.error('Erro ao carregar reservas do cliente:', error.message);
    return;
  }

  minhasReservas = data;
  renderizarReservasCliente(minhasReservas);
}

function renderizarReservasCliente(lista) {
  reservasLista.innerHTML = `<h3>Minhas Reservas (${lista.length})</h3>`;

  if (lista.length === 0) {
    reservasLista.innerHTML += `<p class="empty-text" style="padding: 30px; text-align: center; color: #777; font-size: 13px;">Você não possui nenhum agendamento cadastrado.</p>`;
    return;
  }

  lista.forEach(res => {
    const dataFormatada = res.data_reserva.split('-').reverse().join('/');
    const horaFormatada = res.horario_reserva.substring(0, 5) + 'h';
    const valorFormatado = parseFloat(res.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const cardReserva = document.createElement('div');
    cardReserva.className = 'reserva-item';
    cardReserva.style = 'background: #fff; padding: 15px; border-radius: 6px; margin-top: 10px; border: 1px solid #e2e2e2; display: flex; justify-content: space-between; align-items: center;';
    
    cardReserva.innerHTML = `
      <div>
        <strong style="font-size: 15px; color: #1f8f3d;">${res.numero_campo}</strong>
        <span style="font-size: 11px; color: #777; margin-left: 5px;">(${res.tipo_campo})</span>
        <div style="font-size: 13px; color: #444; margin-top: 6px;">
          📅 <b>Data:</b> ${dataFormatada} às ⏰ <b>Horário:</b> ${horaFormatada}
        </div>
        <div style="font-size: 12px; color: #666; margin-top: 3px;">
          <b>Valor total:</b> ${valorFormatado}
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
        <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${res.status === 'Ativo' ? '#eefaf1' : '#ffebee'}; color: ${res.status === 'Ativo' ? '#1f8f3d' : '#c62828'};">
          ${res.status.toUpperCase()}
        </span>
        ${res.status === 'Ativo' ? `<button onclick="cancelarAgendamentoCliente('${res.id}')" style="background: #c62828; color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: bold; transition: 0.2s;">Cancelar Horário</button>` : ''}
      </div>
    `;
    
    reservasLista.appendChild(cardReserva);
  });
}
window.cancelarAgendamentoCliente = async function(id) {
  const reserva = minhasReservas.find(r => r.id === id);
  if (!reserva) return;

  const stringDataHoraJogo = `${reserva.data_reserva}T${reserva.horario_reserva}-03:00`; // Fuso de Brasília
  const dataDoJogo = new Date(stringDataHoraJogo);
  const agora = new Date();
  
  const diferencaMs = dataDoJogo - agora;
  const horasFaltantes = diferencaMs / (1000 * 60 * 60);

  if (horasFaltantes <= 0) {
    alert("Este horário já passou. Não é possível cancelar.");
    return;
  }

  let percentualMulta = 0;
  let mensagemMulta = "";

  if (horasFaltantes >= 8) {
    percentualMulta = 0; 
    mensagemMulta = "Como você está cancelando com mais de 8 horas de antecedência, NÃO haverá taxas.";
  } else if (horasFaltantes >= 4) {
    percentualMulta = 0.25; 
    mensagemMulta = "Atenção: Cancelamentos entre 4h e 8h antes do jogo possuem taxa de 25%.";
  } else if (horasFaltantes >= 2) {
    percentualMulta = 0.50; 
    mensagemMulta = "Atenção: Cancelamentos entre 2h e 4h antes do jogo possuem taxa de 50%.";
  } else {
    percentualMulta = 1.00; 
    mensagemMulta = "Atenção: Cancelamentos com menos de 2 horas de antecedência exigem o pagamento integral (100%).";
  }

  const valorCampo = parseFloat(reserva.valor);
  const valorMulta = valorCampo * percentualMulta;
  const multaFormatada = valorMulta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


  let alertaConfirmacao = `Deseja realmente cancelar seu agendamento para o ${reserva.numero_campo}?\n\n${mensagemMulta}\n`;
  if (valorMulta > 0) {
    alertaConfirmacao += `\nValor da multa gerada: ${multaFormatada}\nSe você confirmar, não poderá fazer novas reservas até quitar este valor com a administração.`;
  }

  if (!confirm(alertaConfirmacao)) return;

  const { error } = await _supabase
    .from('reservas')
    .update({ 
      status: 'Cancelado',
      data_cancelamento: new Date().toISOString(), 
      taxa_cancelamento: valorMulta,
      taxa_paga: valorMulta === 0 
    })
    .eq('id', id);

  if (error) {
    alert('Erro ao realizar o cancelamento: ' + error.message);
  } else {
    if (valorMulta > 0) {
      alert(`Agendamento cancelado. Uma taxa de ${multaFormatada} foi registrada em seu nome.`);
    } else {
      alert('Agendamento cancelado gratuitamente com sucesso!');
    }
    inicializarPainelCliente(); 
  }
};

function aplicarFiltrosCliente() {
  const termo = inputBusca.value.toLowerCase();
  const filtroStatus = selectStatus.value;

  const filtrados = minhasReservas.filter(res => {
    const bateTexto = res.numero_campo.toLowerCase().includes(termo) || res.data_reserva.includes(termo);
    const bateStatus = filtroStatus === 'Todos' || 
                       (filtroStatus === 'Ativos' && res.status === 'Ativo') ||
                       (filtroStatus === 'Cancelados' && res.status === 'Cancelado');

    return bateTexto && bateStatus;
  });

  renderizarReservasCliente(filtrados);
}

inputBusca.addEventListener('input', aplicarFiltrosCliente);
selectStatus.addEventListener('change', aplicarFiltrosCliente);

inicializarPainelCliente();