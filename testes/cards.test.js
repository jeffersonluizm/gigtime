// Os cards não podem depender de id = username: um username igual a outro id da página
// (ex.: "state", o select do filtro) quebrava o filtro e o clique.
const test = require('node:test');
const assert = require('node:assert/strict');
const { carregarPagina } = require('./apoio');
const { CHAVE_USUARIOS } = require('../codigo-fonte/lib/armazenamento.js');

const usuario = (username, extra = {}) => ({
  username, name: 'Nome ' + username, email: username + '@ex.com', phone: username, role: 'Músico', state: 'MG', city: 'BH',
  rating: 5, genres: ['Rock'], badges: [], profilePicLink: 'a.jpg', bannerPicLink: '', songLink: '', userPicsLinks: [], passwordHash: 'h', ...extra,
});

const comUsuarios = (...lista) => (win) => win.localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(lista));
const clicar = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
const escolhido = (w) => JSON.parse(w.sessionStorage.getItem('clickedUser'));

test('cards não usam o username como id', () => {
  const home = carregarPagina('Home/home.html', { antes: comUsuarios(usuario('state'), usuario('outro', { role: 'Contratante' })) });
  assert.equal(home.document.querySelectorAll('#anunciosMusic [id], #anunciosContrat [id]').length, 0);
  const anuncios = carregarPagina('Anúncios/anuncios.html', { antes: comUsuarios(usuario('state')) });
  assert.equal(anuncios.document.querySelectorAll('#anuncios [id]').length, 0);
});

test('anúncios: usuário "state" não sequestra o select de estado', () => {
  const w = carregarPagina('Anúncios/anuncios.html', {
    antes: comUsuarios(usuario('state', { state: 'SP' }), usuario('bh', { state: 'MG' })),
  });
  const select = w.document.getElementById('state');
  assert.equal(select.tagName, 'SELECT');
  clicar(w, select);
  assert.equal(w.sessionStorage.getItem('clickedUser'), null, 'clicar no filtro não abre perfil');
  select.value = 'MG';
  select.dispatchEvent(new w.Event('change', { bubbles: true }));
  const visiveis = [...w.document.querySelectorAll('#anuncios > .col')].filter((c) => c.style.display !== 'none').map((c) => c.dataset.username);
  assert.deepEqual(visiveis, ['bh']);
});

test('anúncios: clicar no card abre o perfil do usuário do card', () => {
  const w = carregarPagina('Anúncios/anuncios.html', { antes: comUsuarios(usuario('state'), usuario('radioMusician')) });
  clicar(w, w.document.querySelector('#anuncios > .col[data-username="state"] .card-img-top'));
  assert.equal(escolhido(w).username, 'state');
  clicar(w, w.document.querySelector('#anuncios > .col[data-username="radioMusician"] a'));
  assert.equal(escolhido(w).username, 'radioMusician');
});

test('home: username igual ao id de um container não quebra os cards nem o clique', () => {
  const w = carregarPagina('Home/home.html', {
    antes: comUsuarios(usuario('anunciosContrat'), usuario('btnMusicians', { role: 'Contratante' })),
  });
  const d = w.document;
  assert.equal(d.querySelectorAll('#anunciosMusic .card').length, 1);
  assert.equal(d.querySelectorAll('#anunciosContrat .card').length, 1);
  clicar(w, d.querySelector('#anunciosContrat .card a'));
  assert.equal(escolhido(w).username, 'btnMusicians');
  clicar(w, d.querySelector('#anunciosMusic .card a'));
  assert.equal(escolhido(w).username, 'anunciosContrat');
});

test('o card leva ao perfil endereçável (?u=) por link de verdade, acessível pelo teclado', () => {
  const w = carregarPagina('Home/home.html', { antes: comUsuarios(usuario('o\'neil & cia', { name: 'O Neil' })) });
  const links = [...w.document.querySelectorAll('#anunciosMusic [data-username] a.link-perfil')];
  assert.ok(links.length >= 1);
  for (const a of links) assert.equal(a.getAttribute('href'), '../Perfil/perfil.html?u=' + encodeURIComponent("o'neil & cia"));
  const focaveis = links.filter((a) => a.getAttribute('tabindex') !== '-1');
  assert.equal(focaveis.length, 1, 'um link por card na ordem de tabulação');
  assert.match(focaveis[0].textContent, /O Neil/);
});

test('usuário sem avaliação aparece como "Novo" no card', () => {
  const w = carregarPagina('Home/home.html', { antes: comUsuarios(usuario('novato', { rating: 0 })) });
  assert.match(w.document.querySelector('#anunciosMusic .nota').textContent, /Novo/);
});
