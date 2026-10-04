// Filtros dos anúncios (RF-02): papel, estado, avaliação mínima e gêneros musicais.
// Os critérios se combinam com E; dentro de gêneros vale OU (basta ter um dos marcados).
// Critério vazio (null, '', 0 ou lista vazia) não filtra.
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.GigFiltros = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function correspondeFiltro(usuario, filtro) {
    const { papel, estado, avaliacaoMinima, generos } = filtro || {};
    if (papel && usuario.role !== papel) return false;
    if (estado && usuario.state !== estado) return false;
    if (avaliacaoMinima && !((Number(usuario.rating) || 0) >= avaliacaoMinima)) return false;
    if (generos && generos.length > 0) {
      const doUsuario = Array.isArray(usuario.genres) ? usuario.genres : [];
      if (!generos.some((g) => doUsuario.includes(g))) return false;
    }
    return true;
  }

  return { correspondeFiltro };
});
