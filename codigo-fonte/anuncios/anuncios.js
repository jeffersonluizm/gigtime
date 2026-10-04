// Explorar: lista de perfis com filtros (regra em lib/filtros.js, card em ui/cards.js).
// Desempenho (ver docs/carga): o filtro roda sobre os dados, não sobre o DOM, e só POR_PAGINA cards
// são desenhados por vez ("Mostrar mais" acrescenta a próxima página). Antes eram desenhados todos os
// cards e o filtro fazia users.find por card (O(n²)); com 5 mil perfis isso levava mais de 1 s por clique.
// O filtro vai para o endereço (?papel=...&uf=...), então a busca pode ser compartilhada.
(function () {
  const POR_PAGINA = 24;
  const $ = (id) => document.getElementById(id);
  const form = $('filtros');
  const lista = $('anuncios');
  const vazio = $('semResultados');
  const resumo = $('resumoResultados');
  const mais = $('mostrarMais');

  GigFormulario.preencherUFs($('state'), 'Todos os estados');
  GigFormulario.montarGeneros($('generos'), 'genero', 'form-check-inline');

  const colador = new Intl.Collator('pt-BR'); // um só comparador: localeCompare por par é lento com milhares
  const porNota = (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0) || colador.compare(String(a.name), String(b.name));
  const usuarios = GigArmazenamento.lerUsuarios(localStorage).sort(porNota);
  const porUsername = new Map(usuarios.map((u) => [u.username, u]));
  GigCards.ligarCliques(lista, (username) => porUsername.get(username));
  lista.removeAttribute('aria-busy');

  let filtrados = usuarios;
  let mostrados = 0;

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

  function atualizarMais() {
    const restantes = filtrados.length - mostrados;
    mais.hidden = restantes <= 0;
    mais.textContent = `Mostrar mais perfis (${restantes} restantes)`;
  }

  // Acrescenta a próxima página de cards; devolve o primeiro card novo (para levar o foco até ele)
  function desenharProximos() {
    const pagina = filtrados.slice(mostrados, mostrados + POR_PAGINA);
    const antes = lista.children.length;
    lista.insertAdjacentHTML('beforeend', pagina.map((u) => GigCards.html(u, { selos: true })).join(''));
    mostrados += pagina.length;
    atualizarMais();
    return lista.children[antes] || null;
  }

  function filtrarCards() {
    const filtro = filtroDaTela();
    filtrados = GigFiltros.filtrarUsuarios(usuarios, filtro);
    mostrados = 0;
    lista.replaceChildren();
    desenharProximos();
    vazio.hidden = filtrados.length > 0;
    resumo.textContent = filtrados.length === 1 ? '1 perfil encontrado' : `${filtrados.length} perfis encontrados`;
    history.replaceState(null, '', window.location.pathname + GigFiltros.paraUrl(filtro));
  }

  function limpar() {
    aplicarNaTela({ papel: null, estado: '', avaliacaoMinima: 0, generos: [], texto: '' });
    filtrarCards();
  }

  mais.addEventListener('click', () => {
    const primeiro = desenharProximos();
    const link = primeiro && primeiro.querySelector('.card-title a');
    if (link) link.focus();
  });
  form.addEventListener('change', filtrarCards);
  form.addEventListener('input', (event) => { if (event.target.id === 'busca') filtrarCards(); });
  form.addEventListener('submit', (event) => event.preventDefault());
  $('limparFiltros').addEventListener('click', limpar);
  $('limparFiltrosVazio').addEventListener('click', limpar);

  aplicarNaTela(GigFiltros.filtroDaUrl(window.location.search));
  filtrarCards();
})();
