// Dados da conta no navegador: exportar (portabilidade), apagar a conta, restaurar a demonstração
// e medir quanto do localStorage o GigTime ocupa. Só mexe nas chaves gigtime:*, nunca em outros apps
// que dividam a mesma origem (GitHub Pages).
// Depende de lib/armazenamento.js e lib/mensagens.js (que sabe em quais chaves ficam as mensagens).
(function (raiz, fabrica) {
  const ehNode = typeof module === 'object' && module.exports;
  const api = ehNode
    ? fabrica(require('./armazenamento.js'), require('./mensagens.js'))
    : fabrica(raiz.GigArmazenamento, raiz.GigMensagens);
  if (ehNode) module.exports = api;
  else raiz.GigConta = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (armazenamento, mensagens) {
  const { CHAVE_USUARIOS, CHAVE_LIDAS } = armazenamento;
  const chavesDoGigTime = (storage) => [CHAVE_USUARIOS, CHAVE_LIDAS, ...mensagens.chavesDeMensagens(storage)];
  // Cota típica do localStorage por origem (Chrome, Edge, Firefox): 5 Mi unidades UTF-16
  const COTA_ESTIMADA = 5 * 1024 * 1024;

  const lista = (storage, chave) => armazenamento.lerLista(storage, chave);
  const daPessoa = (m, username) => m && (m.de === username || m.para === username);

  function exportarDados(storage, username, agora) {
    const usuario = lista(storage, CHAVE_USUARIOS).find((u) => u.username === username);
    return {
      aviso: 'Dados do GigTime guardados neste navegador. A senha não é exportada (nem o hash).',
      exportadoEm: new Date(typeof agora === 'number' ? agora : Date.now()).toISOString(),
      perfil: usuario ? armazenamento.usuarioPublico(usuario) : null,
      mensagens: mensagens.lerMensagens(storage).filter((m) => daPessoa(m, username)),
    };
  }

  // Devolve false se a conta não existe
  function apagarConta(storage, username) {
    const usuarios = lista(storage, CHAVE_USUARIOS);
    if (!usuarios.some((u) => u.username === username)) return false;
    storage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios.filter((u) => u.username !== username)));
    // A chave do próprio autor some; nas outras listas saem as mensagens trocadas com ele
    for (const chave of mensagens.chavesDeMensagens(storage)) {
      if (chave === mensagens.chaveDoAutor(username)) storage.removeItem(chave);
      else if (storage.getItem(chave) !== null) storage.setItem(chave, JSON.stringify(lista(storage, chave).filter((m) => !daPessoa(m, username))));
    }
    const lidas = armazenamento.lerJSON(storage, CHAVE_LIDAS);
    if (lidas && typeof lidas === 'object') {
      delete lidas[username];
      for (const leitor of Object.keys(lidas)) {
        if (lidas[leitor] && typeof lidas[leitor] === 'object') delete lidas[leitor][username];
      }
      storage.setItem(CHAVE_LIDAS, JSON.stringify(lidas));
    }
    return true;
  }

  // `conversas` (opcional): as conversas de demonstração de dados/demo.js
  function restaurarDemo(storage, seed, conversas) {
    mensagens.chavesDeMensagens(storage).forEach((chave) => storage.removeItem(chave));
    storage.removeItem(CHAVE_LIDAS);
    storage.setItem(CHAVE_USUARIOS, JSON.stringify(seed));
    if (Array.isArray(conversas)) mensagens.semearConversas(storage, conversas);
  }

  function usoDoArmazenamento(storage) {
    let caracteres = 0;
    for (const chave of chavesDoGigTime(storage)) {
      const valor = storage.getItem(chave);
      if (valor !== null) caracteres += chave.length + valor.length;
    }
    return { caracteres, cotaEstimada: COTA_ESTIMADA, percentual: caracteres / COTA_ESTIMADA };
  }

  return { COTA_ESTIMADA, exportarDados, apagarConta, restaurarDemo, usoDoArmazenamento };
});
