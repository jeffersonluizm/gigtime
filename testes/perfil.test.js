const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { StorageMemoria, carregarPagina, esperar, RAIZ } = require('./apoio');
const P = require('../codigo-fonte/lib/perfil.js');
const S = require('../codigo-fonte/lib/senha.js');
const A = require('../codigo-fonte/lib/armazenamento.js');

async function base() {
  return [
    {
      username: 'ana', name: 'Ana', email: 'ana@ex.com', phone: '1', role: 'Músico', state: 'PR', city: 'Curitiba',
      genres: ['Jazz'], rating: 4.2, badges: ['Jazz Lover'], profilePicLink: 'a.jpg', bannerPicLink: 'b.jpg',
      songLink: '', userPicsLinks: ['x'], passwordHash: await S.hashSenha('ana', 'velha'),
    },
    {
      username: 'bia', name: 'Bia', email: 'bia@ex.com', phone: '2', role: 'Contratante', state: 'MG', city: 'BH',
      genres: ['Pop'], rating: 5, badges: [], profilePicLink: 'c.jpg', bannerPicLink: 'd.jpg', songLink: '',
      userPicsLinks: [], passwordHash: 'h',
    },
  ];
}

const dadosDe = (u, extra = {}) => ({
  name: u.name, email: u.email, phone: u.phone, role: u.role, state: u.state, city: u.city,
  genres: u.genres, profilePicLink: u.profilePicLink, bannerPicLink: u.bannerPicLink, songLink: u.songLink, ...extra,
});

test('acaoDoPerfil: no próprio perfil é editar, no perfil de outro é contato', () => {
  assert.equal(P.acaoDoPerfil({ username: 'ana' }, { username: 'ana' }).tipo, 'editar');
  assert.equal(P.acaoDoPerfil({ username: 'ana' }, { username: 'ana' }).href, '../EdicaoPerfil/EdicaoPerfil.html');
  assert.equal(P.acaoDoPerfil({ username: 'bia' }, { username: 'ana' }).tipo, 'contato');
  assert.equal(P.acaoDoPerfil({ username: 'bia' }, null).tipo, 'contato');
});

test('validarDadosPerfil aponta campo obrigatório vazio e falta de gênero', async () => {
  const [ana] = await base();
  const erros = P.validarDadosPerfil(dadosDe(ana, { name: '  ', genres: [] }), await base(), 'ana');
  assert.deepEqual(erros.map((e) => e.campo).sort(), ['genres', 'name']);
});

test('validarDadosPerfil recusa e-mail ou telefone de outro usuário, mas aceita os próprios', async () => {
  const lista = await base();
  assert.deepEqual(P.validarDadosPerfil(dadosDe(lista[0]), lista, 'ana'), []);
  const erros = P.validarDadosPerfil(dadosDe(lista[0], { email: 'bia@ex.com', phone: '2' }), lista, 'ana');
  assert.deepEqual(erros.map((e) => e.campo).sort(), ['email', 'phone']);
});

test('atualizarPerfil troca os campos editáveis e preserva username, nota, selos e hash', async () => {
  const lista = await base();
  const r = await P.atualizarPerfil(lista, 'ana', dadosDe(lista[0], { name: 'Ana Paula', city: 'Londrina', genres: ['Jazz', 'MPB'], profilePicLink: '' }));
  assert.equal(r.ok, true);
  const ana = r.usuarios[0];
  assert.equal(ana.name, 'Ana Paula');
  assert.equal(ana.city, 'Londrina');
  assert.deepEqual(ana.genres, ['Jazz', 'MPB']);
  assert.equal(ana.profilePicLink, '../userImages/defaultUser.jpg', 'sem link volta para a foto padrão');
  assert.equal(ana.username, 'ana');
  assert.equal(ana.rating, 4.2);
  assert.deepEqual(ana.badges, ['Jazz Lover']);
  assert.equal(ana.passwordHash, lista[0].passwordHash);
  assert.equal(r.usuarios[1], lista[1], 'os outros usuários não mudam');
  assert.equal(lista[0].name, 'Ana', 'a lista original não é alterada');
});

test('atualizarPerfil com erro de validação não devolve lista nova', async () => {
  const lista = await base();
  const r = await P.atualizarPerfil(lista, 'ana', dadosDe(lista[0], { city: '' }));
  assert.equal(r.ok, false);
  assert.deepEqual(r.erros.map((e) => e.campo), ['city']);
});

test('troca de senha exige a senha atual correta e a confirmação igual', async () => {
  const lista = await base();
  const errada = await P.atualizarPerfil(lista, 'ana', dadosDe(lista[0]), { atual: 'x', nova: 'nova1', confirmacao: 'nova1' });
  assert.deepEqual(errada.erros.map((e) => e.campo), ['senhaAtual']);
  const diferente = await P.atualizarPerfil(lista, 'ana', dadosDe(lista[0]), { atual: 'velha', nova: 'nova1', confirmacao: 'nova2' });
  assert.deepEqual(diferente.erros.map((e) => e.campo), ['confirmacao']);
});

test('troca de senha válida grava o hash novo', async () => {
  const lista = await base();
  const r = await P.atualizarPerfil(lista, 'ana', dadosDe(lista[0]), { atual: 'velha', nova: 'nova1', confirmacao: 'nova1' });
  assert.equal(r.ok, true);
  assert.ok(await S.autenticar(r.usuarios, 'ana', 'nova1'));
  assert.equal(await S.autenticar(r.usuarios, 'ana', 'velha'), null);
  assert.equal('password' in r.usuarios[0], false);
});

