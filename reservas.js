const reservasLista = document.querySelector('.reservas-box');
const inputBusca = document.querySelector('.search input');
const selectsFiltro = document.querySelectorAll('.select');

let todasAsReservas = [];

// Função para procurar as reservas no Supabase
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

  todasAsReservas = data;
  renderizarReservas(todasAsReservas);
}

// Função para desenhar as reservas no HTML
function renderizarReservas(lista) {
  // Mantém apenas o título h3 original
  reservasLista.innerHTML = `<h3>Reservas (${lista.length})</h3>`;

  if (lista.length === 0) {
    reservasLista.innerHTML += `<p class="empty-text" style="padding: 20px; text-align: center; color: #777;">Nenhuma reserva encontrada</p>`;
    return;
  }

  lista.forEach(res => {
    // Formata a data para o padrão PT-BR (DD/MM/AAAA)
    const dataFormatada = res.data_reserva.split('-').reverse().join('/');
    const horaFormatada = res.horario_reserva.substring(0, 5) + 'h';
    const valorFormatado = parseFloat(res.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    // Define a classe CSS do estado
    const statusClass = res.status === 'Ativo' ? 'status ativo' : 'status cancelado';

    const cardReserva = document.createElement('div');
    cardReserva.className = 'reserva-item'; // Pode adaptar conforme as suas classes de estilo
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
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
        <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${res.status === 'Ativo' ? '#eefaf1' : '#ffebee'}; color: ${res.status === 'Ativo' ? '#1f8f3d' : '#c62828'};">
          ${res.status.toUpperCase()}
        </span>
        ${res.status === 'Ativo' ? `<button onclick="cancelarReserva('${res.id}')" style="background: #c62828; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">Cancelar</button>` : ''}
      </div>
    `;
    
    reservasLista.appendChild(cardReserva);
  });
}

// Função para cancelar uma reserva
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
    buscarReservas(); // Atualiza a lista na tela
  }
};

// Sistema de filtros (Busca por texto e seletores)
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

// Inicializa a busca quando a página abre
buscarReservas();