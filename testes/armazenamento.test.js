const test = require('node:test');
const assert = require('node:assert/strict');
const { StorageMemoria, carregarPagina } = require('./apoio');
const A = require('../codigo-fonte/lib/armazenamento.js');
const { CHAVE_USUARIOS, CHAVE_MENSAGENS } = require('../codigo-fonte/lib/armazenamento.js');

// Usuário com a forma mínima dos dados do GigTime (a migração ignora o que não tem essa forma)
const u = (username, extra = {}) => ({ username, name: username.toUpperCase(), role: 'Músico', genres: [], passwordHash: 'h', ...extra });

test('lerUsuarios devolve lista vazia quando não há nada gravado', () => {
  assert.deepEqual(A.lerUsuarios(new StorageMemoria()), []);
});

test('salvarUsuarios grava em JSON e lerUsuarios devolve o mesmo conteúdo', () => {
  const local = new StorageMemoria();
  A.salvarUsuarios(local, [u('ana')]);
  assert.deepEqual(A.lerUsuarios(local), [u('ana')]);
  assert.equal(JSON.parse(local.getItem(CHAVE_USUARIOS))[0].username, 'ana');
});

test('migrarDaSessao copia os usuários da versão antiga (sessionStorage) para o localStorage', () => {
  const local = new StorageMemoria();
  const sessao = new StorageMemoria({ users: JSON.stringify([u('ana'), u('bia')]) });
  assert.equal(A.migrarDaSessao(local, sessao), true);
  assert.deepEqual(A.lerUsuarios(local).map((x) => x.username), ['ana', 'bia']);
  assert.equal(sessao.getItem('users'), null, 'a cópia antiga sai da sessão');
});

test('migrarDaSessao mescla por username e o localStorage vence em conflito', () => {
  const local = new StorageMemoria({ [CHAVE_USUARIOS]: JSON.stringify([u('ana', { city: 'Local' })]) });
  const sessao = new StorageMemoria({ users: JSON.stringify([u('ana', { city: 'Sessao' }), u('caio')]) });
  A.migrarDaSessao(local, sessao);
  const lista = A.lerUsuarios(local);
  assert.deepEqual(lista.map((x) => x.username), ['ana', 'caio']);
  assert.equal(lista[0].city, 'Local');
});

test('migrarDaSessao não faz nada sem dados antigos e ignora JSON inválido', () => {
  const local = new StorageMemoria();
  assert.equal(A.migrarDaSessao(local, new StorageMemoria()), false);
  assert.equal(A.migrarDaSessao(local, new StorageMemoria({ users: '{quebrado' })), false);
  assert.equal(local.getItem(CHAVE_USUARIOS), null);
});

test('semearSeVazio grava o seed só quando não há usuários', () => {
  const local = new StorageMemoria();
  assert.equal(A.semearSeVazio(local, [u('seed')]), true);
  assert.equal(A.semearSeVazio(local, [u('outro')]), false);
  assert.deepEqual(A.lerUsuarios(local).map((x) => x.username), ['seed']);
});

test('ehErroDeCota reconhece o erro de armazenamento cheio do Chrome e do Firefox', () => {
  const erro = (name) => Object.assign(new Error('x'), { name });
  assert.equal(A.ehErroDeCota(erro('QuotaExceededError')), true);
  assert.equal(A.ehErroDeCota(erro('NS_ERROR_DOM_QUOTA_REACHED')), true);
  assert.equal(A.ehErroDeCota(erro('TypeError')), false);
  assert.equal(A.ehErroDeCota(null), false);
});

test('usuarioPublico remove senha e hash do objeto', () => {
  const p = A.usuarioPublico(u('ana', { password: 'x', passwordHash: 'y' }));
  assert.equal('password' in p, false);
  assert.equal('passwordHash' in p, false);
  assert.equal(p.username, 'ana');
});

test('global.js grava os usuários de exemplo no localStorage e não no sessionStorage', () => {
  const w = carregarPagina('Home/home.html');
  const lista = JSON.parse(w.localStorage.getItem(CHAVE_USUARIOS));
  assert.equal(lista.length, 10);
  assert.equal(w.sessionStorage.getItem('users'), null);
});

test('global.js migra usuários de uma aba aberta na versão antiga', () => {
  const w = carregarPagina('Home/home.html', {
    antes: (win) => win.sessionStorage.setItem('users', JSON.stringify([u('antigo', { role: 'Músico', genres: [], badges: [], password: 'p' })])),
  });
  const nomes = JSON.parse(w.localStorage.getItem(CHAVE_USUARIOS)).map((x) => x.username);
  assert.deepEqual(nomes, ['antigo'], 'quem já tinha dados mantém os dados e não recebe seed por cima');
});

test('global.js limpa senha antiga do usuário logado guardado na sessão', () => {
  const w = carregarPagina('Home/home.html', {
    antes: (win) => win.sessionStorage.setItem('loggedInUser', JSON.stringify(u('lia.batera', { password: 'demo1234', profilePicLink: 'x' }))),
  });
  const logado = JSON.parse(w.sessionStorage.getItem('loggedInUser'));
  assert.equal(logado.username, 'lia.batera');
  assert.equal('password' in logado, false);
});

test('home e anúncios montam os cards a partir do localStorage', () => {
  const home = carregarPagina('Home/home.html');
  assert.equal(home.document.querySelectorAll('#anunciosMusic .card').length, 5);
  assert.equal(home.document.querySelectorAll('#anunciosContrat .card').length, 5);
  const anuncios = carregarPagina('Anúncios/anuncios.html');
  assert.equal(anuncios.document.querySelectorAll('#anuncios .card').length, 10);
});

test('clicar num card guarda o perfil escolhido sem senha', () => {
  const w = carregarPagina('Anúncios/anuncios.html');
  w.document.querySelector('#anuncios > .col[data-username="davi.sax"] a').dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
  const escolhido = JSON.parse(w.sessionStorage.getItem('clickedUser'));
  assert.equal(escolhido.username, 'davi.sax');
  assert.equal('password' in escolhido || 'passwordHash' in escolhido, false);
});
