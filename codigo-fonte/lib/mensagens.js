// Mensagens do chat local: ficam no localStorage do navegador (chave GigArmazenamento.CHAVE_MENSAGENS).
// Cada mensagem: { id, de, para, texto, enviadaEm } (de/para = username; enviadaEm = milissegundos).
// Depende de lib/armazenamento.js, que precisa ser carregado antes na página.
(function (raiz, fabrica) {
  const ehNode = typeof module === 'object' && module.exports;
  const api = fabrica(ehNode ? require('./armazenamento.js') : raiz.GigArmazenamento);
  if (ehNode) module.exports = api;
  else raiz.GigMensagens = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (armazenamento) {
  const CHAVE_MENSAGENS = armazenamento.CHAVE_MENSAGENS; // fonte única da chave
  const LIMITE_TEXTO = 2000; // caracteres por mensagem (o campo da tela tem o mesmo maxlength)

  function lerMensagens(storage) {
    try {
      const lista = JSON.parse(storage.getItem(CHAVE_MENSAGENS));
      return Array.isArray(lista) ? lista : [];
    } catch (e) {
      return [];
    }
  }

  // Devolve false se o navegador recusar por falta de espaço (cota do localStorage)
  function salvarMensagens(storage, lista) {
    try {
      storage.setItem(CHAVE_MENSAGENS, JSON.stringify(lista));
      return true;
    } catch (erro) {
      if (erro && (erro.name === 'QuotaExceededError' || erro.name === 'NS_ERROR_DOM_QUOTA_REACHED')) return false;
      throw erro;
    }
  }

  // Devolve uma lista nova com a mensagem no fim, ou null se a mensagem for inválida
  function enviarMensagem(lista, de, para, texto, agora) {
    const conteudo = typeof texto === 'string' ? texto.trim() : '';
    if (!conteudo || conteudo.length > LIMITE_TEXTO || !de || !para || de === para) return null;
    const enviadaEm = typeof agora === 'number' ? agora : Date.now();
    const id = enviadaEm + '-' + Math.random().toString(36).slice(2, 10);
    return lista.concat([{ id, de, para, texto: conteudo, enviadaEm }]);
  }

  const doPar = (m, a, b) => (m.de === a && m.para === b) || (m.de === b && m.para === a);

  function conversaEntre(lista, a, b) {
    return lista.filter((m) => doPar(m, a, b)).sort((x, y) => x.enviadaEm - y.enviadaEm);
  }

  // Uma entrada por pessoa com quem `eu` conversou: { com, ultima }, mais recente primeiro
  function listarConversas(lista, eu) {
    const porPessoa = new Map();
    for (const m of lista) {
      if (m.de !== eu && m.para !== eu) continue;
      const com = m.de === eu ? m.para : m.de;
      const atual = porPessoa.get(com);
      if (!atual || m.enviadaEm >= atual.enviadaEm) porPessoa.set(com, m);
    }
    return Array.from(porPessoa, ([com, ultima]) => ({ com, ultima }))
      .sort((x, y) => y.ultima.enviadaEm - x.ultima.enviadaEm);
  }

  const dois = (n) => String(n).padStart(2, '0');

  // "HH:MM" se foi hoje, "DD/MM" se foi em outro dia
  function formatarHora(enviadaEm, agora) {
    const data = new Date(enviadaEm);
    const hoje = new Date(typeof agora === 'number' ? agora : Date.now());
    if (data.toDateString() === hoje.toDateString()) return dois(data.getHours()) + ':' + dois(data.getMinutes());
    return dois(data.getDate()) + '/' + dois(data.getMonth() + 1);
  }

  return { CHAVE_MENSAGENS, LIMITE_TEXTO, lerMensagens, salvarMensagens, enviarMensagem, conversaEntre, listarConversas, formatarHora };
});
