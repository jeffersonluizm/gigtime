// Chat local entre o usuário logado e outro usuário. As mensagens ficam no localStorage
// (lib/mensagens.js); a conversa aberta vem de ?com=<username> (botão "Contate-me" do perfil).
(function () {
  const logado = GigArmazenamento.lerJSON(sessionStorage, 'loggedInUser');

  const pedido = new URLSearchParams(window.location.search).get('com');

  // Exige login: guarda a conversa pedida para o login voltar para ela
  if (!logado) {
    const busca = pedido ? '?com=' + GigArmazenamento.codificarParametro(pedido) : '';
    sessionStorage.setItem(GigArmazenamento.CHAVE_DESTINO, '../Chat/chat.html' + busca);
    window.location.href = '../Login/login.html';
    return;
  }

  const eu = logado.username;
  const $ = (id) => document.getElementById(id);
  const FOTO_PADRAO = '../userImages/defaultUser.jpg';
  const usuarios = () => GigArmazenamento.lerUsuarios(localStorage);
  const buscarUsuario = (username) => usuarios().find((u) => u.username === username);

  // Conversa aberta: a do endereço, se for de um usuário existente e não for o próprio logado
  let contatoAtual = pedido && pedido !== eu && buscarUsuario(pedido) ? pedido : null;

  function criar(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function renderizarLista() {
    const lista = $('listaConversas');
    const conversas = GigMensagens.listarConversas(GigMensagens.lerMensagens(localStorage), eu);
    // Conversa nova (aberta pelo "Contate-me") ainda sem mensagens aparece no topo
    if (contatoAtual && buscarUsuario(contatoAtual) && !conversas.some((c) => c.com === contatoAtual)) {
      conversas.unshift({ com: contatoAtual, ultima: null });
    }

    lista.replaceChildren();
    if (conversas.length === 0) {
      lista.appendChild(criar('p', 'p-3 text-secondary', 'Nenhuma conversa ainda. Abra um perfil e clique em "Contate-me".'));
      return;
    }

    conversas.forEach(({ com, ultima }) => {
      const pessoa = buscarUsuario(com) || { username: com, name: com };
      const bloco = criar('div', 'chatBlock' + (com === contatoAtual ? ' active' : ''));
      bloco.dataset.username = com;

      const foto = criar('div', 'profilePicture');
      const img = criar('img', 'cover');
      img.src = pessoa.profilePicLink || FOTO_PADRAO;
      img.alt = '';
      foto.appendChild(img);

      const detalhes = criar('div', 'details');
      const cabecalho = criar('div', 'chatBlockHeader');
      cabecalho.appendChild(criar('h4', '', pessoa.name));
      cabecalho.appendChild(criar('p', 'time', ultima ? GigMensagens.formatarHora(ultima.enviadaEm) : ''));
      const previa = criar('div', 'message');
      previa.appendChild(criar('p', '', ultima ? (ultima.de === eu ? 'Você: ' : '') + ultima.texto : 'Nova conversa'));
      detalhes.append(cabecalho, previa);

      bloco.append(foto, detalhes);
      bloco.addEventListener('click', () => abrirConversa(com));
      lista.appendChild(bloco);
    });
  }

  function renderizarConversa() {
    const area = $('areaMensagens');
    const campo = $('mensagem');
    const enviar = $('enviar');
    const verPerfil = $('verPerfilContato');
    area.replaceChildren();

    const pessoa = contatoAtual && buscarUsuario(contatoAtual);
    // Em telas estreitas a página mostra a lista OU a conversa (ver stylesheet.css)
    document.querySelector('body > .container').classList.toggle('conversa-aberta', Boolean(pessoa));
    if (!pessoa) {
      $('nomeContato').textContent = 'Mensagens';
      $('detalheContato').textContent = '';
      $('fotoContato').src = FOTO_PADRAO;
      verPerfil.classList.add('d-none');
      campo.disabled = true;
      enviar.disabled = true;
      area.appendChild(criar('p', 'text-center text-secondary', 'Escolha uma conversa ao lado ou use o botão "Contate-me" em um perfil.'));
      return;
    }

    $('nomeContato').textContent = pessoa.name;
    $('detalheContato').textContent = `${pessoa.role} · ${pessoa.city}/${pessoa.state}`;
    $('fotoContato').src = pessoa.profilePicLink || FOTO_PADRAO;
    verPerfil.classList.remove('d-none');
    campo.disabled = false;
    enviar.disabled = false;

    const conversa = GigMensagens.conversaEntre(GigMensagens.lerMensagens(localStorage), eu, contatoAtual);
    if (conversa.length === 0) {
      area.appendChild(criar('p', 'text-center text-secondary', 'Nenhuma mensagem ainda. Diga olá!'));
    }
    conversa.forEach((m) => {
      const linha = criar('div', 'messagechat ' + (m.de === eu ? 'myMessage' : 'friendMessage'));
      const balao = criar('p', '', m.texto);
      balao.appendChild(document.createElement('br'));
      balao.appendChild(criar('span', '', GigMensagens.formatarHora(m.enviadaEm)));
      linha.appendChild(balao);
      area.appendChild(linha);
    });
    area.scrollTop = area.scrollHeight;
  }

  function renderizar() {
    renderizarLista();
    renderizarConversa();
  }

  function abrirConversa(username) {
    contatoAtual = username;
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
      alert('Não há espaço no navegador para gravar mais mensagens. Apague dados antigos do site e tente de novo.');
      return;
    }
    campo.value = '';
    renderizar();
  });

  // "Voltar" (só aparece em telas estreitas): fecha a conversa e mostra a lista
  $('voltarLista').addEventListener('click', () => {
    contatoAtual = null;
    history.replaceState(null, '', window.location.pathname);
    renderizar();
  });

  // "Ver perfil" do cabeçalho abre o perfil da pessoa da conversa
  $('verPerfilContato').addEventListener('click', (event) => {
    event.preventDefault();
    const pessoa = buscarUsuario(contatoAtual);
    if (!pessoa) return;
    sessionStorage.setItem('clickedUser', JSON.stringify(GigArmazenamento.usuarioPublico(pessoa)));
    window.location.href = '../Perfil/perfil.html';
  });

  // Mensagem gravada ou perfil editado em outra aba (ex.: outro usuário logado em outra aba) atualiza a tela;
  // contato removido cai no estado vazio (a conversa antiga continua listada pelo username)
  window.addEventListener('storage', (event) => {
    const chaves = [null, GigMensagens.CHAVE_MENSAGENS, GigArmazenamento.CHAVE_USUARIOS];
    if (chaves.includes(event.key)) renderizar();
  });

  renderizar();
})();
