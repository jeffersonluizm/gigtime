// Estrutura comum a todas as páginas: topo (navbar), rodapé com o selo de demonstração,
// contador de mensagens não lidas, aviso pendente, sessão expirada e fallback de imagens.
// A página só declara <header id="topo">, <main id="conteudo"> e <footer id="rodape">;
// <body data-pagina="..."> marca o link ativo e data-topo="simples" usa o topo reduzido (telas de acesso).
(function (raiz) {
  const icone = (nome) => raiz.GigHTML.icone(nome);
  const FALLBACK = { avatar: () => GigConstantes.FOTO_PADRAO, banner: () => GigConstantes.BANNER_PADRAO, destaque: () => GigConstantes.BANNER_PADRAO };

  function linksDoMenu(logado) {
    const comum = `
      <li class="nav-item"><a class="nav-link" href="../anuncios/anuncios.html" data-pagina="explorar">Explorar</a></li>
      <li class="nav-item"><a class="nav-link" href="../Sobre/sobre.html" data-pagina="sobre">Como funciona</a></li>`;
    if (!logado) {
      return comum + `
      <li class="nav-item"><a class="nav-link" href="../Login/login.html" data-pagina="entrar">Entrar</a></li>
      <li class="nav-item"><a class="btn btn-gig-claro btn-sm ms-lg-2 my-2 my-lg-0" href="../Registro/registro.html">Criar conta</a></li>`;
    }
    return comum + `
      <li class="nav-item"><a class="nav-link" href="../Chat/chat.html" data-pagina="mensagens" id="linkMensagens">Mensagens</a></li>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle d-flex align-items-center gap-2" href="#" id="menuConta" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <img class="avatar" id="profileAvatar" alt="" width="32" height="32" data-fallback="avatar">
          <span id="nomeUsuario"></span>
        </a>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="menuConta">
          <li><a class="dropdown-item" id="linkMeuPerfil" href="../Perfil/perfil.html">${icone('person')} Meu perfil</a></li>
          <li><a class="dropdown-item" href="../EdicaoPerfil/EdicaoPerfil.html">${icone('sliders')} Editar perfil</a></li>
          <li><a class="dropdown-item" href="../Conta/conta.html">${icone('gear')} Conta e dados</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><button class="dropdown-item" type="button" id="logoutLink">${icone('box-arrow-right')} Sair</button></li>
        </ul>
      </li>`;
  }

  function montarTopo(topo, logado) {
    const simples = document.body.dataset.topo === 'simples';
    if (simples) {
      topo.innerHTML = `
        <nav class="navbar topo-simples" aria-label="Principal">
          <div class="container">
            <a class="navbar-brand" href="../Home/home.html"><img src="../assets/img/logo.svg" width="34" height="34" alt=""> GigTime</a>
            <a class="btn btn-gig-secundario btn-sm" href="../anuncios/anuncios.html">${icone('search')} Explorar sem conta</a>
          </div>
        </nav>`;
      return;
    }
    topo.innerHTML = `
      <nav class="navbar navbar-expand-lg topo sticky-top" aria-label="Principal">
        <div class="container">
          <a class="navbar-brand" href="../Home/home.html"><img src="../assets/img/logo-claro.svg" width="34" height="34" alt=""> GigTime</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuPrincipal" aria-controls="menuPrincipal" aria-expanded="false" aria-label="Abrir o menu">${icone('list')}</button>
          <div class="collapse navbar-collapse" id="menuPrincipal">
            <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1">${linksDoMenu(logado)}</ul>
          </div>
        </div>
      </nav>`;

    const ativa = document.body.dataset.pagina;
    const link = ativa && topo.querySelector(`.nav-link[data-pagina="${ativa}"]`);
    if (link) link.setAttribute('aria-current', 'page');
    if (!logado) return;

    // Dados do usuário só por src/textContent (nada de HTML montado com eles)
    topo.querySelector('#profileAvatar').src = logado.profilePicLink || GigConstantes.FOTO_PADRAO;
    topo.querySelector('#nomeUsuario').textContent = logado.name || logado.username;
    topo.querySelector('#linkMeuPerfil').href = GigCards.linkDoPerfil(logado.username);
    topo.querySelector('#logoutLink').addEventListener('click', () => {
      GigSessao.sair(sessionStorage);
      raiz.location.href = '../Acesso/saiu.html';
    });
    atualizarContador(logado.username);
  }

  function atualizarContador(eu) {
    const link = document.getElementById('linkMensagens');
    if (!link || !raiz.GigMensagens) return;
    let total = 0;
    try {
      total = GigMensagens.naoLidas(GigMensagens.lerMensagens(localStorage), eu, GigMensagens.lerLidas(localStorage));
    } catch (e) { /* armazenamento indisponível: sem contador */ }
    link.querySelector('.contador')?.remove();
    link.removeAttribute('aria-label');
    if (total > 0) {
      const contador = document.createElement('span');
      contador.className = 'contador';
      contador.setAttribute('aria-hidden', 'true');
      contador.textContent = total > 99 ? '99+' : String(total);
      link.appendChild(contador);
      link.setAttribute('aria-label', `Mensagens, ${total} não ${total === 1 ? 'lida' : 'lidas'}`);
    }
  }

  function montarRodape(rodape) {
    rodape.className = 'rodape';
    rodape.innerHTML = `
      <div class="container">
        <div class="row g-4">
          <div class="col-md-5">
            <p class="titulo-marca d-flex align-items-center gap-2 mb-2"><img src="../assets/img/logo-claro.svg" width="28" height="28" alt=""> GigTime</p>
            <p>Conectando músicos e contratantes de música ao vivo.</p>
            <a class="selo-demo" href="../Sobre/sobre.html#sem-back-end">${icone('hdd-stack')} Demo · dados só neste navegador</a>
          </div>
          <nav class="col-6 col-md-3" aria-label="Navegação do rodapé">
            <h2 class="h6 text-uppercase titulo-marca">Navegar</h2>
            <ul>
              <li><a href="../Home/home.html">Início</a></li>
              <li><a href="../anuncios/anuncios.html">Explorar</a></li>
              <li><a href="../Chat/chat.html">Mensagens</a></li>
              <li><a href="../Conta/conta.html">Conta e dados</a></li>
            </ul>
          </nav>
          <nav class="col-6 col-md-4" aria-label="Sobre o projeto">
            <h2 class="h6 text-uppercase titulo-marca">O projeto</h2>
            <ul>
              <li><a href="../Sobre/sobre.html">Como funciona</a></li>
              <li><a href="../Sobre/sobre.html#arquitetura">Como foi feito</a></li>
              <li><a href="../Privacidade/privacidade.html">Privacidade e dados</a></li>
            </ul>
          </nav>
        </div>
        <hr class="my-4">
        <small>© 2024-2026 GigTime. Projeto acadêmico (PUC Minas, Análise e Desenvolvimento de Sistemas) revisado como portfólio. Personas e ilustrações fictícias.</small>
      </div>`;
  }

  // Imagem que não carrega (link externo fora do ar) troca pela ilustração padrão
  function ligarFallbackDeImagens() {
    document.addEventListener('error', (event) => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement) || !img.dataset.fallback || img.dataset.falhou) return;
      img.dataset.falhou = 'sim';
      img.classList.add('imagem-falhou');
      img.src = (FALLBACK[img.dataset.fallback] || FALLBACK.avatar)();
    }, true);
  }

  // Com o armazenamento bloqueado até o sessionStorage lança erro: a página segue como visitante
  function seguro(acao, padrao) {
    try {
      return acao();
    } catch (e) {
      return padrao;
    }
  }

  // CSP por <meta> não aceita frame-ancestors e o GitHub Pages não envia X-Frame-Options:
  // dentro de um iframe de outro site a página fica oculta (defesa contra clickjacking)
  function bloquearMoldura(janela) {
    let emMoldura;
    try {
      emMoldura = janela.top !== janela.self;
    } catch (e) {
      emMoldura = true;
    }
    if (emMoldura) janela.document.documentElement.hidden = true;
    return emMoldura;
  }

  function iniciar() {
    if (bloquearMoldura(raiz)) return;
    // Sessão parada há mais de 2 horas: encerra e avisa (páginas que exigem login vão para a página própria)
    // (quem exige login trata a expiração no próprio script, com GigSessao.exigirLogin)
    const paginaExigeLogin = document.body.hasAttribute('data-exige-login');
    const estado = seguro(() => GigSessao.situacao(sessionStorage), 'sem-sessao');
    if (estado === 'ativa') {
      GigSessao.registrarAtividade(sessionStorage);
    } else if (estado === 'expirada' && !paginaExigeLogin) {
      GigSessao.sair(sessionStorage);
      GigAvisos.paraProximaPagina('Sua sessão expirou por inatividade. Entre de novo para continuar.', 'info');
    }
    const logado = seguro(() => GigSessao.usuarioLogado(sessionStorage), null);
    const topo = document.getElementById('topo');
    const rodape = document.getElementById('rodape');
    if (topo) montarTopo(topo, logado);
    if (rodape) montarRodape(rodape);
    ligarFallbackDeImagens();
    GigAvisos.mostrarPendente();
    // Mensagem nova chegando por outra aba atualiza o contador
    raiz.addEventListener('storage', (event) => {
      const logadoAgora = seguro(() => GigSessao.usuarioLogado(sessionStorage), null);
      if (logadoAgora && raiz.GigMensagens && [null, GigMensagens.CHAVE_MENSAGENS, GigMensagens.CHAVE_LIDAS].includes(event.key)) {
        atualizarContador(logadoAgora.username);
      }
    });
  }

  raiz.GigLayout = { atualizarContador, bloquearMoldura };
  iniciar();
})(window);
