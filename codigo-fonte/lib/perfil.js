// Regras do perfil: cadastro, edição, troca de senha e o botão de ação da página de perfil.
// Username, nota, selos e fotos de destaque não mudam na edição. Toda gravação de perfil exige a senha
// atual (a sessão fica no sessionStorage e pode ser forjada no DevTools; a senha é a única prova local).
// Depende de lib/constantes.js, lib/senha.js (GigSenha) e lib/validacao.js (GigValidacao).
(function (raiz, fabrica) {
  const ehNode = typeof module === 'object' && module.exports;
  const api = fabrica(
    () => (ehNode ? require('./senha.js') : raiz.GigSenha),
    () => (ehNode ? require('./validacao.js') : raiz.GigValidacao),
    ehNode ? require('./constantes.js') : raiz.GigConstantes,
  );
  if (ehNode) module.exports = api;
  else raiz.GigPerfil = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (senha, validacao, constantes) {
  const { FOTO_PADRAO, BANNER_PADRAO } = constantes;
  const LIMITE_BIO = 280;
  const LIMITE_DISPONIBILIDADE = 80;
  const OBRIGATORIOS = {
    name: 'Informe seu nome.',
    email: 'Informe um e-mail.',
    phone: 'Informe um telefone.',
    role: 'Escolha se você é músico ou contratante.',
    state: 'Escolha o estado.',
    city: 'Informe a cidade.',
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
    const v = validacao();
    const erros = [];
    const erro = (campo, mensagem) => erros.push({ campo, mensagem });
    for (const [campo, mensagem] of Object.entries(OBRIGATORIOS)) {
      if (!texto(dados[campo])) erro(campo, mensagem);
    }
    if (!Array.isArray(dados.genres) || dados.genres.length === 0) erro('genres', 'Selecione pelo menos um gênero musical.');

    const email = texto(dados.email);
    const phone = texto(dados.phone);
    // Unicidade sem diferenciar maiúsculas (Ana@Ex.com e ana@ex.com são o mesmo e-mail)
    const igual = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();
    const outros = usuarios.filter((u) => u.username !== username);
    if (email && !v.emailValido(email)) erro('email', 'Informe um e-mail válido, como nome@exemplo.com.');
    else if (email && outros.some((u) => igual(u.email, email))) erro('email', 'Este e-mail já está em uso.');
    if (phone && !v.telefoneValido(phone)) erro('phone', 'Informe o telefone com DDD, como (31) 91234-5678.');
    else if (phone && outros.some((u) => u.phone === phone)) erro('phone', 'Este telefone já está em uso.');

    if (v.urlImagem(dados.profilePicLink) === null) erro('profilePicLink', 'Use um link de imagem que comece com https://.');
    if (v.urlImagem(dados.bannerPicLink) === null) erro('bannerPicLink', 'Use um link de imagem que comece com https://.');
    if (texto(dados.songLink) && !v.idYoutube(dados.songLink)) erro('songLink', 'Cole um link do YouTube (youtu.be/... ou youtube.com/watch?v=...).');
    if (texto(dados.bio).length > LIMITE_BIO) erro('bio', `A apresentação pode ter até ${LIMITE_BIO} caracteres.`);
    if (texto(dados.disponibilidade).length > LIMITE_DISPONIBILIDADE) erro('disponibilidade', `A disponibilidade pode ter até ${LIMITE_DISPONIBILIDADE} caracteres.`);
    return erros;
  }

  // Campos editáveis já normalizados (links validados, vídeo guardado pelo ID)
  function camposEditaveis(dados) {
    const v = validacao();
    const id = v.idYoutube(dados.songLink);
    return {
      name: texto(dados.name),
      email: texto(dados.email),
      phone: texto(dados.phone),
      role: dados.role,
      state: dados.state,
      city: texto(dados.city),
      genres: dados.genres.slice(),
      bio: texto(dados.bio),
      disponibilidade: texto(dados.disponibilidade),
      profilePicLink: v.urlImagem(dados.profilePicLink) || FOTO_PADRAO,
      bannerPicLink: v.urlImagem(dados.bannerPicLink) || BANNER_PADRAO,
      songLink: id ? 'https://youtu.be/' + id : '',
    };
  }

  async function senhaConfere(usuarios, username, senhaAtual) {
    return Boolean(senhaAtual) && Boolean(await senha().autenticar(usuarios, username, senhaAtual));
  }

  // Devolve { ok: true, usuarios, usuario } com uma lista nova, ou { ok: false, erros }
  async function atualizarPerfil(usuarios, username, dados, senhaAtual) {
    const indice = usuarios.findIndex((u) => u.username === username);
    if (indice < 0) return { ok: false, erros: [{ campo: 'username', mensagem: 'Usuário não encontrado.' }] };
    const erros = validarDadosPerfil(dados, usuarios, username);
    if (!(await senhaConfere(usuarios, username, senhaAtual))) {
      erros.push({ campo: 'senhaAtual', mensagem: 'Confirme com a sua senha atual para salvar.' });
    }
    if (erros.length > 0) return { ok: false, erros };

    const usuario = Object.assign({}, usuarios[indice], camposEditaveis(dados));
    const novos = usuarios.slice();
    novos[indice] = usuario;
    return { ok: true, usuarios: novos, usuario };
  }

  // `senhas` = { atual, nova, confirmacao }; `opcoes` vai para o PBKDF2 (testes usam menos iterações)
  async function trocarSenha(usuarios, username, senhas, opcoes) {
    const indice = usuarios.findIndex((u) => u.username === username);
    if (indice < 0) return { ok: false, erros: [{ campo: 'username', mensagem: 'Usuário não encontrado.' }] };
    const { atual = '', nova = '', confirmacao = '' } = senhas || {};
    const erros = [];
    if (!(await senhaConfere(usuarios, username, atual))) {
      erros.push({ campo: 'senhaAtual', mensagem: 'Senha atual incorreta.' });
    } else {
      const fraca = validacao().erroSenha(nova, username);
      if (fraca) erros.push({ campo: 'novaSenha', mensagem: fraca });
      else if (nova !== confirmacao) erros.push({ campo: 'confirmacao', mensagem: 'As senhas não coincidem.' });
    }
    if (erros.length > 0) return { ok: false, erros };

    const usuario = Object.assign({}, usuarios[indice], { passwordHash: await senha().gerarHash(nova, opcoes) });
    delete usuario.password;
    const novos = usuarios.slice();
    novos[indice] = usuario;
    return { ok: true, usuarios: novos, usuario };
  }

  // Cadastro: dados do perfil + username + senha/confirmação
  function validarCadastro(dados, usuarios) {
    const v = validacao();
    const username = typeof dados.username === 'string' ? dados.username.trim() : '';
    const erros = [];
    if (!v.usernameValido(username)) {
      erros.push({ campo: 'username', mensagem: 'Use de 3 a 30 letras, números, ponto, hífen ou sublinhado, sem espaços.' });
    } else if (usuarios.some((u) => String(u.username).toLowerCase() === username.toLowerCase())) {
      erros.push({ campo: 'username', mensagem: 'Este nome de usuário já existe.' });
    }
    erros.push(...validarDadosPerfil(dados, usuarios, username));
    const fraca = v.erroSenha(dados.senha, username);
    if (fraca) erros.push({ campo: 'senha', mensagem: fraca });
    else if (dados.senha !== dados.confirmacao) erros.push({ campo: 'confirmacao', mensagem: 'As senhas não coincidem.' });
    return erros;
  }

  function criarUsuario(dados, passwordHash) {
    return Object.assign({ username: dados.username.trim() }, camposEditaveis(dados), {
      rating: 0,
      badges: ['Novato'],
      userPicsLinks: [],
      passwordHash,
    });
  }

  return { FOTO_PADRAO, BANNER_PADRAO, LIMITE_BIO, LIMITE_DISPONIBILIDADE, acaoDoPerfil, validarDadosPerfil, atualizarPerfil, trocarSenha, validarCadastro, criarUsuario };
});
