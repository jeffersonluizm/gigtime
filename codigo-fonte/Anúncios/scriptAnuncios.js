// Seleciona o container onde os cards serão inseridos
const anuncios = document.getElementById('anuncios');

// Recupera os usuários do localStorage
const users = GigArmazenamento.lerUsuarios(localStorage);



// Gera os cards para cada usuário
users.forEach(user => {
  const e = GigHTML.escaparHTML; // todo dado do usuário entra escapado no HTML
  const card = `
    <div class="col d-flex NO ${e(user.role)} ${e(user.state)}" data-username="${e(user.username)}">
      <div class="card flex-fill">
        <a href="#" id="${e(user.username)}">
          <img src="${e(user.profilePicLink)}" class="card-img-top" alt="Imagem de ${e(user.name)}">
        </a>
        <div class="card-body">
          <h5 class="card-title">${e(user.name)}
            <i class="fa-solid fa-star fs-6 ms-1 float-end">
              <span>${e(user.rating || 'N/A')}</span>
            </i>
          </h5>
        </div>
        <ul class="list-group list-group-flush">
          <li class="list-group-item">
            <i class="fa-solid fa-person me-1"></i> ${e(user.role)}
          </li>
          <li class="list-group-item">
            <i class="fa-solid fa-location-dot me-1"></i> ${e(user.city)}/${e(user.state)}
          </li>
          <li class="list-group-item">
            <i class="fa-solid fa-guitar me-1"></i> ${e((user.genres || []).join(', '))}
          </li>
          <li class="list-group-item d-flex">
            <div class="d-flex flex-wrap">
              ${(user.badges || []).map(badge => `<div class="badge bg-primary me-2 mb-1">${e(badge)}</div>`).join('')}
            </div>
          </li>
        </ul>
      </div>
    </div>
  `;

  // Adiciona o card ao container sem sobrescrever os elementos existentes
  anuncios.insertAdjacentHTML('beforeend', card);
});

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


users.forEach(user => {
  const link = document.getElementById(user.username);
  link.addEventListener('click', (event) => {
    event.preventDefault(); // Evita redirecionamento imediato
    sessionStorage.setItem('clickedUser', JSON.stringify(GigArmazenamento.usuarioPublico(user))); // Armazena os dados do usuário (sem senha)
    window.location.href = '../Perfil/perfil.html'; // Redireciona para a página de perfil
  });
});
