// Mensagens do chat local: ficam no localStorage do navegador (chave "messages").
// Cada mensagem: { id, de, para, texto, enviadaEm } (de/para = username; enviadaEm = milissegundos).
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.GigMensagens = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CHAVE_MENSAGENS = 'messages';

  function lerMensagens(storage) {
    try {
      const lista = JSON.parse(storage.getItem(CHAVE_MENSAGENS));
      return Array.isArray(lista) ? lista : [];
    } catch (e) {
      return [];
    }
  }

  function salvarMensagens(storage, lista) {
    storage.setItem(CHAVE_MENSAGENS, JSON.stringify(lista));
  }

  // Devolve uma lista nova com a mensagem no fim, ou null se a mensagem for inválida
  function enviarMensagem(lista, de, para, texto, agora) {
    const conteudo = typeof texto === 'string' ? texto.trim() : '';
    if (!conteudo || !de || !para || de === para) return null;
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

  return { CHAVE_MENSAGENS, lerMensagens, salvarMensagens, enviarMensagem, conversaEntre, listarConversas, formatarHora };
});
