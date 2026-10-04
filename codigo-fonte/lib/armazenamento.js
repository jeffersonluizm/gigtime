// Persistência dos dados do GigTime no navegador.
// Usuários e mensagens ficam no localStorage (sobrevivem ao fechar a aba);
// o usuário logado continua no sessionStorage (uma sessão por aba).
// Funciona como script clássico (window.GigArmazenamento) e como módulo no Node (testes).
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.GigArmazenamento = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Prefixo "gigtime:" porque, no GitHub Pages, o site divide a origem (e o localStorage)
  // com outros repositórios do mesmo usuário
  const CHAVE_USUARIOS = 'gigtime:users';
  const CHAVE_MENSAGENS = 'gigtime:messages';
  const CHAVE_SESSAO_ANTIGA = 'users'; // versão publicada antes: usuários no sessionStorage

  function lerJSON(storage, chave) {
    const bruto = storage.getItem(chave);
    if (bruto === null) return null;
    try {
      return JSON.parse(bruto);
    } catch (e) {
      return null;
    }
  }

  function lerUsuarios(storage) {
    const lista = lerJSON(storage, CHAVE_USUARIOS);
    return Array.isArray(lista) ? lista : [];
  }

  function salvarUsuarios(storage, lista) {
    storage.setItem(CHAVE_USUARIOS, JSON.stringify(lista));
  }

  // Troca um usuário (pelo username) relendo a lista do storage na hora de gravar,
  // para não desfazer o que outra aba gravou enquanto esta página esperava (ex.: hash da senha)
  function substituirUsuario(storage, usuario) {
    const atuais = lerUsuarios(storage);
    const indice = atuais.findIndex((u) => u.username === usuario.username);
    if (indice < 0) return false;
    atuais[indice] = usuario;
    salvarUsuarios(storage, atuais);
    return true;
  }

  // A versão anterior do site guardava os usuários no sessionStorage.
  // Leva esses usuários para o localStorage (mesclando por username, o local vence)
  // e apaga a cópia antiga. Devolve true se havia algo para migrar.
  function migrarDaSessao(local, sessao) {
    const antigos = lerJSON(sessao, CHAVE_SESSAO_ANTIGA);
    if (!Array.isArray(antigos)) return false;
    const atuais = lerUsuarios(local);
    const existentes = new Set(atuais.map((u) => u.username));
    const novos = antigos.filter((u) => u && !existentes.has(u.username));
    salvarUsuarios(local, atuais.concat(novos));
    sessao.removeItem(CHAVE_SESSAO_ANTIGA);
    return true;
  }

  // Chaves sem prefixo usadas antes ("users" e "messages"). Só migra o que tem a forma dos dados
  // do GigTime; dado de outro site na mesma origem fica intocado.
  const ehUsuario = (u) => Boolean(u) && typeof u.username === 'string' && typeof u.role === 'string'
    && Array.isArray(u.genres) && ('passwordHash' in u || 'password' in u);
  const ehMensagem = (m) => Boolean(m) && typeof m.id === 'string' && typeof m.de === 'string'
    && typeof m.para === 'string' && typeof m.texto === 'string' && typeof m.enviadaEm === 'number';

  function migrarChave(storage, antiga, nova, valido, identificador) {
    const antigos = lerJSON(storage, antiga);
    if (!Array.isArray(antigos) || antigos.length === 0 || !antigos.every(valido)) return false;
    const atuais = lerJSON(storage, nova);
    const lista = Array.isArray(atuais) ? atuais : [];
    const existentes = new Set(lista.map((item) => item && item[identificador]));
    const novos = antigos.filter((item) => !existentes.has(item[identificador]));
    storage.setItem(nova, JSON.stringify(lista.concat(novos)));
    storage.removeItem(antiga);
    return true;
  }

  // Devolve true se migrou alguma coisa; rodar de novo não muda nada
  function migrarChavesAntigas(local) {
    const usuarios = migrarChave(local, 'users', CHAVE_USUARIOS, ehUsuario, 'username');
    const mensagens = migrarChave(local, 'messages', CHAVE_MENSAGENS, ehMensagem, 'id');
    return usuarios || mensagens;
  }

  function semearSeVazio(storage, seed) {
    if (lerUsuarios(storage).length > 0) return false;
    salvarUsuarios(storage, seed);
    return true;
  }

  // Cópia do usuário sem senha nem hash, para guardar em loggedInUser/clickedUser
  function usuarioPublico(usuario) {
    const copia = Object.assign({}, usuario);
    delete copia.password;
    delete copia.passwordHash;
    return copia;
  }

  // Página para onde o login deve voltar (gravada por quem exigiu login). Lê uma vez só e
  // aceita apenas caminhos relativos do próprio site, como "../Chat/chat.html?com=ana".
  const CHAVE_DESTINO = 'depoisDoLogin';
  const DESTINO_VALIDO = /^\.\.\/[A-Za-zÀ-ÿ]+\/[A-Za-z]+\.html(\?[A-Za-z0-9_=%.&-]*)?$/;

  // encodeURIComponent deixa ' ( ) * ! ~ sem codificar; aqui eles também viram %XX,
  // para o valor caber na lista de caracteres aceitos em DESTINO_VALIDO
  function codificarParametro(valor) {
    return encodeURIComponent(String(valor)).replace(/[!'()*~]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  }

  function destinoDepoisDoLogin(sessao) {
    const destino = sessao.getItem(CHAVE_DESTINO);
    sessao.removeItem(CHAVE_DESTINO);
    return destino && DESTINO_VALIDO.test(destino) ? destino : null;
  }

  return { CHAVE_USUARIOS, CHAVE_MENSAGENS, CHAVE_DESTINO, lerJSON, lerUsuarios, salvarUsuarios, substituirUsuario, migrarDaSessao, migrarChavesAntigas, semearSeVazio, usuarioPublico, destinoDepoisDoLogin, codificarParametro };
});
