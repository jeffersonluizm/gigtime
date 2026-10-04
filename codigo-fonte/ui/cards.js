// Card de perfil usado na Home e em Explorar (antes havia um template em cada página).
// Todo dado do usuário entra escapado (GigHTML.escaparHTML). O card inteiro é clicável pelo link
// do nome (stretched-link); a foto tem um link fora da tabulação, para o clique do mouse.
(function (raiz) {
  const e = (valor) => raiz.GigHTML.escaparHTML(valor);
  const icone = (nome) => raiz.GigHTML.icone(nome);

  const linkDoPerfil = (username) => '../Perfil/perfil.html?u=' + encodeURIComponent(username);

  function textoNota(rating) {
    const nota = Number(rating);
    return nota > 0 ? nota.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : 'Novo';
  }

  // opcoes.selos: mostra os selos (Explorar); opcoes.classeColuna: classes extras da coluna
  function html(usuario, opcoes = {}) {
    const href = e(linkDoPerfil(usuario.username));
    const nota = textoNota(usuario.rating);
    const rotuloNota = nota === 'Novo' ? 'Sem avaliações ainda' : `Avaliação ${nota} de 5`;
    const generos = (Array.isArray(usuario.genres) ? usuario.genres : []).map((g) => `<li class="chip">${e(g)}</li>`).join('');
    const selos = opcoes.selos && Array.isArray(usuario.badges) && usuario.badges.length
      ? `<ul class="selos" aria-label="Selos">${usuario.badges.map((b) => `<li class="selo">${e(b)}</li>`).join('')}</ul>`
      : '';
    return `
      <div class="col ${e(opcoes.classeColuna || '')}" data-username="${e(usuario.username)}">
        <article class="card card-perfil h-100">
          <a class="link-perfil" href="${href}" tabindex="-1" aria-hidden="true">
            <img src="${e(usuario.profilePicLink || raiz.GigConstantes.FOTO_PADRAO)}" class="card-img-top" alt="" loading="lazy" width="240" height="240" data-fallback="avatar">
          </a>
          <div class="card-body">
            <div class="d-flex align-items-start justify-content-between gap-2">
              <h3 class="card-title h5 mb-0"><a class="link-perfil stretched-link" href="${href}">${e(usuario.name)}</a></h3>
              <span class="nota">${icone('star-fill')}<span aria-hidden="true">${e(nota)}</span><span class="visually-hidden">${e(rotuloNota)}</span></span>
            </div>
            <p class="card-perfil__meta">${icone(usuario.role === 'Contratante' ? 'building' : 'mic')} ${e(usuario.role)} · ${icone('geo-alt')} ${e(usuario.city)}/${e(usuario.state)}</p>
            <ul class="chips" aria-label="Gêneros">${generos}</ul>
            ${selos}
          </div>
        </article>
      </div>`;
  }

  // Clique em qualquer link do card guarda o perfil escolhido (compatibilidade com quem ainda
  // chega ao perfil sem ?u=) e deixa o navegador seguir o link (Ctrl+clique abre em nova aba)
  function ligarCliques(container, buscarUsuario) {
    const guardar = (event) => {
      const card = event.target.closest('[data-username]');
      if (!card || !container.contains(card)) return;
      const usuario = buscarUsuario(card.dataset.username);
      if (usuario) raiz.GigSessao.escolherPerfil(raiz.sessionStorage, usuario);
    };
    container.addEventListener('click', guardar);
    container.addEventListener('auxclick', guardar);
  }

  raiz.GigCards = { html, ligarCliques, linkDoPerfil, textoNota };
})(window);
