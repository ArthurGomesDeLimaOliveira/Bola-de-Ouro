
let campoSelecionado = "";
let dataSelecionada = "";
let horarioSelecionado = "";

const selected = document.getElementById("selected-text");
const options = document.getElementById("select-options");
const arrow = document.querySelector(".arrow");
const botoesTempo = document.querySelectorAll(".time");
const btnContinuar = document.querySelector(".continue-btn");
const textoData = document.getElementById("texto-data-selecionada");


const mesAnoTexto = document.getElementById("mes-ano-texto");
const diasCalendario = document.getElementById("dias-calendario");
const btnPrevMonth = document.getElementById("btn-mes-anterior");
const btnNextMonth = document.getElementById("btn-mes-proximo");

const confirmationScreen = document.querySelector(".confirmation");
if (confirmationScreen) {
  confirmationScreen.style.display = "none";
}

function toggleOptions() {
  options.classList.toggle("show");
  arrow.style.transform = options.classList.contains("show") ? "rotate(180deg)" : "rotate(0deg)";
}

window.toggleOptions = toggleOptions;

function selectOption(option) {
  if (!option) return;

  const img = option.querySelector("img").src;
  const categoria = option.querySelector(".categoria").textContent;
  const titulo = option.querySelector("h3").textContent;
  const quantidadej = option.querySelector("p").textContent;
  const valorh = option.querySelector("strong").textContent;

  selected.innerHTML = `
      <div class="option-info selected-card">
            <img src="${img}">
            <div class="option-info">
              <span class="categoria">${categoria}</span>
              <h3>${titulo}</h3>
              <p>${quantidadej}</p>
              <strong>${valorh}</strong>
            </div>
        </div>
  `;

  options.classList.remove("show");
  arrow.style.transform = "rotate(0deg)";

  campoSelecionado = titulo;
  verificarDisponibilidade();
}

window.selectOption = selectOption;

document.addEventListener("click", function (event) {
  const customSelect = document.querySelector(".custom-select");
  if (customSelect && !customSelect.contains(event.target)) {
    options.classList.remove("show");
    arrow.style.transform = "rotate(0deg)";
  }
});

let dataAtual = new Date();
let mesExibicao = dataAtual.getMonth();
let anoExibicao = dataAtual.getFullYear();

const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function renderizarCalendario() {
  if (!diasCalendario) return;

  diasCalendario.innerHTML = "";
  if (mesAnoTexto) mesAnoTexto.textContent = `${mesesNomes[mesExibicao]} ${anoExibicao}`;

  const primeiroDiaSemana = new Date(anoExibicao, mesExibicao, 1).getDay();
  const diasNoMes = new Date(anoExibicao, mesExibicao + 1, 0).getDate();
 
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  for (let i = 0; i < primeiroDiaSemana; i++) {
    const espaco = document.createElement("span");
    espaco.style.background = "transparent";
    espaco.style.cursor = "default";
    diasCalendario.appendChild(espaco);
  }

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const spanDia = document.createElement("span");
    spanDia.textContent = dia;

    const dataDesteSpan = new Date(anoExibicao, mesExibicao, dia);

    if (dataDesteSpan < hoje) {
      spanDia.classList.add("disabled");
      spanDia.style.cursor = "not-allowed";
      spanDia.style.opacity = "0.4";
    } else {
      spanDia.addEventListener("click", () => {

        if (!campoSelecionado) {
          alert("Por favor, selecione um campo na lista acima antes de escolher a data.");
          return;
        }

        const todosDias = diasCalendario.querySelectorAll("span");
        todosDias.forEach(d => d.classList.remove("selected-day"));
        spanDia.classList.add("selected-day");

        const mesFormatado = String(mesExibicao + 1).padStart(2, '0');
        const diaFormatado = String(dia).padStart(2, '0');
        dataSelecionada = `${anoExibicao}-${mesFormatado}-${diaFormatado}`;

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

renderizarCalendario();


async function verificarDisponibilidade() {
  horarioSelecionado = "";
  botoesTempo.forEach(t => t.classList.remove("active"));

  if (!campoSelecionado || !dataSelecionada) return;

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

  const horariosBloqueados = reservasOcupadas.map(res => res.horario_reserva.substring(0, 5));

  botoesTempo.forEach(btn => {
    const horaDoBotao = btn.textContent;

    btn.classList.remove("disabled");
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';

    if (horariosBloqueados.includes(horaDoBotao)) {
      btn.classList.add("disabled");
      btn.disabled = true;
      btn.style.opacity = '0.4';
      btn.style.cursor = 'not-allowed';
    }
  });
}

botoesTempo.forEach((btn) => {
  btn.addEventListener("click", () => {

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

    horarioSelecionado = btn.textContent + ":00";
  });
});

if (btnContinuar) {
  btnContinuar.addEventListener("click", async () => {

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

  
    const { data: { user }, error: authError } = await _supabase.auth.getUser();

    if (authError || !user) {
      alert("Você precisa estar logado para fazer uma reserva!");
      window.location.href = "login.html";
      return;
    }

    const { data: pendencias, error: errPendencias } = await _supabase
      .from('reservas')
      .select('taxa_cancelamento')
      .eq('user_id', user.id)
      .eq('taxa_paga', false);

    if (pendencias && pendencias.length > 0) {
      const totalDevendo = pendencias.reduce((acc, curr) => acc + curr.taxa_cancelamento, 0);
      const devendoFormatado = totalDevendo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      alert(`⚠️ BLOQUEADO! Você possui uma taxa de cancelamento pendente no valor de ${devendoFormatado}.\n\nPara agendar novos horários, por favor, entre em contato com a administração para realizar o acerto.`);
      return;
    }

    const isSociety = campoSelecionado.toLowerCase().includes("society");
    const tipoCampo = isSociety ? "Society" : "Areia";
    const valorReserva = isSociety ? 150.00 : 120.00;

    // Extrai nome e telefone do cadastro do usuário
    const nomeCliente = user.user_metadata?.full_name || "Cliente";
    const telefoneCliente = user.user_metadata?.phone || "Não informado";

    const textoOriginalBotao = btnContinuar.textContent;
    btnContinuar.textContent = "Processando...";
    btnContinuar.disabled = true;

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

    if (insertError) {
      btnContinuar.textContent = textoOriginalBotao;
      btnContinuar.disabled = false;

      if (insertError.code === '23505') {
        alert("Ops! Alguém foi mais rápido e acabou de reservar esse horário. Por favor, escolha outro.");
        verificarDisponibilidade();
      } else {
        alert("Erro ao realizar reserva: " + insertError.message);
      }
      return;
    }

    document.querySelector("main.container").style.display = "none";
    const bannerSection = document.querySelector(".banner");
    if (bannerSection) bannerSection.style.display = "none";

    if (confirmationScreen) {
      confirmationScreen.style.display = "block";
    }
  });
}