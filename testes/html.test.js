const test = require('node:test');
const assert = require('node:assert/strict');
const { carregarPagina } = require('./apoio');
const { escaparHTML } = require('../codigo-fonte/lib/html.js');
const { CHAVE_USUARIOS } = require('../codigo-fonte/lib/armazenamento.js');

test('escaparHTML troca os cinco caracteres especiais do HTML', () => {
  assert.equal(escaparHTML(`<a href="x" title='y'>&</a>`), '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
});

test('escaparHTML escapa o & primeiro (não escapa duas vezes)', () => {
  assert.equal(escaparHTML('&lt;'), '&amp;lt;');
});

test('escaparHTML aceita número, null e undefined', () => {
  assert.equal(escaparHTML(4.5), '4.5');
  assert.equal(escaparHTML(null), '');
  assert.equal(escaparHTML(undefined), '');
});

// Usuário malicioso cadastrado por outra conta no mesmo navegador
const MALICIOSO = {
  username: 'x"><img src=x id=injU>',
  name: '<img src=x id=injN onerror="window.__xss=1">',
  email: 'm@ex.com', phone: '9', role: 'Músico', state: 'MG',
  city: '<script id=injC>window.__xss=1</script>',
  rating: 5,
  genres: ['<img src=x id=injG>'],
  badges: ['<img src=x id=injB>'],
  profilePicLink: 'x" onerror="window.__xss=1',
  bannerPicLink: '', songLink: '', userPicsLinks: [], passwordHash: 'h',
};

const comMalicioso = (logado) => (win) => {
  win.localStorage.setItem(CHAVE_USUARIOS, JSON.stringify([MALICIOSO]));
  if (logado) win.sessionStorage.setItem('loggedInUser', JSON.stringify(MALICIOSO));
};

function semInjecao(w) {
  const d = w.document;
  assert.equal(d.querySelector('[id^=inj]'), null, 'nenhum elemento injetado');
  assert.equal(d.querySelector('[onerror]'), null, 'nenhum atributo onerror');
  assert.equal(w.__xss, undefined);
}

test('cards da home não interpretam HTML vindo dos dados do usuário', () => {
  const w = carregarPagina('Home/home.html', { antes: comMalicioso() });
  semInjecao(w);
  const card = w.document.querySelector('#anunciosMusic .card');
  assert.match(card.querySelector('.card-title').textContent, /<img src=x id=injN/);
});

test('cards dos anúncios não interpretam HTML e o clique ainda abre o perfil certo', () => {
  const w = carregarPagina('anuncios/anuncios.html', { antes: comMalicioso() });
  semInjecao(w);
  const col = w.document.querySelector('#anuncios > .col');
  assert.equal(col.dataset.username, MALICIOSO.username);
  col.querySelector('a.link-perfil').dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.equal(JSON.parse(w.sessionStorage.getItem('clickedUser')).username, MALICIOSO.username);
});

test('navbar do usuário logado mostra o nome como texto', () => {
  const w = carregarPagina('Home/home.html', { antes: comMalicioso(true) });
  semInjecao(w);
  assert.equal(w.document.getElementById('nomeUsuario').textContent, MALICIOSO.name);
  assert.equal(w.document.getElementById('profileAvatar').getAttribute('src'), MALICIOSO.profilePicLink);
});

test('icone monta o <svg> do sprite, decorativo e sem aceitar nome com caracteres especiais', () => {
  const { icone } = require('../codigo-fonte/lib/html.js');
  assert.equal(icone('star-fill'), '<svg class="icone" aria-hidden="true" focusable="false"><use href="../assets/icones.svg#star-fill"></use></svg>');
  assert.throws(() => icone('x"><script>'), /ícone inválido/);
});
