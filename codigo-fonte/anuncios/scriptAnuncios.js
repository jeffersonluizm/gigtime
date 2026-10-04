// Seleciona o container onde os cards serão inseridos
const anuncios = document.getElementById('anuncios');

// Recupera os usuários do localStorage
const users = GigArmazenamento.lerUsuarios(localStorage);



// Gera os cards (template em ui/cards.js)
anuncios.insertAdjacentHTML('beforeend', users.map((user) => GigCards.html(user, { selos: true, classeColuna: 'd-flex' })).join(''));

document.addEventListener('DOMContentLoaded', () => {
  const selectedRole = sessionStorage.getItem('selectedRole'); // Recupera a escolha do usuário
  const radioMusician = document.getElementById('radioMusician');
  const radioContractor = document.getElementById('radioContractor');

  document.getElementById('state').addEventListener('change', () => filtrarCards());

  if (selectedRole === 'Músico') {
    radioMusician.checked = true; // Marca o botão de Músico
    filtrarCards(); // Aplica o filtro automaticamente
  } else if (selectedRole === 'Contratante') {
    radioContractor.checked = true; // Marca o botão de Contratante
    filtrarCards(); // Aplica o filtro automaticamente
  }
});

// Seleciona os botões de rádio pelos IDs
const radioMusician = document.getElementById('radioMusician');
const radioContractor = document.getElementById('radioContractor');
const caixasAvaliacao = document.querySelectorAll('.filtroAvaliacao');
const caixasGenero = document.querySelectorAll('.filtroGenero');

// Lê os filtros marcados na tela
function filtroAtual() {
  const avaliacaoMarcada = Array.from(caixasAvaliacao).find(caixa => caixa.checked);
  return {
    papel: radioMusician.checked ? 'Músico' : radioContractor.checked ? 'Contratante' : null,
    estado: document.getElementById('state').value,
    avaliacaoMinima: avaliacaoMarcada ? Number(avaliacaoMarcada.value) : 0,
    generos: Array.from(caixasGenero).filter(caixa => caixa.checked).map(caixa => caixa.value),
  };
}

// Exibe só os cards que atendem a todos os filtros (papel, estado, avaliação mínima e gêneros);
// critério sem escolha não filtra. A regra fica em lib/filtros.js.
function filtrarCards() {
  const filtro = filtroAtual();
  const cards = document.querySelectorAll('#anuncios > .col'); // Seleciona todos os cards
  cards.forEach(card => {
    const usuario = users.find(user => user.username === card.dataset.username);
    const visivel = usuario ? GigFiltros.correspondeFiltro(usuario, filtro) : true;
    card.style.setProperty('display', visivel ? 'flex' : 'none', 'important');
  });
}

// Adiciona eventos de clique aos botões de rádio
radioMusician.addEventListener('change', () => {
  if (radioMusician.checked) filtrarCards(); // Exibe músicos
});

radioContractor.addEventListener('change', () => {
  if (radioContractor.checked) filtrarCards(); // Exibe contratantes
});

// Avaliação mínima: uma caixa por vez (marcar uma desmarca as outras; desmarcar tira o filtro)
caixasAvaliacao.forEach(caixa => {
  caixa.addEventListener('change', () => {
    if (caixa.checked) caixasAvaliacao.forEach(outra => { if (outra !== caixa) outra.checked = false; });
    filtrarCards();
  });
});

caixasGenero.forEach(caixa => caixa.addEventListener('change', () => filtrarCards()));

document.getElementById('limparFiltros').addEventListener('click', () => {
  radioMusician.checked = false;
  radioContractor.checked = false;
  document.getElementById('state').value = '';
  caixasAvaliacao.forEach(caixa => { caixa.checked = false; });
  caixasGenero.forEach(caixa => { caixa.checked = false; });
  sessionStorage.removeItem('selectedRole');
  filtrarCards();
});

// Verifica o botão marcado ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  if (radioMusician.checked) {
    filtrarCards(); // Exibe músicos
  } else if (radioContractor.checked) {
    filtrarCards(); // Exibe contratantes
  }
});


// Clique no card guarda o perfil escolhido; o link leva a ../Perfil/perfil.html?u=<username>
GigCards.ligarCliques(anuncios, (username) => users.find((u) => u.username === username));
