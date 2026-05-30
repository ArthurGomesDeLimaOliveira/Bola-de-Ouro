const reservasLista = document.querySelector('.reservas-box');
const inputBusca = document.querySelector('.search input');
const selectsFiltro = document.querySelectorAll('.select');

let todasAsReservas = [];

function reservaJaPassou(reserva) {
  const dataHoraReserva = new Date(`${reserva.data_reserva}T${reserva.horario_reserva}`);
  return dataHoraReserva <= new Date();
}

async function buscarReservas() {
  const { data, error } = await _supabase
    .from('reservas')
    .select('*')
    .order('data_reserva', { ascending: true })
    .order('horario_reserva', { ascending: true });

  if (error) {
    console.error('Erro ao buscar reservas:', error.message);
    return;
  }

  todasAsReservas = (data || []).filter(res => res.arquivada !== true);
  renderizarReservas(todasAsReservas);
}

function renderizarReservas(lista) {
  reservasLista.innerHTML = `<h3>Reservas (${lista.length})</h3>`;

  if (lista.length === 0) {
    reservasLista.innerHTML += `<p class="empty-text" style="padding: 20px; text-align: center; color: #777;">Nenhuma reserva encontrada</p>`;
    return;
  }

  lista.forEach(res => {
    const dataFormatada = res.data_reserva.split('-').reverse().join('/');
    const horaFormatada = res.horario_reserva.substring(0, 5) + 'h';
    const valorFormatado = parseFloat(res.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    let infoTaxa = '';
    if (res.status === 'Cancelado' && res.taxa_cancelamento > 0) {
      if (res.taxa_paga) {
        infoTaxa = `<div style="font-size: 11px; color: green; font-weight: bold; margin-top: 5px;">✅ Taxa Paga (R$ ${res.taxa_cancelamento.toFixed(2)})</div>`;
      } else {
        infoTaxa = `
          <div style="font-size: 11px; color: #c62828; font-weight: bold; margin-top: 5px; border: 1px solid red; padding: 4px; border-radius: 4px;">
            ⚠️ DEVENDO: R$ ${res.taxa_cancelamento.toFixed(2)}
            <button onclick="marcarTaxaPaga('${res.id}')" style="background: green; color: white; border: none; padding: 3px 6px; cursor: pointer; margin-left: 5px; border-radius: 3px;">Quitar</button>
          </div>
        `;
      }
    }

    const jaPassou = reservaJaPassou(res);
    const botaoCancelar = res.status === 'Ativo' && !jaPassou
      ? `<button onclick="cancelarReserva('${res.id}')" style="background: #c62828; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">Cancelar Admin</button>`
      : '';
    const botaoArquivar = jaPassou
      ? `<button onclick="arquivarReservaAdmin('${res.id}')" style="background: #1f8f3d; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">Arquivar</button>`
      : '';

    const cardReserva = document.createElement('div');
    cardReserva.className = 'reserva-item';
    cardReserva.style = 'background: #fff; padding: 15px; border-radius: 6px; margin-top: 10px; border: 1px solid #e2e2e2; display: flex; justify-content: space-between; align-items: center;';
    
    cardReserva.innerHTML = `
      <div>
        <strong style="font-size: 14px; color: #222;">${res.nome_cliente}</strong> 
        <span style="font-size: 11px; color: #666; margin-left: 8px;">📞 ${res.telefone_cliente}</span>
        <div style="font-size: 12px; color: #444; margin-top: 5px;">
          <b>Campo:</b> ${res.numero_campo} (${res.tipo_campo}) | 📅 ${dataFormatada} às ${horaFormatada}
        </div>
        <div style="font-size: 12px; color: #1f8f3d; margin-top: 3px; font-weight: bold;">
          Valor: ${valorFormatado}
        </div>
        ${infoTaxa}
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
        <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${res.status === 'Ativo' ? '#eefaf1' : '#ffebee'}; color: ${res.status === 'Ativo' ? '#1f8f3d' : '#c62828'};">
          ${res.status.toUpperCase()}
        </span>
        ${botaoCancelar}
        ${botaoArquivar}
      </div>
    `;
    
    reservasLista.appendChild(cardReserva);
  });
}

window.cancelarReserva = async function(id) {
  if (!confirm('Tem certeza de que deseja cancelar esta reserva?')) return;

  const { error } = await _supabase
    .from('reservas')
    .update({ status: 'Cancelado' })
    .eq('id', id);

  if (error) {
    alert('Erro ao cancelar: ' + error.message);
  } else {
    alert('Reserva cancelada com sucesso!');
    buscarReservas();
  }
};

window.arquivarReservaAdmin = async function(id) {
  if (!confirm('Deseja arquivar esta reserva? Ela saira da lista principal, mas continuara salva no banco.')) return;

  const { error } = await _supabase
    .from('reservas')
    .update({
      arquivada: true,
      arquivada_em: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    alert('Erro ao arquivar: ' + error.message);
  } else {
    alert('Reserva arquivada com sucesso!');
    buscarReservas();
  }
};

window.marcarTaxaPaga = async function(id) {
  if (!confirm('Deseja confirmar o pagamento desta taxa? Isso irá liberar o cliente para fazer novas reservas.')) return;

  const { error } = await _supabase
    .from('reservas')
    .update({ taxa_paga: true })
    .eq('id', id);

  if (error) {
    alert('Erro ao atualizar: ' + error.message);
  } else {
    alert('Taxa quitada! Cliente liberado.');
    buscarReservas();
  }
};

function aplicarFiltros() {
  const termo = inputBusca.value.toLowerCase();
  const filtroTipo = selectsFiltro[0].value; // 'Todos os campos', 'Campo Society', 'Campo Areia'
  const filtroStatus = selectsFiltro[1].value; // 'Todos', 'Ativos', 'Cancelados'

  const filtrados = todasAsReservas.filter(res => {
    const bateTexto = res.nome_cliente.toLowerCase().includes(termo) || 
                      res.numero_campo.toLowerCase().includes(termo) ||
                      res.data_reserva.includes(termo);
                      
    const bateTipo = filtroTipo === 'Todos os campos' || 
                     (filtroTipo === 'Campo Society' && res.tipo_campo === 'Society') ||
                     (filtroTipo === 'Campo Areia' && res.tipo_campo === 'Areia');

    const bateStatus = filtroStatus === 'Todos' || 
                       (filtroStatus === 'Ativos' && res.status === 'Ativo') ||
                       (filtroStatus === 'Cancelados' && res.status === 'Cancelado');

    return bateTexto && bateTipo && bateStatus;
  });

  renderizarReservas(filtrados);
}

inputBusca.addEventListener('input', aplicarFiltros);
selectsFiltro.forEach(select => select.addEventListener('change', aplicarFiltros));

buscarReservas();
