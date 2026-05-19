const tipoCampoSelect = document.getElementById('tipoCampo');
const numeroCampoSelect = document.getElementById('numeroCampo');
const dataReservaInput = document.getElementById('dataReserva');
const horarioReservaSelect = document.getElementById('horarioReserva');
const boxPreco = document.getElementById('boxPreco');
const txtPreco = document.getElementById('txtPreco');
const form = document.getElementById('formAgendamento');

// Bloqueia datas passadas no calendário
const hoje = new Date().toISOString().split('T')[0];
dataReservaInput.min = hoje;

// Atualiza os números dos campos baseado no tipo selecionado
tipoCampoSelect.addEventListener('change', () => {
  const tipo = tipoCampoSelect.value;
  const opcaoSelecionada = tipoCampoSelect.options[tipoCampoSelect.selectedIndex];
  const preco = opcaoSelecionada.getAttribute('data-preco');

  // Mostra o preço
  txtPreco.textContent = parseFloat(preco).toFixed(2).replace('.', ',');
  boxPreco.style.display = 'block';

  // Reseta e habilita o select de números
  numeroCampoSelect.innerHTML = '<option value="" disabled selected>Escolha o número...</option>';
  numeroCampoSelect.disabled = false;

  if (tipo === 'Society') {
    for (let i = 1; i <= 6; i++) {
      numeroCampoSelect.innerHTML += `<option value="CS${i}">Campo Society ${i}</option>`;
    }
  } else if (tipo === 'Areia') {
    for (let i = 1; i <= 3; i++) {
      numeroCampoSelect.innerHTML += `<option value="QA${i}">Quadra de Areia ${i}</option>`;
    }
  }
  
  // Reseta verificação de hora se mudar o campo
  if (dataReservaInput.value) carregarHorariosDisponiveis();
});

// Quando o usuário escolhe a data ou altera o número do campo, atualiza os horários livres
dataReservaInput.addEventListener('change', carregarHorariosDisponiveis);
numeroCampoSelect.addEventListener('change', carregarHorariosDisponiveis);

async function carregarHorariosDisponiveis() {
  const data = dataReservaInput.value;
  const campo = numeroCampoSelect.value;

  if (!data || !campo) return;

  horarioReservaSelect.innerHTML = '<option value="" disabled selected>Buscando horários livres...</option>';
  horarioReservaSelect.disabled = true;

  // 1. Horários operacionais da Arena (ex: das 08:00 às 22:00)
  const listaHorariosPadrao = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", 
    "20:00", "21:00", "22:00"
  ];

  try {
    // 2. Busca no Supabase quais desses horários já foram reservados para esse campo específico neste dia
    const { data: reservasExistentes, error } = await _supabase
      .from('reservas')
      .select('horario_reserva')
      .eq('data_reserva', data)
      .eq('numero_campo', campo)
      .eq('status', 'Ativo');

    if (error) throw error;

    // Converte os horários vindos do banco para um formato simples "HH:MM"
    const horariosOcupados = reservasExistentes.map(res => res.horario_reserva.substring(0, 5));

    // 3. Filtra apenas os horários que NÃO estão ocupados
    const horariosLivres = listaHorariosPadrao.filter(hora => !horariosOcupados.includes(hora));

    // 4. Alimenta o select da tela
    horarioReservaSelect.innerHTML = '<option value="" disabled selected>Escolha o horário...</option>';
    
    if (horariosLivres.length === 0) {
      horarioReservaSelect.innerHTML = '<option value="" disabled>Todos os horários esgotados</option>';
    } else {
      horariosLivres.forEach(hora => {
        horarioReservaSelect.innerHTML += `<option value="${hora}:00">${hora}h</option>`;
      });
      horarioReservaSelect.disabled = false;
    }

  } catch (error) {
    alert('Erro ao carregar horários: ' + error.message);
  }
}

// Envio do formulário (Salvar Reserva)
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Verifica se o usuário está logado antes de salvar
  const { data: { user }, error: authError } = await _supabase.auth.getUser();

  if (authError || !user) {
    alert('Você precisa estar logado para agendar um horário!');
    window.location.href = 'login.html';
    return;
  }

  const opcaoSelecionada = tipoCampoSelect.options[tipoCampoSelect.selectedIndex];
  const precoValor = parseFloat(opcaoSelecionada.getAttribute('data-preco'));

  // Prepara o objeto com as informações recolhidas
  const novaReserva = {
    usuario_id: user.id,
    nome_cliente: user.user_metadata?.full_name || 'Cliente Cadastrado',
    telefone_cliente: user.user_metadata?.phone || 'Não Informado',
    tipo_campo: tipoCampoSelect.value,
    numero_campo: numeroCampoSelect.value,
    data_reserva: dataReservaInput.value,
    horario_reserva: horarioReservaSelect.value,
    valor: precoValor,
    status: 'Ativo'
  };

  // Grava na tabela do banco de dados
  const { error: insertError } = await _supabase
    .from('reservas')
    .insert([novaReserva]);

  if (insertError) {
    alert('Não foi possível concluir o agendamento: ' + insertError.message);
  } else {
    alert('Reserva realizada com sucesso! Bom jogo!');
    window.location.href = 'home.html';
  }
});