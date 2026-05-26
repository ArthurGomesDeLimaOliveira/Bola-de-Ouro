// Função auxiliar para pegar data no formato do banco (YYYY-MM-DD)
function formatarDataBanco(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

async function carregarDadosDashboard() {
  const { data: reservas, error } = await _supabase
    .from('reservas')
    .select('*')
    .order('data_reserva', { ascending: false }); // Usando a data do jogo para ordenar

  if (error) {
    console.error('Erro ao carregar dados:', error.message);
    return;
  }

  const reservasAtivas = reservas.filter(r => r.status === 'Ativo');

  const hoje = new Date();
  const dataHojeStr = formatarDataBanco(hoje);
  
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(hoje.getDate() - 6); 
  
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
  const anoAtual = hoje.getFullYear();

  let receitaHoje = 0, qtdHoje = 0;
  let receitaSemana = 0, qtdSemana = 0;
  let receitaMes = 0, qtdMes = 0;

  reservasAtivas.forEach(res => {
    const valor = parseFloat(res.valor);
    const dataRes = res.data_reserva;
    const dataObj = new Date(`${dataRes}T00:00:00`);


    if (dataRes === dataHojeStr) {
      receitaHoje += valor;
      qtdHoje++;
    }

    if (dataObj >= seteDiasAtras && dataObj <= hoje) {
      receitaSemana += valor;
      qtdSemana++;
    }

    const mesRes = dataRes.split('-')[1];
    const anoRes = dataRes.split('-')[0];
    if (mesRes === mesAtual && anoRes == anoAtual) {
      receitaMes += valor;
      qtdMes++;
    }
  });

  const clientesUnicos = new Set(reservas.map(r => r.telefone_cliente)).size;

  document.getElementById('metric-hoje-valor').textContent = receitaHoje.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
  document.getElementById('metric-hoje-qtd').textContent = `${qtdHoje} reservas hoje`;

  document.getElementById('metric-semana-valor').textContent = receitaSemana.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
  document.getElementById('metric-semana-qtd').textContent = `${qtdSemana} reservas (7 dias)`;

  document.getElementById('metric-mes-valor').textContent = receitaMes.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
  document.getElementById('metric-mes-qtd').textContent = `${qtdMes} reservas neste mês`;

  document.getElementById('metric-clientes').textContent = clientesUnicos;
  document.getElementById('metric-clientes-qtd').textContent = `${reservas.length} cadastros de jogos totais`;


  const listaRecentes = document.getElementById('lista-recentes');
  listaRecentes.innerHTML = '';
  

  const ultimas5 = reservas.slice(0, 5); 
  
  if (ultimas5.length === 0) {
    listaRecentes.innerHTML = '<p class="empty-text">Nenhuma reserva encontrada</p>';
  } else {
    ultimas5.forEach(res => {
      const dataFormatada = res.data_reserva.split('-').reverse().join('/');
      const statusTag = res.status === 'Ativo' 
        ? '<span style="color: #1f8f3d; font-weight: bold; font-size: 11px;">[ATIVO]</span>'
        : '<span style="color: #c62828; font-weight: bold; font-size: 11px;">[CANCELADO]</span>';

      listaRecentes.innerHTML += `
        <div style="display:flex; justify-content:space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee; font-size: 13px;">
          <div>
            ${statusTag} <b style="margin-left: 5px;">${res.nome_cliente}</b> reservou o <b>${res.numero_campo}</b>
          </div>
          <span style="color: #666;">Data do Jogo: ${dataFormatada} às ${res.horario_reserva.substring(0,5)}h</span>
        </div>
      `;
    });
  }


  const labels7Dias = [];
  const dados7Dias = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(hoje.getDate() - i);
    labels7Dias.push(d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }));

    const dataAlvoStr = formatarDataBanco(d);
    const receitaDoDia = reservasAtivas
      .filter(r => r.data_reserva === dataAlvoStr)
      .reduce((acc, curr) => acc + parseFloat(curr.valor), 0);
      
    dados7Dias.push(receitaDoDia);
  }

  new Chart(document.getElementById('chartReceita'), {
    type: 'line',
    data: {
      labels: labels7Dias,
      datasets: [{
        label: 'Faturamento (R$)',
        data: dados7Dias,
        borderColor: '#1f8f3d',
        backgroundColor: 'rgba(31, 143, 61, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });


  const qtdSociety = reservasAtivas.filter(r => r.tipo_campo === 'Society').length;
  const qtdAreia = reservasAtivas.filter(r => r.tipo_campo === 'Areia').length;

  new Chart(document.getElementById('chartTipos'), {
    type: 'doughnut',
    data: {
      labels: ['Campos Society', 'Quadras de Areia'],
      datasets: [{
        data: [qtdSociety, qtdAreia],
        backgroundColor: ['#2451c0', '#cc6b00'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%', // Tamanho do buraco no meio
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });


  const contagemCampos = {};
  reservasAtivas.forEach(r => {
    contagemCampos[r.numero_campo] = (contagemCampos[r.numero_campo] || 0) + 1;
  });

  const camposOrdenados = Object.keys(contagemCampos).sort((a, b) => contagemCampos[b] - contagemCampos[a]);
  const valoresCampos = camposOrdenados.map(campo => contagemCampos[campo]);

  new Chart(document.getElementById('chartCampos'), {
    type: 'bar',
    data: {
      labels: camposOrdenados,
      datasets: [{
        label: 'Quantidade de Reservas',
        data: valoresCampos,
        backgroundColor: '#1f8f3d',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', carregarDadosDashboard);