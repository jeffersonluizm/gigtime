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
  const CHAVE_LIDAS = armazenamento.CHAVE_LIDAS;
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
      if (armazenamento.ehErroDeCota(erro)) return false;
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

  // Até quando cada usuário já leu cada conversa: { usuario: { contato: lidaAte } }
  function lerLidas(storage) {
    const lidas = armazenamento.lerJSON(storage, CHAVE_LIDAS);
    return lidas && typeof lidas === 'object' && !Array.isArray(lidas) ? lidas : {};
  }

  // Devolve false se o navegador recusar por falta de espaço
  function marcarComoLida(storage, eu, contato, ate) {
    const lidas = lerLidas(storage);
    const minhas = Object.assign({}, lidas[eu]);
    minhas[contato] = typeof ate === 'number' ? ate : Date.now();
    lidas[eu] = minhas;
    try {
      storage.setItem(CHAVE_LIDAS, JSON.stringify(lidas));
      return true;
    } catch (erro) {
      if (armazenamento.ehErroDeCota(erro)) return false;
      throw erro;
    }
  }

  // Mensagens recebidas por `eu` depois da última leitura, por contato (Map contato -> quantidade)
  function naoLidasPorContato(lista, eu, lidas) {
    const minhas = (lidas && lidas[eu]) || {};
    const contagem = new Map();
    for (const m of lista) {
      if (m.para !== eu || m.enviadaEm <= (minhas[m.de] || 0)) continue;
      contagem.set(m.de, (contagem.get(m.de) || 0) + 1);
    }
    return contagem;
  }

  function naoLidas(lista, eu, lidas) {
    let total = 0;
    for (const n of naoLidasPorContato(lista, eu, lidas).values()) total += n;
    return total;
  }

  const dois = (n) => String(n).padStart(2, '0');

  // "HH:MM" se foi hoje, "DD/MM" se foi em outro dia
  function formatarHora(enviadaEm, agora) {
    const data = new Date(enviadaEm);
    const hoje = new Date(typeof agora === 'number' ? agora : Date.now());
    if (data.toDateString() === hoje.toDateString()) return dois(data.getHours()) + ':' + dois(data.getMinutes());
    return dois(data.getDate()) + '/' + dois(data.getMonth() + 1);
  }

  return { CHAVE_MENSAGENS, CHAVE_LIDAS, LIMITE_TEXTO, lerMensagens, salvarMensagens, enviarMensagem, conversaEntre, listarConversas, lerLidas, marcarComoLida, naoLidas, naoLidasPorContato, formatarHora };
});
