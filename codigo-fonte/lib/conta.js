// Dados da conta no navegador: exportar (portabilidade), apagar a conta, restaurar a demonstração
// e medir quanto do localStorage o GigTime ocupa. Só mexe nas chaves gigtime:*, nunca em outros apps
// que dividam a mesma origem (GitHub Pages).
// Depende de lib/armazenamento.js.
(function (raiz, fabrica) {
  const ehNode = typeof module === 'object' && module.exports;
  const api = fabrica(ehNode ? require('./armazenamento.js') : raiz.GigArmazenamento);
  if (ehNode) module.exports = api;
  else raiz.GigConta = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (armazenamento) {
  const { CHAVE_USUARIOS, CHAVE_MENSAGENS, CHAVE_LIDAS } = armazenamento;
  const CHAVES = [CHAVE_USUARIOS, CHAVE_MENSAGENS, CHAVE_LIDAS];
  // Cota típica do localStorage por origem (Chrome, Edge, Firefox): 5 Mi unidades UTF-16
  const COTA_ESTIMADA = 5 * 1024 * 1024;

  const lista = (storage, chave) => {
    const valor = armazenamento.lerJSON(storage, chave);
    return Array.isArray(valor) ? valor : [];
  };
  const daPessoa = (m, username) => m && (m.de === username || m.para === username);

  function exportarDados(storage, username, agora) {
    const usuario = lista(storage, CHAVE_USUARIOS).find((u) => u.username === username);
    return {
      aviso: 'Dados do GigTime guardados neste navegador. A senha não é exportada (nem o hash).',
      exportadoEm: new Date(typeof agora === 'number' ? agora : Date.now()).toISOString(),
      perfil: usuario ? armazenamento.usuarioPublico(usuario) : null,
      mensagens: lista(storage, CHAVE_MENSAGENS).filter((m) => daPessoa(m, username)),
    };
  }

  // Devolve false se a conta não existe
  function apagarConta(storage, username) {
    const usuarios = lista(storage, CHAVE_USUARIOS);
    if (!usuarios.some((u) => u.username === username)) return false;
    storage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios.filter((u) => u.username !== username)));
    storage.setItem(CHAVE_MENSAGENS, JSON.stringify(lista(storage, CHAVE_MENSAGENS).filter((m) => !daPessoa(m, username))));
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

  function restaurarDemo(storage, seed) {
    storage.removeItem(CHAVE_MENSAGENS);
    storage.removeItem(CHAVE_LIDAS);
    storage.setItem(CHAVE_USUARIOS, JSON.stringify(seed));
  }

  function usoDoArmazenamento(storage) {
    let caracteres = 0;
    for (const chave of CHAVES) {
      const valor = storage.getItem(chave);
      if (valor !== null) caracteres += chave.length + valor.length;
    }
    return { caracteres, cotaEstimada: COTA_ESTIMADA, percentual: caracteres / COTA_ESTIMADA };
  }

  return { COTA_ESTIMADA, exportarDados, apagarConta, restaurarDemo, usoDoArmazenamento };
});
