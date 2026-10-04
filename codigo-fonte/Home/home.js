// Home: destaques de músicos e contratantes (cards em ui/cards.js)
(function () {
  const usuarios = GigArmazenamento.lerUsuarios(localStorage);
  const porUsername = new Map(usuarios.map((u) => [u.username, u]));
  const containers = { 'Músico': document.getElementById('anunciosMusic'), 'Contratante': document.getElementById('anunciosContrat') };

  // O botão escolhido vira filtro de papel em Explorar
  document.getElementById('btnMusicians').addEventListener('click', () => sessionStorage.setItem(GigConstantes.CHAVES_SESSAO.PAPEL, 'Músico'));
  document.getElementById('btnContractors').addEventListener('click', () => sessionStorage.setItem(GigConstantes.CHAVES_SESSAO.PAPEL, 'Contratante'));

  for (const [papel, container] of Object.entries(containers)) {
    const doPapel = usuarios.filter((u) => u.role === papel);
    container.insertAdjacentHTML('beforeend', doPapel.map((u) => GigCards.html(u, { classeColuna: 'col-card d-flex' })).join(''));
    GigCards.ligarCliques(container, (username) => porUsername.get(username));
  }
})();
