// ==========================================
// 1. VARIÁVEIS DE ESTADO DA RESERVA
// ==========================================
let campoSelecionado = "";
let dataSelecionada = "";
let horarioSelecionado = "";

// Elementos da interface principais
const selected = document.getElementById("selected-text");
const options = document.getElementById("select-options");
const arrow = document.querySelector(".arrow");
const botoesTempo = document.querySelectorAll(".time");
const btnContinuar = document.querySelector(".continue-btn");
const textoData = document.getElementById("texto-data-selecionada");

// Elementos do Calendário Dinâmico
const mesAnoTexto = document.getElementById("mes-ano-texto");
const diasCalendario = document.getElementById("dias-calendario");
const btnPrevMonth = document.getElementById("btn-mes-anterior");
const btnNextMonth = document.getElementById("btn-mes-proximo");

// Esconde a tela de confirmação ao carregar a página
const confirmationScreen = document.querySelector(".confirmation");
if (confirmationScreen) {
  confirmationScreen.style.display = "none";
}

// ==========================================
// 2. LÓGICA DO DROPDOWN (SELEÇÃO DE CAMPO)
// ==========================================
function toggleOptions() {
  options.classList.toggle("show");
  arrow.style.transform = options.classList.contains("show") ? "rotate(180deg)" : "rotate(0deg)";
}

// Expõe a função globalmente para o HTML
window.toggleOptions = toggleOptions;

function selectOption(option) {
  if (!option) return; 
  
  const img = option.querySelector("img").src;
  const categoria = option.querySelector(".categoria").textContent;
  const titulo = option.querySelector("h3").textContent;
  
  selected.innerHTML = `
      <div class="selected-card">
          <img src="${img}">
          <div class="selected-info">
            <small>${categoria}</small>
            <strong>${titulo}</strong>
          </div>
      </div>
  `;

  options.classList.remove("show");
  arrow.style.transform = "rotate(0deg)";

  // Atualiza o estado e busca horários disponíveis
  campoSelecionado = titulo;
  verificarDisponibilidade();
}

// Expõe a função globalmente para o HTML
window.selectOption = selectOption;

// Fechar dropdown ao clicar fora
document.addEventListener("click", function (event) {
  const customSelect = document.querySelector(".custom-select");
  if (customSelect && !customSelect.contains(event.target)) {
    options.classList.remove("show");
    arrow.style.transform = "rotate(0deg)";
  }
});

// ==========================================
// 3. LÓGICA DO CALENDÁRIO DINÂMICO
// ==========================================
let dataAtual = new Date();
let mesExibicao = dataAtual.getMonth();
let anoExibicao = dataAtual.getFullYear();

