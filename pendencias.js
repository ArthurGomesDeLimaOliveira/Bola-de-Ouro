const pendenciasLista = document.getElementById('lista-pendencias');
const inputBusca = document.getElementById('busca-pendencia');

let todasAsPendencias = [];

async function buscarPendencias() {
  const { data, error } = await _supabase
    .from('reservas')
    .select('*')
    .eq('taxa_paga', false)
    .gt('taxa_cancelamento', 0)
    .order('data_cancelamento', { ascending: false });

  if (error) {
    console.error('Erro ao buscar pendências:', error.message);
    return;
  }

  todasAsPendencias = data || [];
  renderizarPendencias(todasAsPendencias);
}

function renderizarPendencias(lista) {
  pendenciasLista.innerHTML = `<h3>Clientes Bloqueados (${lista.length})</h3>`;

  if (lista.length === 0) {
    pendenciasLista.innerHTML += `
      <div style="padding: 40px; text-align: center;">
        <h2 style="color: #1f8f3d; margin-bottom: 10px;">🎉 Tudo limpo!</h2>
        <p style="color: #777; font-size: 14px;">Não há nenhum cliente com taxas de cancelamento pendentes no momento.</p>
      </div>`;
    return;
  }

  lista.forEach(res => {
    const dataJogo = res.data_reserva.split('-').reverse().join('/');
    const taxaFormatada = parseFloat(res.taxa_cancelamento).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    let dataCancelamentoStr = "Data não registrada";
    if (res.data_cancelamento) {
      const dataCanc = new Date(res.data_cancelamento);
      dataCancelamentoStr = dataCanc.toLocaleDateString('pt-BR') + ' às ' + dataCanc.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    }

    const card = document.createElement('div');
    card.style = 'background: #fffefeb5; padding: 18px; border-radius: 8px; margin-top: 15px; border: 1px solid #f5c6c6; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);';
    
    card.innerHTML = `
      <div>
        <strong style="font-size: 16px; color: #c62828;">⚠️ ${res.nome_cliente}</strong> 
        <span style="font-size: 12px; color: #666; margin-left: 8px;">📞 ${res.telefone_cliente}</span>
        
        <div style="font-size: 13px; color: #444; margin-top: 8px;">
          <b>Faltou ao jogo do dia:</b> ${dataJogo} às ${res.horario_reserva.substring(0, 5)}h no ${res.numero_campo}
        </div>
        <div style="font-size: 12px; color: #777; margin-top: 4px;">
          <i>Cancelou em: ${dataCancelamentoStr}</i>
        </div>
        
        <div style="font-size: 14px; color: #c62828; margin-top: 10px; font-weight: bold; background: #ffebee; display: inline-block; padding: 4px 8px; border-radius: 4px;">
          Valor da Dívida: ${taxaFormatada}
        </div>
      </div>
      
      <div style="text-align: right;">
        <button onclick="marcarTaxaPaga('${res.id}')" style="background: #1f8f3d; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: bold; transition: 0.2s; box-shadow: 0 2px 5px rgba(31, 143, 61, 0.3);">
           Registrar Pagamento
        </button>
        <div style="font-size: 10px; color: #888; margin-top: 8px; max-width: 150px;">
          Ao clicar, o cliente será desbloqueado para novos agendamentos.
        </div>
      </div>
    `;
    
    pendenciasLista.appendChild(card);
  });
}

// O botão mágico do Admin
window.marcarTaxaPaga = async function(id) {
  if (!confirm('Deseja confirmar o recebimento deste valor? O cliente será liberado imediatamente.')) return;

  const { error } = await _supabase
    .from('reservas')
    .update({ taxa_paga: true })
    .eq('id', id);

  if (error) {
    alert('Erro ao atualizar sistema: ' + error.message);
  } else {
    alert('Pagamento registrado! O cliente já pode voltar a jogar.');
    buscarPendencias();
  }
};

inputBusca.addEventListener('input', () => {
  const termo = inputBusca.value.toLowerCase();
  const filtrados = todasAsPendencias.filter(res => 
    res.nome_cliente.toLowerCase().includes(termo) || 
    res.telefone_cliente.includes(termo)
  );
  renderizarPendencias(filtrados);
});

buscarPendencias();