// Home: os perfis mais bem avaliados de cada papel (cards em ui/cards.js).
// Mostra só os primeiros DESTAQUES de cada lista: com milhares de usuários, desenhar todos
// deixava a Home lenta (ver docs/carga). A lista completa fica em Explorar.
(function () {
  const DESTAQUES = 4;
  const usuarios = GigArmazenamento.lerUsuarios(localStorage);
  const porUsername = new Map(usuarios.map((u) => [u.username, u]));
  const secoes = [
    { papel: 'Músico', container: document.getElementById('anunciosMusic'), vazio: 'Nenhum músico cadastrado ainda.' },
    { papel: 'Contratante', container: document.getElementById('anunciosContrat'), vazio: 'Nenhum contratante cadastrado ainda.' },
  ];
  const porNota = (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0);

  for (const { papel, container, vazio } of secoes) {
    const melhores = usuarios.filter((u) => u.role === papel).sort(porNota).slice(0, DESTAQUES);
    container.removeAttribute('aria-busy');
    if (melhores.length === 0) {
      container.innerHTML = `<div class="estado w-100"><svg class="icone" aria-hidden="true" focusable="false"><use href="../assets/icones.svg#people"></use></svg><p class="mb-0"></p><a class="btn btn-gig btn-sm" href="../Registro/registro.html">Criar o primeiro perfil</a></div>`;
      container.querySelector('p').textContent = vazio;
      continue;
    }
    container.innerHTML = melhores.map((u) => GigCards.html(u)).join('');
    GigCards.ligarCliques(container, (username) => porUsername.get(username));
  }
})();
