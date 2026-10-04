const test = require('node:test');
const assert = require('node:assert/strict');
const { carregarPagina } = require('./apoio');
const { correspondeFiltro } = require('../codigo-fonte/lib/filtros.js');

const ana = { username: 'ana', role: 'Músico', state: 'PR', rating: 4.2, genres: ['Jazz', 'MPB'] };
const bar = { username: 'bar', role: 'Contratante', state: 'MG', rating: 4.9, genres: ['MPB', 'Jazz'] };
const novato = { username: 'novato', role: 'Músico', state: 'MG', rating: 0, genres: ['Rock'] };

test('sem critério nenhum, todo mundo aparece', () => {
  assert.equal(correspondeFiltro(ana, {}), true);
  assert.equal(correspondeFiltro(novato, { papel: null, estado: '', avaliacaoMinima: 0, generos: [] }), true);
});

test('papel e estado filtram por igualdade', () => {
  assert.equal(correspondeFiltro(ana, { papel: 'Músico' }), true);
  assert.equal(correspondeFiltro(bar, { papel: 'Músico' }), false);
  assert.equal(correspondeFiltro(bar, { estado: 'MG' }), true);
  assert.equal(correspondeFiltro(ana, { estado: 'MG' }), false);
});

test('avaliação mínima inclui quem tem nota igual ou maior', () => {
  assert.equal(correspondeFiltro(bar, { avaliacaoMinima: 4 }), true);
  assert.equal(correspondeFiltro(ana, { avaliacaoMinima: 4.2 }), true);
  assert.equal(correspondeFiltro(ana, { avaliacaoMinima: 5 }), false);
  assert.equal(correspondeFiltro(novato, { avaliacaoMinima: 1 }), false, 'sem avaliação não passa em mínimo nenhum');
  assert.equal(correspondeFiltro({ ...novato, rating: undefined }, { avaliacaoMinima: 1 }), false);
});

test('gêneros: basta ter um dos gêneros marcados', () => {
  assert.equal(correspondeFiltro(ana, { generos: ['Rock', 'Jazz'] }), true);
  assert.equal(correspondeFiltro(novato, { generos: ['Jazz'] }), false);
  assert.equal(correspondeFiltro({ ...novato, genres: undefined }, { generos: ['Jazz'] }), false);
});

test('critérios se combinam com E', () => {
  const filtro = { papel: 'Contratante', estado: 'MG', avaliacaoMinima: 4, generos: ['Jazz'] };
  assert.equal(correspondeFiltro(bar, filtro), true);
  assert.equal(correspondeFiltro(ana, filtro), false);
  assert.equal(correspondeFiltro(bar, { ...filtro, avaliacaoMinima: 5 }), false);
});

// Página de anúncios com os 10 usuários de exemplo
const visiveis = (w) => [...w.document.querySelectorAll('#anuncios > .col')]
  .filter((c) => !c.hidden)
  .map((c) => c.dataset.username)
  .sort();

function marcar(w, id, valor = true) {
  const el = w.document.getElementById(id);
  el.checked = valor;
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
}

test('anúncios: avaliação mínima 5 mostra só quem tem nota 5', () => {
  const w = carregarPagina('anuncios/anuncios.html');
  marcar(w, 'avaliacao5');
  assert.deepEqual(visiveis(w), ['banda.aurora', 'casa.lume']);
});

test('anúncios: avaliação mínima é uma escolha só e "Qualquer" volta a mostrar todos', () => {
  const w = carregarPagina('anuncios/anuncios.html');
  marcar(w, 'avaliacao4');
  marcar(w, 'avaliacao5');
  assert.equal(w.document.getElementById('avaliacao4').checked, false);
  marcar(w, 'avaliacao0');
  assert.equal(visiveis(w).length, 10);
});

test('anúncios: lê o filtro do endereço (?papel=) e grava o filtro escolhido no endereço', () => {
  const w = carregarPagina('anuncios/anuncios.html', { busca: '?papel=Contratante&uf=SP' });
  assert.equal(w.document.getElementById('radioContractor').checked, true);
  assert.deepEqual(visiveis(w), ['casa.lume']);
  marcar(w, 'radioMusician');
  assert.equal(new URLSearchParams(w.location.search).get('papel'), 'Músico');
  assert.equal(new URLSearchParams(w.location.search).get('uf'), 'SP');
});

