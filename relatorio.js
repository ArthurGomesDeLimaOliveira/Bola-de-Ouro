const mapaCampos = {
  'Campo Society 1': { tipo: 'Society' },
  'Campo Society 2': { tipo: 'Society' },
  'Campo Society 3': { tipo: 'Society' },
  'Campo Society 4': { tipo: 'Society' },
  'Campo Society 5': { tipo: 'Society' },
  'Campo Society 6': { tipo: 'Society' },
  'Quadra de Areia 1': { tipo: 'Areia' },
  'Quadra de Areia 2': { tipo: 'Areia' },
  'Quadra de Areia 3': { tipo: 'Areia' }
};

let graficoEvolucaoReceita = null;

function criarDataLocal(dataBanco) {
  const [ano, mes, dia] = dataBanco.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatarDataGrafico(dataBanco) {
  return criarDataLocal(dataBanco).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  });
}

function renderizarGraficoEvolucao(reservasAtivas) {
  const canvasGrafico = document.getElementById('chartEvolucaoReceita');
  if (!canvasGrafico || typeof Chart === 'undefined') return;

  const receitaPorData = {};

  reservasAtivas.forEach(res => {
    if (!res.data_reserva) return;
    receitaPorData[res.data_reserva] = (receitaPorData[res.data_reserva] || 0) + parseFloat(res.valor || 0);
  });

  const datasOrdenadas = Object.keys(receitaPorData).sort();
  const labels = datasOrdenadas.length ? datasOrdenadas.map(formatarDataGrafico) : ['Sem dados'];
  const valores = datasOrdenadas.length ? datasOrdenadas.map(data => receitaPorData[data]) : [0];

  if (graficoEvolucaoReceita) {
    graficoEvolucaoReceita.destroy();
  }

  graficoEvolucaoReceita = new Chart(canvasGrafico, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Receita',
        data: valores,
        borderColor: '#444',
        backgroundColor: 'rgba(68, 68, 68, 0.08)',
        pointBackgroundColor: '#444',
        pointBorderColor: '#444',
        borderWidth: 2,
        tension: 0.25,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: 10
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: '#111',
            boxWidth: 12,
            font: {
              size: 11,
              weight: 'bold'
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const valor = context.parsed.y || 0;
              return 'Receita: ' + valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#444',
            callback: function(value) {
              return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
            }
          },
          grid: {
            color: 'rgba(0,0,0,0.05)'
          }
        },
        x: {
          ticks: {
            color: '#444'
          },
          grid: {
            color: 'rgba(0,0,0,0.05)'
          }
        }
      }
    }
  });
}

async function gerarRelatorioFinanceiro() {
  const { data: reservas, error } = await _supabase
    .from('reservas')
    .select('*');

  if (error) {
    console.error('Erro ao buscar dados:', error.message);
    return;
  }

  const reservasAtivas = reservas.filter(r => r.status === 'Ativo');

  const totalFaturamento = reservasAtivas.reduce((acc, atual) => acc + parseFloat(atual.valor || 0), 0);
  const totalAgendamentos = reservasAtivas.length;

  document.querySelectorAll('.card h3.money')[0].textContent = totalFaturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  document.querySelectorAll('.card h3')[1].textContent = totalAgendamentos;
  
  const ticketMedio = totalAgendamentos > 0 ? (totalFaturamento / totalAgendamentos) : 0;
  document.querySelectorAll('.card h3.money')[1].textContent = ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const recSociety = reservasAtivas.filter(r => r.tipo_campo === 'Society').reduce((acc, r) => acc + parseFloat(r.valor || 0), 0);
  const recAreia = reservasAtivas.filter(r => r.tipo_campo === 'Areia').reduce((acc, r) => acc + parseFloat(r.valor || 0), 0);
  
  document.querySelectorAll('.society-areia-item .value')[0].textContent = recSociety.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  document.querySelectorAll('.society-areia-item .value')[1].textContent = recAreia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  renderizarGraficoEvolucao(reservasAtivas);

  const tabelaCorpo = document.querySelector('table tbody');
  tabelaCorpo.innerHTML = ''; 

  Object.keys(mapaCampos).forEach(nomeCampo => {
    const estatistica = reservasAtivas.filter(r => r.numero_campo === nomeCampo);
    const qtd = estatistica.length;
    const fat = estatistica.reduce((acc, r) => acc + parseFloat(r.valor || 0), 0);
    const porc = totalFaturamento > 0 ? ((fat / totalFaturamento) * 100).toFixed(0) : 0;

    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td>${nomeCampo}</td>
      <td><span class="tag ${mapaCampos[nomeCampo].tipo.toLowerCase()}">${mapaCampos[nomeCampo].tipo}</span></td>
      <td>${qtd}</td>
      <td>${fat.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      <td>${porc}%</td>
    `;
    tabelaCorpo.appendChild(linha);
  });

  const linhaTotal = document.createElement('tr');
  linhaTotal.className = 'total-row';
  linhaTotal.innerHTML = `<td><b>Total</b></td><td></td><td><b>${totalAgendamentos}</b></td><td class="money"><b>${totalFaturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b></td><td><b>100%</b></td>`;
  tabelaCorpo.appendChild(linhaTotal);
}

gerarRelatorioFinanceiro();
