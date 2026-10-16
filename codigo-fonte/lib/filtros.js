// Filtros de Explorar (RF-02): papel, estado, avaliação mínima, gêneros e busca por texto.
// Os critérios se combinam com E; dentro de gêneros vale OU (basta ter um dos marcados).
// Critério vazio (null, '', 0 ou lista vazia) não filtra. O filtro também vai e volta pelo endereço
// (?papel=...&uf=...&nota=...&genero=...&q=...), para a busca poder ser compartilhada.
// Depende de lib/constantes.js.
(function (raiz, fabrica) {
  const ehNode = typeof module === 'object' && module.exports;
  const api = fabrica(ehNode ? require('./constantes.js') : raiz.GigConstantes);
  if (ehNode) module.exports = api;
  else raiz.GigFiltros = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (constantes) {
  // "São Paulo" -> "sao paulo": compara sem acento e sem diferenciar maiúscula
  const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  function correspondeFiltro(usuario, filtro) {
    const { papel, estado, avaliacaoMinima, generos, texto } = filtro || {};
    if (papel && usuario.role !== papel) return false;
    if (estado && usuario.state !== estado) return false;
    if (avaliacaoMinima && !((Number(usuario.rating) || 0) >= avaliacaoMinima)) return false;
    if (generos && generos.length > 0) {
      const doUsuario = Array.isArray(usuario.genres) ? usuario.genres : [];
      if (!generos.some((g) => doUsuario.includes(g))) return false;
    }
    const busca = normalizar(texto);
    if (busca) {
      const onde = normalizar([usuario.name, usuario.city, usuario.username].join(' '));
      if (!onde.includes(busca)) return false;
    }
    return true;
  }

  function filtrarUsuarios(usuarios, filtro) {
    return usuarios.filter((u) => correspondeFiltro(u, filtro));
  }

  function filtroDaUrl(busca) {
    const p = new URLSearchParams(busca || '');
    const papel = p.get('papel');
    const uf = p.get('uf');
    const nota = Number(p.get('nota'));
    return {
      papel: constantes.PAPEIS.includes(papel) ? papel : null,
      estado: constantes.UFS.includes(uf) ? uf : '',
      avaliacaoMinima: Number.isInteger(nota) && nota >= 1 && nota <= 5 ? nota : 0,
      generos: p.getAll('genero').filter((g) => constantes.GENEROS.includes(g)),
      texto: (p.get('q') || '').slice(0, 80),
    };
  }

  function paraUrl(filtro) {
    const p = new URLSearchParams();
    const { papel, estado, avaliacaoMinima, generos, texto } = filtro || {};
    if (papel) p.set('papel', papel);
    if (estado) p.set('uf', estado);
    if (avaliacaoMinima) p.set('nota', String(avaliacaoMinima));
    (generos || []).forEach((g) => p.append('genero', g));
    if (texto && texto.trim()) p.set('q', texto.trim());
    const texto2 = p.toString();
    return texto2 ? '?' + texto2 : '';
  }

  return { correspondeFiltro, filtrarUsuarios, filtroDaUrl, paraUrl, normalizar };
});
