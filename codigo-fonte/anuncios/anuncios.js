// Explorar: lista de perfis com filtros (regra em lib/filtros.js, card em ui/cards.js).
// Os cards são desenhados uma vez; filtrar só mostra/esconde (atributo hidden), usando um Map
// username -> usuário (antes era users.find por card: O(n²), ver docs/carga).
// O filtro vai para o endereço (?papel=...&uf=...), então a busca pode ser compartilhada.
(function () {
  const $ = (id) => document.getElementById(id);
  const form = $('filtros');
  const lista = $('anuncios');
  const vazio = $('semResultados');
  const resumo = $('resumoResultados');

  GigFormulario.preencherUFs($('state'), 'Todos os estados');
  GigFormulario.montarGeneros($('generos'), 'genero', 'form-check-inline');

  const porNota = (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0) || String(a.name).localeCompare(String(b.name), 'pt-BR');
  const usuarios = GigArmazenamento.lerUsuarios(localStorage).sort(porNota);
  const porUsername = new Map(usuarios.map((u) => [u.username, u]));

  lista.innerHTML = usuarios.map((u) => GigCards.html(u, { selos: true })).join('');
  lista.removeAttribute('aria-busy');
  const cards = Array.from(lista.children).map((el) => ({ el, usuario: porUsername.get(el.dataset.username) }));
  GigCards.ligarCliques(lista, (username) => porUsername.get(username));

  function filtroDaTela() {
    const papel = form.querySelector('input[name="papel"]:checked');
    const nota = form.querySelector('input[name="nota"]:checked');
    return {
      papel: (papel && papel.value) || null,
      estado: $('state').value,
      avaliacaoMinima: nota ? Number(nota.value) : 0,
      generos: GigFormulario.marcados($('generos')),
      texto: $('busca').value,
    };
  }

  function aplicarNaTela(filtro) {
    const papel = form.querySelector(`input[name="papel"][value="${filtro.papel || ''}"]`);
    if (papel) papel.checked = true;
    $('state').value = filtro.estado || '';
    const nota = form.querySelector(`input[name="nota"][value="${filtro.avaliacaoMinima || 0}"]`) || $('avaliacao0');
    nota.checked = true;
    $('generos').querySelectorAll('input').forEach((caixa) => { caixa.checked = filtro.generos.includes(caixa.value); });
    $('busca').value = filtro.texto || '';
  }

  function filtrarCards() {
    const filtro = filtroDaTela();
    let visiveis = 0;
    for (const { el, usuario } of cards) {
      const passa = !usuario || GigFiltros.correspondeFiltro(usuario, filtro);
      el.hidden = !passa;
      if (passa) visiveis++;
    }
    vazio.hidden = visiveis > 0;
    resumo.textContent = visiveis === 1 ? '1 perfil encontrado' : `${visiveis} perfis encontrados`;
    history.replaceState(null, '', window.location.pathname + GigFiltros.paraUrl(filtro));
  }

  function limpar() {
    aplicarNaTela({ papel: null, estado: '', avaliacaoMinima: 0, generos: [], texto: '' });
    filtrarCards();
  }

  form.addEventListener('change', filtrarCards);
  form.addEventListener('input', (event) => { if (event.target.id === 'busca') filtrarCards(); });
  form.addEventListener('submit', (event) => event.preventDefault());
  $('limparFiltros').addEventListener('click', limpar);
  $('limparFiltrosVazio').addEventListener('click', limpar);

  aplicarNaTela(GigFiltros.filtroDaUrl(window.location.search));
  filtrarCards();
})();
