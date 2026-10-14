// Mensagens do chat local, no localStorage do navegador. Cada mensagem: { id, de, para, texto, enviadaEm }
// (de/para = username; enviadaEm = milissegundos). Mensagens novas vão para a chave do autor
// (gigtime:messages:<usuário>): duas abas de pessoas diferentes nunca gravam a mesma chave, então uma não
// apaga a mensagem da outra (ver docs/carga, H10). A lista única antiga (CHAVE_MENSAGENS) continua lida.
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

  const PREFIXO_AUTOR = CHAVE_MENSAGENS + ':';
  const chaveDoAutor = (username) => PREFIXO_AUTOR + username;
  // null = storage.clear() (evento "storage" sem chave)
  const ehChaveDeMensagens = (chave) => chave === null || chave === CHAVE_MENSAGENS || String(chave).startsWith(PREFIXO_AUTOR);

  function lerLista(storage, chave) {
    try {
      const lista = JSON.parse(storage.getItem(chave));
      return Array.isArray(lista) ? lista : [];
    } catch (e) {
      return [];
    }
  }

  // Todas as chaves de mensagens: a lista antiga e as dos autores
  function chavesDeMensagens(storage) {
    const chaves = [CHAVE_MENSAGENS];
    for (let i = 0; i < storage.length; i++) {
      const chave = storage.key(i);
      if (chave && chave.startsWith(PREFIXO_AUTOR)) chaves.push(chave);
    }
    return chaves;
  }

  function lerMensagens(storage) {
    if (typeof storage.key !== 'function') return lerLista(storage, CHAVE_MENSAGENS);
    const vistas = new Set();
    const todas = [];
    for (const chave of chavesDeMensagens(storage)) {
      for (const m of lerLista(storage, chave)) {
        if (!m || vistas.has(m.id)) continue;
        vistas.add(m.id);
        todas.push(m);
      }
    }
    return todas;
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

  // Envio: acrescenta a mensagem na chave do autor e grava só essa chave.
  // Devolve 'gravada', 'invalida' ou 'sem-espaco'.
  async function adicionarMensagem(storage, de, para, texto, agora) {
    const chave = chaveDoAutor(de);
    const nova = enviarMensagem(lerLista(storage, chave), de, para, texto, agora);
    if (!nova) return 'invalida';
    try {
      storage.setItem(chave, JSON.stringify(nova));
      return 'gravada';
    } catch (erro) {
      if (armazenamento.ehErroDeCota(erro)) return 'sem-espaco';
      throw erro;
    }
  }

  // Grava as conversas de exemplo ({ de, para, texto, minutosAtras }) nas chaves dos autores.
  // Devolve quantas mensagens foram gravadas.
  function semearConversas(storage, conversas, agora) {
    const base = typeof agora === 'number' ? agora : Date.now();
    const porAutor = new Map();
    conversas.forEach((c, i) => {
      const enviadaEm = base - c.minutosAtras * 60000;
      const lista = porAutor.get(c.de) || [];
      lista.push({ id: `${enviadaEm}-demo${i}`, de: c.de, para: c.para, texto: c.texto, enviadaEm });
      porAutor.set(c.de, lista);
    });
    for (const [autor, lista] of porAutor) storage.setItem(chaveDoAutor(autor), JSON.stringify(lista));
    return conversas.length;
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

  return { CHAVE_MENSAGENS, CHAVE_LIDAS, LIMITE_TEXTO, semearConversas, chaveDoAutor, ehChaveDeMensagens, chavesDeMensagens, lerMensagens, salvarMensagens, enviarMensagem, adicionarMensagem, conversaEntre, listarConversas, lerLidas, marcarComoLida, naoLidas, naoLidasPorContato, formatarHora };
});