test('anúncios: busca por texto e estado vazio com contagem anunciada', () => {
  const w = carregarPagina('anuncios/anuncios.html');
  const d = w.document;
  assert.equal(d.getElementById('resumoResultados').textContent, '10 perfis encontrados');
  d.getElementById('busca').value = 'goiania';
  d.getElementById('busca').dispatchEvent(new w.Event('input', { bubbles: true }));
  assert.deepEqual(visiveis(w), ['nina.voz']);
  assert.equal(d.getElementById('resumoResultados').textContent, '1 perfil encontrado');
  d.getElementById('busca').value = 'nenhum lugar';
  d.getElementById('busca').dispatchEvent(new w.Event('input', { bubbles: true }));
  assert.equal(d.getElementById('semResultados').hidden, false);
  d.getElementById('limparFiltrosVazio').click();
  assert.equal(visiveis(w).length, 10);
  assert.equal(d.getElementById('semResultados').hidden, true);
});

test('anúncios: filtro por gênero', () => {
  const w = carregarPagina('anuncios/anuncios.html');
  marcar(w, 'generoJazz');
  assert.deepEqual(visiveis(w), ['bar.do.cais', 'bistro.alecrim', 'davi.sax']);
});

test('anúncios: papel, estado, avaliação e gênero combinados', () => {
  const w = carregarPagina('anuncios/anuncios.html');
  marcar(w, 'radioContractor');
  const estado = w.document.getElementById('state');
  estado.value = 'RJ';
  estado.dispatchEvent(new w.Event('change', { bubbles: true }));
  assert.deepEqual(visiveis(w), ['bar.do.cais']);
  marcar(w, 'generoJazz');
  assert.deepEqual(visiveis(w), ['bar.do.cais']);
  marcar(w, 'avaliacao5');
  assert.deepEqual(visiveis(w), []);
});

test('anúncios: limpar filtros desfaz tudo', () => {
  const w = carregarPagina('anuncios/anuncios.html');
  marcar(w, 'radioMusician');
  marcar(w, 'generoRock');
  marcar(w, 'avaliacao5');
  w.document.getElementById('limparFiltros').click();
  assert.equal(visiveis(w).length, 10);
  assert.equal(w.document.getElementById('radioMusician').checked, false);
  assert.equal(w.document.getElementById('radioTodos').checked, true);
  assert.equal(w.document.getElementById('generoRock').checked, false);
});

test('busca por texto procura no nome, na cidade e no usuário, sem diferenciar acento e maiúscula', () => {
  const lia = { username: 'lia.batera', name: 'Lia Fontes', city: 'São Paulo', role: 'Músico', genres: [] };
  assert.equal(correspondeFiltro(lia, { texto: 'lia' }), true);
  assert.equal(correspondeFiltro(lia, { texto: 'SAO PAULO' }), true);
  assert.equal(correspondeFiltro(lia, { texto: 'batera' }), true);
  assert.equal(correspondeFiltro(lia, { texto: '  fontes ' }), true);
  assert.equal(correspondeFiltro(lia, { texto: 'recife' }), false);
  assert.equal(correspondeFiltro(lia, { texto: '' }), true);
});

test('filtrarUsuarios devolve os que passam, na ordem original, e não muda a lista', () => {
  const { filtrarUsuarios } = require('../codigo-fonte/lib/filtros.js');
  const lista = [ana, bar, novato];
  assert.deepEqual(filtrarUsuarios(lista, { estado: 'MG' }).map((u) => u.username), ['bar', 'novato']);
  assert.equal(lista.length, 3);
});

test('filtroDaUrl e paraUrl ida e volta (filtro compartilhável pelo endereço)', () => {
  const { filtroDaUrl, paraUrl } = require('../codigo-fonte/lib/filtros.js');
  const filtro = { papel: 'Contratante', estado: 'MG', avaliacaoMinima: 4, generos: ['Jazz', 'MPB'], texto: 'bar' };
  const busca = paraUrl(filtro);
  assert.equal(busca, '?papel=Contratante&uf=MG&nota=4&genero=Jazz&genero=MPB&q=bar');
  assert.deepEqual(filtroDaUrl(busca), filtro);
  assert.deepEqual(filtroDaUrl('?papel=Hacker&nota=9&uf=XX'), { papel: null, estado: '', avaliacaoMinima: 0, generos: [], texto: '' }, 'valores fora da lista são ignorados');
  assert.equal(paraUrl({}), '');
});
