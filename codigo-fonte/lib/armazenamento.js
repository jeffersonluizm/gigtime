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

  // Armazenamento cheio (cota do localStorage): Chrome/Edge/Safari e Firefox usam nomes diferentes
  const ehErroDeCota = (erro) => Boolean(erro) && (erro.name === 'QuotaExceededError' || erro.name === 'NS_ERROR_DOM_QUOTA_REACHED');

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

  // Só é migrado o que tem a forma dos dados do GigTime: no GitHub Pages a origem é dividida com
  // outros repositórios, e dado de app vizinho sob as mesmas chaves não pode ser mesclado nem apagado.
  const ehUsuario = (u) => Boolean(u) && typeof u.username === 'string' && typeof u.role === 'string'
    && Array.isArray(u.genres) && ('passwordHash' in u || 'password' in u);
  const ehMensagem = (m) => Boolean(m) && typeof m.id === 'string' && typeof m.de === 'string'
    && typeof m.para === 'string' && typeof m.texto === 'string' && typeof m.enviadaEm === 'number';

  // Move os itens válidos de origem[antiga] para destino[nova], mesclando pelo identificador
  // (o que já está no destino vence). Itens inválidos ficam na chave antiga; ela só é apagada
  // quando não sobra nada. Devolve true se havia algo válido para mover.
  function moverItens(origem, antiga, destino, nova, valido, identificador) {
    const antigos = lerJSON(origem, antiga);
    if (!Array.isArray(antigos)) return false;
    const validos = antigos.filter(valido);
    if (validos.length === 0) return false;
    const atuais = lerJSON(destino, nova);
    const lista = Array.isArray(atuais) ? atuais : [];
    const existentes = new Set(lista.map((item) => item && item[identificador]));
    destino.setItem(nova, JSON.stringify(lista.concat(validos.filter((item) => !existentes.has(item[identificador])))));
    const restantes = antigos.filter((item) => !valido(item));
    if (restantes.length > 0) origem.setItem(antiga, JSON.stringify(restantes));
    else origem.removeItem(antiga);
    return true;
  }

  // A versão anterior do site guardava os usuários no sessionStorage["users"].
  // Leva esses usuários para o localStorage (mesclando por username, o local vence).
  function migrarDaSessao(local, sessao) {
    return moverItens(sessao, CHAVE_SESSAO_ANTIGA, local, CHAVE_USUARIOS, ehUsuario, 'username');
  }

  // Chaves sem prefixo usadas antes no localStorage ("users" e "messages")
  // Devolve true se migrou alguma coisa; rodar de novo não muda nada
  function migrarChavesAntigas(local) {
    const usuarios = moverItens(local, 'users', local, CHAVE_USUARIOS, ehUsuario, 'username');
    const mensagens = moverItens(local, 'messages', local, CHAVE_MENSAGENS, ehMensagem, 'id');
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

  return { CHAVE_USUARIOS, CHAVE_MENSAGENS, ehErroDeCota, lerJSON, lerUsuarios, salvarUsuarios, substituirUsuario, migrarDaSessao, migrarChavesAntigas, semearSeVazio, usuarioPublico };
});
