// Chat local entre o usuário logado e outro usuário. As mensagens ficam no localStorage
// (lib/mensagens.js); a conversa aberta vem de ?com=<username> (botão "Contate-me" do perfil).
// Desempenho: a lista de usuários vira um Map a cada desenho (antes era um JSON.parse por contato)
// e a conversa mostra só as POR_PAGINA mensagens mais recentes, com "carregar anteriores".
(function () {
  const pedido = new URLSearchParams(window.location.search).get('com');

  // Exige login: guarda a conversa pedida para o login voltar para ela
  const busca = pedido ? '?com=' + GigSessao.codificarParametro(pedido) : '';
  const logado = GigSessao.exigirLogin(sessionStorage, '../Chat/chat.html' + busca, (url) => { window.location.href = url; });
  if (!logado) return;

  const POR_PAGINA = 100;
  const eu = logado.username;
  const $ = (id) => document.getElementById(id);
  const icone = GigHTML.icone;
  let usuarios = new Map();
  const recarregarUsuarios = () => { usuarios = new Map(GigArmazenamento.lerUsuarios(localStorage).map((u) => [u.username, u])); };
  recarregarUsuarios();

  // Conversa aberta: a do endereço, se for de um usuário existente e não for o próprio logado
  let contatoAtual = pedido && pedido !== eu && usuarios.has(pedido) ? pedido : null;
  let visiveis = POR_PAGINA;

  function criar(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function renderizarLista(mensagens) {
    const lista = $('listaConversas');
    const conversas = GigMensagens.listarConversas(mensagens, eu);
    const naoLidas = GigMensagens.naoLidasPorContato(mensagens, eu, GigMensagens.lerLidas(localStorage));
    // Conversa nova (aberta pelo "Contate-me") ainda sem mensagens aparece no topo
    if (contatoAtual && usuarios.has(contatoAtual) && !conversas.some((c) => c.com === contatoAtual)) {
      conversas.unshift({ com: contatoAtual, ultima: null });
    }

    lista.replaceChildren();
    if (conversas.length === 0) {
      const vazio = criar('li', 'estado');
      vazio.innerHTML = `${icone('chat-dots')}<p class="mb-1">Nenhuma conversa ainda.</p><a class="btn btn-gig btn-sm" href="../anuncios/anuncios.html">Encontrar alguém</a>`;
      lista.appendChild(vazio);
      return;
    }

    conversas.forEach(({ com, ultima }) => {
      const pessoa = usuarios.get(com) || { username: com, name: com };
      const item = criar('li');
      const bloco = criar('button', 'chatBlock' + (com === contatoAtual ? ' active' : ''));
      bloco.type = 'button';
      bloco.dataset.username = com;
      if (com === contatoAtual) bloco.setAttribute('aria-current', 'true');

      const img = criar('img', 'avatar');
      img.src = pessoa.profilePicLink || GigConstantes.FOTO_PADRAO;
      img.alt = '';
      img.dataset.fallback = 'avatar';

      const detalhes = criar('span', 'chatBlock__detalhes');
      const topo = criar('span', 'chatBlock__topo');
      topo.append(criar('span', 'chatBlock__nome', pessoa.name), criar('span', 'chatBlock__hora', ultima ? GigMensagens.formatarHora(ultima.enviadaEm) : ''));
      const previa = criar('span', 'chatBlock__previa', ultima ? (ultima.de === eu ? 'Você: ' : '') + ultima.texto : 'Nova conversa');
      detalhes.append(topo, previa);
      bloco.append(img, detalhes);

      const quantas = naoLidas.get(com) || 0;
      if (quantas > 0 && com !== contatoAtual) {
        bloco.appendChild(criar('span', 'contador', String(quantas)));
        bloco.setAttribute('aria-label', `${pessoa.name}, ${quantas} ${quantas === 1 ? 'mensagem não lida' : 'mensagens não lidas'}`);
      }
      bloco.addEventListener('click', () => abrirConversa(com));
      item.appendChild(bloco);
      lista.appendChild(item);
    });
  }

  function renderizarConversa(mensagens) {
    const area = $('areaMensagens');
    const campo = $('mensagem');
    const enviar = $('enviar');
    const verPerfil = $('verPerfilContato');
    area.replaceChildren();

    const pessoa = contatoAtual && usuarios.get(contatoAtual);
    // Em telas estreitas a página mostra a lista OU a conversa (ver chat.css)
    document.querySelector('.chat-app').classList.toggle('conversa-aberta', Boolean(pessoa));
    if (!pessoa) {
      $('nomeContato').textContent = 'Mensagens';
      $('detalheContato').textContent = '';
      $('fotoContato').src = GigConstantes.FOTO_PADRAO;
      verPerfil.classList.add('d-none');
      campo.disabled = true;
      enviar.disabled = true;
      const vazio = criar('div', 'estado');
      vazio.innerHTML = `${icone('chat-dots')}<p class="mb-0">Escolha uma conversa ou use o botão "Contate-me" em um perfil.</p>`;
      area.appendChild(vazio);
      return;
    }

    $('nomeContato').textContent = pessoa.name;
    $('detalheContato').textContent = `${pessoa.role} · ${pessoa.city}/${pessoa.state}`;
    $('fotoContato').src = pessoa.profilePicLink || GigConstantes.FOTO_PADRAO;
    verPerfil.href = GigCards.linkDoPerfil(pessoa.username);
    verPerfil.classList.remove('d-none');
    campo.disabled = false;
    enviar.disabled = false;

    const conversa = GigMensagens.conversaEntre(mensagens, eu, contatoAtual);
    if (conversa.length === 0) {
      area.appendChild(criar('p', 'estado', `Nenhuma mensagem ainda. Diga olá para ${pessoa.name}!`));
    }
    const inicio = Math.max(0, conversa.length - visiveis);
    if (inicio > 0) {
      const anteriores = criar('button', 'btn btn-sm btn-gig-secundario mx-auto mb-3 d-block', `Carregar mensagens anteriores (${inicio})`);
      anteriores.type = 'button';
      anteriores.id = 'carregarAnteriores';
      anteriores.addEventListener('click', () => {
        visiveis += POR_PAGINA;
        renderizar({ manterRolagem: true });
      });
      area.appendChild(anteriores);
    } else {
      const marcador = criar('span');
      marcador.id = 'carregarAnteriores';
      marcador.hidden = true;
      area.appendChild(marcador);
    }
    const fragmento = document.createDocumentFragment();
    for (let i = inicio; i < conversa.length; i++) {
      const m = conversa[i];
      const linha = criar('div', 'messagechat ' + (m.de === eu ? 'myMessage' : 'friendMessage'));
      const balao = criar('p', '', m.texto);
      const hora = criar('span', 'hora', GigMensagens.formatarHora(m.enviadaEm));
      balao.appendChild(hora);
      linha.appendChild(balao);
      fragmento.appendChild(linha);
    }
    area.appendChild(fragmento);
    const ultima = conversa[conversa.length - 1];
    GigMensagens.marcarComoLida(localStorage, eu, contatoAtual, ultima ? Math.max(ultima.enviadaEm, Date.now()) : Date.now());
  }

  function renderizar(opcoes = {}) {
    const mensagens = GigMensagens.lerMensagens(localStorage);
    const area = $('areaMensagens');
    const alturaAntes = area.scrollHeight - area.scrollTop;
    renderizarConversa(mensagens);
    renderizarLista(mensagens);
    // Carregar anteriores mantém a posição de leitura; nos demais casos vai para a mensagem mais nova
    area.scrollTop = opcoes.manterRolagem ? area.scrollHeight - alturaAntes : area.scrollHeight;
    GigLayout.atualizarContador(eu, mensagens);
  }

  function abrirConversa(username) {
    contatoAtual = username;
    visiveis = POR_PAGINA;
    $('erroEnvio').textContent = '';
    // Mantém a conversa no endereço (recarregar a página reabre a mesma conversa)
    history.replaceState(null, '', '?com=' + encodeURIComponent(username));
    renderizar();
    $('mensagem').focus();
  }

  $('chatForm').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!contatoAtual) return;
    const campo = $('mensagem');
    const nova = GigMensagens.enviarMensagem(GigMensagens.lerMensagens(localStorage), eu, contatoAtual, campo.value);
    if (!nova) return;
    if (!GigMensagens.salvarMensagens(localStorage, nova)) {
      $('erroEnvio').textContent = 'Não há espaço no navegador para gravar mais mensagens. Apague conversas antigas em Conta e dados (restaurar a demonstração) e tente de novo.';
      return;
    }
    $('erroEnvio').textContent = '';
    campo.value = '';
    renderizar();
  });

  // "Voltar" (só aparece em telas estreitas): fecha a conversa e mostra a lista
  $('voltarLista').addEventListener('click', () => {
    contatoAtual = null;
    history.replaceState(null, '', window.location.pathname);
    renderizar();
    const primeiro = document.querySelector('.chatlist .chatBlock');
    if (primeiro) primeiro.focus();
  });

  // "Ver perfil" do cabeçalho guarda o perfil escolhido (o link já leva ao endereço ?u=)
  $('verPerfilContato').addEventListener('click', () => {
    const pessoa = usuarios.get(contatoAtual);
    if (pessoa) GigSessao.escolherPerfil(sessionStorage, pessoa);
  });

  // Mensagem gravada ou perfil editado em outra aba (ex.: outro usuário logado em outra aba) atualiza a tela;
  // contato removido cai no estado vazio (a conversa antiga continua listada pelo username)
  // A mensagem que chega na conversa aberta é anunciada ao leitor de tela (a área não é live: ela é redesenhada)
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === GigArmazenamento.CHAVE_USUARIOS) recarregarUsuarios();
    if (![null, GigMensagens.CHAVE_MENSAGENS, GigArmazenamento.CHAVE_USUARIOS].includes(event.key)) return;
    const antes = $('areaMensagens').querySelectorAll('.friendMessage').length;
    renderizar();
    const recebidas = $('areaMensagens').querySelectorAll('.friendMessage');
    if (contatoAtual && recebidas.length > antes) {
      const pessoa = usuarios.get(contatoAtual);
      const texto = recebidas[recebidas.length - 1].firstChild.textContent;
      $('anuncioChat').textContent = `Nova mensagem de ${pessoa ? pessoa.name : contatoAtual}: ${texto}`;
    }
  });

  renderizar();
})();
