// Persistência dos dados do GigTime no navegador.
// Usuários e mensagens ficam no localStorage (sobrevivem ao fechar a aba);
// o usuário logado continua no sessionStorage (uma sessão por aba).
// Funciona como script clássico (window.GigArmazenamento) e como módulo no Node (testes).
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.GigArmazenamento = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CHAVE_USUARIOS = 'users';

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

  // A versão anterior do site guardava os usuários no sessionStorage.
  // Leva esses usuários para o localStorage (mesclando por username, o local vence)
  // e apaga a cópia antiga. Devolve true se havia algo para migrar.
  function migrarDaSessao(local, sessao) {
    const antigos = lerJSON(sessao, CHAVE_USUARIOS);
    if (!Array.isArray(antigos)) return false;
    const atuais = lerUsuarios(local);
    const existentes = new Set(atuais.map((u) => u.username));
    const novos = antigos.filter((u) => u && !existentes.has(u.username));
    salvarUsuarios(local, atuais.concat(novos));
    sessao.removeItem(CHAVE_USUARIOS);
    return true;
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

  return { CHAVE_USUARIOS, lerJSON, lerUsuarios, salvarUsuarios, migrarDaSessao, semearSeVazio, usuarioPublico };
});
