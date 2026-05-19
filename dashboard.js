async function carregarDadosDashboard() {
  const { data: reservas, error } = await _supabase
    .from('reservas')
    .select('*');

  if (error) {
    console.error('Erro ao carregar dados do dashboard:', error.message);
    return;
  }

  // 1. CALCULAR MÉTRICAS DOS CARTÕES (Mudar os textos dos boxes de resumos)
  const ativas = reservas.filter(r => r.status === 'Ativo');
  const canceladas = reservas.filter(r => r.status === 'Cancelado');
  
  const faturamentoTotal = ativas.reduce((acc, curr) => acc + parseFloat(curr.valor), 0);

  // Se tiver caixas com classes ou ids específicos de números, pode injetar diretamente:
  // Exemplo assumindo que existam elementos para exibir totais:
  console.log(`Faturamento Atual: R$ ${faturamentoTotal.toFixed(2)}`);
  console.log(`Reservas Ativas: ${ativas.length}`);

  // 2. PREENCHER RESERVAS RECENTES (Últimas 5)
  const recentesBox = document.querySelector('.box.wide:last-of-type');
  const ultimas5 = [...ativas].reverse().slice(0, 5);

  if (ultimas5.length > 0) {
    recentesBox.innerHTML = `
      <div class="recent-top">
        <h4>Reservas Recentes</h4>
        <a href="reservas.html" class="btn">Ver Reservas</a>
      </div>
    `;
    
    ultimas5.forEach(res => {
      const dataFormatada = res.data_reserva.split('-').reverse().join('/');
      recentesBox.innerHTML += `
        <div style="display:flex; justify-content:space-between; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 13px;">
          <span><b>${res.nome_cliente}</b> reservou o <b>${res.numero_campo}</b></span>
          <span style="color: #666;">${dataFormatada} às ${res.horario_reserva.substring(0,5)}h</span>
        </div>
      `;
    });
  }

  // 3. ATUALIZAR GRÁFICO DE BARRAS / TIPOS DE CAMPOS
  const totalSociety = ativas.filter(r => r.tipo_campo === 'Society').length;
  const totalAreia = ativas.filter(r => r.tipo_campo === 'Areia').length;

  const boxTipoCampo = document.querySelector('.fake-chart.center');
  if (totalSociety > 0 || totalAreia > 0) {
    boxTipoCampo.innerHTML = `
      <div style="display: flex; gap: 30px; text-align: center; margin-top: 20px;">
        <div>
          <h2 style="color: #2451c0;">${totalSociety}</h2>
          <p style="font-size: 12px; color: #555;">Campos Society</p>
        </div>
        <div>
          <h2 style="color: #cc6b00;">${totalAreia}</h2>
          <p style="font-size: 12px; color: #555;">Quadras de Areia</p>
        </div>
      </div>
      <div class="legend" style="margin-top: 15px;">
        <span><b style="color: #2451c0;">●</b> Society</span>
        <span><b style="color: #cc6b00;">●</b> Areia</span>
      </div>
    `;
  }
}

carregarDadosDashboard();