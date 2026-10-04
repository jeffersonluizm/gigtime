// Escape de HTML para montar templates com dados de usuário (nome, cidade, links...) e o ícone do sprite.
// Todo dado vindo do storage passa por escaparHTML antes de entrar em innerHTML/insertAdjacentHTML,
// inclusive dentro de atributos entre aspas (id="...", src="...").
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.GigHTML = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const TROCAS = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function escaparHTML(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor).replace(/[&<>"']/g, (c) => TROCAS[c]);
  }

  // Ícone do sprite próprio (assets/icones.svg), sempre decorativo: o texto ao lado é que dá o sentido
  function icone(nome) {
    if (!/^[a-z0-9-]+$/.test(nome)) throw new Error('ícone inválido: ' + nome);
    return `<svg class="icone" aria-hidden="true" focusable="false"><use href="../assets/icones.svg#${nome}"></use></svg>`;
  }

  return { escaparHTML, icone };
});