const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function renderizarCalendario() {
  if (!diasCalendario) return; // Evita erro se o HTML não estiver pronto
  
  diasCalendario.innerHTML = ""; // Limpa os dias antigos
  if (mesAnoTexto) mesAnoTexto.textContent = `${mesesNomes[mesExibicao]} ${anoExibicao}`;

  // Descobre em qual dia da semana o mês começa (0 = Dom, 1 = Seg...) e quantos dias tem o mês
  const primeiroDiaSemana = new Date(anoExibicao, mesExibicao, 1).getDay();
  const diasNoMes = new Date(anoExibicao, mesExibicao + 1, 0).getDate();

  // Pega a data de hoje (zerando a hora para comparar apenas o dia)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // 1. Cria espaços em branco para os dias antes do dia 1º
  for (let i = 0; i < primeiroDiaSemana; i++) {
    const espaco = document.createElement("span");
    espaco.style.background = "transparent";
    espaco.style.cursor = "default";
    diasCalendario.appendChild(espaco);
  }

  // 2. Preenche os dias reais do mês
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const spanDia = document.createElement("span");
    spanDia.textContent = dia;

    const dataDesteSpan = new Date(anoExibicao, mesExibicao, dia);

    // Se a data for anterior a hoje, bloqueia o dia
    if (dataDesteSpan < hoje) {
      spanDia.classList.add("disabled");
      spanDia.style.cursor = "not-allowed";
      spanDia.style.opacity = "0.4"; // Deixa visualmente apagado
    } else {
      // Se for uma data válida (hoje ou futuro), adiciona o evento de clique
      spanDia.addEventListener("click", () => {
        
        // --- TRAVA: Verificar se o campo foi escolhido primeiro ---
        if (!campoSelecionado) {
          alert("Por favor, selecione um campo na lista acima antes de escolher a data.");
          return; 
        }

        // Limpa seleção antiga e marca o novo dia
        const todosDias = diasCalendario.querySelectorAll("span");
        todosDias.forEach(d => d.classList.remove("selected-day"));
        spanDia.classList.add("selected-day");

        // Formata a data para o banco de dados (YYYY-MM-DD)
        const mesFormatado = String(mesExibicao + 1).padStart(2, '0');
        const diaFormatado = String(dia).padStart(2, '0');
        dataSelecionada = `${anoExibicao}-${mesFormatado}-${diaFormatado}`;

        // Atualiza o texto dinâmico na tela (ex: "quinta-feira, 26 de maio")
        const opcoes = { weekday: 'long', day: 'numeric', month: 'long' };
        const dataFormatadaTela = dataDesteSpan.toLocaleDateString('pt-BR', opcoes);

        if (textoData) {
          textoData.textContent = `Horários para ${dataFormatadaTela}`;
        }

        verificarDisponibilidade();
      });
    }

    diasCalendario.appendChild(spanDia);
  }
}

// Eventos de clique nas setinhas do calendário
if (btnPrevMonth && btnNextMonth) {
  btnPrevMonth.addEventListener("click", () => {
    mesExibicao--;
    if (mesExibicao < 0) {
      mesExibicao = 11;
      anoExibicao--;
    }
    renderizarCalendario();
  });

  btnNextMonth.addEventListener("click", () => {
    mesExibicao++;
    if (mesExibicao > 11) {
      mesExibicao = 0;
      anoExibicao++;
    }
    renderizarCalendario();
  });
}

// Desenha o calendário na tela pela primeira vez
renderizarCalendario();

// ==========================================
// 4. LÓGICA DOS HORÁRIOS E BLOQUEIO VISUAL
// ==========================================
async function verificarDisponibilidade() {
  // Reseta a seleção de horário
  horarioSelecionado = "";
  botoesTempo.forEach(t => t.classList.remove("active"));

  // Só busca se campo e data já estiverem escolhidos
  if (!campoSelecionado || !dataSelecionada) return;

  // Busca no Supabase os horários ocupados para este campo e dia
  const { data: reservasOcupadas, error } = await _supabase
    .from('reservas')
    .select('horario_reserva')
    .eq('numero_campo', campoSelecionado)
    .eq('data_reserva', dataSelecionada)
    .eq('status', 'Ativo');

  if (error) {
    console.error("Erro ao buscar horários", error);
    return;
  }

  // Cria uma lista apenas com as horas (ex: ['08:00', '19:00'])
  const horariosBloqueados = reservasOcupadas.map(res => res.horario_reserva.substring(0, 5));

  // Aplica o bloqueio visual nos botões
  botoesTempo.forEach(btn => {
    const horaDoBotao = btn.textContent;
    
    // Limpa estados anteriores
    btn.classList.remove("disabled");
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';

    // Se o horário estiver na lista de ocupados, bloqueia
    if (horariosBloqueados.includes(horaDoBotao)) {
      btn.classList.add("disabled");
      btn.disabled = true;
      btn.style.opacity = '0.4';
      btn.style.cursor = 'not-allowed';
    }
  });
}

// Clique num horário disponível
botoesTempo.forEach((btn) => {
  btn.addEventListener("click", () => {
    
    // --- TRAVAS: Campo e Data ---
    if (!campoSelecionado) {
      alert("Por favor, selecione um campo primeiro.");
      return;
    }
    if (!dataSelecionada) {
      alert("Por favor, escolha um dia no calendário antes de selecionar o horário.");
      return;
    }

    if (btn.classList.contains("disabled")) return; // Não faz nada se estiver bloqueado

    botoesTempo.forEach((item) => item.classList.remove("active"));
    btn.classList.add("active");
    
    // Formata para o banco (HH:MM:SS)
    horarioSelecionado = btn.textContent + ":00";
  });
});

