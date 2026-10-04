  // Armazena a escolha no sessionStorage ao clicar nos botões
  document.getElementById('btnMusicians').addEventListener('click', () => {
    sessionStorage.setItem('selectedRole', 'Músico');
  });

  document.getElementById('btnContractors').addEventListener('click', () => {
    sessionStorage.setItem('selectedRole', 'Contratante');
  });

  // Seleciona o container onde os cards serão inseridos
const anunciosMusic = document.getElementById('anunciosMusic');
const anunciosContrat = document.getElementById('anunciosContrat');

// Recupera os usuários do localStorage
const users = GigArmazenamento.lerUsuarios(localStorage);



// Gera os cards para cada usuário
users.forEach(user => {
  const e = GigHTML.escaparHTML; // todo dado do usuário entra escapado no HTML
  const card = `
        <div class="col col-card d-flex" data-username="${e(user.username)}">
          <div class="card flex-fill">
            <a href="#" class="link-perfil">
              <img src="${e(user.profilePicLink)}" class="card-img-top" alt="Imagem de ${e(user.name)}">
            </a>
            <div class="card-body">
              <h5 class="card-title">${e(user.name)}
                <i class="fa-solid fa-star mt-2 ms-1 float-end">
                  <span> ${e(user.rating || 'N/A')}</span>
                </i>
              </h5>
              
            </div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item">
                <i class="fa-solid fa-location-dot me-1"></i> ${e(user.city)}/${e(user.state)}
              </li>
              <li class="list-group-item">
                <i class="fa-solid fa-guitar me-1"></i> ${e((user.genres || []).join(', '))}
              </li>
            </ul>
          </div>
        </div>
  `;

  // Adiciona o card ao container sem sobrescrever os elementos existentes
  if (user.role === 'Músico') {
  anunciosMusic.insertAdjacentHTML('beforeend', card);
  } else if (user.role === 'Contratante') {
  anunciosContrat.insertAdjacentHTML('beforeend', card);
  }
});

// Abre o perfil do card clicado. Delegação no container: o card é achado pelo data-username,
// nunca por id (um username igual a outro id da página, como "state", não interfere)
function abrirPerfilDoCard(event) {
  const link = event.target.closest('a.link-perfil');
  const card = link && link.closest('[data-username]');
  if (!card) return;
  event.preventDefault(); // Evita redirecionamento imediato
  const user = users.find(u => u.username === card.dataset.username);
  if (!user) return;
  sessionStorage.setItem('clickedUser', JSON.stringify(GigArmazenamento.usuarioPublico(user))); // Armazena os dados do usuário (sem senha)
  window.location.href = '../Perfil/perfil.html'; // Redireciona para a página de perfil
}

anunciosMusic.addEventListener('click', abrirPerfilDoCard);
anunciosContrat.addEventListener('click', abrirPerfilDoCard);
