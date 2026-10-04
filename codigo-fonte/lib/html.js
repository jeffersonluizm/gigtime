// Escape de HTML para montar templates com dados de usuário (nome, cidade, links...).
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

  return { escaparHTML };
});
