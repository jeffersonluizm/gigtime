// Sessão do usuário (sessionStorage, uma por aba): quem está logado e qual perfil foi escolhido.
// Atenção: é uma sessão de DEMONSTRAÇÃO. Sem servidor, qualquer pessoa com o DevTools pode gravar
// outro usuário aqui; por isso toda gravação sensível (perfil, senha, conta) pede a senha de novo.
// Depende de lib/constantes.js e lib/armazenamento.js.
(function (raiz, fabrica) {
  const ehNode = typeof module === 'object' && module.exports;
  const api = ehNode
    ? fabrica(require('./constantes.js'), require('./armazenamento.js'))
    : fabrica(raiz.GigConstantes, raiz.GigArmazenamento);
  if (ehNode) module.exports = api;
  else raiz.GigSessao = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (constantes, armazenamento) {
  const { LOGADO, ESCOLHIDO, PAPEL, DESTINO } = constantes.CHAVES_SESSAO;

  const comUsername = (valor) => (valor && typeof valor.username === 'string' ? valor : null);

  function usuarioLogado(sessao) {
    return comUsername(armazenamento.lerJSON(sessao, LOGADO));
  }

  function entrar(sessao, usuario) {
    sessao.setItem(LOGADO, JSON.stringify(armazenamento.usuarioPublico(usuario)));
  }

  function sair(sessao) {
    [LOGADO, ESCOLHIDO, PAPEL].forEach((chave) => sessao.removeItem(chave));
  }

  function perfilEscolhido(sessao) {
    return comUsername(armazenamento.lerJSON(sessao, ESCOLHIDO));
  }

  function escolherPerfil(sessao, usuario) {
    sessao.setItem(ESCOLHIDO, JSON.stringify(armazenamento.usuarioPublico(usuario)));
  }

  // Página que só funciona logada: sem sessão, guarda a volta e manda para o login
  function exigirLogin(sessao, destino, navegar) {
    const logado = usuarioLogado(sessao);
    if (logado) return logado;
    sessao.setItem(DESTINO, destino);
    navegar('../Login/login.html');
    return null;
  }

  // Página para onde o login deve voltar (gravada por quem exigiu login). Lê uma vez só e
  // aceita apenas caminhos relativos do próprio site, como "../Chat/chat.html?com=ana".
  const DESTINO_VALIDO = /^\.\.\/[A-Za-zÀ-ÿ]+\/[A-Za-z]+\.html(\?[A-Za-z0-9_=%.&-]*)?$/;

  // encodeURIComponent deixa ' ( ) * ! ~ sem codificar; aqui eles também viram %XX,
  // para o valor caber na lista de caracteres aceitos em DESTINO_VALIDO
  function codificarParametro(valor) {
    return encodeURIComponent(String(valor)).replace(/[!'()*~]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  }

  function destinoDepoisDoLogin(sessao) {
    const destino = sessao.getItem(DESTINO);
    sessao.removeItem(DESTINO);
    return destino && DESTINO_VALIDO.test(destino) ? destino : null;
  }

  return { usuarioLogado, entrar, sair, perfilEscolhido, escolherPerfil, exigirLogin, destinoDepoisDoLogin, codificarParametro };
});
