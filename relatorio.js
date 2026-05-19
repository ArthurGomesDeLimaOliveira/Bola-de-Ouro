// Dicionário para mapear o código do campo para o nome completo e tipo
const mapaCampos = {
  'CS1': { nome: 'Campo Society 1', tipo: 'Society' },
  'CS2': { nome: 'Campo Society 2', tipo: 'Society' },
  'CS3': { nome: 'Campo Society 3', tipo: 'Society' },
  'CS4': { nome: 'Campo Society 4', tipo: 'Society' },
  'CS5': { nome: 'Campo Society 5', tipo: 'Society' },
  'CS6': { nome: 'Campo Society 6', tipo: 'Society' },
  'QA1': { nome: 'Quadra de Areia 1', tipo: 'Areia' },
  'QA2': { nome: 'Quadra de Areia 2', tipo: 'Areia' },
  'QA3': { nome: 'Quadra de Areia 3', tipo: 'Areia' }
};

async function gerarRelatorioFinanceiro() {
  // 1. Puxa todas as reservas do Supabase
  const { data: reservas, error } = await _supabase
    .from('reservas')
    .select('*');

  if (error) {
    console.error('Erro ao buscar dados para o relatório:', error.message);
    return;
  }

  // Filtra apenas as reservas que estão com status 'Ativo' para o financeiro
  const reservasAtivas = reservas.filter(r => r.status === 'Ativo');

  // 2. Cálculos Gerais para os Cards do Topo
  const totalFaturamento = reservasAtivas.reduce((acc, atual) => acc + parseFloat(atual.valor), 0);
  const totalAgendamentos = reservasAtivas.length;
  const totalCancelados = reservas.filter(r => r.status === 'Cancelado').length;

  // Atualiza visualmente os blocos de resumo se houver IDs ou classes específicas
  // (Caso queira adicionar os ids correspondentes no seu HTML: id="cardFaturamento", id="cardTotal", etc.)
  console.log(`Faturamento Total: R$ ${totalFaturamento.toFixed(2)}`);
  console.log(`Total de Reservas Concluídas: ${totalAgendamentos}`);

  // 3. Inicializa a estrutura de dados para cada um dos 9 campos da Arena
  const estatisticasCampos = {};
  Object.keys(mapaCampos).forEach(codigo => {
    estatisticasCampos[codigo] = {
      nome: mapaCampos[codigo].nome,
      tipo: mapaCampos[codigo].tipo,
      quantidade: 0,
      faturamento: 0
    };
  });

  // 4. Agrupa os valores e contagens por campo real vindo do banco
  reservasAtivas.forEach(res => {
    const cod = res.numero_campo;
    if (estatisticasCampos[cod]) {
      estatisticasCampos[cod].quantidade += 1;
      estatisticasCampos[cod].faturamento += parseFloat(res.valor);
    }
  });

  // 5. Renderiza as linhas da tabela dinamicamente
  const tabelaCorpo = document.querySelector('table tbody');
  if (!tabelaCorpo) return;

  tabelaCorpo.innerHTML = ''; // Limpa as linhas estáticas antigas

  Object.keys(estatisticasCampos).forEach(codigo => {
    const dados = estatisticasCampos[codigo];
    
    // Calcula a porcentagem de participação desse campo no faturamento total
    const porcentagem = totalFaturamento > 0 ? ((dados.faturamento / totalFaturamento) * 100).toFixed(0) : 0;
    
    // Formatação de moeda para Real (R$)
    const faturamentoFormatado = dados.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    // Classe CSS para a tag do tipo do campo
    const tagClasse = dados.tipo === 'Society' ? 'tag society' : 'tag areia';

    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td>${dados.nome}</td>
      <td><span class="${tagClasse}">${dados.tipo}</span></td>
      <td>${dados.quantidade}</td>
      <td>${faturamentoFormatado}</td>
      <td>${porcentagem}%</td>
    `;
    tabelaCorpo.appendChild(linha);
  });

  // 6. Adiciona a linha final com a soma de todos os totais
  const faturamentoTotalFormatado = totalFaturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const linhaTotal = document.createElement('tr');
  linhaTotal.className = 'total-row';
  linhaTotal.innerHTML = `
    <td><b>Total</b></td>
    <td></td>
    <td><b>${totalAgendamentos}</b></td>
    <td class="money"><b>${faturamentoTotalFormatado}</b></td>
    <td><b>100%</b></td>
  `;
  tabelaCorpo.appendChild(linhaTotal);

  // 7. Gráfico Visual Simples (Preenche as barras do relatório se existirem)
  const totalSociety = reservasAtivas.filter(r => r.tipo_campo === 'Society').length;
  const totalAreia = reservasAtivas.filter(r => r.tipo_campo === 'Areia').length;

  // Injeta dinamicamente os valores nos componentes de gráfico se estiverem na tela
  const chartBox = document.querySelector('.fake-chart');
  if (chartBox && (totalSociety > 0 || totalAreia > 0)) {
    // Código para ajustar o visual das barras proporcionalmente, caso use estilos inline
    console.log(`Participação de uso - Society: ${totalSociety} | Areia: ${totalAreia}`);
  }
}

// Executa a função automaticamente ao abrir a página de relatórios
gerarRelatorioFinanceiro();