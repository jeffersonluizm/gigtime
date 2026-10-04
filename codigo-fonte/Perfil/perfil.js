// Perfil: endereço próprio (perfil.html?u=<username>). Sem ?u=, usa o perfil escolhido na sessão
// (links antigos). Os dados vêm sempre do modelo atual no localStorage e entram por textContent/src.
(function () {
  const $ = (id) => document.getElementById(id);
  const usuarios = GigArmazenamento.lerUsuarios(localStorage);
  const pedido = new URLSearchParams(window.location.search).get('u');
  const escolhido = GigSessao.perfilEscolhido(sessionStorage);
  const username = pedido || (escolhido && escolhido.username);
  const usuario = username ? usuarios.find((u) => u.username === username) : null;
  const logado = GigSessao.usuarioLogado(sessionStorage);

  $('perfilCarregando').remove();
  if (!usuario) {
    $('perfilNaoEncontrado').hidden = false;
    document.title = 'Perfil não encontrado | GigTime';
    return;
  }
  $('perfil').hidden = false;
  document.title = `${usuario.name} | GigTime`;
  if (!pedido) history.replaceState(null, '', '?u=' + encodeURIComponent(usuario.username));

  const lista = (valor) => (Array.isArray(valor) ? valor : []);
  const itens = (ul, textos, classe) => {
    ul.replaceChildren(...textos.map((texto) => {
      const li = document.createElement('li');
      li.className = classe;
      li.textContent = texto;
      return li;
    }));
  };

  $('profilePic').src = usuario.profilePicLink || GigConstantes.FOTO_PADRAO;
  $('profilePic').alt = `Foto de ${usuario.name}`;
  $('bannerImg').src = usuario.bannerPicLink || GigConstantes.BANNER_PADRAO;
  $('name').textContent = usuario.name;
  $('role').textContent = usuario.role;
  $('location').textContent = `${usuario.city}/${usuario.state}`;
  const nota = GigCards.textoNota(usuario.rating);
  $('nota').textContent = nota === 'Novo' ? 'Novo no GigTime' : `${nota} de 5`;
  itens($('badges'), lista(usuario.badges), 'selo');
  itens($('genres'), lista(usuario.genres), 'chip');
  $('bio').textContent = usuario.bio || 'Este perfil ainda não tem uma apresentação.';
  $('disponibilidade').textContent = usuario.disponibilidade || 'A combinar';

  // Contato só para quem está logado (evita expor e-mail e telefone a qualquer visitante)
  if (logado) {
    $('email').textContent = usuario.email;
    $('phone').textContent = usuario.phone;
    $('contatoVisivel').hidden = false;
  } else {
    $('contatoOculto').hidden = false;
    $('entrarParaVer').addEventListener('click', () => {
      sessionStorage.setItem(GigConstantes.CHAVES_SESSAO.DESTINO, '../Perfil/perfil.html?u=' + GigSessao.codificarParametro(usuario.username));
    });
  }

  // O embed sai só do ID validado (11 caracteres), nunca do link guardado
  const idVideo = GigValidacao.idYoutube(usuario.songLink);
  if (idVideo) {
    $('songLink').src = 'https://www.youtube-nocookie.com/embed/' + idVideo;
    $('songLink').title = `Vídeo de ${usuario.name} no YouTube`;
    $('videoMoldura').hidden = false;
  } else {
    $('songLink').removeAttribute('src');
    $('semVideo').hidden = false;
  }

  // Próprio perfil: "Editar perfil"; perfil de outra pessoa: "Contate-me"
  const acao = GigPerfil.acaoDoPerfil(usuario, logado);
  const botaoAcao = $('acaoPerfil');
  botaoAcao.textContent = acao.texto;
  botaoAcao.href = acao.href;
  botaoAcao.dataset.href = acao.href;

  // Galeria: cada foto é um botão que abre o diálogo (Esc fecha e o foco volta para a foto)
  const fotos = lista(usuario.userPicsLinks).filter(Boolean);
  const galeria = $('galeria');
  if (fotos.length === 0) $('semDestaques').hidden = false;
  fotos.forEach((link, i) => {
    const li = document.createElement('li');
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'galeria-item';
    botao.setAttribute('aria-label', `Ampliar foto ${i + 1} de ${fotos.length}`);
    const img = document.createElement('img');
    img.src = link;
    img.alt = '';
    img.loading = 'lazy';
    img.dataset.fallback = 'destaque';
    botao.appendChild(img);
    botao.addEventListener('click', () => abrirFoto(img.src, `Foto ${i + 1} de ${usuario.name}`));
    li.appendChild(botao);
    galeria.appendChild(li);
  });

  const modal = $('modal');
  function abrirFoto(src, descricao) {
    $('modal-img').src = src;
    $('modal-img').alt = descricao;
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
    $('close-btn').focus();
  }
  function fecharFoto() {
    if (typeof modal.close === 'function') modal.close();
    else modal.removeAttribute('open');
  }
  $('close-btn').addEventListener('click', fecharFoto);
  modal.addEventListener('click', (event) => { if (event.target === modal) fecharFoto(); }); // clique fora da foto
})();
