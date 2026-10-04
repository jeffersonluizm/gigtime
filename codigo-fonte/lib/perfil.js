// Regras do perfil: botão de ação da página de perfil e edição do usuário logado no modelo `users`.
// Os campos editáveis são os mesmos do cadastro (mais o banner); username, nota, selos e fotos
// de destaque não mudam aqui. Depende de lib/senha.js (GigSenha) para trocar a senha.
(function (raiz, fabrica) {
  const ehNode = typeof module === 'object' && module.exports;
  const api = fabrica(() => (ehNode ? require('./senha.js') : raiz.GigSenha));
  if (ehNode) module.exports = api;
  else raiz.GigPerfil = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (senha) {
  const FOTO_PADRAO = '../userImages/defaultUser.jpg';
  const BANNER_PADRAO = 'https://picsum.photos/2000/1000?x=1';
  const OBRIGATORIOS = {
    name: 'Por favor, insira um nome.',
    email: 'Por favor, insira um e-mail válido.',
    phone: 'Por favor, insira um telefone válido.',
    role: 'Por favor, selecione seu perfil.',
    state: 'Por favor, selecione seu estado.',
    city: 'Por favor, insira uma cidade.',
  };

  // O que o botão da página de perfil faz: editar o próprio perfil ou contatar a pessoa
  function acaoDoPerfil(exibido, logado) {
    if (logado && exibido && logado.username === exibido.username) {
      return { tipo: 'editar', texto: 'Editar perfil', href: '../EdicaoPerfil/EdicaoPerfil.html' };
    }
    const com = exibido ? '?com=' + encodeURIComponent(exibido.username) : '';
    return { tipo: 'contato', texto: 'Contate-me', href: '../Chat/chat.html' + com };
  }

  const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');

  function validarDadosPerfil(dados, usuarios, username) {
    const erros = [];
    for (const [campo, mensagem] of Object.entries(OBRIGATORIOS)) {
      if (!texto(dados[campo])) erros.push({ campo, mensagem });
    }
    if (!Array.isArray(dados.genres) || dados.genres.length === 0) {
      erros.push({ campo: 'genres', mensagem: 'Selecione pelo menos um gênero musical.' });
    }
    const outros = usuarios.filter((u) => u.username !== username);
    if (texto(dados.email) && outros.some((u) => u.email === texto(dados.email))) {
      erros.push({ campo: 'email', mensagem: 'Este e-mail já está em uso.' });
    }
    if (texto(dados.phone) && outros.some((u) => u.phone === texto(dados.phone))) {
      erros.push({ campo: 'phone', mensagem: 'Este telefone já está em uso.' });
    }
    return erros;
  }

  // Devolve { ok: true, usuarios, usuario } com uma lista nova, ou { ok: false, erros }.
  // `senhas` = { atual, nova, confirmacao }; só troca a senha se `nova` ou `confirmacao` vierem preenchidas.
  async function atualizarPerfil(usuarios, username, dados, senhas) {
    const indice = usuarios.findIndex((u) => u.username === username);
    if (indice < 0) return { ok: false, erros: [{ campo: 'username', mensagem: 'Usuário não encontrado.' }] };

    const erros = validarDadosPerfil(dados, usuarios, username);
    const { atual = '', nova = '', confirmacao = '' } = senhas || {};
    const trocarSenha = Boolean(nova || confirmacao);
    if (trocarSenha) {
      if (!(await senha().autenticar(usuarios, username, atual))) {
        erros.push({ campo: 'senhaAtual', mensagem: 'Senha atual incorreta.' });
      } else if (!nova || nova !== confirmacao) {
        erros.push({ campo: 'confirmacao', mensagem: 'As senhas não coincidem.' });
      }
    }
    if (erros.length > 0) return { ok: false, erros };

    const usuario = Object.assign({}, usuarios[indice], {
      name: texto(dados.name),
      email: texto(dados.email),
      phone: texto(dados.phone),
      role: dados.role,
      state: dados.state,
      city: texto(dados.city),
      genres: dados.genres.slice(),
      profilePicLink: texto(dados.profilePicLink) || FOTO_PADRAO,
      bannerPicLink: texto(dados.bannerPicLink) || BANNER_PADRAO,
      songLink: texto(dados.songLink),
    });
    if (trocarSenha) {
      usuario.passwordHash = await senha().hashSenha(username, nova);
      delete usuario.password;
    }
    const novos = usuarios.slice();
    novos[indice] = usuario;
    return { ok: true, usuarios: novos, usuario };
  }

  return { FOTO_PADRAO, BANNER_PADRAO, acaoDoPerfil, validarDadosPerfil, atualizarPerfil };
});