test('destinoDepoisDoLogin só aceita páginas do próprio site e é lido uma vez', () => {
  const sessao = new StorageMemoria({ depoisDoLogin: '../Chat/chat.html?com=ana' });
  assert.equal(A.destinoDepoisDoLogin(sessao), '../Chat/chat.html?com=ana');
  assert.equal(A.destinoDepoisDoLogin(sessao), null);
  assert.equal(A.destinoDepoisDoLogin(new StorageMemoria({ depoisDoLogin: 'https://mal.example/x.html' })), null);
  assert.equal(A.destinoDepoisDoLogin(new StorageMemoria({ depoisDoLogin: 'javascript:alert(1)' })), null);
});

// Página de edição
const html = fs.readFileSync(path.join(RAIZ, 'EdicaoPerfil', 'EdicaoPerfil.html'), 'utf8');

test('EdicaoPerfil.html: ids únicos, Bootstrap JS uma vez e divs balanceadas', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), []);
  assert.equal((html.match(/bootstrap\.bundle\.min\.js/g) || []).length, 1);
  assert.equal((html.match(/bootstrap\.min\.css/g) || []).length, 1);
  assert.equal((html.match(/<div[\s>]/g) || []).length, (html.match(/<\/div>/g) || []).length);
  assert.equal(/<center>/i.test(html), false);
});

function logadoComo(username) {
  return (win) => {
    win.sessionStorage.setItem('loggedInUser', JSON.stringify({ username }));
  };
}

test('EdicaoPerfil sem login manda para o login e volta depois', () => {
  const w = carregarPagina('EdicaoPerfil/EdicaoPerfil.html');
  assert.equal(w.sessionStorage.getItem('depoisDoLogin'), '../EdicaoPerfil/EdicaoPerfil.html');
});

test('EdicaoPerfil vem preenchida com os dados do usuário logado', () => {
  const w = carregarPagina('EdicaoPerfil/EdicaoPerfil.html', { antes: logadoComo('cartola') });
  const $ = (id) => w.document.getElementById(id);
  assert.equal($('username').value, 'cartola');
  assert.equal($('username').readOnly, true);
  assert.equal($('name').value, 'Cartola');
  assert.equal($('state').value, 'RJ');
  assert.equal($('role').value, 'Músico');
  assert.equal($('genreSertanejo').checked, true);
  assert.equal($('genreRock').checked, false);
});

test('EdicaoPerfil salva no modelo users e atualiza a sessão', async () => {
  const w = carregarPagina('EdicaoPerfil/EdicaoPerfil.html', { antes: logadoComo('cartola') });
  const $ = (id) => w.document.getElementById(id);
  $('city').value = 'Niterói';
  $('genreRock').checked = true;
  $('editForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperar();
  const cartola = JSON.parse(w.localStorage.getItem('users')).find((u) => u.username === 'cartola');
  assert.equal(cartola.city, 'Niterói');
  assert.deepEqual(cartola.genres, ['Sertanejo', 'Rock', 'MPB']);
  assert.equal(JSON.parse(w.sessionStorage.getItem('loggedInUser')).city, 'Niterói');
  assert.equal(w.localStorage.getItem('formularioData'), null, 'não usa mais o formulário solto');
});

test('EdicaoPerfil mostra erro e não salva com campo obrigatório vazio', async () => {
  const w = carregarPagina('EdicaoPerfil/EdicaoPerfil.html', { antes: logadoComo('cartola') });
  const $ = (id) => w.document.getElementById(id);
  $('name').value = '';
  $('editForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperar();
  assert.ok($('name').classList.contains('is-invalid'));
  const cartola = JSON.parse(w.localStorage.getItem('users')).find((u) => u.username === 'cartola');
  assert.equal(cartola.name, 'Cartola');
});

// Página de perfil
function verPerfil(exibido, logado) {
  return (win) => {
    win.sessionStorage.setItem('clickedUser', JSON.stringify({ username: exibido, name: 'velho', city: 'velha', state: 'XX', genres: [], badges: [], userPicsLinks: [] }));
    if (logado) win.sessionStorage.setItem('loggedInUser', JSON.stringify({ username: logado }));
  };
}

test('perfil do próprio usuário mostra "Editar perfil"', () => {
  const w = carregarPagina('Perfil/perfil.html', { antes: verPerfil('cartola', 'cartola') });
  const botao = w.document.getElementById('acaoPerfil');
  assert.equal(botao.textContent.trim(), 'Editar perfil');
  assert.equal(botao.dataset.href, '../EdicaoPerfil/EdicaoPerfil.html');
});

test('perfil de outra pessoa mostra "Contate-me"', () => {
  const w = carregarPagina('Perfil/perfil.html', { antes: verPerfil('sonic', 'cartola') });
  assert.equal(w.document.getElementById('acaoPerfil').textContent.trim(), 'Contate-me');
});

test('perfil mostra os dados atuais do modelo, não a cópia guardada na sessão', () => {
  const w = carregarPagina('Perfil/perfil.html', { antes: verPerfil('cartola', null) });
  assert.equal(w.document.getElementById('name').textContent, 'Cartola');
  assert.equal(w.document.getElementById('location').textContent, 'Rio de Janeiro/RJ');
});

test('EdicaoPerfil mantém um estado fora da lista de UFs (ex.: seed "GH") e deixa salvar', async () => {
  const w = carregarPagina('EdicaoPerfil/EdicaoPerfil.html', { antes: logadoComo('sonic') });
  const $ = (id) => w.document.getElementById(id);
  assert.equal($('state').value, 'GH');
  $('city').value = 'Station Square';
  $('editForm').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperar();
  const sonic = JSON.parse(w.localStorage.getItem('users')).find((u) => u.username === 'sonic');
  assert.equal(sonic.city, 'Station Square');
  assert.equal(sonic.state, 'GH');
});