// ==========================================
// 5. FINALIZAÇÃO E SALVAMENTO NO SUPABASE
// ==========================================
if (btnContinuar) {
  btnContinuar.addEventListener("click", async () => {
    
    // Validações separadas para guiar o usuário
    if (!campoSelecionado) {
      alert("Você esqueceu de escolher o campo! Selecione um campo antes de continuar.");
      return;
    }
    if (!dataSelecionada) {
      alert("Você esqueceu de escolher a data! Selecione um dia no calendário antes de continuar.");
      return;
    }
    if (!horarioSelecionado) {
      alert("Você esqueceu de escolher o horário! Selecione um horário disponível antes de continuar.");
      return;
    }

    // Verifica se o usuário está logado
    const { data: { user }, error: authError } = await _supabase.auth.getUser();

    if (authError || !user) {
      alert("Você precisa estar logado para fazer uma reserva!");
      window.location.href = "login.html";
      return;
    }

    // --- VERIFICAÇÃO DE TAXAS PENDENTES (INADIMPLÊNCIA) ---
    const { data: pendencias, error: errPendencias } = await _supabase
      .from('reservas')
      .select('taxa_cancelamento')
      .eq('user_id', user.id)
      .eq('taxa_paga', false);

    if (pendencias && pendencias.length > 0) {
      // Soma o total que o cliente deve
      const totalDevendo = pendencias.reduce((acc, curr) => acc + curr.taxa_cancelamento, 0);
      const devendoFormatado = totalDevendo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      
      alert(`⚠️ BLOQUEADO! Você possui uma taxa de cancelamento pendente no valor de ${devendoFormatado}.\n\nPara agendar novos horários, por favor, entre em contato com a administração para realizar o acerto.`);
      return; // Impede a reserva!
    }

    // Prepara os dados extras (tipo e valor)
    const isSociety = campoSelecionado.toLowerCase().includes("society");
    const tipoCampo = isSociety ? "Society" : "Areia";
    const valorReserva = isSociety ? 150.00 : 120.00;

    // Extrai nome e telefone do cadastro do usuário
    const nomeCliente = user.user_metadata?.full_name || "Cliente";
    const telefoneCliente = user.user_metadata?.phone || "Não informado";

    // Altera o texto do botão para dar feedback
    const textoOriginalBotao = btnContinuar.textContent;
    btnContinuar.textContent = "Processando...";
    btnContinuar.disabled = true;

    // Tenta inserir a reserva no Supabase
    const { error: insertError } = await _supabase
      .from('reservas')
      .insert([
        {
          numero_campo: campoSelecionado,
          data_reserva: dataSelecionada,
          horario_reserva: horarioSelecionado,
          nome_cliente: nomeCliente,
          telefone_cliente: telefoneCliente,
          tipo_campo: tipoCampo,
          valor: valorReserva,
          status: 'Ativo'
        }
      ]);

    // Tratamento de Erros
    if (insertError) {
      btnContinuar.textContent = textoOriginalBotao;
      btnContinuar.disabled = false;

      // Código 23505 é o bloqueio da porta lógica (Unique Constraint)
      if (insertError.code === '23505') {
        alert("Ops! Alguém foi mais rápido e acabou de reservar esse horário. Por favor, escolha outro.");
        verificarDisponibilidade(); // Atualiza os botões na hora!
      } else {
        alert("Erro ao realizar reserva: " + insertError.message);
      }
      return;
    }

    // Sucesso! Mostra a tela de confirmação
    document.querySelector("main.container").style.display = "none";
    const bannerSection = document.querySelector(".banner");
    if (bannerSection) bannerSection.style.display = "none";
    
    if (confirmationScreen) {
      confirmationScreen.style.display = "block";
    }
  });
}